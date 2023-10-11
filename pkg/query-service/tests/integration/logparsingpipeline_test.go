package tests

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"slices"
	"strings"
	"testing"

	"github.com/gorilla/mux"
	"github.com/jmoiron/sqlx"
	"github.com/knadh/koanf/parsers/yaml"
	"github.com/open-telemetry/opamp-go/protobufs"
	"github.com/pkg/errors"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.signoz.io/signoz/pkg/query-service/agentConf"
	"go.signoz.io/signoz/pkg/query-service/app"
	"go.signoz.io/signoz/pkg/query-service/app/logparsingpipeline"
	"go.signoz.io/signoz/pkg/query-service/app/opamp"
	opampModel "go.signoz.io/signoz/pkg/query-service/app/opamp/model"
	"go.signoz.io/signoz/pkg/query-service/auth"
	"go.signoz.io/signoz/pkg/query-service/constants"
	"go.signoz.io/signoz/pkg/query-service/dao"
	"go.signoz.io/signoz/pkg/query-service/model"
	v3 "go.signoz.io/signoz/pkg/query-service/model/v3"
	"go.signoz.io/signoz/pkg/query-service/queryBuilderToExpr"
	"golang.org/x/exp/maps"
)

func TestLogPipelinesLifecycle(t *testing.T) {
	testbed := NewLogPipelinesTestBed(t)
	assert := assert.New(t)

	getPipelinesResp := testbed.GetPipelinesFromQS()
	assert.Equal(
		0, len(getPipelinesResp.Pipelines),
		"There should be no pipelines at the start",
	)
	assert.Equal(
		0, len(getPipelinesResp.History),
		"There should be no pipelines config history at the start",
	)

	// Should be able to create pipelines config
	pipelineFilter := &v3.FilterSet{
		Operator: "AND",
		Items: []v3.FilterItem{
			{
				Key: v3.AttributeKey{
					Key:      "method",
					DataType: v3.AttributeKeyDataTypeString,
					Type:     v3.AttributeKeyTypeTag,
				},
				Operator: "=",
				Value:    "GET",
			},
		},
	}
	postablePipelines := logparsingpipeline.PostablePipelines{
		Pipelines: []logparsingpipeline.PostablePipeline{
			{
				OrderId: 1,
				Name:    "pipeline1",
				Alias:   "pipeline1",
				Enabled: true,
				Filter:  pipelineFilter,
				Config: []logparsingpipeline.PipelineOperator{
					{
						OrderId: 1,
						ID:      "add",
						Type:    "add",
						Field:   "attributes.test",
						Value:   "val",
						Enabled: true,
						Name:    "test add",
					},
				},
			}, {
				OrderId: 2,
				Name:    "pipeline2",
				Alias:   "pipeline2",
				Enabled: true,
				Filter:  pipelineFilter,
				Config: []logparsingpipeline.PipelineOperator{
					{
						OrderId: 1,
						ID:      "remove",
						Type:    "remove",
						Field:   "attributes.test",
						Enabled: true,
						Name:    "test remove",
					},
				},
			},
		},
	}

	createPipelinesResp := testbed.PostPipelinesToQS(postablePipelines)
	assertPipelinesResponseMatchesPostedPipelines(
		t, postablePipelines, createPipelinesResp,
	)
	testbed.assertPipelinesSentToOpampClient(createPipelinesResp.Pipelines)

	// Should be able to get the configured pipelines.
	getPipelinesResp = testbed.GetPipelinesFromQS()
	assertPipelinesResponseMatchesPostedPipelines(
		t, postablePipelines, getPipelinesResp,
	)

	// Deployment status should be pending.
	assert.Equal(
		1, len(getPipelinesResp.History),
		"pipelines config history should not be empty after 1st configuration",
	)
	assert.Equal(
		agentConf.DeployInitiated, getPipelinesResp.History[0].DeployStatus,
		"pipelines deployment should be in progress after 1st configuration",
	)

	// Deployment status should get updated after acknowledgement from opamp client
	testbed.simulateOpampClientAcknowledgementForLatestConfig()

	getPipelinesResp = testbed.GetPipelinesFromQS()
	assertPipelinesResponseMatchesPostedPipelines(
		t, postablePipelines, getPipelinesResp,
	)
	assert.Equal(
		getPipelinesResp.History[0].DeployStatus, agentConf.Deployed,
		"pipeline deployment should be complete after acknowledgment from opamp client",
	)

	// Should be able to update pipelines config.
	postablePipelines.Pipelines[1].Enabled = false
	updatePipelinesResp := testbed.PostPipelinesToQS(postablePipelines)
	assertPipelinesResponseMatchesPostedPipelines(
		t, postablePipelines, updatePipelinesResp,
	)
	testbed.assertPipelinesSentToOpampClient(updatePipelinesResp.Pipelines)

	assert.Equal(
		2, len(updatePipelinesResp.History),
		"there should be 2 history entries after posting pipelines config for the 2nd time",
	)
	assert.Equal(
		agentConf.DeployInitiated, updatePipelinesResp.History[0].DeployStatus,
		"deployment should be in progress for latest pipeline config",
	)

	// Deployment status should get updated again on receiving msg from client.
	testbed.simulateOpampClientAcknowledgementForLatestConfig()

	getPipelinesResp = testbed.GetPipelinesFromQS()
	assertPipelinesResponseMatchesPostedPipelines(
		t, postablePipelines, getPipelinesResp,
	)
	assert.Equal(
		getPipelinesResp.History[0].DeployStatus, agentConf.Deployed,
		"deployment for latest pipeline config should be complete after acknowledgment from opamp client",
	)
}

