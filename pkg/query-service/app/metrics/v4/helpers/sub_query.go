package helpers

import (
	"fmt"
	"strings"
	"time"

	"go.signoz.io/signoz/pkg/query-service/constants"
	v3 "go.signoz.io/signoz/pkg/query-service/model/v3"
	"go.signoz.io/signoz/pkg/query-service/utils"
)

var (
	sixHoursInMilliseconds = time.Hour.Milliseconds() * 6
	oneDayInMilliseconds   = time.Hour.Milliseconds() * 24
	oneWeekInMilliseconds  = oneDayInMilliseconds * 7
)

// start and end are in milliseconds
func whichTSTableToUse(start, end int64) (int64, int64, string) {
	// If time range is less than 6 hours, we need to use the `time_series_v4` table
	// else if time range is less than 1 day and greater than 6 hours, we need to use the `time_series_v4_6hrs` table
	// else we need to use the `time_series_v4_1day` table
	var tableName string
	if end-start < sixHoursInMilliseconds {
		// adjust the start time to nearest 1 hour
		start = start - (start % (time.Hour.Milliseconds() * 1))
		tableName = constants.SIGNOZ_TIMESERIES_v4_LOCAL_TABLENAME
	} else if end-start < oneDayInMilliseconds {
		// adjust the start time to nearest 6 hours
		start = start - (start % (time.Hour.Milliseconds() * 6))
		tableName = constants.SIGNOZ_TIMESERIES_v4_6HRS_LOCAL_TABLENAME
	} else if end-start < oneWeekInMilliseconds {
		// adjust the start time to nearest 1 day
		start = start - (start % (time.Hour.Milliseconds() * 24))
		tableName = constants.SIGNOZ_TIMESERIES_v4_1DAY_LOCAL_TABLENAME
	} else {
		// adjust the start time to nearest 1 week
		start = start - (start % (time.Hour.Milliseconds() * 24 * 7))
		tableName = constants.SIGNOZ_TIMESERIES_v4_1WEEK_LOCAL_TABLENAME
	}

	return start, end, tableName
}

// start and end are in milliseconds
// we have three tables for samples
// 1. distributed_samples_v4
// 2. distributed_samples_v4_agg_5min - for queries with time range above or equal to 1 day and less than 1 week
// 3. distributed_samples_v4_agg_30min - for queries with time range above or equal to 1 week
// if the `timeAggregation` is `count_distinct` we can't use the aggregated tables because they don't support it
func WhichSamplesTableToUse(start, end int64, mq *v3.BuilderQuery) string {

	// we don't have any aggregated table for sketches
	if mq.AggregateAttribute.Type == v3.AttributeKeyType(v3.MetricTypeExponentialHistogram) {
		return constants.SIGNOZ_EXP_HISTOGRAM_TABLENAME
	}

	if mq.TimeAggregation == v3.TimeAggregationCountDistinct {
		return constants.SIGNOZ_SAMPLES_V4_TABLENAME
	}

	if end-start < oneDayInMilliseconds {
		return constants.SIGNOZ_SAMPLES_V4_TABLENAME
	} else if end-start < oneWeekInMilliseconds {
		return constants.SIGNOZ_SAMPLES_V4_AGG_5MIN_TABLENAME
	} else {
		return constants.SIGNOZ_SAMPLES_V4_AGG_30MIN_TABLENAME
	}
}

