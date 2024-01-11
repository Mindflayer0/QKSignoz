import './LogsExplorerViews.styles.scss';

import { Button, Dropdown, MenuProps, Radio } from 'antd';
import { RadioChangeEvent } from 'antd/lib';
import NestedMenu from 'components/NestedMenu/NestedMenu';
import { LOCALSTORAGE } from 'constants/localStorage';
import { AVAILABLE_EXPORT_PANEL_TYPES } from 'constants/panelTypes';
import { QueryParams } from 'constants/query';
import {
	initialFilters,
	initialQueriesMap,
	initialQueryBuilderFormValues,
	PANEL_TYPES,
} from 'constants/queryBuilder';
import { DEFAULT_PER_PAGE_VALUE } from 'container/Controls/config';
import ExplorerOptions from 'container/ExplorerOptions/ExplorerOptions';
import GoToTop from 'container/GoToTop';
import LogsExplorerChart from 'container/LogsExplorerChart';
import LogsExplorerList from 'container/LogsExplorerList';
import LogsExplorerTable from 'container/LogsExplorerTable';
import { useOptionsMenu } from 'container/OptionsMenu';
import TimeSeriesView from 'container/TimeSeriesView/TimeSeriesView';
import { useUpdateDashboard } from 'hooks/dashboard/useUpdateDashboard';
import { addEmptyWidgetInDashboardJSONWithQuery } from 'hooks/dashboard/utils';
import { LogTimeRange } from 'hooks/logs/types';
import { useCopyLogLink } from 'hooks/logs/useCopyLogLink';
import { useGetExplorerQueryRange } from 'hooks/queryBuilder/useGetExplorerQueryRange';
import { useQueryBuilder } from 'hooks/queryBuilder/useQueryBuilder';
import useAxiosError from 'hooks/useAxiosError';
import useClickOutside from 'hooks/useClickOutside';
import { useHandleExplorerTabChange } from 'hooks/useHandleExplorerTabChange';
import { useNotifications } from 'hooks/useNotifications';
import useUrlQueryData from 'hooks/useUrlQueryData';
import { getPaginationQueryData } from 'lib/newQueryBuilder/getPaginationQueryData';
import { FileDigit, FileDown, Sheet, Sliders } from 'lucide-react';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import { AppState } from 'store/reducers';
import { Dashboard } from 'types/api/dashboard/getAll';
import { ILog } from 'types/api/logs/log';
import {
	IBuilderQuery,
	OrderByPayload,
	Query,
	TagFilter,
} from 'types/api/queryBuilder/queryBuilderData';
import {
	DataSource,
	LogsAggregatorOperator,
	StringOperators,
} from 'types/common/queryBuilder';
import { GlobalReducer } from 'types/reducer/globalTime';
import { generateExportToDashboardLink } from 'utils/dashboard/generateExportToDashboardLink';
import { v4 } from 'uuid';