func TestLogPipelinesValidation(t *testing.T) {
	// QS should respond with appropriate http status code
	// for valid and invalid pipelines requests
	validPipelineFilter := &v3.FilterSet{
		Operator: "AND",
		Items: []v3.FilterItem{
			{
				Key: v3.AttributeKey{
					Key:      "method",
					DataType: v3.AttributeKeyDataTypeString,
					Type:     v3.AttributeKeyTypeTag,
				},
				Operator: "=",
				Value:    "GET",
			},
		},
	}

	testCases := []struct {
		Name                       string
		Pipeline                   logparsingpipeline.PostablePipeline
		ExpectedResponseStatusCode int
	}{
		{
			Name: "Valid Pipeline",
			Pipeline: logparsingpipeline.PostablePipeline{
				OrderId: 1,
				Name:    "pipeline 1",
				Alias:   "pipeline1",
				Enabled: true,
				Filter:  validPipelineFilter,
				Config: []logparsingpipeline.PipelineOperator{
					{
						OrderId: 1,
						ID:      "add",
						Type:    "add",
						Field:   "attributes.test",
						Value:   "val",
						Enabled: true,
						Name:    "test add",
					},
				},
			},
			ExpectedResponseStatusCode: 200,
		},
		{
			Name: "Invalid orderId",
			Pipeline: logparsingpipeline.PostablePipeline{
				OrderId: 0,
				Name:    "pipeline 1",
				Alias:   "pipeline1",
				Enabled: true,
				Filter:  validPipelineFilter,
				Config: []logparsingpipeline.PipelineOperator{
					{
						OrderId: 1,
						ID:      "add",
						Type:    "add",
						Field:   "attributes.test",
						Value:   "val",
						Enabled: true,
						Name:    "test add",
					},
				},
			},
			ExpectedResponseStatusCode: 400,
		},
		{
			Name: "Invalid filter",
			Pipeline: logparsingpipeline.PostablePipeline{
				OrderId: 1,
				Name:    "pipeline 1",
				Alias:   "pipeline1",
				Enabled: true,
				Filter:  &v3.FilterSet{},
				Config: []logparsingpipeline.PipelineOperator{
					{
						OrderId: 1,
						ID:      "add",
						Type:    "add",
						Field:   "attributes.test",
						Value:   "val",
						Enabled: true,
						Name:    "test add",
					},
				},
			},
			ExpectedResponseStatusCode: 400,
		},
		{
			Name: "Invalid operator field",
			Pipeline: logparsingpipeline.PostablePipeline{
				OrderId: 1,
				Name:    "pipeline 1",
				Alias:   "pipeline1",
				Enabled: true,
				Filter:  validPipelineFilter,
				Config: []logparsingpipeline.PipelineOperator{
					{
						OrderId: 1,
						ID:      "add",
						Type:    "add",
						Field:   "bad.field",
						Value:   "val",
						Enabled: true,
						Name:    "test add",
					},
				},
			},
			ExpectedResponseStatusCode: 400,
		},
	}

	for _, tc := range testCases {
		t.Run(tc.Name, func(t *testing.T) {
			testbed := NewLogPipelinesTestBed(t)
			testbed.PostPipelinesToQSExpectingStatusCode(
				logparsingpipeline.PostablePipelines{
					Pipelines: []logparsingpipeline.PostablePipeline{tc.Pipeline},
				},
				tc.ExpectedResponseStatusCode,
			)
		})
	}
}