func AggregationColumnForSamplesTable(start, end int64, mq *v3.BuilderQuery) string {
	tableName := WhichSamplesTableToUse(start, end, mq)
	var aggregationColumn string
	switch mq.Temporality {
	case v3.Delta:
		switch tableName {
		case constants.SIGNOZ_SAMPLES_V4_TABLENAME:
			aggregationColumn = "sum(value)"
		case constants.SIGNOZ_SAMPLES_V4_AGG_5MIN_TABLENAME, constants.SIGNOZ_SAMPLES_V4_AGG_30MIN_TABLENAME:
			aggregationColumn = "sum(sum)"
		}
	case v3.Cumulative:
		switch tableName {
		case constants.SIGNOZ_SAMPLES_V4_TABLENAME:
			aggregationColumn = "max(value)"
		case constants.SIGNOZ_SAMPLES_V4_AGG_5MIN_TABLENAME, constants.SIGNOZ_SAMPLES_V4_AGG_30MIN_TABLENAME:
			aggregationColumn = "max(max)"
		}
	case v3.Unspecified:
		switch tableName {
		case constants.SIGNOZ_SAMPLES_V4_TABLENAME:
			switch mq.TimeAggregation {
			case v3.TimeAggregationAnyLast:
				aggregationColumn = "anyLast(value)"
			case v3.TimeAggregationSum:
				aggregationColumn = "sum(value)"
			case v3.TimeAggregationAvg:
				aggregationColumn = "avg(value)"
			case v3.TimeAggregationMin:
				aggregationColumn = "min(value)"
			case v3.TimeAggregationMax:
				aggregationColumn = "max(value)"
			case v3.TimeAggregationCount:
				aggregationColumn = "count(value)"
			case v3.TimeAggregationCountDistinct:
				aggregationColumn = "countDistinct(value)"
			}
		case constants.SIGNOZ_SAMPLES_V4_AGG_5MIN_TABLENAME, constants.SIGNOZ_SAMPLES_V4_AGG_30MIN_TABLENAME:
			switch mq.TimeAggregation {
			case v3.TimeAggregationAnyLast:
				aggregationColumn = "anyLast(last)"
			case v3.TimeAggregationSum:
				aggregationColumn = "sum(sum)"
			case v3.TimeAggregationAvg:
				aggregationColumn = "sum(sum) / sum(count)"
			case v3.TimeAggregationMin:
				aggregationColumn = "min(min)"
			case v3.TimeAggregationMax:
				aggregationColumn = "max(max)"
			case v3.TimeAggregationCount:
				aggregationColumn = "sum(count)"
			}
		}
	}
	return aggregationColumn
}

