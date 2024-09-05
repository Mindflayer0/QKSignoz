package v4

import (
	"testing"

	. "github.com/smartystreets/goconvey/convey"
	"go.signoz.io/signoz/pkg/query-service/constants"
	v3 "go.signoz.io/signoz/pkg/query-service/model/v3"
)

var testGetClickhouseColumnNameData = []struct {
	Name               string
	AttributeKey       v3.AttributeKey
	ExpectedColumnName string
}{
	{
		Name:               "attribute",
		AttributeKey:       v3.AttributeKey{Key: "user_name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
		ExpectedColumnName: "attributes_string['user_name']",
	},
	{
		Name:               "resource",
		AttributeKey:       v3.AttributeKey{Key: "servicename", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeResource},
		ExpectedColumnName: "resources_string['servicename']",
	},
	{
		Name:               "selected field",
		AttributeKey:       v3.AttributeKey{Key: "servicename", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag, IsColumn: true},
		ExpectedColumnName: "`attribute_string_servicename`",
	},
	{
		Name:               "selected field resource",
		AttributeKey:       v3.AttributeKey{Key: "sdk_version", DataType: v3.AttributeKeyDataTypeInt64, Type: v3.AttributeKeyTypeResource, IsColumn: true},
		ExpectedColumnName: "`resource_number_sdk_version`",
	},
	{
		Name:               "selected field float",
		AttributeKey:       v3.AttributeKey{Key: "sdk_version", DataType: v3.AttributeKeyDataTypeFloat64, Type: v3.AttributeKeyTypeTag, IsColumn: true},
		ExpectedColumnName: "`attribute_number_sdk_version`",
	},
	{
		Name:               "same name as top level column",
		AttributeKey:       v3.AttributeKey{Key: "trace_id", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
		ExpectedColumnName: "attributes_string['trace_id']",
	},
	{
		Name:               "top level column",
		AttributeKey:       v3.AttributeKey{Key: "trace_id", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeUnspecified, IsColumn: true},
		ExpectedColumnName: "trace_id",
	},
	{
		Name:               "name with - ",
		AttributeKey:       v3.AttributeKey{Key: "test-attr", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag, IsColumn: true},
		ExpectedColumnName: "`attribute_string_test-attr`",
	},
}

func TestGetClickhouseColumnName(t *testing.T) {
	for _, tt := range testGetClickhouseColumnNameData {
		Convey("testGetClickhouseColumnNameData", t, func() {
			columnName := getClickhouseColumnName(tt.AttributeKey)
			So(columnName, ShouldEqual, tt.ExpectedColumnName)
		})
	}
}

var testGetSelectLabelsData = []struct {
	Name              string
	AggregateOperator v3.AggregateOperator
	GroupByTags       []v3.AttributeKey
	SelectLabels      string
}{
	{
		Name:              "select fields for groupBy attribute",
		AggregateOperator: v3.AggregateOperatorCount,
		GroupByTags:       []v3.AttributeKey{{Key: "user_name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
		SelectLabels:      " attributes_string['user_name'] as `user_name`,",
	},
	{
		Name:              "select fields for groupBy resource",
		AggregateOperator: v3.AggregateOperatorCount,
		GroupByTags:       []v3.AttributeKey{{Key: "user_name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeResource}},
		SelectLabels:      " resources_string['user_name'] as `user_name`,",
	},
	{
		Name:              "select fields for groupBy attribute and resource",
		AggregateOperator: v3.AggregateOperatorCount,
		GroupByTags: []v3.AttributeKey{
			{Key: "user_name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeResource},
			{Key: "host", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
		},
		SelectLabels: " resources_string['user_name'] as `user_name`, attributes_string['host'] as `host`,",
	},
	{
		Name:              "select fields for groupBy materialized columns",
		AggregateOperator: v3.AggregateOperatorCount,
		GroupByTags:       []v3.AttributeKey{{Key: "host", IsColumn: true}},
		SelectLabels:      " host as `host`,",
	},
	{
		Name:              "trace_id field as an attribute",
		AggregateOperator: v3.AggregateOperatorCount,
		GroupByTags:       []v3.AttributeKey{{Key: "trace_id", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
		SelectLabels:      " attributes_string['trace_id'] as `trace_id`,",
	},
}

func TestGetSelectLabels(t *testing.T) {
	for _, tt := range testGetSelectLabelsData {
		Convey("testGetSelectLabelsData", t, func() {
			selectLabels := getSelectLabels(tt.AggregateOperator, tt.GroupByTags)
			So(selectLabels, ShouldEqual, tt.SelectLabels)
		})
	}
}

var timeSeriesFilterQueryData = []struct {
	Name           string
	FilterSet      *v3.FilterSet
	GroupBy        []v3.AttributeKey
	ExpectedFilter string
	Fields         map[string]v3.AttributeKey
	Error          string
}{
	{
		Name: "Test attribute and resource attribute",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "user_name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "john", Operator: "="},
			{Key: v3.AttributeKey{Key: "k8s_namespace", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeResource}, Value: "my_service", Operator: "!="},
		}},
		ExpectedFilter: "attributes_string['user_name'] = 'john' AND mapContains(attributes_string, 'user_name')",
	},
	{
		Name: "Test attribute and resource attribute with different case",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "user_name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "%JoHn%", Operator: "like"},
			{Key: v3.AttributeKey{Key: "k8s_namespace", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeResource}, Value: "%MyService%", Operator: "nlike"},
		}},
		ExpectedFilter: "attributes_string['user_name'] LIKE '%JoHn%' AND mapContains(attributes_string, 'user_name')",
	},
	{
		Name: "Test materialized column",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "user_name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag, IsColumn: true}, Value: "john", Operator: "="},
			{Key: v3.AttributeKey{Key: "k8s_namespace", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeResource}, Value: "my_service", Operator: "!="},
		}},
		ExpectedFilter: "`attribute_string_user_name` = 'john'",
	},
	{
		Name: "Test like",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "host", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "102.%", Operator: "like"},
		}},
		ExpectedFilter: "attributes_string['host'] LIKE '102.%' AND mapContains(attributes_string, 'host')",
	},
	{
		Name: "Test IN",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeFloat64, Type: v3.AttributeKeyTypeTag}, Value: []interface{}{1, 2, 3, 4}, Operator: "in"},
		}},
		ExpectedFilter: "attributes_number['bytes'] IN [1,2,3,4] AND mapContains(attributes_number, 'bytes')",
	},
	{
		Name: "Test DataType int64",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeInt64, Type: v3.AttributeKeyTypeTag}, Value: 10, Operator: ">"},
		}},
		ExpectedFilter: "attributes_number['bytes'] > 10 AND mapContains(attributes_number, 'bytes')",
	},
	{
		Name: "Test NOT IN",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: []interface{}{"john", "bunny"}, Operator: "nin"},
		}},
		ExpectedFilter: "attributes_string['name'] NOT IN ['john','bunny'] AND mapContains(attributes_string, 'name')",
	},
	{
		Name: "Test exists",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "", Operator: "exists"},
		}},
		ExpectedFilter: "mapContains(attributes_string, 'bytes')",
	},
	{
		Name: "Test not exists",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "", Operator: "nexists"},
		}},
		ExpectedFilter: "not mapContains(attributes_string, 'bytes')",
	},
	{
		Name: "Test contains",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "host", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "102.", Operator: "contains"},
		}},
		ExpectedFilter: "attributes_string['host'] LIKE '%102.%' AND mapContains(attributes_string, 'host')",
	},
	{
		Name: "Test contains with single quotes",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "message", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "hello 'world'", Operator: "contains"},
		}},
		ExpectedFilter: "attributes_string['message'] LIKE '%hello \\'world\\'%' AND mapContains(attributes_string, 'message')",
	},
	{
		Name: "Test not contains",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "host", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "102.", Operator: "ncontains"},
		}},
		ExpectedFilter: "attributes_string['host'] NOT LIKE '%102.%' AND mapContains(attributes_string, 'host')",
	},
	{
		Name: "Test regex",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "host", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag, IsColumn: true}, Value: "host: \"(?P<host>\\S+)\"", Operator: "regex"},
		}},
		ExpectedFilter: "match(`attribute_string_host`, 'host: \"(?P<host>\\\\S+)\"')",
	},
	{
		Name: "Test not regex",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "host", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "102.", Operator: "nregex"},
		}},
		ExpectedFilter: "NOT match(attributes_string['host'], '102.') AND mapContains(attributes_string, 'host')",
	},
	{
		Name: "Test groupBy",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "host", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "102.", Operator: "ncontains"},
		}},
		GroupBy:        []v3.AttributeKey{{Key: "host", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
		ExpectedFilter: "attributes_string['host'] NOT LIKE '%102.%' AND mapContains(attributes_string, 'host') AND mapContains(attributes_string, 'host')",
	},
	{
		Name: "Test groupBy isColumn",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "host", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "102.", Operator: "ncontains"},
		}},
		GroupBy:        []v3.AttributeKey{{Key: "host", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag, IsColumn: true}},
		ExpectedFilter: "attributes_string['host'] NOT LIKE '%102.%' AND mapContains(attributes_string, 'host') AND `attribute_string_host_exists`=true",
	},
	{
		Name: "Wrong data",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "bytes", Type: v3.AttributeKeyTypeTag, DataType: v3.AttributeKeyDataTypeFloat64}, Value: true, Operator: "="},
		}},
		Error: "failed to validate and cast value for bytes: invalid data type, expected float, got bool",
	},
	{
		Name: "Test top level field with metadata",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "body", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "%test%", Operator: "like"},
		}},
		ExpectedFilter: "attributes_string['body'] LIKE '%test%' AND mapContains(attributes_string, 'body')",
	},
	{
		Name: "Test exists on top level field",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "trace_id", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeUnspecified, IsColumn: true}, Operator: "exists"},
		}},
		ExpectedFilter: "trace_id != ''",
	},
	{
		Name: "Test not exists on top level field",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "span_id", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeUnspecified, IsColumn: true}, Operator: "nexists"},
		}},
		ExpectedFilter: "span_id = ''",
	},
	{
		Name: "Test exists on top level field number",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "trace_flags", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeUnspecified, IsColumn: true}, Operator: "exists"},
		}},
		ExpectedFilter: "trace_flags != 0",
	},
	{
		Name: "Test not exists on top level field number",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "severity_number", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeUnspecified, IsColumn: true}, Operator: "nexists"},
		}},
		ExpectedFilter: "severity_number = 0",
	},
	{
		Name: "Test exists on materiazlied column",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag, IsColumn: true}, Operator: "exists"},
		}},
		ExpectedFilter: "`attribute_string_method_exists`=true",
	},
	{
		Name: "Test nexists on materiazlied column",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "status", DataType: v3.AttributeKeyDataTypeInt64, Type: v3.AttributeKeyTypeTag, IsColumn: true}, Operator: "nexists"},
		}},
		ExpectedFilter: "`attribute_number_status_exists`=false",
	},
	{
		Name: "Test for body contains and ncontains",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "body", DataType: v3.AttributeKeyDataTypeString, IsColumn: true}, Operator: "contains", Value: "test"},
			{Key: v3.AttributeKey{Key: "body", DataType: v3.AttributeKeyDataTypeString, IsColumn: true}, Operator: "ncontains", Value: "test1"},
		}},
		ExpectedFilter: "lower(body) LIKE lower('%test%') AND lower(body) NOT LIKE lower('%test1%')",
	},
	{
		Name: "Test for body like and nlike",
		FilterSet: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
			{Key: v3.AttributeKey{Key: "body", DataType: v3.AttributeKeyDataTypeString, IsColumn: true}, Operator: "like", Value: "test"},
			{Key: v3.AttributeKey{Key: "body", DataType: v3.AttributeKeyDataTypeString, IsColumn: true}, Operator: "nlike", Value: "test1"},
		}},
		ExpectedFilter: "lower(body) LIKE lower('test') AND lower(body) NOT LIKE lower('test1')",
	},
}