func TestOpAMPServerToAgentCommunication(t *testing.T) {
	testbed := NewLogPipelinesTestBed(t)
	require := require.New(t)

	// If an agent connects before any pipelines exist,
	// it should receive the same config it sent over
	// in the first message on connection.
	getPipelinesResp := testbed.GetPipelinesFromQS()
	require.Equal(
		0, len(getPipelinesResp.Pipelines),
		"There should be no pipelines at the start",
	)

	agent1Conn := &mockOpAmpConnection{}
	response := testbed.opampServer.OnMessage(
		agent1Conn,
		&protobufs.AgentToServer{
			InstanceUid: "testAgent1",
			EffectiveConfig: &protobufs.EffectiveConfig{
				ConfigMap: &TestCollectorConfig,
			},
		},
	)

	errorMsg := fmt.Sprintf(
		"opamp server OnMessage did not respond with expected effective config. Received: %v", response,
	)
	require.NotNil(response.RemoteConfig, errorMsg)
	require.NotNil(response.RemoteConfig.Config, errorMsg)

	expectedConfigYaml := maps.Values(TestCollectorConfig.ConfigMap)[0].Body
	recommendedConfigYaml := maps.Values(response.RemoteConfig.Config.ConfigMap)[0].Body
	requireYamlsAreEqual(t, expectedConfigYaml, recommendedConfigYaml)

	// If an agent connects after some pipelines exist,
	// it should receive the merged config back.

	postablePipelines := logparsingpipeline.PostablePipelines{
		Pipelines: []logparsingpipeline.PostablePipeline{
			{
				OrderId: 1,
				Name:    "pipeline1",
				Alias:   "pipeline1",
				Enabled: true,
				Filter: &v3.FilterSet{
					Operator: "AND",
					Items: []v3.FilterItem{
						{
							Key: v3.AttributeKey{
								Key:      "method",
								DataType: v3.AttributeKeyDataTypeString,
								Type:     v3.AttributeKeyTypeTag,
							},
							Operator: "=",
							Value:    "GET",
						},
					},
				},
				Config: []logparsingpipeline.PipelineOperator{
					{
						OrderId: 1,
						ID:      "add",
						Type:    "add",
						Field:   "attributes.test",
						Value:   "val",
						Enabled: true,
						Name:    "test add",
					},
				},
			},
		},
	}
	createPipelinesResp := testbed.PostPipelinesToQS(postablePipelines)
	assertPipelinesResponseMatchesPostedPipelines(
		t, postablePipelines, createPipelinesResp,
	)
	testbed.assertPipelinesSentToOpampClient(createPipelinesResp.Pipelines)

	agent2Conn := &mockOpAmpConnection{}
	response2 := testbed.opampServer.OnMessage(
		agent2Conn,
		&protobufs.AgentToServer{
			InstanceUid: "testAgent2",
			EffectiveConfig: &protobufs.EffectiveConfig{
				ConfigMap: &TestCollectorConfig,
			},
		},
	)

	errorMsg2 := fmt.Sprintf(
		"opamp server OnMessage did not respond with expected effective config. Received: %v", response,
	)
	require.NotNil(response2.RemoteConfig, errorMsg2)
	require.NotNil(response2.RemoteConfig.Config, errorMsg2)
	configFiles := maps.Values(
		response2.RemoteConfig.Config.ConfigMap,
	)
	require.Equal(1, len(configFiles), errorMsg2)

	// Validate initial agent config is included in
	// config recommended by the opamp server.
	recommendedConfYaml := configFiles[0].Body
	testAgentConfYaml := maps.Values(TestCollectorConfig.ConfigMap)[0].Body
	assertCollectorConfIncludesSubset(
		t, recommendedConfYaml, testAgentConfYaml,
	)
	assertCollectorConfHasLogPipelinesConfig(
		t, recommendedConfYaml, createPipelinesResp.Pipelines,
	)

	// If pipelines change, all agents should receive
	// the latest effective config.
	postablePipelines.Pipelines[0].Config[0].Value = "new value"
	updatePipelinesResp := testbed.PostPipelinesToQS(postablePipelines)
	assertPipelinesResponseMatchesPostedPipelines(
		t, postablePipelines, updatePipelinesResp,
	)
	testbed.assertPipelinesSentToOpampClient(updatePipelinesResp.Pipelines)

	assertOpampClientReceivedPipelines(
		t, agent1Conn, updatePipelinesResp.Pipelines,
	)
	assertOpampClientReceivedPipelines(
		t, agent2Conn, updatePipelinesResp.Pipelines,
	)
}

