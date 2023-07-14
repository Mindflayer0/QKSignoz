export const legend = {
	address: '{{address}}',
};

export const QUERYNAME_AND_EXPRESSION = ['A', 'B', 'C'];
export const LETENCY_LEGENDS_AGGREGATEOPERATOR = ['p50', 'p90', 'p99'];
export const OPERATION_LEGENDS = ['Operations'];

export enum FORMULA {
	ERROR_PERCENTAGE = 'A*100/B',
	DATABASE_CALLS_AVG_DURATION = 'A/B',
}

export enum GraphTitle {
	LATENCY = 'Latency',
	RATE_PER_OPS = 'Rate (ops/s)',
	ERROR_PERCENTAGE = 'Error Percentage',
	DATABASE_CALLS_RPS = 'Database Calls RPS',
	DATABASE_CALLS_AVG_DURATION = 'Database Calls Avg Duration',
	EXTERNAL_CALL_ERROR_PERCENTAGE = 'External Call Error Percentage',
	EXTERNAL_CALL_DURATION = 'External Call duration',
	EXTERNAL_CALL_RPS_BY_ADDRESS = 'External Call RPS(by Address)',
	EXTERNAL_CALL_DURATION_BY_ADDRESS = 'External Call duration(by Address)',
}

export enum OPERATOR {
	EQUAL = '=',
	IN = 'IN',
}

export enum DataType {
	STRING = 'string',
	FLOAT64 = 'float64',
	INT64 = 'int64',
}

export enum MetricsType {
	Tag = 'tag',
	Resource = 'resource',
}

export enum WidgetKeys {
	Address = 'address',
	DurationNano = 'durationNano',
	StatusCode = 'status_code',
	Operation = 'operation',
	OperationName = 'operationName',
	Service_name = 'service_name',
	ServiceName = 'serviceName',
	SignozLatencyCount = 'signoz_latency_count',
	SignozDBLatencyCount = 'signoz_db_latency_count',
	DatabaseCallCount = 'signoz_database_call_count',
	DatabaseCallLatencySum = 'signoz_database_call_latency_sum',
	SignozDbLatencySum = 'signoz_db_latency_sum',
	SignozCallsTotal = 'signoz_calls_total',
	SignozExternalCallLatencyCount = 'signoz_external_call_latency_count',
	SignozExternalCallLatencySum = 'signoz_external_call_latency_sum',
}
