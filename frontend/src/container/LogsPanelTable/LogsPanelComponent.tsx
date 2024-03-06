import './LogsPanelComponent.styles.scss';

import { Table } from 'antd';
import LogDetail from 'components/LogDetail';
import { VIEW_TYPES } from 'components/LogDetail/constants';
import { SOMETHING_WENT_WRONG } from 'constants/api';
import { DEFAULT_ENTITY_VERSION } from 'constants/app';
import { OPERATORS, PANEL_TYPES } from 'constants/queryBuilder';
import { REACT_QUERY_KEY } from 'constants/reactQueryKeys';
import Controls from 'container/Controls';
import { timePreferance } from 'container/NewWidget/RightContainer/timeItems';
import { PER_PAGE_OPTIONS } from 'container/TracesExplorer/ListView/configs';
import { tableStyles } from 'container/TracesExplorer/ListView/styles';
import { useActiveLog } from 'hooks/logs/useActiveLog';
import { useGetQueryRange } from 'hooks/queryBuilder/useGetQueryRange';
import { Pagination } from 'hooks/queryPagination';
import { useLogsData } from 'hooks/useLogsData';
import { getDashboardVariables } from 'lib/dashbaordVariables/getDashboardVariables';
import { GetQueryResultsProps } from 'lib/dashboard/getQueryResults';
import { FlatLogData } from 'lib/logs/flatLogData';
import { RowData } from 'lib/query/createTableColumnsFromQuery';
import { useDashboard } from 'providers/Dashboard/Dashboard';
import {
	HTMLAttributes,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { Widgets } from 'types/api/dashboard/getAll';
import { ILog } from 'types/api/logs/log';
import { DataTypes } from 'types/api/queryBuilder/queryAutocompleteResponse';
import { Query } from 'types/api/queryBuilder/queryBuilderData';
import { GlobalReducer } from 'types/reducer/globalTime';
import { v4 as uuid } from 'uuid';

import { getLogPanelColumnsList } from './utils';

function LogsPanelComponent({
	selectedLogsFields,
	query,
	selectedTime,
}: LogsPanelComponentProps): JSX.Element {
	const { selectedTime: globalSelectedTime, maxTime, minTime } = useSelector<
		AppState,
		GlobalReducer
	>((state) => state.globalTime);

	const [pagination, setPagination] = useState<Pagination>({
		offset: 0,
		limit: query.builder.queryData[0].limit || 0,
	});

	const [requestData, setRequestData] = useState<GetQueryResultsProps>(() => {
		const updatedQuery = { ...query };
		updatedQuery.builder.queryData[0].pageSize = 10;
		return {
			query: updatedQuery,
			graphType: PANEL_TYPES.LIST,
			selectedTime: selectedTime?.enum || 'GLOBAL_TIME',
			globalSelectedInterval: globalSelectedTime,
			tableParams: {
				pagination,
			},
		};
	});

	useEffect(() => {
		const newQueryData = { ...query };
		const newRequestData = {
			...requestData,
			query: newQueryData,
		};

		const { tableParams } = newRequestData;
		if (tableParams?.pagination) {
			const { limit } = newQueryData.builder.queryData[0];
			tableParams.pagination.limit = limit === 0 ? 0 : limit || 0;
		}

		setRequestData(newRequestData);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [query]);

	const [pageSize, setPageSize] = useState<number>(10);
	const { selectedDashboard } = useDashboard();

	const updatePagination = (value: number): void => {
		setPagination((prevPagination) => ({
			...prevPagination,
			limit: 0,
			offset: value,
		}));
	};

	const updateRequestData = (pageSize: number): void => {
		setRequestData((prevRequestData) => ({
			...prevRequestData,
			query: {
				...prevRequestData.query,
				builder: {
					...prevRequestData.query.builder,
					queryData: [
						{
							...prevRequestData.query.builder.queryData[0],
							pageSize,
						},
					],
				},
			},
			tableParams: {
				...prevRequestData.tableParams,
				pagination,
			},
		}));
	};

	const handleChangePageSize = (value: number): void => {
		updatePagination(value);
		setPageSize(value);
		updateRequestData(value);
	};

	const { data, isFetching, isError } = useGetQueryRange(
		{
			...requestData,
			globalSelectedInterval: globalSelectedTime,
			selectedTime: selectedTime?.enum || 'GLOBAL_TIME',
			variables: getDashboardVariables(selectedDashboard?.data.variables),
		},
		DEFAULT_ENTITY_VERSION,
		{
			queryKey: [
				REACT_QUERY_KEY.GET_QUERY_RANGE,
				globalSelectedTime,
				maxTime,
				minTime,
				requestData,
				selectedDashboard?.data.variables,
				selectedTime?.enum,
			],
			enabled: !!requestData.query && !!selectedLogsFields?.length,
		},
	);

	const columns = getLogPanelColumnsList(selectedLogsFields);

	const dataLength =
		data?.payload?.data?.newResult?.data?.result[0]?.list?.length;
	const totalCount = useMemo(() => dataLength || 0, [dataLength]);

	const [firstLog, setFirstLog] = useState<ILog>();
	const [lastLog, setLastLog] = useState<ILog>();

	const { logs } = useLogsData({
		result: data?.payload.data.newResult.data.result,
		panelType: PANEL_TYPES.LIST,
		stagedQuery: query,
	});

	useEffect(() => {
		if (logs.length) {
			setFirstLog(logs[0]);
			setLastLog(logs[logs.length - 1]);
		}
	}, [logs]);

	const flattenLogData = useMemo(
		() => logs.map((log) => FlatLogData(log) as RowData),
		[logs],
	);

	const {
		activeLog,
		onSetActiveLog,
		onClearActiveLog,
		onAddToQuery,
	} = useActiveLog();

	const handleRow = useCallback(
		(record: RowData): HTMLAttributes<RowData> => ({
			onClick: (): void => {
				const log = logs.find((item) => item.id === record.id);
				if (log) onSetActiveLog(log);
			},
		}),
		[logs, onSetActiveLog],
	);

	const isOrderByTimeStamp =
		query.builder.queryData[0].orderBy.length > 0 &&
		query.builder.queryData[0].orderBy[0].columnName === 'timestamp';

	const handlePreviousPagination = (): void => {
		if (isOrderByTimeStamp) {
			setRequestData({
				...requestData,
				query: {
					...requestData.query,
					builder: {
						...requestData.query.builder,
						queryData: [
							{
								...requestData.query.builder.queryData[0],
								filters: {
									...requestData.query.builder.queryData[0].filters,
									items: [
										{
											id: uuid(),
											key: {
												key: 'id',
												type: '',
												dataType: DataTypes.String,
												isColumn: true,
											},
											op: OPERATORS['>'],
											value: firstLog?.id || '',
										},
									],
								},
							},
						],
					},
				},
			});
			return;
		}
		setPagination({
			...pagination,
			limit: 0,
			offset: pagination.offset - pageSize,
		});
		setRequestData({
			...requestData,
			globalSelectedInterval: globalSelectedTime,
			tableParams: {
				pagination: {
					limit: 0,
					offset: pagination.offset - pageSize,
				},
			},
		});
	};

	const handleNextPagination = (): void => {
		if (isOrderByTimeStamp) {
			setRequestData({
				...requestData,
				query: {
					...requestData.query,
					builder: {
						...requestData.query.builder,
						queryData: [
							{
								...requestData.query.builder.queryData[0],
								filters: {
									...requestData.query.builder.queryData[0].filters,
									items: [
										{
											id: uuid(),
											key: {
												key: 'id',
												type: '',
												dataType: DataTypes.String,
												isColumn: true,
											},
											op: OPERATORS['<'],
											value: lastLog?.id || '',
										},
									],
								},
							},
						],
					},
				},
			});
			return;
		}
		setPagination({
			...pagination,
			limit: 0,
			offset: pagination.offset + pageSize,
		});
		setRequestData({
			...requestData,
			globalSelectedInterval: globalSelectedTime,
			tableParams: {
				pagination: {
					limit: 0,
					offset: pagination.offset + pageSize,
				},
			},
		});
	};

	if (isError) {
		return <div>{SOMETHING_WENT_WRONG}</div>;
	}

	return (
		<>
			<div className="logs-table">
				<div className="resize-table">
					<Table
						pagination={false}
						tableLayout="fixed"
						scroll={{ x: `calc(50vw - 10px)` }}
						sticky
						loading={isFetching}
						style={tableStyles}
						dataSource={flattenLogData}
						columns={columns}
						onRow={handleRow}
					/>
				</div>
				{!query.builder.queryData[0].limit && (
					<div className="controller">
						<Controls
							totalCount={totalCount}
							perPageOptions={PER_PAGE_OPTIONS}
							isLoading={isFetching}
							offset={pagination.offset}
							countPerPage={pageSize}
							handleNavigatePrevious={handlePreviousPagination}
							handleNavigateNext={handleNextPagination}
							handleCountItemsPerPageChange={handleChangePageSize}
							isLogPanel={isOrderByTimeStamp}
						/>
					</div>
				)}
			</div>
			<LogDetail
				selectedTab={VIEW_TYPES.OVERVIEW}
				log={activeLog}
				onClose={onClearActiveLog}
				onAddToQuery={onAddToQuery}
				onClickActionItem={onAddToQuery}
				isListViewPanel
			/>
		</>
	);
}

export type LogsPanelComponentProps = {
	selectedLogsFields: Widgets['selectedLogFields'];
	query: Query;
	selectedTime?: timePreferance;
};

LogsPanelComponent.defaultProps = {
	selectedTime: undefined,
};

export default LogsPanelComponent;