func requireYamlsAreEqual(
	t *testing.T,
	yaml1 []byte,
	yaml2 []byte,
) {

	normalizeYaml := func(yamlText []byte) string {
		// normalize text representations (order, array repr etc)
		parser := yaml.Parser()

		unmarshalled, err := parser.Unmarshal(yamlText)
		require.Nil(t, err)

		marshalled, err := parser.Marshal(unmarshalled)
		require.Nil(t, err)

		return string(marshalled)
	}

	require.Equal(
		t, normalizeYaml(yaml1), normalizeYaml(yaml2),
	)
}

func assertCollectorConfIncludesSubset(
	t *testing.T,
	collectorConfYaml []byte,
	expectedSubsetYaml []byte,
) {
	collectorConf, err := yaml.Parser().Unmarshal(collectorConfYaml)
	if err != nil {
		t.Fatalf("Failed to unmarshal collectorConfYaml")
	}

	expectedSubset, err := yaml.Parser().Unmarshal(expectedSubsetYaml)
	if err != nil {
		t.Fatalf("Failed to unmarshal expectedSubsetYaml")
	}

	for _, section := range []string{
		"receivers", "processors", "exporters", "service",
	} {
		expectedSectionItemNames := maps.Keys(
			expectedSubset[section].(map[string]interface{}),
		)

		for _, expectedItemName := range expectedSectionItemNames {
			_, itemExistInCollectorConf := collectorConf[section].(map[string]interface{})[expectedItemName]
			assert.True(
				t, itemExistInCollectorConf,
				fmt.Sprintf(
					"Collector conf did not contain expected item: %s.%s",
					section, expectedItemName,
				),
			)
		}
	}
}

// LogPipelinesTestBed coordinates and mocks components involved in
// configuring log pipelines and provides test helpers.
type LogPipelinesTestBed struct {
	t               *testing.T
	testUser        *model.User
	apiHandler      *app.APIHandler
	opampServer     *opamp.Server
	opampClientConn *mockOpAmpConnection
}

