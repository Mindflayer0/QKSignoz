import './MQTables.styles.scss';

import { Skeleton, Table, Typography } from 'antd';
import axios from 'axios';
import { SOMETHING_WENT_WRONG } from 'constants/api';
import { QueryParams } from 'constants/query';
import { useNotifications } from 'hooks/useNotifications';
import useUrlQuery from 'hooks/useUrlQuery';
import { isEmpty } from 'lodash-es';
import {
	ConsumerLagDetailTitle,
	ConsumerLagDetailType,
	convertToTitleCase,
	RowData,
	SelectedTimelineQuery,
} from 'pages/MessagingQueues/MessagingQueuesUtils';
import { useEffect, useMemo, useState } from 'react';
import { useMutation } from 'react-query';

import {
	ConsumerLagPayload,
	getConsumerLagDetails,
} from './getConsumerLagDetails';

export function getColumns(data: any): any[] {
	if (data?.result?.length === 0) {
		return [];
	}

	const columns: {
		title: string;
		dataIndex: string;
		key: string;
	}[] = data?.result?.[0]?.table?.columns.map((clm: any) => ({
		title: convertToTitleCase(clm.name),
		dataIndex: clm.name,
		key: clm.name,
	}));

	return columns;
}

export function getTableData(data: any): any[] {
	if (data?.result?.length === 0) {
		return [];
	}

	const tableData: RowData[] = data?.result?.[0]?.table?.rows.map(
		(row: any, index: number): RowData => ({
			key: index,
			...row.data,
		}),
	);

	return tableData;
}

const showPaginationItem = (total: number, range: number[]): JSX.Element => (
	<>
		<Typography.Text className="numbers">
			{range[0]} &#8212; {range[1]}
		</Typography.Text>
		<Typography.Text className="total"> of {total}</Typography.Text>
	</>
);

function MessagingQueuesTable({
	currentTab,
}: {
	currentTab: ConsumerLagDetailType;
}): JSX.Element {
	const [columns, setColumns] = useState<any[]>([]);
	const [tableData, setTableData] = useState<any[]>([]);
	const { notifications } = useNotifications();
	const urlQuery = useUrlQuery();
	const timelineQuery = decodeURIComponent(
		urlQuery.get(QueryParams.selectedTimelineQuery) || '',
	);
	const timelineQueryData: SelectedTimelineQuery = useMemo(
		() => (timelineQuery ? JSON.parse(timelineQuery) : {}),
		[timelineQuery],
	);

	const paginationConfig = useMemo(
		() =>
			tableData?.length > 20 && {
				pageSize: 20,
				showTotal: showPaginationItem,
				showSizeChanger: false,
				hideOnSinglePage: true,
			},
		[tableData],
	);

	const props: ConsumerLagPayload = useMemo(
		() => ({
			start: timelineQueryData?.start,
			end: timelineQueryData?.end,
			variables: {
				partition: timelineQueryData?.partition,
				topic: timelineQueryData?.topic,
				consumer_group: timelineQueryData?.group,
			},
			detailType: currentTab,
		}),
		[currentTab, timelineQueryData],
	);

	const handleConsumerDetailsOnError = (error: Error): void => {
		notifications.error({
			message: axios.isAxiosError(error) ? error?.message : SOMETHING_WENT_WRONG,
		});
	};

	const { mutate: getConsumerDetails, isLoading } = useMutation(
		getConsumerLagDetails,
		{
			onSuccess: (data) => {
				setColumns(getColumns(data?.payload));
				setTableData(getTableData(data?.payload));
			},
			onError: handleConsumerDetailsOnError,
		},
	);

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect(() => getConsumerDetails(props), [currentTab, props]);

	const isEmptyDetails = (timelineQueryData: SelectedTimelineQuery): boolean =>
		isEmpty(timelineQueryData) ||
		(!timelineQueryData?.group &&
			!timelineQueryData?.topic &&
			!timelineQueryData?.partition);

	return (
		<div className="mq-tables-container">
			{isEmptyDetails(timelineQueryData) ? (
				<div className="no-data-style">
					<Typography.Text>
						Click on a co-ordinate above to see the details
					</Typography.Text>
					<Skeleton />
				</div>
			) : (
				<>
					<div className="mq-table-title">
						{ConsumerLagDetailTitle[currentTab]}
						<div className="mq-table-subtitle">{`${timelineQueryData?.group || ''} ${
							timelineQueryData?.topic || ''
						} ${timelineQueryData?.partition || ''}`}</div>
					</div>
					<Table
						className="mq-table"
						pagination={paginationConfig}
						size="middle"
						columns={columns}
						dataSource={tableData}
						bordered={false}
						loading={isLoading}
					/>
				</>
			)}
		</div>
	);
}

export default MessagingQueuesTable;