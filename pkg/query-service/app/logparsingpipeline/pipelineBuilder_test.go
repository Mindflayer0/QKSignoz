package logparsingpipeline

import (
	"context"
	"strings"
	"testing"
	"time"

	"github.com/open-telemetry/opentelemetry-collector-contrib/pkg/stanza/entry"
	. "github.com/smartystreets/goconvey/convey"
	"github.com/stretchr/testify/require"
	"go.signoz.io/signoz/pkg/query-service/model"
	v3 "go.signoz.io/signoz/pkg/query-service/model/v3"
	"go.signoz.io/signoz/pkg/query-service/utils"
)

var prepareProcessorTestData = []struct {
	Name      string
	Operators []PipelineOperator
	Output    []PipelineOperator
}{
	{
		Name: "Last operator disabled",
		Operators: []PipelineOperator{
			{
				ID:      "t1",
				Name:    "t1",
				Output:  "t2",
				Enabled: true,
			},
			{
				ID:      "t2",
				Name:    "t2",
				Enabled: false,
			},
		},
		Output: []PipelineOperator{
			{
				ID:      "t1",
				Name:    "t1",
				Enabled: true,
			},
		},
	},
	{
		Name: "Operator in middle disabled",
		Operators: []PipelineOperator{
			{
				ID:      "t1",
				Name:    "t1",
				Output:  "t2",
				Enabled: true,
			},
			{
				ID:      "t2",
				Name:    "t2",
				Output:  "t3",
				Enabled: false,
			},
			{
				ID:      "t3",
				Name:    "t3",
				Enabled: true,
			},
		},
		Output: []PipelineOperator{
			{
				ID:      "t1",
				Name:    "t1",
				Output:  "t3",
				Enabled: true,
			},
			{
				ID:      "t3",
				Name:    "t3",
				Enabled: true,
			},
		},
	},
	{
		Name: "Single operator disabled",
		Operators: []PipelineOperator{
			{
				ID:      "t1",
				Name:    "t1",
				Output:  "t2",
				Enabled: false,
			},
		},
		Output: []PipelineOperator{},
	},
	{
		Name: "Single operator enabled",
		Operators: []PipelineOperator{
			{
				ID:      "t1",
				Name:    "t1",
				Enabled: true,
			},
		},
		Output: []PipelineOperator{
			{
				ID:      "t1",
				Name:    "t1",
				Enabled: true,
			},
		},
	},
	{
		Name:      "Empty operator",
		Operators: []PipelineOperator{},
		Output:    []PipelineOperator{},
	},
	{
		Name: "new test",
		Operators: []PipelineOperator{
			{
				ID:      "move_filename",
				Output:  "move_function",
				Enabled: true,
				Name:    "move_filename",
			},
			{
				ID:      "move_function",
				Output:  "move_line",
				Enabled: false,
				Name:    "move_function",
			},
			{
				ID:      "move_line",
				Output:  "move_lwp",
				Enabled: true,
				Name:    "move_line",
			},
			{
				ID:      "move_lwp",
				Output:  "move_callid",
				Enabled: true,
				Name:    "move_lwp",
			},
			{
				ID:      "move_callid",
				Enabled: true,
				Name:    "move_lwp",
			},
		},
		Output: []PipelineOperator{
			{
				ID:      "move_filename",
				Output:  "move_line",
				Enabled: true,
				Name:    "move_filename",
			},
			{
				ID:      "move_line",
				Output:  "move_lwp",
				Enabled: true,
				Name:    "move_line",
			},
			{
				ID:      "move_lwp",
				Output:  "move_callid",
				Enabled: true,
				Name:    "move_lwp",
			},
			{
				ID:      "move_callid",
				Enabled: true,
				Name:    "move_lwp",
			},
		},
	},
	{
		Name: "first op disabled",
		Operators: []PipelineOperator{
			{
				ID:      "move_filename",
				Output:  "move_function",
				Enabled: false,
				Name:    "move_filename",
			},
			{
				ID:      "move_function",
				Enabled: true,
				Name:    "move_function",
			},
		},
		Output: []PipelineOperator{
			{
				ID:      "move_function",
				Enabled: true,
				Name:    "move_function",
			},
		},
	},
}

func TestPreparePipelineProcessor(t *testing.T) {
	for _, test := range prepareProcessorTestData {
		Convey(test.Name, t, func() {
			res := getOperators(test.Operators)
			So(res, ShouldResemble, test.Output)
		})
	}
}

func TestNoCollectorErrorsFromProcessorsForMismatchedLogs(t *testing.T) {
	require := require.New(t)

	testPipelineFilter := &v3.FilterSet{
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
	makeTestPipeline := func(config []PipelineOperator) Pipeline {
		return Pipeline{
			OrderId: 1,
			Name:    "pipeline1",
			Alias:   "pipeline1",
			Enabled: true,
			Filter:  testPipelineFilter,
			Config:  config,
		}
	}

	makeTestLog := func(
		body string,
		attributes map[string]string,
	) model.SignozLog {
		attributes["method"] = "GET"

		testTraceId, err := utils.RandomHex(16)
		require.Nil(err)

		testSpanId, err := utils.RandomHex(8)
		require.Nil(err)

		return model.SignozLog{
			Timestamp:         uint64(time.Now().UnixNano()),
			Body:              body,
			Attributes_string: attributes,
			Resources_string:  attributes,
			SeverityText:      entry.Info.String(),
			SeverityNumber:    uint8(entry.Info),
			SpanID:            testSpanId,
			TraceID:           testTraceId,
		}
	}

	testCases := []struct {
		Name           string
		Operator       PipelineOperator
		NonMatchingLog model.SignozLog
	}{
		{
			"regex processor should ignore non-matching log",
			PipelineOperator{
				ID:        "regex",
				Type:      "regex_parser",
				Enabled:   true,
				Name:      "regex parser",
				ParseFrom: "body",
				ParseTo:   "attributes",
				Regex:     `^\s*(?P<body_json>{.*})\s*$`,
			},
			makeTestLog("mismatching log", map[string]string{}),
		},
		// TODO(Raj): see if there is an error scenario for grok parser.
		// TODO(Raj): see if there is an error scenario for trace parser.
		{
			"json parser should ignore non matching logs",
			PipelineOperator{
				ID:        "json",
				Type:      "json_parser",
				Enabled:   true,
				Name:      "json parser",
				ParseFrom: "attributes.test_json",
				ParseTo:   "attributes",
			},
			makeTestLog("mismatching log", map[string]string{
				"test_json": "bad json",
			}),
		}, {
			"move parser should ignore non matching logs",
			PipelineOperator{
				ID:      "move",
				Type:    "move",
				Enabled: true,
				Name:    "move",
				From:    "attributes.test1",
				To:      "attributes.test2",
			},
			makeTestLog("mismatching log", map[string]string{}),
		},
	}

	for _, testCase := range testCases {
		testPipelines := []Pipeline{makeTestPipeline([]PipelineOperator{testCase.Operator})}

		result, collectorErrorLogs, err := SimulatePipelinesProcessing(
			context.Background(),
			testPipelines,
			[]model.SignozLog{testCase.NonMatchingLog},
		)
		require.Nil(err)
		require.Equal(0, len(collectorErrorLogs), strings.Join(collectorErrorLogs, "\n"))
		require.Equal(1, len(result))
	}
}