func NewLogPipelinesTestBed(t *testing.T) *LogPipelinesTestBed {
	// Create a tmp file based sqlite db for testing.
	testDBFile, err := os.CreateTemp("", "test-signoz-db-*")
	if err != nil {
		t.Fatalf("could not create temp file for test db: %v", err)
	}
	testDBFilePath := testDBFile.Name()
	t.Cleanup(func() { os.Remove(testDBFilePath) })
	testDBFile.Close()

	// TODO(Raj): move away from singleton DB instances to avoid
	// issues when running tests in parallel.
	dao.InitDao("sqlite", testDBFilePath)

	testDB, err := sqlx.Open("sqlite3", testDBFilePath)
	if err != nil {
		t.Fatalf("could not open test db sqlite file: %v", err)
	}
	controller, err := logparsingpipeline.NewLogParsingPipelinesController(testDB, "sqlite")
	if err != nil {
		t.Fatalf("could not create a logparsingpipelines controller: %v", err)
	}

	apiHandler, err := app.NewAPIHandler(app.APIHandlerOpts{
		AppDao:                        dao.DB(),
		LogsParsingPipelineController: controller,
	})
	if err != nil {
		t.Fatalf("could not create a new ApiHandler: %v", err)
	}

	opampServer, err := mockOpampServer(testDBFilePath)
	if err != nil {
		t.Fatalf("could not create opamp server and mock client connection: %v", err)
	}

	clientConn, _ := mockOpampAgent(opampServer)

	user, apiErr := createTestUser()
	if apiErr != nil {
		t.Fatalf("could not create a test user: %v", apiErr)
	}

	return &LogPipelinesTestBed{
		t:               t,
		testUser:        user,
		apiHandler:      apiHandler,
		opampServer:     opampServer,
		opampClientConn: clientConn,
	}
}

func (tb *LogPipelinesTestBed) PostPipelinesToQSExpectingStatusCode(
	postablePipelines logparsingpipeline.PostablePipelines,
	expectedStatusCode int,
) *logparsingpipeline.PipelinesResponse {
	req, err := NewAuthenticatedTestRequest(
		tb.testUser, "/api/v1/logs/pipelines", postablePipelines,
	)
	if err != nil {
		tb.t.Fatalf("couldn't create authenticated test request: %v", err)
	}

	respWriter := httptest.NewRecorder()
	tb.apiHandler.CreateLogsPipeline(respWriter, req)

	response := respWriter.Result()
	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		tb.t.Fatalf("couldn't read response body received from posting pipelines to QS: %v", err)
	}

	if response.StatusCode != expectedStatusCode {
		tb.t.Fatalf(
			"Received response status %d after posting log pipelines. Expected: %d\nResponse body:%s\n",
			response.StatusCode, expectedStatusCode, string(responseBody),
		)
	}

	var result app.ApiResponse
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		tb.t.Fatalf(
			"Could not unmarshal QS response into an ApiResponse.\nResponse body: %s",
			responseBody,
		)
	}

	pipelinesResp, err := unmarshalPipelinesResponse(&result)
	if err != nil {
		tb.t.Fatalf("could not extract PipelinesResponse from apiResponse: %v", err)
	}
	return pipelinesResp
}

func (tb *LogPipelinesTestBed) PostPipelinesToQS(
	postablePipelines logparsingpipeline.PostablePipelines,
) *logparsingpipeline.PipelinesResponse {
	return tb.PostPipelinesToQSExpectingStatusCode(
		postablePipelines, 200,
	)
}

