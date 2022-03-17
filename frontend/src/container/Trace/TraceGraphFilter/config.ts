interface Dropdown {
	key: string;
	displayValue: string;
	yAxisUnit?: string;
}

export const groupBy: Dropdown[] = [
	{
		key: '',
		displayValue: 'None',
	},
	{
		key: 'serviceName',
		displayValue: 'Service Name',
	},

	{
		displayValue: 'Operation',
		key: 'operation',
	},
	{
		displayValue: 'HTTP url',
		key: 'httpUrl',
	},
	{
		displayValue: 'HTTP method',
		key: 'httpMethod',
	},
	{
		displayValue: 'HTTP host',
		key: 'httpHost',
	},
	{
		displayValue: 'HTTP route',
		key: 'httpRoute',
	},
	{
		displayValue: 'HTTP status code',
		key: 'httpCode',
	},
	{
		displayValue: 'Database name',
		key: 'dbName',
	},
	{
		displayValue: 'Database operation',
		key: 'dbSystem',
	},
	{
		displayValue: 'Messaging System',
		key: 'msgSystem',
	},
	{
		displayValue: 'Messaging Operation',
		key: 'msgOperation',
	},
	{
		displayValue: 'Component',
		key: 'component',
	},
];

export const functions: Dropdown[] = [
	{ displayValue: 'Count', key: 'count', yAxisUnit: 'short' },
	{
		displayValue: 'Rate per sec',
		key: 'ratePerSec',
		yAxisUnit: 'reqps',
	},
	{ displayValue: 'Sum(duration in ns)', key: 'sum', yAxisUnit: 'ns' },
	{ displayValue: 'Avg(duration in ns)', key: 'avg', yAxisUnit: 'ns' },
	{
		displayValue: 'Max(duration in ns)',
		key: 'max',
		yAxisUnit: 'ns',
	},
	{
		displayValue: 'Min(duration in ns)',
		key: 'min',
		yAxisUnit: 'ns',
	},
	{
		displayValue: '50th percentile(duration in ns)',
		key: 'p50',
		yAxisUnit: 'ns',
	},
	{
		displayValue: '90th percentile(duration in ns)',
		key: 'p90',
		yAxisUnit: 'ns',
	},
	{
		displayValue: '95th percentile(duration in ns)',
		key: 'p95',
		yAxisUnit: 'ns',
	},
	{
		displayValue: '99th percentile(duration in ns)',
		key: 'p99',
		yAxisUnit: 'ns',
	},
];
