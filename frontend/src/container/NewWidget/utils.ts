import { omitIdFromQuery } from 'components/ExplorerCard/utils';
import {
	initialQueryBuilderFormValuesMap,
	PANEL_TYPES,
} from 'constants/queryBuilder';
import { isEqual, set } from 'lodash-es';
import {
	IBuilderQuery,
	Query,
	QueryState,
} from 'types/api/queryBuilder/queryBuilderData';
import { DataSource } from 'types/common/queryBuilder';

export const getIsQueryModified = (
	currentQuery: Query,
	stagedQuery: Query | null,
): boolean => {
	if (!stagedQuery) {
		return false;
	}
	const omitIdFromStageQuery = omitIdFromQuery(stagedQuery);
	const omitIdFromCurrentQuery = omitIdFromQuery(currentQuery);
	return !isEqual(omitIdFromStageQuery, omitIdFromCurrentQuery);
};

type PartialPanelTypes = {
	[PANEL_TYPES.BAR]: 'bar';
	[PANEL_TYPES.LIST]: 'list';
	[PANEL_TYPES.TABLE]: 'table';
	[PANEL_TYPES.TIME_SERIES]: 'graph';
	[PANEL_TYPES.VALUE]: 'value';
};

export const panelTypeDataSourceFormValuesMap: Record<
	keyof PartialPanelTypes,
	Record<DataSource, any>
> = {
	[PANEL_TYPES.BAR]: {
		[DataSource.LOGS]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'groupBy',
					'limit',
					'having',
					'orderBy',
				],
			},
		},
		[DataSource.METRICS]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'groupBy',
					'limit',
					'having',
					'orderBy',
				],
			},
		},
		[DataSource.TRACES]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'groupBy',
					'limit',
					'having',
					'orderBy',
				],
			},
		},
	},
	[PANEL_TYPES.LIST]: {
		[DataSource.LOGS]: {
			builder: {
				queryData: ['filters', 'limit', 'orderBy'],
			},
		},
		[DataSource.METRICS]: {
			// handle the case as list view doesn't have metrics support
		},
		[DataSource.TRACES]: {
			builder: {
				// check select columns here
				queryData: ['filters', 'limit', 'orderBy'],
			},
		},
	},
	[PANEL_TYPES.TIME_SERIES]: {
		[DataSource.LOGS]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'groupBy',
					'limit',
					'having',
					'orderBy',
				],
			},
		},
		[DataSource.METRICS]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'groupBy',
					'limit',
					'having',
					'orderBy',
				],
			},
		},
		[DataSource.TRACES]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'groupBy',
					'limit',
					'having',
					'orderBy',
				],
			},
		},
	},
	[PANEL_TYPES.TABLE]: {
		[DataSource.LOGS]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'groupBy',
					'limit',
					'having',
					'orderBy',
				],
			},
		},
		[DataSource.METRICS]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'groupBy',
					'limit',
					'having',
					'orderBy',
				],
			},
		},
		[DataSource.TRACES]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'groupBy',
					'limit',
					'having',
					'orderBy',
				],
			},
		},
	},
	[PANEL_TYPES.VALUE]: {
		[DataSource.LOGS]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'reduceTo',
					'having',
				],
			},
		},
		[DataSource.METRICS]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'having',
					'reduceTo',
				],
			},
		},
		[DataSource.TRACES]: {
			builder: {
				queryData: [
					'filters',
					'aggregateOperator',
					'aggregateAttribute',
					'groupBy',
					'limit',
					'having',
					'orderBy',
				],
			},
		},
	},
};

export function handleQueryChange(
	newPanelType: keyof PartialPanelTypes,
	supersetQuery: QueryState,
): QueryState {
	const updatedQuery = { ...supersetQuery };

	// eslint-disable-next-line sonarjs/no-ignored-return
	updatedQuery.builder.queryData.map((query, index) => {
		const tempQuery = initialQueryBuilderFormValuesMap[query.dataSource];

		console.log(tempQuery, query.dataSource);
		const fieldsToSelect =
			panelTypeDataSourceFormValuesMap[newPanelType][query.dataSource].builder
				.queryData;

		fieldsToSelect.forEach((field: keyof IBuilderQuery) => {
			set(tempQuery, field, supersetQuery.builder.queryData[index][field]);
		});
		return tempQuery;
	});
	return updatedQuery;
}