func TestBuildLogsTimeSeriesFilterQuery(t *testing.T) {
	for _, tt := range timeSeriesFilterQueryData {
		Convey("TestBuildLogsTimeSeriesFilterQuery", t, func() {
			query, err := buildLogsTimeSeriesFilterQuery(tt.FilterSet, tt.GroupBy, v3.AttributeKey{})
			if tt.Error != "" {
				So(err.Error(), ShouldEqual, tt.Error)
			} else {
				So(err, ShouldBeNil)
				So(query, ShouldEqual, tt.ExpectedFilter)
			}

		})
	}
}

var testBuildLogsQueryData = []struct {
	Name              string
	PanelType         v3.PanelType
	Start             int64
	End               int64
	Step              int64
	BuilderQuery      *v3.BuilderQuery
	GroupByTags       []v3.AttributeKey
	TableName         string
	AggregateOperator v3.AggregateOperator
	ExpectedQuery     string
	Type              int
	PreferRPM         bool
}{
	{
		Name:      "Test aggregate count on select field",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorCount,
			Expression:        "A",
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, toFloat64(count(*)) as value " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"group by ts order by value DESC",
	},
	{
		Name:      "Test aggregate count on a attribute",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "user_name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCount,
			Expression:         "A",
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, toFloat64(count(*)) as value " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) " +
			"AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) AND mapContains(attributes_string, 'user_name') group by ts order by value DESC",
	},
	{
		Name:      "Test aggregate count on a with filter",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "user_name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCount,
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeFloat64, Type: v3.AttributeKeyTypeTag}, Value: 100, Operator: ">"},
			}},
			Expression: "A",
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, toFloat64(count(*)) as value " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND " +
			"(ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) AND " +
			"attributes_number['bytes'] > 100.000000 AND mapContains(attributes_number, 'bytes') AND mapContains(attributes_string, 'user_name') " +
			"group by ts order by value DESC",
	},
	// {
	// 	Name:      "Test aggregate count on a with resource filter",
	// 	PanelType: v3.PanelTypeGraph,
	// 	Start:     1680066360726210000,
	// 	End:       1680066458000000000,
	// 	BuilderQuery: &v3.BuilderQuery{
	// 		QueryName:          "A",
	// 		StepInterval:       60,
	// 		AggregateAttribute: v3.AttributeKey{Key: "user_name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
	// 		AggregateOperator:  v3.AggregateOperatorCount,
	// 		Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
	// 			{Key: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeFloat64, Type: v3.AttributeKeyTypeResource}, Value: 100, Operator: ">"},
	// 		}},
	// 		Expression: "A",
	// 	},
	// 	TableName: "logs",
	// 	ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, toFloat64(count(*)) as value " +
	// 		"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND " +
	// 		"(ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) AND " +
	// 		"mapContains(attributes_string, 'user_name') AND (resource_fingerprint GLOBAL IN (SELECT fingerprint FROM signoz_logs.distributed_logs_v2_resource " +
	// 		"WHERE (seen_at_ts_bucket_start >= 1680064560) AND (seen_at_ts_bucket_start <= 1680066458) AND simpleJSONExtractString(lower(labels), 'bytes') > 100.000000" +
	// 		" AND lower(labels) like '%bytes%')) group by ts order by value DESC",
	// },
	{
		Name:      "Test aggregate count distinct and order by value",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag, IsColumn: true},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			OrderBy:            []v3.OrderBy{{ColumnName: "#SIGNOZ_VALUE", Order: "ASC"}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, toFloat64(count(distinct(`attribute_string_name`))) as value " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) AND `attribute_string_name_exists`=true group by " +
			"ts order by value ASC",
	},
	{
		Name:      "Test aggregate count distinct on non selected field",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, toFloat64(count(distinct(attributes_string['name']))) as value " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) AND mapContains(attributes_string, 'name') group by ts order by value DESC",
	},
	{
		Name:      "Test aggregate count distinct on non selected field containing dot",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "method.name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			GroupBy:            []v3.AttributeKey{{Key: "host.name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy:            []v3.OrderBy{{ColumnName: "host.name", Order: "ASC"}, {ColumnName: "ts", Order: "ASC", Key: "ts"}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, attributes_string['host.name'] as `host.name`, " +
			"toFloat64(count(distinct(attributes_string['method.name']))) as value from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) AND mapContains(attributes_string, 'host.name') " +
			"AND mapContains(attributes_string, 'method.name') group by `host.name`,ts order by `host.name` ASC",
	},
	{
		Name:      "Test aggregate count distinct on selected field containing dot",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "method.name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag, IsColumn: true},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			GroupBy:            []v3.AttributeKey{{Key: "host.name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag, IsColumn: true}},
			OrderBy:            []v3.OrderBy{{ColumnName: "host.name", Order: "ASC"}, {ColumnName: "ts", Order: "ASC", Key: "ts", IsColumn: true}},
		},

		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, `attribute_string_host$$name` as `host.name`, toFloat64(count(distinct(`attribute_string_method$$name`))) as value" +
			" from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND `attribute_string_host$$name_exists`=true AND `attribute_string_method$$name_exists`=true " +
			"group by `host.name`,ts " +
			"order by `host.name` ASC",
	},
	{
		Name:      "Test aggregate count distinct with filter and groupBy",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag, IsColumn: true},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
				{Key: v3.AttributeKey{Key: "x", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeResource}, Value: "abc", Operator: "!="},
			},
			},
			GroupBy: []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy: []v3.OrderBy{{ColumnName: "method", Order: "ASC"}, {ColumnName: "ts", Order: "ASC", Key: "ts", IsColumn: true}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts," +
			" attributes_string['method'] as `method`, " +
			"toFloat64(count(distinct(`attribute_string_name`))) as value from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') " +
			"AND mapContains(attributes_string, 'method') AND `attribute_string_name_exists`=true " +
			"AND (resource_fingerprint GLOBAL IN (SELECT fingerprint FROM signoz_logs.distributed_logs_v2_resource " +
			"WHERE (seen_at_ts_bucket_start >= 1680064560) AND (seen_at_ts_bucket_start <= 1680066458) AND simpleJSONExtractString(lower(labels), 'x') != 'abc' " +
			"AND lower(labels) not like '%x%abc%')) group by `method`,ts " +
			"order by `method` ASC",
	},
	{
		Name:      "Test aggregate count with multiple filter,groupBy and orderBy",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag, IsColumn: true},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
				{Key: v3.AttributeKey{Key: "x", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeResource}, Value: "abc", Operator: "!="},
			},
			},
			GroupBy: []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, {Key: "x", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeResource}},
			OrderBy: []v3.OrderBy{{ColumnName: "method", Order: "ASC"}, {ColumnName: "x", Order: "ASC"}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts," +
			" attributes_string['method'] as `method`, " +
			"resources_string['x'] as `x`, " +
			"toFloat64(count(distinct(`attribute_string_name`))) as value from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') " +
			"AND mapContains(attributes_string, 'method') AND `attribute_string_name_exists`=true " +
			"AND (resource_fingerprint GLOBAL IN (SELECT fingerprint FROM signoz_logs.distributed_logs_v2_resource " +
			"WHERE (seen_at_ts_bucket_start >= 1680064560) AND (seen_at_ts_bucket_start <= 1680066458) AND simpleJSONExtractString(lower(labels), 'x') != 'abc' " +
			"AND lower(labels) not like '%x%abc%' AND ( (simpleJSONHas(lower(labels), 'x') AND lower(labels) like '%x%') ))) group by `method`,`x`,ts order by `method` ASC,`x` ASC",
	},
	{
		Name:      "Test aggregate avg",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeFloat64, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorAvg,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
			GroupBy: []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy: []v3.OrderBy{{ColumnName: "method", Order: "ASC"}, {ColumnName: "x", Order: "ASC", Key: "x", IsColumn: true}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts," +
			" attributes_string['method'] as `method`, " +
			"avg(attributes_number['bytes']) as value " +
			"from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') " +
			"AND mapContains(attributes_string, 'method') " +
			"AND mapContains(attributes_number, 'bytes') " +
			"group by `method`,ts " +
			"order by `method` ASC",
	},
	{
		Name:      "Test aggregate sum",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeFloat64, Type: v3.AttributeKeyTypeTag, IsColumn: true},
			AggregateOperator:  v3.AggregateOperatorSum,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
			GroupBy: []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy: []v3.OrderBy{{ColumnName: "method", Order: "ASC"}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts," +
			" attributes_string['method'] as `method`, " +
			"sum(`attribute_number_bytes`) as value " +
			"from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') " +
			"AND mapContains(attributes_string, 'method') " +
			"AND `attribute_number_bytes_exists`=true " +
			"group by `method`,ts " +
			"order by `method` ASC",
	},
	{
		Name:      "Test aggregate min",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeFloat64, Type: v3.AttributeKeyTypeTag, IsColumn: true},
			AggregateOperator:  v3.AggregateOperatorMin,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
			GroupBy: []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy: []v3.OrderBy{{ColumnName: "method", Order: "ASC"}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts," +
			" attributes_string['method'] as `method`, " +
			"min(`attribute_number_bytes`) as value " +
			"from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') " +
			"AND mapContains(attributes_string, 'method') " +
			"AND `attribute_number_bytes_exists`=true " +
			"group by `method`,ts " +
			"order by `method` ASC",
	},
	{
		Name:      "Test aggregate max",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeFloat64, Type: v3.AttributeKeyTypeTag, IsColumn: true},
			AggregateOperator:  v3.AggregateOperatorMax,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
			GroupBy: []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy: []v3.OrderBy{{ColumnName: "method", Order: "ASC"}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts," +
			" attributes_string['method'] as `method`, " +
			"max(`attribute_number_bytes`) as value " +
			"from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') " +
			"AND mapContains(attributes_string, 'method') " +
			"AND `attribute_number_bytes_exists`=true " +
			"group by `method`,ts " +
			"order by `method` ASC",
	},
	{
		Name:      "Test aggregate PXX",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeFloat64, Type: v3.AttributeKeyTypeTag, IsColumn: true},
			AggregateOperator:  v3.AggregateOperatorP05,
			Expression:         "A",
			Filters:            &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{}},
			GroupBy:            []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy:            []v3.OrderBy{{ColumnName: "method", Order: "ASC"}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts," +
			" attributes_string['method'] as `method`, " +
			"quantile(0.05)(`attribute_number_bytes`) as value " +
			"from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND mapContains(attributes_string, 'method') " +
			"AND `attribute_number_bytes_exists`=true " +
			"group by `method`,ts " +
			"order by `method` ASC",
	},
	{
		Name:      "Test aggregate RateSum",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "bytes", DataType: v3.AttributeKeyDataTypeFloat64, Type: v3.AttributeKeyTypeTag, IsColumn: true},
			AggregateOperator:  v3.AggregateOperatorRateSum,
			Expression:         "A",
			Filters:            &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{}},
			GroupBy:            []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy:            []v3.OrderBy{{ColumnName: "method", Order: "ASC"}},
		},
		TableName: "logs",
		PreferRPM: true,
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, attributes_string['method'] as `method`" +
			", sum(`attribute_number_bytes`)/1.000000 as value from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND mapContains(attributes_string, 'method') " +
			"AND `attribute_number_bytes_exists`=true " +
			"group by `method`,ts order by `method` ASC",
	},
	{
		Name:      "Test aggregate rate",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "bytes", Type: v3.AttributeKeyTypeTag, DataType: v3.AttributeKeyDataTypeFloat64},
			AggregateOperator:  v3.AggregateOperatorRate,
			Expression:         "A",
			Filters:            &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{}},
			GroupBy:            []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy:            []v3.OrderBy{{ColumnName: "method", Order: "ASC"}},
		},
		TableName: "logs",
		PreferRPM: false,
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, attributes_string['method'] as `method`" +
			", count(attributes_number['bytes'])/60.000000 as value " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND mapContains(attributes_string, 'method') " +
			"AND mapContains(attributes_number, 'bytes') " +
			"group by `method`,ts " +
			"order by `method` ASC",
	},
	{
		Name:      "Test aggregate RateSum without materialized column",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "bytes", Type: v3.AttributeKeyTypeTag, DataType: v3.AttributeKeyDataTypeFloat64},
			AggregateOperator:  v3.AggregateOperatorRateSum,
			Expression:         "A",
			Filters:            &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{}},
			GroupBy:            []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy:            []v3.OrderBy{{ColumnName: "method", Order: "ASC"}},
		},
		TableName: "logs",
		PreferRPM: true,
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, " +
			"attributes_string['method'] as `method`, " +
			"sum(attributes_number['bytes'])/1.000000 as value " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND mapContains(attributes_string, 'method') " +
			"AND mapContains(attributes_number, 'bytes') " +
			"group by `method`,ts " +
			"order by `method` ASC",
	},
	{
		Name:      "Test Noop",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			SelectColumns:     []v3.AttributeKey{},
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters:           &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{}},
			OrderBy: []v3.OrderBy{
				v3.OrderBy{ColumnName: "timestamp", Order: "DESC"},
			},
		},
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"order by timestamp DESC",
	},
	{
		Name:      "Test Noop order by custom",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			SelectColumns:     []v3.AttributeKey{},
			QueryName:         "A",
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters:           &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{}},
			OrderBy:           []v3.OrderBy{{ColumnName: "method", DataType: v3.AttributeKeyDataTypeString, Order: "ASC", IsColumn: true}},
		},
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) order by `method` ASC",
	},
	{
		Name:      "Test Noop with filter",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			SelectColumns:     []v3.AttributeKey{},
			QueryName:         "A",
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "severity_number", DataType: v3.AttributeKeyDataTypeInt64, IsColumn: true}, Operator: "!=", Value: 0},
			}},
		},
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) " +
			"AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) AND severity_number != 0 order by timestamp DESC",
	},
	{
		Name:      "Test aggregate with having clause",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			Having: []v3.Having{
				{
					ColumnName: "name",
					Operator:   ">",
					Value:      10,
				},
			},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, toFloat64(count(distinct(attributes_string['name']))) as value " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND mapContains(attributes_string, 'name') group by ts having value > 10 order by value DESC",
	},
	{
		Name:      "Test aggregate with having clause and filters",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
			Having: []v3.Having{
				{
					ColumnName: "name",
					Operator:   ">",
					Value:      10,
				},
			},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, toFloat64(count(distinct(attributes_string['name']))) as value " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') AND mapContains(attributes_string, 'name') group by ts having value > 10 order by value DESC",
	},
	{
		Name:      "Test top level key",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "body", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeUnspecified, IsColumn: true}, Value: "%test%", Operator: "like"},
			},
			},
			Having: []v3.Having{
				{
					ColumnName: "name",
					Operator:   ">",
					Value:      10,
				},
			},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, toFloat64(count(distinct(attributes_string['name']))) as value " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND lower(body) LIKE lower('%test%') AND mapContains(attributes_string, 'name') group by ts having value > 10 order by value DESC",
	},
	{
		Name:      "Test attribute with same name as top level key",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "body", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "%test%", Operator: "like"},
			},
			},
			Having: []v3.Having{
				{
					ColumnName: "name",
					Operator:   ">",
					Value:      10,
				},
			},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, toFloat64(count(distinct(attributes_string['name']))) as value " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND attributes_string['body'] LIKE '%test%' AND mapContains(attributes_string, 'body') AND mapContains(attributes_string, 'name') group by ts having value > 10 order by value DESC",
	},

	// Tests for table panel type
	{
		Name:      "TABLE: Test count",
		PanelType: v3.PanelTypeTable,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorCount,
			Expression:        "A",
		},
		TableName: "logs",
		ExpectedQuery: "SELECT now() as ts, toFloat64(count(*)) as value from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) " +
			"AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) order by value DESC",
	},
	{
		Name:      "TABLE: Test count with groupBy",
		PanelType: v3.PanelTypeTable,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorCount,
			Expression:        "A",
			GroupBy: []v3.AttributeKey{
				{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT now() as ts, attributes_string['name'] as `name`, toFloat64(count(*)) as value from signoz_logs.distributed_logs_v2 where " +
			"(timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND mapContains(attributes_string, 'name') group by `name` order by value DESC",
	},
	{
		Name:      "TABLE: Test rate with groupBy",
		PanelType: v3.PanelTypeTable,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorRate,
			Expression:        "A",
			GroupBy: []v3.AttributeKey{
				{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT now() as ts, attributes_string['name'] as `name`, count()/97.000000 as value from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND mapContains(attributes_string, 'name') group by `name` order by value DESC",
	},
	{
		Name:      "TABLE: Test count with groupBy, orderBy",
		PanelType: v3.PanelTypeTable,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorCount,
			Expression:        "A",
			GroupBy: []v3.AttributeKey{
				{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			},
			OrderBy: []v3.OrderBy{
				{ColumnName: "name", Order: "DESC"},
			},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT now() as ts, attributes_string['name'] as `name`, toFloat64(count(*)) as value from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND mapContains(attributes_string, 'name') group by `name` order by `name` DESC",
	},
	{
		Name:      "TABLE: Test count with JSON Filter, groupBy, orderBy",
		PanelType: v3.PanelTypeTable,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorCount,
			Expression:        "A",
			Filters: &v3.FilterSet{
				Operator: "AND",
				Items: []v3.FilterItem{
					{
						Key: v3.AttributeKey{
							Key:      "body.message",
							DataType: "string",
							IsJSON:   true,
						},
						Operator: "contains",
						Value:    "a",
					},
				},
			},
			GroupBy: []v3.AttributeKey{
				{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			},
			OrderBy: []v3.OrderBy{
				{ColumnName: "name", Order: "DESC"},
			},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT now() as ts, attributes_string['name'] as `name`, toFloat64(count(*)) as value from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND lower(body) like lower('%message%') AND JSON_EXISTS(body, '$.\"message\"') AND JSON_VALUE(body, '$.\"message\"') LIKE '%a%' " +
			"AND mapContains(attributes_string, 'name') group by `name` order by `name` DESC",
	},
	{
		Name:      "TABLE: Test count with JSON Filter Array, groupBy, orderBy",
		PanelType: v3.PanelTypeTable,
		Start:     1680066360726210000,
		End:       1680066458000000000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorCount,
			Expression:        "A",
			Filters: &v3.FilterSet{
				Operator: "AND",
				Items: []v3.FilterItem{
					{
						Key: v3.AttributeKey{
							Key:      "body.requestor_list[*]",
							DataType: "array(string)",
							IsJSON:   true,
						},
						Operator: "has",
						Value:    "index_service",
					},
				},
			},
			GroupBy: []v3.AttributeKey{
				{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			},
			OrderBy: []v3.OrderBy{
				{ColumnName: "name", Order: "DESC"},
			},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT now() as ts, attributes_string['name'] as `name`, toFloat64(count(*)) as value from signoz_logs.distributed_logs_v2 " +
			"where (timestamp >= 1680066360726210000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND lower(body) like lower('%requestor_list%') AND lower(body) like lower('%index_service%') AND " +
			"has(JSONExtract(JSON_QUERY(body, '$.\"requestor_list\"[*]'), 'Array(String)'), 'index_service') AND mapContains(attributes_string, 'name') " +
			"group by `name` order by `name` DESC",
	},
}

func TestBuildLogsQuery(t *testing.T) {
	for _, tt := range testBuildLogsQueryData {
		Convey("TestBuildLogsQuery", t, func() {
			query, err := buildLogsQuery(tt.PanelType, tt.Start, tt.End, tt.BuilderQuery.StepInterval, tt.BuilderQuery, "", tt.PreferRPM)
			So(err, ShouldBeNil)
			So(query, ShouldEqual, tt.ExpectedQuery)

		})
	}
}

var testOrderBy = []struct {
	Name      string
	PanelType v3.PanelType
	Items     []v3.OrderBy
	Tags      []v3.AttributeKey
	Result    string
}{
	{
		Name:      "Test 1",
		PanelType: v3.PanelTypeGraph,
		Items: []v3.OrderBy{
			{
				ColumnName: "name",
				Order:      "asc",
			},
			{
				ColumnName: constants.SigNozOrderByValue,
				Order:      "desc",
			},
		},
		Tags: []v3.AttributeKey{
			{Key: "name"},
		},
		Result: "`name` asc,value desc",
	},
	{
		Name:      "Test 2",
		PanelType: v3.PanelTypeGraph,
		Items: []v3.OrderBy{
			{
				ColumnName: "name",
				Order:      "asc",
			},
			{
				ColumnName: "bytes",
				Order:      "asc",
			},
		},
		Tags: []v3.AttributeKey{
			{Key: "name"},
			{Key: "bytes"},
		},
		Result: "`name` asc,`bytes` asc",
	},
	{
		Name:      "Test Graph item not present in tag",
		PanelType: v3.PanelTypeGraph,
		Items: []v3.OrderBy{
			{
				ColumnName: "name",
				Order:      "asc",
			},
			{
				ColumnName: "bytes",
				Order:      "asc",
			},
			{
				ColumnName: "method",
				Order:      "asc",
			},
		},
		Tags: []v3.AttributeKey{
			{Key: "name"},
			{Key: "bytes"},
		},
		Result: "`name` asc,`bytes` asc",
	},
	{
		Name:      "Test 3",
		PanelType: v3.PanelTypeList,
		Items: []v3.OrderBy{
			{
				ColumnName: "name",
				Order:      "asc",
			},
			{
				ColumnName: constants.SigNozOrderByValue,
				Order:      "asc",
			},
			{
				ColumnName: "bytes",
				Order:      "asc",
			},
		},
		Tags: []v3.AttributeKey{
			{Key: "name"},
			{Key: "bytes"},
		},
		Result: "`name` asc,value asc,`bytes` asc",
	},
	{
		Name:      "Test 4",
		PanelType: v3.PanelTypeList,
		Items: []v3.OrderBy{
			{
				ColumnName: "name",
				Order:      "asc",
			},
			{
				ColumnName: constants.SigNozOrderByValue,
				Order:      "asc",
			},
			{
				ColumnName: "bytes",
				Order:      "asc",
			},
			{
				ColumnName: "response_time",
				Order:      "desc",
				Key:        "response_time",
				Type:       v3.AttributeKeyTypeTag,
				DataType:   v3.AttributeKeyDataTypeString,
			},
		},
		Tags: []v3.AttributeKey{
			{Key: "name"},
			{Key: "bytes"},
		},
		Result: "`name` asc,value asc,`bytes` asc,attributes_string['response_time'] desc",
	},
}

func TestOrderBy(t *testing.T) {
	for _, tt := range testOrderBy {
		Convey("testOrderBy", t, func() {
			res := orderByAttributeKeyTags(tt.PanelType, tt.Items, tt.Tags)
			So(res, ShouldResemble, tt.Result)
		})
	}
}

var testPrepLogsQueryData = []struct {
	Name              string
	PanelType         v3.PanelType
	Start             int64
	End               int64
	Step              int64
	BuilderQuery      *v3.BuilderQuery
	GroupByTags       []v3.AttributeKey
	TableName         string
	AggregateOperator v3.AggregateOperator
	ExpectedQuery     string
	Options           v3.LogQBOptions
}{
	{
		Name:      "Test TS with limit- first",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
			Limit:   10,
			GroupBy: []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT `method` from (SELECT attributes_string['method'] as `method`, toFloat64(count(distinct(attributes_string['name']))) " +
			"as value from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') AND mapContains(attributes_string, 'method') AND mapContains(attributes_string, 'name') group by `method` order by value DESC) LIMIT 10",
		Options: v3.LogQBOptions{GraphLimitQtype: constants.FirstQueryGraphLimit, PreferRPM: true},
	},
	{
		Name:      "Test TS with limit- first - with order by value",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
			Limit:   10,
			GroupBy: []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy: []v3.OrderBy{{ColumnName: constants.SigNozOrderByValue, Order: "ASC"}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT `method` from (SELECT attributes_string['method'] as `method`, toFloat64(count(distinct(attributes_string['name']))) " +
			"as value from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') AND mapContains(attributes_string, 'method') AND mapContains(attributes_string, 'name') group by `method` order by value ASC) LIMIT 10",
		Options: v3.LogQBOptions{GraphLimitQtype: constants.FirstQueryGraphLimit, PreferRPM: true},
	},
	{
		Name:      "Test TS with limit- first - with order by attribute",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
			Limit:   10,
			GroupBy: []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy: []v3.OrderBy{{ColumnName: "method", Order: "ASC"}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT `method` from (SELECT attributes_string['method'] as `method`, toFloat64(count(distinct(attributes_string['name']))) " +
			"as value from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') AND mapContains(attributes_string, 'method') AND mapContains(attributes_string, 'name') group by `method` order by `method` ASC) LIMIT 10",
		Options: v3.LogQBOptions{GraphLimitQtype: constants.FirstQueryGraphLimit, PreferRPM: true},
	},
	{
		Name:      "Test TS with limit- second",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
			GroupBy: []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			Limit:   2,
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, attributes_string['method'] as `method`, " +
			"toFloat64(count(distinct(attributes_string['name']))) as value from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) " +
			"AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') AND mapContains(attributes_string, 'method') " +
			"AND mapContains(attributes_string, 'name') AND (`method`) GLOBAL IN (#LIMIT_PLACEHOLDER) group by `method`,ts order by value DESC",
		Options: v3.LogQBOptions{GraphLimitQtype: constants.SecondQueryGraphLimit},
	},
	{
		Name:      "Test TS with limit- second - with order by",
		PanelType: v3.PanelTypeGraph,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:          "A",
			StepInterval:       60,
			AggregateAttribute: v3.AttributeKey{Key: "name", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag},
			AggregateOperator:  v3.AggregateOperatorCountDistinct,
			Expression:         "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
			GroupBy: []v3.AttributeKey{{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			OrderBy: []v3.OrderBy{{ColumnName: "method", Order: "ASC"}},
			Limit:   2,
		},
		TableName: "logs",
		ExpectedQuery: "SELECT toStartOfInterval(fromUnixTimestamp64Nano(timestamp), INTERVAL 60 SECOND) AS ts, attributes_string['method'] as `method`, " +
			"toFloat64(count(distinct(attributes_string['name']))) as value from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) " +
			"AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') AND mapContains(attributes_string, 'method') " +
			"AND mapContains(attributes_string, 'name') AND (`method`) GLOBAL IN (#LIMIT_PLACEHOLDER) group by `method`,ts order by `method` ASC",
		Options: v3.LogQBOptions{GraphLimitQtype: constants.SecondQueryGraphLimit},
	},
	// Live tail
	{
		Name:      "Live Tail Query",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string " +
			"from signoz_logs.distributed_logs_v2 where attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') AND ",
		Options: v3.LogQBOptions{IsLivetailQuery: true},
	},
	{
		Name:      "Live Tail Query with contains",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "contains"},
			},
			},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string " +
			"from signoz_logs.distributed_logs_v2 where attributes_string['method'] LIKE '%GET%' AND mapContains(attributes_string, 'method') AND ",
		Options: v3.LogQBOptions{IsLivetailQuery: true},
	},
	{
		Name:      "Live Tail Query W/O filter",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters:           &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{}},
		},
		TableName: "logs",
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string " +
			"from signoz_logs.distributed_logs_v2 where ",
		Options: v3.LogQBOptions{IsLivetailQuery: true},
	},
	{
		Name:      "Table query w/o limit",
		PanelType: v3.PanelTypeTable,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorCount,
			Expression:        "A",
			Filters:           &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{}},
		},
		TableName:     "logs",
		ExpectedQuery: "SELECT now() as ts, toFloat64(count(*)) as value from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) order by value DESC",
		Options:       v3.LogQBOptions{},
	},
	{
		Name:      "Table query with limit",
		PanelType: v3.PanelTypeTable,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorCount,
			Expression:        "A",
			Filters:           &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{}},
			Limit:             10,
		},
		TableName:     "logs",
		ExpectedQuery: "SELECT now() as ts, toFloat64(count(*)) as value from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) order by value DESC LIMIT 10",
		Options:       v3.LogQBOptions{},
	},
	{
		Name:      "Ignore offset if order by is timestamp in list queries",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "id", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeUnspecified, IsColumn: true}, Value: "logid", Operator: "<"},
			},
			},
			OrderBy: []v3.OrderBy{
				{
					ColumnName: "timestamp",
					Order:      "DESC",
				},
			},
			Offset:   100,
			PageSize: 100,
		},
		TableName: "logs",
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND id < 'logid' order by timestamp DESC LIMIT 100",
	},
	{
		Name:      "Don't ignore offset if order by is not timestamp",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}, Value: "GET", Operator: "="},
			},
			},
			OrderBy: []v3.OrderBy{
				{
					ColumnName: "mycolumn",
					Order:      "DESC",
				},
			},
			Offset:   100,
			PageSize: 100,
		},
		TableName: "logs",
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string " +
			"from signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND " +
			"ts_bucket_start <= 1680066458) AND attributes_string['method'] = 'GET' AND mapContains(attributes_string, 'method') order by resources_string['mycolumn'] DESC LIMIT 100 OFFSET 100",
	},
}

