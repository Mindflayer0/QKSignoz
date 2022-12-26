import { SearchOutlined } from '@ant-design/icons';
import {
	Button,
	Card,
	Input,
	notification,
	Space,
	Table,
	TableProps,
	Tooltip,
	Typography,
} from 'antd';
import { ColumnType } from 'antd/es/table';
import { ColumnsType } from 'antd/lib/table';
import { FilterConfirmProps } from 'antd/lib/table/interface';
import getAll from 'api/errors/getAll';
import getErrorCounts from 'api/errors/getErrorCounts';
import ROUTES from 'constants/routes';
import dayjs from 'dayjs';
import createQueryParams from 'lib/createQueryParams';
import history from 'lib/history';
import React, { useCallback, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries } from 'react-query';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { AppState } from 'store/reducers';
import { ErrorResponse, SuccessResponse } from 'types/api';
import { Exception, PayloadProps } from 'types/api/errors/getAll';
import { GlobalReducer } from 'types/reducer/globalTime';

import {
	getDefaultOrder,
	getFilterString,
	getNanoSeconds,
	getOffSet,
	getOrder,
	getOrderParams,
	getUpdatePageSize,
	urlKey,
} from './utils';

function AllErrors(): JSX.Element {
	const { maxTime, minTime, loading } = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);
	const { search, pathname } = useLocation();
	const params = useMemo(() => new URLSearchParams(search), [search]);

	const { t } = useTranslation(['common']);

	const updatedOrder = getOrder(params.get(urlKey.order));
	const getUpdatedOffset = getOffSet(params.get(urlKey.offset));
	const getUpdatedParams = getOrderParams(params.get(urlKey.orderParam));
	const getUpdatedPageSize = getUpdatePageSize(params.get(urlKey.pageSize));
	const getUpdatedExceptionType = getFilterString(
		params.get(urlKey.exceptionType),
	);
	const getUpdatedServiceName = getFilterString(params.get(urlKey.serviceName));

	const updatedPath = useMemo(
		() =>
			`${pathname}?${createQueryParams({
				order: updatedOrder,
				offset: getUpdatedOffset,
				orderParam: getUpdatedParams,
				pageSize: getUpdatedPageSize,
				exceptionType: getUpdatedExceptionType,
				serviceName: getUpdatedServiceName,
			})}`,
		[
			pathname,
			updatedOrder,
			getUpdatedOffset,
			getUpdatedParams,
			getUpdatedPageSize,
			getUpdatedExceptionType,
			getUpdatedServiceName,
		],
	);

	const [{ isLoading, data }, errorCountResponse] = useQueries([
		{
			queryKey: ['getAllErrors', updatedPath, maxTime, minTime],
			queryFn: (): Promise<SuccessResponse<PayloadProps> | ErrorResponse> =>
				getAll({
					end: maxTime,
					start: minTime,
					order: updatedOrder,
					limit: getUpdatedPageSize,
					offset: getUpdatedOffset,
					orderParam: getUpdatedParams,
					exceptionType: getUpdatedExceptionType,
					serviceName: getUpdatedServiceName,
				}),
			enabled: !loading,
		},
		{
			queryKey: ['getErrorCounts', maxTime, minTime],
			queryFn: (): Promise<ErrorResponse | SuccessResponse<number>> =>
				getErrorCounts({
					end: maxTime,
					start: minTime,
				}),
		},
	]);

	useEffect(() => {
		if (data?.error) {
			notification.error({
				message: data.error || t('something_went_wrong'),
			});
		}
	}, [data?.error, data?.payload, t]);

	const getDateValue = (value: string): JSX.Element => (
		<Typography>{dayjs(value).format('DD/MM/YYYY HH:mm:ss A')}</Typography>
	);

	const filterIcon = useCallback(() => <SearchOutlined />, []);

	const handleSearch = (
		confirm: (param?: FilterConfirmProps) => void,
	): VoidFunction => (): void => {
		confirm();
	};

	const filterDropdownWrapper = useCallback(
		({ setSelectedKeys, selectedKeys, confirm, placeholder, filterKey }) => {
			let defaultValue = '';

			switch (filterKey) {
				case 'serviceName':
					defaultValue = getUpdatedServiceName;
					break;
				case 'exceptionType':
					defaultValue = getUpdatedExceptionType;
					break;
				default:
					break;
			}

			return (
				<Card size="small">
					<Space align="start" direction="vertical">
						<Input
							placeholder={placeholder}
							value={selectedKeys[0]}
							onChange={(e): void =>
								setSelectedKeys(e.target.value ? [e.target.value] : [])
							}
							allowClear
							defaultValue={defaultValue}
							onPressEnter={handleSearch(confirm)}
						/>
						<Button
							type="primary"
							onClick={handleSearch(confirm)}
							icon={<SearchOutlined />}
							size="small"
						>
							Search
						</Button>
					</Space>
				</Card>
			);
		},
		[getUpdatedExceptionType, getUpdatedServiceName],
	);

	const onExceptionTypeFilter = useCallback(
		(value, record: Exception): boolean => {
			if (record.exceptionType && typeof value === 'string') {
				return record.exceptionType.toLowerCase().includes(value.toLowerCase());
			}
			return false;
		},
		[],
	);

	const onApplicationTypeFilter = useCallback(
		(value, record: Exception): boolean => {
			if (record.serviceName && typeof value === 'string') {
				return record.serviceName.toLowerCase().includes(value.toLowerCase());
			}
			return false;
		},
		[],
	);

	const getFilter = useCallback(
		(
			onFilter: ColumnType<Exception>['onFilter'],
			placeholder: string,
			filterKey: string,
		): ColumnType<Exception> => ({
			onFilter,
			filterIcon,
			filterDropdown: ({ confirm, selectedKeys, setSelectedKeys }): JSX.Element =>
				filterDropdownWrapper({
					setSelectedKeys,
					selectedKeys,
					confirm,
					placeholder,
					filterKey,
				}),
		}),
		[filterIcon, filterDropdownWrapper],
	);

	const columns: ColumnsType<Exception> = [
		{
			title: 'Exception Type',
			dataIndex: 'exceptionType',
			key: 'exceptionType',
			...getFilter(onExceptionTypeFilter, 'Search By Exception', 'exceptionType'),
			render: (value, record): JSX.Element => (
				<Tooltip overlay={(): JSX.Element => value}>
					<Link
						to={`${ROUTES.ERROR_DETAIL}?groupId=${
							record.groupID
						}&timestamp=${getNanoSeconds(record.lastSeen)}`}
					>
						{value}
					</Link>
				</Tooltip>
			),
			sorter: true,
			defaultSortOrder: getDefaultOrder(
				getUpdatedParams,
				updatedOrder,
				'exceptionType',
			),
		},
		{
			title: 'Error Message',
			dataIndex: 'exceptionMessage',
			key: 'exceptionMessage',
			render: (value): JSX.Element => (
				<Tooltip overlay={(): JSX.Element => value}>
					<Typography.Paragraph
						ellipsis={{
							rows: 2,
						}}
					>
						{value}
					</Typography.Paragraph>
				</Tooltip>
			),
		},
		{
			title: 'Count',
			dataIndex: 'exceptionCount',
			key: 'exceptionCount',
			sorter: true,
			defaultSortOrder: getDefaultOrder(
				getUpdatedParams,
				updatedOrder,
				'exceptionCount',
			),
		},
		{
			title: 'Last Seen',
			dataIndex: 'lastSeen',
			key: 'lastSeen',
			render: getDateValue,
			sorter: true,
			defaultSortOrder: getDefaultOrder(
				getUpdatedParams,
				updatedOrder,
				'lastSeen',
			),
		},
		{
			title: 'First Seen',
			dataIndex: 'firstSeen',
			key: 'firstSeen',
			render: getDateValue,
			sorter: true,
			defaultSortOrder: getDefaultOrder(
				getUpdatedParams,
				updatedOrder,
				'firstSeen',
			),
		},
		{
			title: 'Application',
			dataIndex: 'serviceName',
			key: 'serviceName',
			sorter: true,
			defaultSortOrder: getDefaultOrder(
				getUpdatedParams,
				updatedOrder,
				'serviceName',
			),
			...getFilter(
				onApplicationTypeFilter,
				'Search By Application',
				'serviceName',
			),
		},
	];

	const onChangeHandler: TableProps<Exception>['onChange'] = (
		paginations,
		filters,
		sorter,
	) => {
		if (!Array.isArray(sorter)) {
			const exceptionTypeValues = filters.exceptionType as string[];
			const exceptionType =
				exceptionTypeValues && exceptionTypeValues.length > 0
					? exceptionTypeValues[0]
					: '';
			const serviceNameValues = filters.serviceName as string[];
			const serviceName =
				serviceNameValues && serviceNameValues.length > 0
					? serviceNameValues[0]
					: '';
			const { pageSize = 0, current = 0 } = paginations;
			const { columnKey = '', order } = sorter;
			const updatedOrder = order === 'ascend' ? 'ascending' : 'descending';

			history.replace(
				`${pathname}?${createQueryParams({
					order: updatedOrder,
					offset: (current - 1) * pageSize,
					orderParam: columnKey,
					pageSize,
					exceptionType,
					serviceName,
				})}`,
			);
		}
	};

	return (
		<Table
			tableLayout="fixed"
			dataSource={data?.payload as Exception[]}
			columns={columns}
			rowKey="firstSeen"
			loading={isLoading || false || errorCountResponse.status === 'loading'}
			pagination={{
				pageSize: getUpdatedPageSize,
				responsive: true,
				current: getUpdatedOffset / 10 + 1,
				position: ['bottomLeft'],
				total: errorCountResponse.data?.payload || 0,
			}}
			onChange={onChangeHandler}
		/>
	);
}

export default AllErrors;