// PrepareTimeseriesFilterQuery builds the sub-query to be used for filtering timeseries based on the search criteria
func PrepareTimeseriesFilterQuery(start, end int64, mq *v3.BuilderQuery) (string, error) {
	var conditions []string
	var fs *v3.FilterSet = mq.Filters
	var groupTags []v3.AttributeKey = mq.GroupBy

	conditions = append(conditions, fmt.Sprintf("metric_name = %s", utils.ClickHouseFormattedValue(mq.AggregateAttribute.Key)))
	conditions = append(conditions, fmt.Sprintf("temporality = '%s'", mq.Temporality))

	start, end, tableName := whichTSTableToUse(start, end)

	conditions = append(conditions, fmt.Sprintf("unix_milli >= %d AND unix_milli < %d", start, end))

	if fs != nil && len(fs.Items) != 0 {
		for _, item := range fs.Items {
			toFormat := item.Value
			op := v3.FilterOperator(strings.ToLower(strings.TrimSpace(string(item.Operator))))
			if op == v3.FilterOperatorContains || op == v3.FilterOperatorNotContains {
				toFormat = fmt.Sprintf("%%%s%%", toFormat)
			}
			fmtVal := utils.ClickHouseFormattedValue(toFormat)
			switch op {
			case v3.FilterOperatorEqual:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') = %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorNotEqual:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') != %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorIn:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') IN %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorNotIn:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') NOT IN %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorLike:
				conditions = append(conditions, fmt.Sprintf("like(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorNotLike:
				conditions = append(conditions, fmt.Sprintf("notLike(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorRegex:
				conditions = append(conditions, fmt.Sprintf("match(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorNotRegex:
				conditions = append(conditions, fmt.Sprintf("not match(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorGreaterThan:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') > %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorGreaterThanOrEq:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') >= %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorLessThan:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') < %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorLessThanOrEq:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') <= %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorContains:
				conditions = append(conditions, fmt.Sprintf("like(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorNotContains:
				conditions = append(conditions, fmt.Sprintf("notLike(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorExists:
				conditions = append(conditions, fmt.Sprintf("has(JSONExtractKeys(labels), '%s')", item.Key.Key))
			case v3.FilterOperatorNotExists:
				conditions = append(conditions, fmt.Sprintf("not has(JSONExtractKeys(labels), '%s')", item.Key.Key))
			default:
				return "", fmt.Errorf("unsupported filter operator")
			}
		}
	}
	whereClause := strings.Join(conditions, " AND ")

	var selectLabels string
	for _, tag := range groupTags {
		selectLabels += fmt.Sprintf("JSONExtractString(labels, '%s') as %s, ", tag.Key, tag.Key)
	}

	// The table JOIN key always exists
	selectLabels += "fingerprint"

	filterSubQuery := fmt.Sprintf(
		"SELECT DISTINCT %s FROM %s.%s WHERE %s",
		selectLabels,
		constants.SIGNOZ_METRIC_DBNAME,
		tableName,
		whereClause,
	)

	return filterSubQuery, nil
}

// PrepareTimeseriesFilterQuery builds the sub-query to be used for filtering timeseries based on the search criteria
func PrepareTimeseriesFilterQueryV3(start, end int64, mq *v3.BuilderQuery) (string, error) {
	var conditions []string
	var fs *v3.FilterSet = mq.Filters
	var groupTags []v3.AttributeKey = mq.GroupBy

	conditions = append(conditions, fmt.Sprintf("metric_name = %s", utils.ClickHouseFormattedValue(mq.AggregateAttribute.Key)))
	conditions = append(conditions, fmt.Sprintf("temporality = '%s'", mq.Temporality))

	start, end, tableName := whichTSTableToUse(start, end)

	conditions = append(conditions, fmt.Sprintf("unix_milli >= %d AND unix_milli < %d", start, end))

	if fs != nil && len(fs.Items) != 0 {
		for _, item := range fs.Items {
			toFormat := item.Value
			op := v3.FilterOperator(strings.ToLower(strings.TrimSpace(string(item.Operator))))
			if op == v3.FilterOperatorContains || op == v3.FilterOperatorNotContains {
				toFormat = fmt.Sprintf("%%%s%%", toFormat)
			}
			fmtVal := utils.ClickHouseFormattedValue(toFormat)
			switch op {
			case v3.FilterOperatorEqual:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') = %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorNotEqual:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') != %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorIn:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') IN %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorNotIn:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') NOT IN %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorLike:
				conditions = append(conditions, fmt.Sprintf("like(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorNotLike:
				conditions = append(conditions, fmt.Sprintf("notLike(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorRegex:
				conditions = append(conditions, fmt.Sprintf("match(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorNotRegex:
				conditions = append(conditions, fmt.Sprintf("not match(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorGreaterThan:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') > %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorGreaterThanOrEq:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') >= %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorLessThan:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') < %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorLessThanOrEq:
				conditions = append(conditions, fmt.Sprintf("JSONExtractString(labels, '%s') <= %s", item.Key.Key, fmtVal))
			case v3.FilterOperatorContains:
				conditions = append(conditions, fmt.Sprintf("like(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorNotContains:
				conditions = append(conditions, fmt.Sprintf("notLike(JSONExtractString(labels, '%s'), %s)", item.Key.Key, fmtVal))
			case v3.FilterOperatorExists:
				conditions = append(conditions, fmt.Sprintf("has(JSONExtractKeys(labels), '%s')", item.Key.Key))
			case v3.FilterOperatorNotExists:
				conditions = append(conditions, fmt.Sprintf("not has(JSONExtractKeys(labels), '%s')", item.Key.Key))
			default:
				return "", fmt.Errorf("unsupported filter operator")
			}
		}
	}
	whereClause := strings.Join(conditions, " AND ")

	var selectLabels string

	if mq.AggregateOperator == v3.AggregateOperatorNoOp || mq.AggregateOperator == v3.AggregateOperatorRate {
		selectLabels += "labels, "
	} else {
		for _, tag := range groupTags {
			selectLabels += fmt.Sprintf("JSONExtractString(labels, '%s') as %s, ", tag.Key, tag.Key)
		}
	}

	// The table JOIN key always exists
	selectLabels += "fingerprint"

	filterSubQuery := fmt.Sprintf(
		"SELECT DISTINCT %s FROM %s.%s WHERE %s",
		selectLabels,
		constants.SIGNOZ_METRIC_DBNAME,
		tableName,
		whereClause,
	)

	return filterSubQuery, nil
}