function LogsExplorerViews({
	selectedView,
	showHistogram,
}: {
	selectedView: string;
	showHistogram: boolean;
}): JSX.Element {
	const { notifications } = useNotifications();
	const history = useHistory();

	const { activeLogId, timeRange, onTimeRangeChange } = useCopyLogLink();
	const [selectedPanelType, setSelectedPanelType] = useState<PANEL_TYPES>(
		PANEL_TYPES.LIST,
	);

	const { queryData: pageSize } = useUrlQueryData(
		QueryParams.pageSize,
		DEFAULT_PER_PAGE_VALUE,
	);

	const { minTime } = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);

	const currentMinTimeRef = useRef<number>(minTime);

	// Context
	const {
		initialDataSource,
		currentQuery,
		stagedQuery,
		panelType,
		updateAllQueriesOperators,
	} = useQueryBuilder();

	const { handleExplorerTabChange } = useHandleExplorerTabChange();

	// State
	const [page, setPage] = useState<number>(1);
	const [logs, setLogs] = useState<ILog[]>([]);
	const [requestData, setRequestData] = useState<Query | null>(null);
	const [showFormatMenuItems, setShowFormatMenuItems] = useState(false);

	const handleAxisError = useAxiosError();

	const listQuery = useMemo(() => {
		if (!stagedQuery || stagedQuery.builder.queryData.length < 1) return null;

		return stagedQuery.builder.queryData.find((item) => !item.disabled) || null;
	}, [stagedQuery]);

	const orderByTimestamp: OrderByPayload | null = useMemo(() => {
		const timestampOrderBy = listQuery?.orderBy.find(
			(item) => item.columnName === 'timestamp',
		);

		return timestampOrderBy || null;
	}, [listQuery]);

	const isMultipleQueries = useMemo(
		() =>
			currentQuery.builder.queryData.length > 1 ||
			currentQuery.builder.queryFormulas.length > 0,
		[currentQuery],
	);

	const isGroupByExist = useMemo(() => {
		const groupByCount: number = currentQuery.builder.queryData.reduce<number>(
			(acc, query) => acc + query.groupBy.length,
			0,
		);

		return groupByCount > 0;
	}, [currentQuery]);

	const isLimit: boolean = useMemo(() => {
		if (!listQuery) return false;
		if (!listQuery.limit) return false;

		return logs.length >= listQuery.limit;
	}, [logs.length, listQuery]);

	const listChartQuery = useMemo(() => {
		if (!stagedQuery || !listQuery) return null;

		const modifiedQueryData: IBuilderQuery = {
			...listQuery,
			aggregateOperator: LogsAggregatorOperator.COUNT,
		};

		const modifiedQuery: Query = {
			...stagedQuery,
			builder: {
				...stagedQuery.builder,
				queryData: stagedQuery.builder.queryData.map((item) => ({
					...item,
					...modifiedQueryData,
				})),
			},
		};

		return modifiedQuery;
	}, [stagedQuery, listQuery]);

	const exportDefaultQuery = useMemo(
		() =>
			updateAllQueriesOperators(
				currentQuery || initialQueriesMap.logs,
				PANEL_TYPES.TIME_SERIES,
				DataSource.LOGS,
			),
		[currentQuery, updateAllQueriesOperators],
	);

	const handleModeChange = (e: RadioChangeEvent): void => {
		setSelectedPanelType(e.target.value);
		setShowFormatMenuItems(false);
	};

	const {
		data: listChartData,
		isFetching: isFetchingListChartData,
		isLoading: isLoadingListChartData,
	} = useGetExplorerQueryRange(listChartQuery, PANEL_TYPES.TIME_SERIES, {
		enabled: !!listChartQuery && panelType === PANEL_TYPES.LIST,
	});

	const { data, isLoading, isError } = useGetExplorerQueryRange(
		requestData,
		panelType,
		{
			keepPreviousData: true,
			enabled: !isLimit && !!requestData,
		},
		{
			...(timeRange &&
				activeLogId &&
				!logs.length && {
					start: timeRange.start,
					end: timeRange.end,
				}),
		},
	);

	const getRequestData = useCallback(
		(
			query: Query | null,
			params: {
				page: number;
				log: ILog | null;
				pageSize: number;
				filters: TagFilter;
			},
		): Query | null => {
			if (!query) return null;

			const paginateData = getPaginationQueryData({
				filters: params.filters,
				listItemId: params.log ? params.log.id : null,
				orderByTimestamp,
				page: params.page,
				pageSize: params.pageSize,
			});

			const queryData: IBuilderQuery[] =
				query.builder.queryData.length > 1
					? query.builder.queryData
					: [
							{
								...(listQuery || initialQueryBuilderFormValues),
								...paginateData,
							},
					  ];

			const data: Query = {
				...query,
				builder: {
					...query.builder,
					queryData,
				},
			};

			return data;
		},
		[orderByTimestamp, listQuery],
	);

	const handleEndReached = useCallback(
		(index: number) => {
			if (!listQuery) return;

			if (isLimit) return;
			if (logs.length < pageSize) return;

			const { limit, filters } = listQuery;

			const lastLog = logs[index];

			const nextLogsLength = logs.length + pageSize;

			const nextPageSize =
				limit && nextLogsLength >= limit ? limit - logs.length : pageSize;

			if (!stagedQuery) return;

			const newRequestData = getRequestData(stagedQuery, {
				filters,
				page: page + 1,
				log: orderByTimestamp ? lastLog : null,
				pageSize: nextPageSize,
			});

			setPage((prevPage) => prevPage + 1);

			setRequestData(newRequestData);
		},
		[
			isLimit,
			logs,
			listQuery,
			pageSize,
			stagedQuery,
			getRequestData,
			page,
			orderByTimestamp,
		],
	);

	const {
		mutate: updateDashboard,
		isLoading: isUpdateDashboardLoading,
	} = useUpdateDashboard();

	const handleExport = useCallback(
		(dashboard: Dashboard | null): void => {
			if (!dashboard || !panelType) return;

			const panelTypeParam = AVAILABLE_EXPORT_PANEL_TYPES.includes(panelType)
				? panelType
				: PANEL_TYPES.TIME_SERIES;

			const widgetId = v4();

			const updatedDashboard = addEmptyWidgetInDashboardJSONWithQuery(
				dashboard,
				exportDefaultQuery,
				widgetId,
				panelTypeParam,
			);

			updateDashboard(updatedDashboard, {
				onSuccess: (data) => {
					if (data.error) {
						const message =
							data.error === 'feature usage exceeded' ? (
								<span>
									Panel limit exceeded for {DataSource.LOGS} in community edition. Please
									checkout our paid plans{' '}
									<a
										href="https://signoz.io/pricing/?utm_source=product&utm_medium=dashboard-limit"
										rel="noreferrer noopener"
										target="_blank"
									>
										here
									</a>
								</span>
							) : (
								data.error
							);
						notifications.error({
							message,
						});

						return;
					}

					const dashboardEditView = generateExportToDashboardLink({
						query: exportDefaultQuery,
						panelType: panelTypeParam,
						dashboardId: data.payload?.uuid || '',
						widgetId,
					});

					history.push(dashboardEditView);
				},
				onError: handleAxisError,
			});
		},
		[
			exportDefaultQuery,
			history,
			notifications,
			panelType,
			updateDashboard,
			handleAxisError,
		],
	);

	useEffect(() => {
		const shouldChangeView =
			(isMultipleQueries || isGroupByExist) && selectedView !== 'search';

		if (selectedPanelType === PANEL_TYPES.LIST && shouldChangeView) {
			handleExplorerTabChange(PANEL_TYPES.TIME_SERIES);
			setSelectedPanelType(PANEL_TYPES.TIME_SERIES);
		}
	}, [
		isMultipleQueries,
		isGroupByExist,
		selectedPanelType,
		selectedView,
		handleExplorerTabChange,
	]);

	useEffect(() => {
		const currentParams = data?.params as Omit<LogTimeRange, 'pageSize'>;
		const currentData = data?.payload.data.newResult.data.result || [];
		if (currentData.length > 0 && currentData[0].list) {
			const currentLogs: ILog[] = currentData[0].list.map((item) => ({
				...item.data,
				timestamp: item.timestamp,
			}));
			const newLogs = [...logs, ...currentLogs];

			setLogs(newLogs);
			onTimeRangeChange({
				start: currentParams?.start,
				end: timeRange?.end || currentParams?.end,
				pageSize: newLogs.length,
			});
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data]);

	useEffect(() => {
		if (
			requestData?.id !== stagedQuery?.id ||
			currentMinTimeRef.current !== minTime
		) {
			const newRequestData = getRequestData(stagedQuery, {
				filters: listQuery?.filters || initialFilters,
				page: 1,
				log: null,
				pageSize:
					timeRange?.pageSize && activeLogId ? timeRange?.pageSize : pageSize,
			});

			setLogs([]);
			setPage(1);
			setRequestData(newRequestData);
			currentMinTimeRef.current = minTime;

			if (!activeLogId) {
				onTimeRangeChange(null);
			}
		}
	}, [
		stagedQuery,
		requestData,
		getRequestData,
		listQuery,
		pageSize,
		minTime,
		timeRange,
		activeLogId,
		onTimeRangeChange,
		panelType,
	]);

	const { options, config } = useOptionsMenu({
		storageKey: LOCALSTORAGE.LOGS_LIST_OPTIONS,
		dataSource: initialDataSource || DataSource.METRICS,
		aggregateOperator: listQuery?.aggregateOperator || StringOperators.NOOP,
	});

	const chartData = useMemo(() => {
		if (!stagedQuery) return [];

		if (panelType === PANEL_TYPES.LIST) {
			if (listChartData && listChartData.payload.data.result.length > 0) {
				return listChartData.payload.data.result;
			}
			return [];
		}

		if (!data || data.payload.data.result.length === 0) return [];

		const isGroupByExist = stagedQuery.builder.queryData.some(
			(queryData) => queryData.groupBy.length > 0,
		);

		const firstPayloadQuery = data.payload.data.result.find(
			(item) => item.queryName === listQuery?.queryName,
		);

		const firstPayloadQueryArray = firstPayloadQuery ? [firstPayloadQuery] : [];

		return isGroupByExist ? data.payload.data.result : firstPayloadQueryArray;
	}, [stagedQuery, panelType, data, listChartData, listQuery]);

	const exportItems: MenuProps['items'] = [
		{
			type: 'group',
			label: 'EXPORT AS',
			children: [
				{
					key: 'excel',
					label: 'Excel (.xslx)',
					icon: <Sheet size={14} />,
				},
				{
					key: 'csv',
					label: 'CSV',
					icon: <FileDigit size={14} />,
				},
			],
		},
	];

	const formatItems = [
		{
			key: 'raw',
			label: 'Raw',
			data: {
				title: 'max lines per row',
			},
		},
		{
			key: 'list',
			label: 'Default',
		},
		{
			key: 'table',
			label: 'Column',
			data: {
				title: 'columns',
			},
		},
	];

	const handleToggleShowFormatOptions = (): void =>
		setShowFormatMenuItems(!showFormatMenuItems);

	const menuRef = useRef<HTMLDivElement>(null);

	useClickOutside({
		ref: menuRef,
		onClickOutside: () => {
			console.log('clicked outside;');
			if (showFormatMenuItems) {
				setShowFormatMenuItems(false);
			}
		},
	});

	return (
		<div className="logs-explorer-views-container">
			{showHistogram && (
				<LogsExplorerChart
					isLoading={isFetchingListChartData || isLoadingListChartData}
					data={chartData}
				/>
			)}

			<div className="logs-explorer-views-types">
				<div className="views-tabs-container">
					<Radio.Group
						className="views-tabs"
						onChange={handleModeChange}
						value={selectedPanelType}
					>
						<Radio.Button
							value={PANEL_TYPES.LIST}
							disabled={
								(isMultipleQueries || isGroupByExist) && selectedView !== 'search'
							}
						>
							List view
						</Radio.Button>
						<Radio.Button value={PANEL_TYPES.TIME_SERIES}> Time series </Radio.Button>
						<Radio.Button value={PANEL_TYPES.TABLE}> Table </Radio.Button>
					</Radio.Group>

					{selectedPanelType === PANEL_TYPES.LIST && (
						<div className="tab-options">
							<Dropdown
								menu={{ items: exportItems }}
								className="dropdown"
								placement="bottomRight"
								trigger={['click']}
							>
								<Button>
									<FileDown size={16} />
								</Button>
							</Dropdown>

							<div className="format-options-container" ref={menuRef}>
								<Button onClick={handleToggleShowFormatOptions}>
									<Sliders size={16} />
								</Button>

								{showFormatMenuItems && (
									<NestedMenu
										title="FORMAT"
										items={formatItems}
										selectedOptionFormat={options.format}
										config={config}
									/>
								)}
							</div>
						</div>
					)}
				</div>

				<div className="logs-explorer-views-type-content">
					{selectedPanelType === PANEL_TYPES.LIST && (
						<LogsExplorerList
							isLoading={isLoading}
							currentStagedQueryData={listQuery}
							logs={logs}
							onEndReached={handleEndReached}
						/>
					)}

					{selectedPanelType === PANEL_TYPES.TIME_SERIES && (
						<TimeSeriesView isLoading={isLoading} data={data} isError={isError} />
					)}

					{selectedPanelType === PANEL_TYPES.TABLE && (
						<LogsExplorerTable
							data={data?.payload.data.newResult.data.result || []}
							isLoading={isLoading}
						/>
					)}
				</div>
			</div>

			<GoToTop />

			<ExplorerOptions
				disabled={!stagedQuery}
				query={exportDefaultQuery}
				isLoading={isUpdateDashboardLoading}
				onExport={handleExport}
			/>
		</div>
	);
}

export default memo(LogsExplorerViews);