func (tb *LogPipelinesTestBed) GetPipelinesFromQS() *logparsingpipeline.PipelinesResponse {
	req, err := NewAuthenticatedTestRequest(
		tb.testUser, "/api/v1/logs/pipelines/latest", nil,
	)
	if err != nil {
		tb.t.Fatalf("couldn't create authenticated test request: %v", err)
	}
	req = mux.SetURLVars(req, map[string]string{
		"version": "latest",
	})

	respWriter := httptest.NewRecorder()
	tb.apiHandler.ListLogsPipelinesHandler(respWriter, req)
	response := respWriter.Result()
	responseBody, err := io.ReadAll(response.Body)
	if err != nil {
		tb.t.Fatalf("couldn't read response body received from QS: %v", err)
	}

	if response.StatusCode != 200 {
		tb.t.Fatalf(
			"could not list log parsing pipelines. status: %d, body: %v",
			response.StatusCode, string(responseBody),
		)
	}

	var result app.ApiResponse
	err = json.Unmarshal(responseBody, &result)
	if err != nil {
		tb.t.Fatalf(
			"Could not unmarshal QS response into an ApiResponse.\nResponse body: %s",
			string(responseBody),
		)
	}
	pipelinesResp, err := unmarshalPipelinesResponse(&result)
	if err != nil {
		tb.t.Fatalf("could not extract PipelinesResponse from apiResponse: %v", err)
	}
	return pipelinesResp
}

func (tb *LogPipelinesTestBed) assertPipelinesSentToOpampClient(
	pipelines []logparsingpipeline.Pipeline,
) {
	assertOpampClientReceivedPipelines(
		tb.t, tb.opampClientConn, pipelines,
	)
}

func assertOpampClientReceivedPipelines(
	t *testing.T,
	conn *mockOpAmpConnection,
	pipelines []logparsingpipeline.Pipeline,
) {
	lastMsg := conn.latestMsgFromServer()
	collectorConfFiles := lastMsg.RemoteConfig.Config.ConfigMap
	assert.Equal(
		t, len(collectorConfFiles), 1,
		"otel config sent to client is expected to contain atleast 1 file",
	)

	collectorConfYaml := maps.Values(collectorConfFiles)[0].Body
	assertCollectorConfHasLogPipelinesConfig(
		t, collectorConfYaml, pipelines,
	)
}

func assertCollectorConfHasLogPipelinesConfig(
	t *testing.T,
	collectorConfYaml []byte,
	pipelines []logparsingpipeline.Pipeline,
) {
	collectorConfSentToClient, err := yaml.Parser().Unmarshal(collectorConfYaml)
	if err != nil {
		t.Fatalf("could not unmarshal config file sent to opamp client: %v", err)
	}

	// Each pipeline is expected to become its own processor
	// in the logs service in otel collector config.
	collectorConfSvcs := collectorConfSentToClient["service"].(map[string]interface{})
	collectorConfLogsSvc := collectorConfSvcs["pipelines"].(map[string]interface{})["logs"].(map[string]interface{})
	collectorConfLogsSvcProcessorNames := collectorConfLogsSvc["processors"].([]interface{})
	collectorConfLogsPipelineProcNames := []string{}
	for _, procNameVal := range collectorConfLogsSvcProcessorNames {
		procName := procNameVal.(string)
		if strings.HasPrefix(procName, constants.LogsPPLPfx) {
			collectorConfLogsPipelineProcNames = append(
				collectorConfLogsPipelineProcNames,
				procName,
			)
		}
	}
	_, expectedLogProcessorNames, err := logparsingpipeline.PreparePipelineProcessor(pipelines)
	assert.Equal(
		t, expectedLogProcessorNames, collectorConfLogsPipelineProcNames,
		"config sent to opamp client doesn't contain expected log pipelines",
	)

	collectorConfProcessors := collectorConfSentToClient["processors"].(map[string]interface{})
	for _, procName := range expectedLogProcessorNames {
		pipelineProcessorInConf, procExists := collectorConfProcessors[procName]
		assert.True(t, procExists, fmt.Sprintf(
			"%s processor not found in config sent to opamp client", procName,
		))

		// Validate that filter expr in collector conf is as expected.

		// extract expr present in collector conf processor
		pipelineProcOps := pipelineProcessorInConf.(map[string]interface{})["operators"].([]interface{})

		routerOpIdx := slices.IndexFunc(
			pipelineProcOps,
			func(op interface{}) bool { return op.(map[string]interface{})["id"] == "router_signoz" },
		)
		require.GreaterOrEqual(t, routerOpIdx, 0)
		routerOproutes := pipelineProcOps[routerOpIdx].(map[string]interface{})["routes"].([]interface{})
		pipelineFilterExpr := routerOproutes[0].(map[string]interface{})["expr"].(string)

		// find logparsingpipeline.Pipeline whose processor is being validated here
		pipelineIdx := slices.IndexFunc(
			pipelines, func(p logparsingpipeline.Pipeline) bool {
				return logparsingpipeline.CollectorConfProcessorName(p) == procName
			},
		)
		require.GreaterOrEqual(t, pipelineIdx, 0)
		expectedExpr, err := queryBuilderToExpr.Parse(pipelines[pipelineIdx].Filter)
		require.Nil(t, err)
		require.Equal(t, expectedExpr, pipelineFilterExpr)
	}

}

