import './PlannedDowntime.styles.scss';
import 'dayjs/locale/en';

import { PlusOutlined } from '@ant-design/icons';
import { Color } from '@signozhq/design-tokens';
import { Button, Dropdown, Flex, Input, MenuProps, Typography } from 'antd';
import getAll from 'api/alerts/getAll';
import { useDeleteDowntimeSchedule } from 'api/plannedDowntime/deleteDowntimeSchedule';
import getAllDowntimeSchedules, {
	DowntimeSchedules,
} from 'api/plannedDowntime/getAllDowntimeSchedules';
import dayjs from 'dayjs';
import { useNotifications } from 'hooks/useNotifications';
import { CalendarClockIcon, PencilRuler, Search, SortDesc } from 'lucide-react';
import React, { ChangeEvent, useState } from 'react';
import { useQuery } from 'react-query';

import { PlannedDowntimeDeleteModal } from './PlannedDowntimeDeleteModal';
import { PlannedDowntimeForm } from './PlannedDowntimeForm';
import { PlannedDowntimeList } from './PlannedDowntimeList';
import {
	defautlInitialValues,
	deleteDowntimeHandler,
} from './PlannedDowntimeutils';

export function PlannedDowntime(): JSX.Element {
	const { data, isError, isLoading } = useQuery('allAlerts', {
		queryFn: getAll,
		cacheTime: 0,
	});
	const [isOpen, setIsOpen] = React.useState(false);

	const [initialValues, setInitialValues] = useState<
		Partial<DowntimeSchedules & { editMode: boolean }>
	>(defautlInitialValues);

	const downtimeSchedules = useQuery('allDowntimeSchedules', {
		queryFn: getAllDowntimeSchedules,
		cacheTime: 0,
	});

	const alertOptions = React.useMemo(
		() =>
			data?.payload?.map((i) => ({
				label: i.alert,
				value: i.id,
			})),
		[data],
	);

	dayjs.locale('en');

	const [searchValue, setSearchValue] = React.useState<string>('');
	const [deleteData, setDeleteData] = useState<{ id: number; name: string }>();
	const [isEditMode, setEditMode] = useState<boolean>(false);

	const handleSearch = (e: ChangeEvent<HTMLInputElement>): void => {
		setSearchValue(e.target.value);
		console.log(searchValue);
	};

	const filterMenuItems: MenuProps['items'] = [
		{
			label: (
				<div className="create-dashboard-menu-item">
					{' '}
					<PencilRuler size={14} /> Created by
				</div>
			),
			key: '0',
		},
		{
			label: (
				<div className="create-dashboard-menu-item">
					{' '}
					<CalendarClockIcon size={14} /> Last updated by
				</div>
			),
			key: '1',
		},
	];

	const clearSearch = (): void => {
		setSearchValue('');
	};

	// Delete Downtime Schedule
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const { notifications } = useNotifications();

	const hideDeleteDowntimeScheduleModal = (): void => {
		setIsDeleteModalOpen(false);
	};

	const refetchAllSchedules = (): void => {
		downtimeSchedules.refetch();
	};

	const {
		mutateAsync: deleteDowntimeScheduleAsync,
		isLoading: isDeleteLoading,
	} = useDeleteDowntimeSchedule({ id: deleteData?.id });

	const onDeleteHandler = (): void => {
		deleteDowntimeHandler({
			deleteDowntimeScheduleAsync,
			notifications,
			refetchAllSchedules,
			deleteId: deleteData?.id,
			hideDeleteDowntimeScheduleModal,
			clearSearch,
		});
	};

	return (
		<div className="planned-downtime-container">
			<div className="planned-downtime-content">
				<Typography.Title className="title">Planned Downtime</Typography.Title>
				<Typography.Text className="subtitle">
					Create and manage planned downtimes.
				</Typography.Text>
				<Flex className="toolbar">
					<Dropdown
						overlayClassName="new-downtime-menu"
						menu={{ items: filterMenuItems }}
						placement="bottomLeft"
					>
						<Button
							type="default"
							className="periscope-btn"
							icon={<SortDesc size={14} />}
						>
							Filter
						</Button>
					</Dropdown>
					<Input
						placeholder="Search for a planned downtime..."
						prefix={<Search size={12} color={Color.BG_VANILLA_400} />}
						value={searchValue}
						onChange={handleSearch}
					/>
					<Button
						icon={<PlusOutlined />}
						type="primary"
						onClick={(): void => {
							setInitialValues({ ...defautlInitialValues, editMode: false });
							setIsOpen(true);
						}}
					>
						New downtime
					</Button>
				</Flex>
				<br />
				<PlannedDowntimeList
					downtimeSchedules={downtimeSchedules}
					alertOptions={alertOptions || []}
					setInitialValues={setInitialValues}
					setModalOpen={setIsOpen}
					handleDeleteDowntime={(id, name): void => {
						setDeleteData({ id, name });
						setIsDeleteModalOpen(true);
					}}
					setEditMode={setEditMode}
				/>
				<PlannedDowntimeForm
					alertOptions={alertOptions || []}
					initialValues={initialValues}
					isError={isError}
					isLoading={isLoading}
					isOpen={isOpen}
					setIsOpen={setIsOpen}
					refetchAllSchedules={refetchAllSchedules}
					isEditMode={isEditMode}
				/>
				<PlannedDowntimeDeleteModal
					isDeleteLoading={isDeleteLoading}
					isDeleteModalOpen={isDeleteModalOpen}
					onDeleteHandler={onDeleteHandler}
					setIsDeleteModalOpen={setIsDeleteModalOpen}
					downtimeSchedule={deleteData?.name || ''}
				/>
			</div>
		</div>
	);
}