func TestPrepareLogsQuery(t *testing.T) {
	for _, tt := range testPrepLogsQueryData {
		Convey("TestBuildLogsQuery", t, func() {
			query, err := PrepareLogsQuery(tt.Start, tt.End, "", tt.PanelType, tt.BuilderQuery, tt.Options)
			So(err, ShouldBeNil)
			So(query, ShouldEqual, tt.ExpectedQuery)

		})
	}
}

var testPrepLogsQueryLimitOffsetData = []struct {
	Name              string
	PanelType         v3.PanelType
	Start             int64
	End               int64
	Step              int64
	BuilderQuery      *v3.BuilderQuery
	GroupByTags       []v3.AttributeKey
	TableName         string
	AggregateOperator v3.AggregateOperator
	ExpectedQuery     string
	Options           v3.LogQBOptions
}{
	{
		Name:      "Test limit less than pageSize - order by ts",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters:           &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{}},
			OrderBy:           []v3.OrderBy{{ColumnName: constants.TIMESTAMP, Order: "desc", Key: constants.TIMESTAMP, DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeUnspecified, IsColumn: true}},
			Limit:             1,
			Offset:            0,
			PageSize:          5,
		},
		TableName: "logs",
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string from " +
			"signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"order by `timestamp` desc LIMIT 1",
	},
	{
		Name:      "Test limit greater than pageSize - order by ts",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "id", Type: v3.AttributeKeyTypeUnspecified, DataType: v3.AttributeKeyDataTypeString, IsColumn: true}, Operator: v3.FilterOperatorLessThan, Value: "2TNh4vp2TpiWyLt3SzuadLJF2s4"},
			}},
			OrderBy:  []v3.OrderBy{{ColumnName: constants.TIMESTAMP, Order: "desc", Key: constants.TIMESTAMP, DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeUnspecified, IsColumn: true}},
			Limit:    100,
			Offset:   10,
			PageSize: 10,
		},
		TableName: "logs",
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string from " +
			"signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"AND id < '2TNh4vp2TpiWyLt3SzuadLJF2s4' order by `timestamp` desc LIMIT 10",
	},
	{
		Name:      "Test limit less than pageSize  - order by custom",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters:           &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{}},
			OrderBy:           []v3.OrderBy{{ColumnName: "method", Order: "desc", Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			Limit:             1,
			Offset:            0,
			PageSize:          5,
		},
		TableName: "logs",
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string from " +
			"signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) " +
			"order by attributes_string['method'] desc LIMIT 1 OFFSET 0",
	},
	{
		Name:      "Test limit greater than pageSize - order by custom",
		PanelType: v3.PanelTypeList,
		Start:     1680066360726,
		End:       1680066458000,
		BuilderQuery: &v3.BuilderQuery{
			QueryName:         "A",
			StepInterval:      60,
			AggregateOperator: v3.AggregateOperatorNoOp,
			Expression:        "A",
			Filters: &v3.FilterSet{Operator: "AND", Items: []v3.FilterItem{
				{Key: v3.AttributeKey{Key: "id", Type: v3.AttributeKeyTypeUnspecified, DataType: v3.AttributeKeyDataTypeString, IsColumn: true}, Operator: v3.FilterOperatorLessThan, Value: "2TNh4vp2TpiWyLt3SzuadLJF2s4"},
			}},
			OrderBy:  []v3.OrderBy{{ColumnName: "method", Order: "desc", Key: "method", DataType: v3.AttributeKeyDataTypeString, Type: v3.AttributeKeyTypeTag}},
			Limit:    100,
			Offset:   50,
			PageSize: 50,
		},
		TableName: "logs",
		ExpectedQuery: "SELECT timestamp, id, trace_id, span_id, trace_flags, severity_text, severity_number, body,attributes_string,attributes_number,attributes_bool,resources_string from " +
			"signoz_logs.distributed_logs_v2 where (timestamp >= 1680066360726000000 AND timestamp <= 1680066458000000000) AND (ts_bucket_start >= 1680064560 AND ts_bucket_start <= 1680066458) AND " +
			"id < '2TNh4vp2TpiWyLt3SzuadLJF2s4' order by attributes_string['method'] desc LIMIT 50 OFFSET 50",
	},
}

func TestPrepareLogsQueryLimitOffset(t *testing.T) {
	for _, tt := range testPrepLogsQueryLimitOffsetData {
		Convey("TestBuildLogsQuery", t, func() {
			query, err := PrepareLogsQuery(tt.Start, tt.End, "", tt.PanelType, tt.BuilderQuery, tt.Options)
			So(err, ShouldBeNil)
			So(query, ShouldEqual, tt.ExpectedQuery)

		})
	}
}