func (tb *LogPipelinesTestBed) simulateOpampClientAcknowledgementForLatestConfig() {
	lastMsg := tb.opampClientConn.latestMsgFromServer()
	tb.opampServer.OnMessage(tb.opampClientConn, &protobufs.AgentToServer{
		InstanceUid: "test",
		EffectiveConfig: &protobufs.EffectiveConfig{
			ConfigMap: lastMsg.RemoteConfig.Config,
		},
		RemoteConfigStatus: &protobufs.RemoteConfigStatus{
			Status:               protobufs.RemoteConfigStatuses_RemoteConfigStatuses_APPLIED,
			LastRemoteConfigHash: lastMsg.RemoteConfig.ConfigHash,
		},
	})
}

func unmarshalPipelinesResponse(apiResponse *app.ApiResponse) (
	*logparsingpipeline.PipelinesResponse,
	error,
) {
	dataJson, err := json.Marshal(apiResponse.Data)
	if err != nil {
		return nil, errors.Wrap(err, "could not marshal apiResponse.Data")
	}
	var pipelinesResp logparsingpipeline.PipelinesResponse
	err = json.Unmarshal(dataJson, &pipelinesResp)
	if err != nil {
		return nil, errors.Wrap(err, "could not unmarshal apiResponse.Data json into PipelinesResponse")
	}

	return &pipelinesResp, nil
}

func assertPipelinesResponseMatchesPostedPipelines(
	t *testing.T,
	postablePipelines logparsingpipeline.PostablePipelines,
	pipelinesResp *logparsingpipeline.PipelinesResponse,
) {
	assert.Equal(
		t, len(postablePipelines.Pipelines), len(pipelinesResp.Pipelines),
		"length mistmatch between posted pipelines and pipelines in response",
	)
	for i, pipeline := range pipelinesResp.Pipelines {
		postable := postablePipelines.Pipelines[i]
		assert.Equal(t, postable.Name, pipeline.Name, "pipeline.Name mismatch")
		assert.Equal(t, postable.OrderId, pipeline.OrderId, "pipeline.OrderId mismatch")
		assert.Equal(t, postable.Enabled, pipeline.Enabled, "pipeline.Enabled mismatch")
		assert.Equal(t, postable.Config, pipeline.Config, "pipeline.Config mismatch")
	}
}

func mockOpampServer(testDBFilePath string) (
	*opamp.Server, error,
) {
	// Mock an available opamp agent.
	testDB, err := opampModel.InitDB(testDBFilePath)
	if err != nil {
		return nil, err
	}
	err = agentConf.Initiate(testDB, "sqlite")
	if err != nil {
		return nil, err
	}
	agentConfigProvider, apiErr := agentConf.NewCollectorConfigProvider()
	if apiErr != nil {
		return nil, apiErr.ToError()
	}
	opampServer := opamp.InitializeServer(nil, agentConfigProvider)
	return opampServer, nil
}

