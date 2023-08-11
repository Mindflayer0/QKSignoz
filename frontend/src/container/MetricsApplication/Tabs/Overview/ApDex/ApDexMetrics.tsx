import { QuestionCircleOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import { PANEL_TYPES } from 'constants/queryBuilder';
import Graph from 'container/GridGraphLayout/Graph';
import { GraphTitle } from 'container/MetricsApplication/constant';
import { getWidgetQueryBuilder } from 'container/MetricsApplication/MetricsApplication.factory';
import { apDexMetricsQueryBuilderQueries } from 'container/MetricsApplication/MetricsPageQueries/OverviewQueries';
import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EQueryType } from 'types/common/dashboard';
import { v4 as uuid } from 'uuid';

import { IServiceName } from '../../types';
import { ApDexMetricsProps } from './types';

function ApDexMetrics({
	delta,
	metricsBuckets,
	thresholdValue,
	onDragSelect,
	tagFilterItems,
	topLevelOperationsRoute,
	handleGraphClick,
}: ApDexMetricsProps): JSX.Element {
	const { servicename } = useParams<IServiceName>();

	const apDexMetricsWidget = useMemo(
		() =>
			getWidgetQueryBuilder({
				query: {
					queryType: EQueryType.QUERY_BUILDER,
					promql: [],
					builder: apDexMetricsQueryBuilderQueries({
						servicename,
						tagFilterItems,
						topLevelOperationsRoute,
						threashold: thresholdValue || 0,
						delta: delta || false,
						metricsBuckets: metricsBuckets || [],
					}),
					clickhouse_sql: [],
					id: uuid(),
				},
				title: (
					<Typography>
						{GraphTitle.APDEX}
						<Typography.Link>
							<QuestionCircleOutlined />
						</Typography.Link>
					</Typography>
				),
				panelTypes: PANEL_TYPES.TIME_SERIES,
			}),
		[
			delta,
			metricsBuckets,
			servicename,
			tagFilterItems,
			thresholdValue,
			topLevelOperationsRoute,
		],
	);

	const isQueryEnabled =
		topLevelOperationsRoute.length > 0 &&
		metricsBuckets &&
		metricsBuckets?.length > 0 &&
		delta !== undefined;

	return (
		<Graph
			name="apdex"
			widget={apDexMetricsWidget}
			onDragSelect={onDragSelect}
			onClickHandler={handleGraphClick('ApDex')}
			yAxisUnit=""
			allowThreshold
			threshold={thresholdValue}
			isQueryEnabled={isQueryEnabled}
		/>
	);
}

ApDexMetrics.defaultProps = {
	delta: undefined,
	le: undefined,
};

export default ApDexMetrics;
