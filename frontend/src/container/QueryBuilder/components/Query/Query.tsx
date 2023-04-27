import { Col, Input, Row } from 'antd';
// ** Constants
import { PANEL_TYPES } from 'constants/queryBuilder';
// ** Components
import {
	AdditionalFiltersToggler,
	DataSourceDropdown,
	FilterLabel,
	ListItemWrapper,
	ListMarker,
} from 'container/QueryBuilder/components';
import {
	AggregatorFilter,
	GroupByFilter,
	HavingFilter,
	OperatorsSelect,
	ReduceToFilter,
} from 'container/QueryBuilder/filters';
import AggregateEveryFilter from 'container/QueryBuilder/filters/AggregateEveryFilter';
import LimitFilter from 'container/QueryBuilder/filters/LimitFilter/LimitFilter';
import { OrderByFilter } from 'container/QueryBuilder/filters/OrderByFilter';
import QueryBuilderSearch from 'container/QueryBuilder/filters/QueryBuilderSearch';
import { useQueryOperations } from 'hooks/queryBuilder/useQueryOperations';
// ** Hooks
import React, { ChangeEvent, memo, ReactNode, useCallback } from 'react';
import { IBuilderQueryForm } from 'types/api/queryBuilder/queryBuilderData';
import { StringOperators } from 'types/common/queryBuilder';
import { transformToUpperCase } from 'utils/transformToUpperCase';

// ** Types
import { QueryProps } from './Query.interfaces';

