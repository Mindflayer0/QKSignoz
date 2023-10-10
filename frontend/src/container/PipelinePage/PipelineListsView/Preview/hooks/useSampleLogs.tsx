import {
	initialFilters,
	initialQueriesMap,
	PANEL_TYPES,
} from 'constants/queryBuilder';
import { Time } from 'container/TopNav/DateTimeSelection/config';
import { useGetQueryRange } from 'hooks/queryBuilder/useGetQueryRange';
import cloneDeep from 'lodash-es/cloneDeep';
import { useMemo } from 'react';
import { ILog } from 'types/api/logs/log';
import { TagFilter } from 'types/api/queryBuilder/queryBuilderData';
import { LogsAggregatorOperator } from 'types/common/queryBuilder';

import { LogsResponse } from '../types';

export interface SampleLogsRequest {
	filter: TagFilter;
	timeInterval: Time;
	count: number;
}

const DEFAULT_SAMPLE_LOGS_COUNT = 5;

const useSampleLogs = ({
	filter,
	timeInterval,
	count,
}: SampleLogsRequest): LogsResponse => {
	const sampleLogsQuery = useMemo(() => {
		const q = cloneDeep(initialQueriesMap.logs);
		q.builder.queryData[0] = {
			...q.builder.queryData[0],
			filters: filter || initialFilters,
			aggregateOperator: LogsAggregatorOperator.NOOP,
			orderBy: [{ columnName: 'timestamp', order: 'desc' }],
			limit: count || DEFAULT_SAMPLE_LOGS_COUNT,
		};
		return q;
	}, [count, filter]);

	const sampleLogsResponse = useGetQueryRange({
		graphType: PANEL_TYPES.LIST,
		query: sampleLogsQuery,
		selectedTime: 'GLOBAL_TIME',
		globalSelectedInterval: timeInterval,
	});

	const { isError, isFetching: isLoading } = sampleLogsResponse;

	let logs: ILog[] = [];
	if (!(isLoading || isError)) {
		const logsList =
			sampleLogsResponse?.data?.payload?.data?.newResult?.data?.result[0]?.list ||
			[];
		logs = logsList.map((item) => ({
			...item.data,
			timestamp: item.timestamp,
		}));
	}

	return { isLoading, isError, logs };
};

export default useSampleLogs;