func mockOpampAgent(opampServer *opamp.Server) (
	*mockOpAmpConnection, *protobufs.ServerToAgent,
) {
	// Mock an available opamp agent
	opampClientConnection := &mockOpAmpConnection{}
	response := opampServer.OnMessage(
		opampClientConnection,
		&protobufs.AgentToServer{
			InstanceUid: "test",
			EffectiveConfig: &protobufs.EffectiveConfig{
				ConfigMap: &TestCollectorConfig,
			},
		},
	)
	return opampClientConnection, response
}

var TestCollectorConfig protobufs.AgentConfigMap = protobufs.AgentConfigMap{
	ConfigMap: map[string]*protobufs.AgentConfigFile{
		"otel-collector.yaml": {
			Body: []byte(`
      receivers:
        otlp:
          protocols:
            grpc:
              endpoint: 0.0.0.0:4317
            http:
              endpoint: 0.0.0.0:4318
      processors:
        batch:
          send_batch_size: 10000
          send_batch_max_size: 11000
          timeout: 10s
      exporters:
        otlp:
          endpoint: otelcol2:4317
      service:
        pipelines:
          logs:
            receivers: [otlp]
            processors: [batch]
            exporters: [otlp]
    `),
			ContentType: "text/yaml",
		},
	},
}

func createTestUser() (*model.User, *model.ApiError) {
	// Create a test user for auth
	ctx := context.Background()
	org, apiErr := dao.DB().CreateOrg(ctx, &model.Organization{
		Name: "test",
	})
	if apiErr != nil {
		return nil, apiErr
	}

	group, apiErr := dao.DB().CreateGroup(ctx, &model.Group{
		Name: "test",
	})
	if apiErr != nil {
		return nil, apiErr
	}

	return dao.DB().CreateUser(
		ctx,
		&model.User{
			Name:     "test",
			Email:    "test@test.com",
			Password: "test",
			OrgId:    org.Id,
			GroupId:  group.Id,
		},
		true,
	)
}

func NewAuthenticatedTestRequest(
	user *model.User,
	path string,
	postData interface{},
) (*http.Request, error) {
	userJwt, err := auth.GenerateJWTForUser(user)
	if err != nil {
		return nil, err
	}

	var req *http.Request

	if postData != nil {
		var body bytes.Buffer
		err = json.NewEncoder(&body).Encode(postData)
		if err != nil {
			return nil, err
		}
		req = httptest.NewRequest(http.MethodPost, path, &body)
	} else {
		req = httptest.NewRequest(http.MethodPost, path, nil)
	}

	req.Header.Add("Authorization", "Bearer "+userJwt.AccessJwt)
	return req, nil
}

type mockOpAmpConnection struct {
	serverToAgentMsgs []*protobufs.ServerToAgent
}

func (conn *mockOpAmpConnection) Send(ctx context.Context, msg *protobufs.ServerToAgent) error {
	conn.serverToAgentMsgs = append(conn.serverToAgentMsgs, msg)
	return nil
}

func (conn *mockOpAmpConnection) latestMsgFromServer() *protobufs.ServerToAgent {
	if len(conn.serverToAgentMsgs) < 1 {
		return nil
	}
	return conn.serverToAgentMsgs[len(conn.serverToAgentMsgs)-1]
}

func (conn *mockOpAmpConnection) LatestPipelinesReceivedFromServer() ([]logparsingpipeline.Pipeline, error) {
	pipelines := []logparsingpipeline.Pipeline{}
	lastMsg := conn.latestMsgFromServer()
	if lastMsg == nil {
		return pipelines, nil
	}

	return pipelines, nil
}

func (conn *mockOpAmpConnection) Disconnect() error {
	return nil
}
func (conn *mockOpAmpConnection) RemoteAddr() net.Addr {
	return nil
}