export const Query = memo(function Query({
	index,
	isAvailableToDisable,
	queryVariant,
	query,
	panelType,
}: QueryProps): JSX.Element {
	const {
		operators,
		isMetricsDataSource,
		listOfAdditionalFilters,
		handleChangeAggregatorAttribute,
		handleChangeDataSource,
		handleChangeQueryData,
		handleChangeOperator,
		handleDeleteQuery,
	} = useQueryOperations({ index, query, panelType });

	const handleChangeAggregateEvery = useCallback(
		(value: IBuilderQueryForm['stepInterval']) => {
			handleChangeQueryData('stepInterval', value);
		},
		[handleChangeQueryData],
	);

	const handleChangeLimit = useCallback(
		(value: IBuilderQueryForm['limit']) => {
			handleChangeQueryData('limit', value);
		},
		[handleChangeQueryData],
	);

	const handleChangeHavingFilter = useCallback(
		(value: IBuilderQueryForm['having']) => {
			handleChangeQueryData('having', value);
		},
		[handleChangeQueryData],
	);

	const handleChangeOrderByKeys = useCallback(
		(value: IBuilderQueryForm['orderBy']) => {
			handleChangeQueryData('orderBy', value);
		},
		[handleChangeQueryData],
	);

	const handleToggleDisableQuery = useCallback(() => {
		handleChangeQueryData('disabled', !query.disabled);
	}, [handleChangeQueryData, query]);

	const handleChangeTagFilters = useCallback(
		(value: IBuilderQueryForm['tagFilters']) => {
			handleChangeQueryData('tagFilters', value);
		},
		[handleChangeQueryData],
	);

	const handleChangeReduceTo = useCallback(
		(value: IBuilderQueryForm['reduceTo']) => {
			handleChangeQueryData('reduceTo', value);
		},
		[handleChangeQueryData],
	);

	const handleChangeGroupByKeys = useCallback(
		(value: IBuilderQueryForm['groupBy']) => {
			handleChangeQueryData('groupBy', value);
		},
		[handleChangeQueryData],
	);

	const handleChangeQueryLegend = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			handleChangeQueryData('legend', event.target.value);
		},
		[handleChangeQueryData],
	);

	const renderAdditionalFilters = useCallback((): ReactNode => {
		switch (panelType) {
			case PANEL_TYPES.TIME_SERIES: {
				return (
					<>
						{!isMetricsDataSource && (
							<Col span={11}>
								<Row gutter={[11, 5]}>
									<Col flex="5.93rem">
										<FilterLabel label="Limit" />
									</Col>
									<Col flex="1 1 12.5rem">
										<LimitFilter query={query} onChange={handleChangeLimit} />
									</Col>
								</Row>
							</Col>
						)}
						{query.aggregateOperator !== StringOperators.NOOP && (
							<Col span={11}>
								<Row gutter={[11, 5]}>
									<Col flex="5.93rem">
										<FilterLabel label="HAVING" />
									</Col>
									<Col flex="1 1 12.5rem">
										<HavingFilter onChange={handleChangeHavingFilter} query={query} />
									</Col>
								</Row>
							</Col>
						)}
						{!isMetricsDataSource && (
							<Col span={11}>
								<Row gutter={[11, 5]}>
									<Col flex="5.93rem">
										<FilterLabel label="Order by" />
									</Col>
									<Col flex="1 1 12.5rem">
										<OrderByFilter query={query} onChange={handleChangeOrderByKeys} />
									</Col>
								</Row>
							</Col>
						)}

						<Col span={11}>
							<Row gutter={[11, 5]}>
								<Col flex="5.93rem">
									<FilterLabel label="Aggregate Every" />
								</Col>
								<Col flex="1 1 6rem">
									<AggregateEveryFilter
										query={query}
										onChange={handleChangeAggregateEvery}
									/>
								</Col>
							</Row>
						</Col>
					</>
				);
			}

			case PANEL_TYPES.VALUE: {
				return (
					<>
						{query.aggregateOperator !== StringOperators.NOOP && (
							<Col span={11}>
								<Row gutter={[11, 5]}>
									<Col flex="5.93rem">
										<FilterLabel label="HAVING" />
									</Col>
									<Col flex="1 1 12.5rem">
										<HavingFilter onChange={handleChangeHavingFilter} query={query} />
									</Col>
								</Row>
							</Col>
						)}
						<Col span={11}>
							<Row gutter={[11, 5]}>
								<Col flex="5.93rem">
									<FilterLabel label="Aggregate Every" />
								</Col>
								<Col flex="1 1 6rem">
									<AggregateEveryFilter
										query={query}
										onChange={handleChangeAggregateEvery}
									/>
								</Col>
							</Row>
						</Col>
					</>
				);
			}

			default: {
				return null;
			}
		}
	}, [
		panelType,
		query,
		isMetricsDataSource,
		handleChangeAggregateEvery,
		handleChangeHavingFilter,
		handleChangeLimit,
		handleChangeOrderByKeys,
	]);

	return (
		<ListItemWrapper onDelete={handleDeleteQuery}>
			<Col span={24}>
				<Row align="middle">
					<Col>
						<ListMarker
							isDisabled={query.disabled}
							onDisable={handleToggleDisableQuery}
							labelName={query.queryName}
							index={index}
							isAvailableToDisable={isAvailableToDisable}
						/>
						{queryVariant === 'dropdown' ? (
							<DataSourceDropdown
								onChange={handleChangeDataSource}
								value={query.dataSource}
								style={{ marginRight: '0.5rem', minWidth: '5.625rem' }}
							/>
						) : (
							<FilterLabel label={transformToUpperCase(query.dataSource)} />
						)}
					</Col>
					<Col flex="1">
						<Row gutter={[11, 5]}>
							{isMetricsDataSource && (
								<Col>
									<FilterLabel label="WHERE" />
								</Col>
							)}
							<Col flex="1">
								<QueryBuilderSearch query={query} onChange={handleChangeTagFilters} />
							</Col>
						</Row>
					</Col>
				</Row>
			</Col>
			<Col span={11}>
				<Row gutter={[11, 5]}>
					<Col flex="5.93rem">
						<OperatorsSelect
							value={query.aggregateOperator}
							onChange={handleChangeOperator}
							operators={operators}
						/>
					</Col>
					<Col flex="1 1 12.5rem">
						<AggregatorFilter
							onChange={handleChangeAggregatorAttribute}
							query={query}
						/>
					</Col>
				</Row>
			</Col>

			<Col span={11} offset={2}>
				<Row gutter={[11, 5]}>
					<Col flex="5.93rem">
						<FilterLabel
							label={panelType === PANEL_TYPES.VALUE ? 'Reduce to' : 'Group by'}
						/>
					</Col>
					<Col flex="1 1 12.5rem">
						{panelType === PANEL_TYPES.VALUE ? (
							<ReduceToFilter query={query} onChange={handleChangeReduceTo} />
						) : (
							<GroupByFilter
								disabled={isMetricsDataSource && !query.aggregateAttribute.key}
								query={query}
								onChange={handleChangeGroupByKeys}
							/>
						)}
					</Col>
				</Row>
			</Col>
			<Col span={24}>
				<AdditionalFiltersToggler listOfAdditionalFilter={listOfAdditionalFilters}>
					<Row gutter={[0, 11]} justify="space-between">
						{renderAdditionalFilters()}
					</Row>
				</AdditionalFiltersToggler>
			</Col>
			<Row style={{ width: '100%' }}>
				<Input
					onChange={handleChangeQueryLegend}
					size="middle"
					value={query.legend}
					addonBefore="Legend Format"
				/>
			</Row>
		</ListItemWrapper>
	);
});
