import {
	initialAggregateAttribute,
	initialQueryBuilderFormValues,
	mapOfFilters,
	mapOfOperators,
	PANEL_TYPES,
} from 'constants/queryBuilder';
import { ITEMS } from 'container/NewDashboard/ComponentsSlider/menuItems';
import { useQueryBuilder } from 'hooks/queryBuilder/useQueryBuilder';
import { findDataTypeOfOperator } from 'lib/query/findDataTypeOfOperator';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { BaseAutocompleteData } from 'types/api/queryBuilder/queryAutocompleteResponse';
import { IBuilderQueryForm } from 'types/api/queryBuilder/queryBuilderData';
import {
	HandleChangeQueryData,
	UseQueryOperations,
} from 'types/common/operations.types';
import {
	DataSource,
	QueryAdditionalFilter,
	StringOperators,
} from 'types/common/queryBuilder';

export const useQueryOperations: UseQueryOperations = ({
	query,
	index,
	panelType,
}) => {
	const { handleSetQueryData, removeEntityByIndex } = useQueryBuilder();
	const [operators, setOperators] = useState<string[]>([]);
	const [listOfAdditionalFilters, setListOfAdditionalFilters] = useState<
		string[]
	>([]);

	const { dataSource, aggregateOperator } = query;

	const handleChangeOperator = useCallback(
		(value: string): void => {
			const aggregateDataType: BaseAutocompleteData['dataType'] =
				query.aggregateAttribute.dataType;

			const typeOfValue = findDataTypeOfOperator(value);
			const shouldResetAggregateAttribute =
				(aggregateDataType === 'string' || aggregateDataType === 'bool') &&
				typeOfValue === 'number';

			const newQuery: IBuilderQueryForm = {
				...query,
				aggregateOperator: value,
				having: [],
				groupBy: [],
				orderBy: [],
				limit: null,
				tagFilters: { items: [], op: 'AND' },
				...(shouldResetAggregateAttribute
					? { aggregateAttribute: initialAggregateAttribute }
					: {}),
			};

			handleSetQueryData(index, newQuery);
		},
		[index, query, handleSetQueryData],
	);

	const getNewOperators = useCallback(
		(dataSource: DataSource, currentPanelType: ITEMS): string[] => {
			let operatorsByDataSource = mapOfOperators[dataSource];

			if (
				dataSource !== DataSource.METRICS &&
				currentPanelType !== PANEL_TYPES.LIST
			) {
				operatorsByDataSource = operatorsByDataSource.filter(
					(operator) => operator !== StringOperators.NOOP,
				);
			}

			return operatorsByDataSource;
		},
		[],
	);

	const getNewListOfAdditionalFilters = useCallback(
		(dataSource: DataSource, operator: string): string[] => {
			let result: QueryAdditionalFilter[] = mapOfFilters[dataSource];

			if (dataSource === DataSource.METRICS && operator === StringOperators.NOOP) {
				result = result.filter((currentFilter) => currentFilter.field !== 'having');
			}

			return result.map((item) => item.text);
		},
		[],
	);

	const handleChangeAggregatorAttribute = useCallback(
		(value: BaseAutocompleteData): void => {
			const newQuery: IBuilderQueryForm = {
				...query,
				aggregateAttribute: value,
				having: [],
			};

			handleSetQueryData(index, newQuery);
		},
		[index, query, handleSetQueryData],
	);

	const handleChangeDataSource = useCallback(
		(nextSource: DataSource): void => {
			let newQuery: IBuilderQueryForm = {
				...query,
				dataSource: nextSource,
			};

			const newOperators = getNewOperators(nextSource, panelType);

			const entries = Object.entries(initialQueryBuilderFormValues).filter(
				([key]) => key !== 'queryName' && key !== 'expression',
			);

			const initCopyResult = Object.fromEntries(entries);

			newQuery = {
				...newQuery,
				...initCopyResult,
				dataSource: nextSource,
				aggregateOperator: newOperators[0],
			};

			setOperators(newOperators);
			handleSetQueryData(index, newQuery);
		},
		[index, query, panelType, handleSetQueryData, getNewOperators],
	);

	const handleDeleteQuery = useCallback(() => {
		removeEntityByIndex('queryData', index);
	}, [removeEntityByIndex, index]);

	const handleChangeQueryData: HandleChangeQueryData = useCallback(
		(key, value) => {
			const newQuery: IBuilderQueryForm = {
				...query,
				[key]: value,
			};

			handleSetQueryData(index, newQuery);
		},
		[query, index, handleSetQueryData],
	);

	const isMetricsDataSource = useMemo(
		() => query.dataSource === DataSource.METRICS,
		[query.dataSource],
	);

	useEffect(() => {
		if (operators.length === 0) {
			const initialOperators = getNewOperators(dataSource, panelType);
			setOperators(initialOperators);
		}
	}, [operators, dataSource, panelType, getNewOperators]);

	useEffect(() => {
		const additionalFilters = getNewListOfAdditionalFilters(
			dataSource,
			aggregateOperator,
		);

		setListOfAdditionalFilters(additionalFilters);
	}, [dataSource, aggregateOperator, getNewListOfAdditionalFilters]);

	return {
		isMetricsDataSource,
		operators,
		listOfAdditionalFilters,
		handleChangeOperator,
		handleChangeAggregatorAttribute,
		handleChangeDataSource,
		handleDeleteQuery,
		handleChangeQueryData,
	};
};
