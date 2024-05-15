import './styles.scss';

import { ExclamationCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { Card, Modal, Table, Typography } from 'antd';
import { ExpandableConfig } from 'antd/es/table/interface';
import savePipeline from 'api/pipeline/post';
import useAnalytics from 'hooks/analytics/useAnalytics';
import { useNotifications } from 'hooks/useNotifications';
import cloneDeep from 'lodash-es/cloneDeep';
import isEqual from 'lodash-es/isEqual';
import React, { useCallback, useMemo, useState } from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useTranslation } from 'react-i18next';
import {
	ActionMode,
	ActionType,
	PipelineData,
	ProcessorData,
} from 'types/api/pipeline/def';
import { v4 } from 'uuid';

import { tableComponents } from '../config';
import PipelinesSearchSection from '../Layouts/Pipeline/PipelinesSearchSection';
import AddNewPipeline from './AddNewPipeline';
import AddNewProcessor from './AddNewProcessor';
import { pipelineColumns } from './config';
import ModeAndConfiguration from './ModeAndConfiguration';
import PipelineExpanView from './PipelineExpandView';
import SaveConfigButton from './SaveConfigButton';
import {
	AlertContentWrapper,
	AlertModalTitle,
	Container,
	FooterButton,
} from './styles';
import DragAction from './TableComponents/DragAction';
import PipelineActions from './TableComponents/PipelineActions';
import PreviewAction from './TableComponents/PipelineActions/components/PreviewAction';
import TableExpandIcon from './TableComponents/TableExpandIcon';
import {
	getDataOnSearch,
	getEditedDataSource,
	getElementFromArray,
	getRecordIndex,
	getTableColumn,
	getUpdatedRow,
} from './utils';

function PipelinesListEmptyState(): JSX.Element {
	const { t } = useTranslation(['pipeline']);
	return (
		<div className="logs-pipelines-empty-state-centered-container">
			<Card size="small">
				<div className="logs-pipelines-empty-state-centered-container">
					<iframe
						className="logs-pipelines-empty-state-video-iframe"
						sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
						src="https://www.youtube.com/embed/OneENGNmLd0"
						frameBorder="0"
						allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
						allowFullScreen
						title={t('learn_more')}
					/>
					<div>
						<Typography>
							{t('learn_more')}&nbsp;
							<a
								href="https://signoz.io/docs/logs-pipelines/introduction/"
								target="_blank"
								rel="noreferrer"
							>
								here
							</a>
						</Typography>
					</div>
				</div>
			</Card>
		</div>
	);
}

function PipelineListsView({
	isActionType,
	setActionType,
	isActionMode,
	setActionMode,
	savedPipelinesVersion,
	savedPipelines,
	setSavedPipelines,
	currentPipelines,
	setCurrentPipelines,
	refetchPipelineLists,
}: PipelineListsViewProps): JSX.Element {
	const { t } = useTranslation(['pipeline', 'common']);
	const [modal, contextHolder] = Modal.useModal();
	const { notifications } = useNotifications();
	const [pipelineSearchValue, setPipelineSearchValue] = useState<string>('');
	const { trackEvent } = useAnalytics();
	const [expandedPipelineId, setExpandedPipelineId] = useState<
		string | undefined
	>(undefined);
	const expandedPipelineData = useCallback(
		() => currentPipelines?.find((p) => p.id === expandedPipelineId),
		[currentPipelines, expandedPipelineId],
	);

	const setExpandedPipelineData = useCallback(
		(newData: PipelineData): void => {
			if (expandedPipelineId) {
				const pipelineIdx = currentPipelines?.findIndex(
					(p) => p.id === expandedPipelineId,
				);
				if (pipelineIdx >= 0) {
					const newPipelineData = cloneDeep(currentPipelines);
					newPipelineData[pipelineIdx] = newData;
					setCurrentPipelines(newPipelineData);
				}
			}
		},
		[expandedPipelineId, currentPipelines, setCurrentPipelines],
	);

	const [
		selectedProcessorData,
		setSelectedProcessorData,
	] = useState<ProcessorData>();

	const [
		selectedPipelineData,
		setSelectedPipelineData,
	] = useState<PipelineData>();

	const [expandedRowKeys, setExpandedRowKeys] = useState<Array<string>>();
	const isEditingActionMode = isActionMode === ActionMode.Editing;

	const visibleCurrPipelines = useMemo((): Array<PipelineData> => {
		if (pipelineSearchValue === '') {
			return currentPipelines;
		}
		return currentPipelines.filter((data) =>
			getDataOnSearch(data as never, pipelineSearchValue),
		);
	}, [currentPipelines, pipelineSearchValue]);

	const handleAlert = useCallback(
		({ title, descrition, buttontext, onCancel, onOk }: AlertMessage) => {
			modal.confirm({
				title: <AlertModalTitle>{title}</AlertModalTitle>,
				icon: <ExclamationCircleOutlined />,
				content: <AlertContentWrapper>{descrition}</AlertContentWrapper>,
				okText: <span>{buttontext}</span>,
				cancelText: <span>{t('cancel')}</span>,
				onOk,
				onCancel,
			});
		},
		[modal, t],
	);

	const pipelineEditAction = useCallback(
		(record: PipelineData) => (): void => {
			setActionType(ActionType.EditPipeline);
			setSelectedPipelineData(record);
		},
		[setActionType],
	);

	const pipelineDeleteHandler = useCallback(
		(record: PipelineData) => (): void => {
			const filteredData = getElementFromArray(
				cloneDeep(currentPipelines),
				record,
				'id',
			);
			filteredData.forEach((item, index) => {
				const obj = item;
				obj.orderId = index + 1;
			});
			setCurrentPipelines(filteredData);
		},
		[currentPipelines, setCurrentPipelines],
	);

	const pipelineDeleteAction = useCallback(
		(record: PipelineData) => (): void => {
			handleAlert({
				title: `${t('delete_pipeline')} : ${record.name}?`,
				descrition: t('delete_pipeline_description'),
				buttontext: t('delete'),
				onOk: pipelineDeleteHandler(record),
			});
		},
		[handleAlert, pipelineDeleteHandler, t],
	);

	const processorEditAction = useCallback(
		(record: ProcessorData) => (): void => {
			setActionType(ActionType.EditProcessor);
			setSelectedProcessorData(record);
		},
		[setActionType],
	);

	const onSwitchPipelineChange = useCallback(
		(checked: boolean, record: PipelineData): void => {
			const findRecordIndex = getRecordIndex(currentPipelines, record, 'id');
			const updateSwitch = {
				...currentPipelines[findRecordIndex],
				enabled: checked,
			};
			const editedPipelineData = getEditedDataSource(
				cloneDeep(currentPipelines),
				record,
				'id',
				updateSwitch,
			);
			setCurrentPipelines(editedPipelineData);
		},
		[currentPipelines, setCurrentPipelines],
	);

	const columns = useMemo(() => {
		const fieldColumns = getTableColumn(pipelineColumns);
		if (isEditingActionMode) {
			fieldColumns.push(
				{
					title: 'Actions',
					dataIndex: 'smartAction',
					key: 'smartAction',
					align: 'center',
					render: (_value, record): JSX.Element => (
						<PipelineActions
							pipeline={record}
							editAction={pipelineEditAction(record)}
							deleteAction={pipelineDeleteAction(record)}
						/>
					),
				},
				{
					title: '',
					dataIndex: 'enabled',
					key: 'enabled',
					render: (value, record) => (
						<DragAction
							isEnabled={value}
							onChange={(checked: boolean): void =>
								onSwitchPipelineChange(checked, record)
							}
						/>
					),
				},
			);
		} else {
			fieldColumns.push({
				title: 'Actions',
				dataIndex: 'smartAction',
				key: 'smartAction',
				align: 'center',
				render: (_value, record): JSX.Element => (
					<PreviewAction pipeline={record} />
				),
			});
		}
		return fieldColumns;
	}, [
		isEditingActionMode,
		pipelineEditAction,
		pipelineDeleteAction,
		onSwitchPipelineChange,
	]);

	const movePipelineRow = useCallback(
		(dragIndex: number, hoverIndex: number) => {
			if (currentPipelines && isEditingActionMode) {
				const rawData = currentPipelines;

				const updatedRows = getUpdatedRow(
					cloneDeep(currentPipelines),
					visibleCurrPipelines[dragIndex].orderId - 1,
					visibleCurrPipelines[hoverIndex].orderId - 1,
				);

				updatedRows.forEach((item, index) => {
					const obj = item;
					obj.orderId = index + 1;
				});
				handleAlert({
					title: t('reorder_pipeline'),
					descrition: t('reorder_pipeline_description'),
					buttontext: t('reorder'),
					onOk: (): void => setCurrentPipelines(updatedRows),
					onCancel: (): void => setCurrentPipelines(rawData),
				});
			}
		},
		[
			currentPipelines,
			isEditingActionMode,
			visibleCurrPipelines,
			handleAlert,
			t,
			setCurrentPipelines,
		],
	);

	const expandedRowView = useCallback(
		(): JSX.Element => (
			<PipelineExpanView
				handleAlert={handleAlert}
				isActionMode={isActionMode}
				setActionType={setActionType}
				processorEditAction={processorEditAction}
				expandedPipelineData={expandedPipelineData()}
				setExpandedPipelineData={setExpandedPipelineData}
				prevPipelineData={savedPipelines}
			/>
		),
		[
			handleAlert,
			processorEditAction,
			isActionMode,
			expandedPipelineData,
			setActionType,
			savedPipelines,
			setExpandedPipelineData,
		],
	);

	const onExpand = useCallback(
		(expanded: boolean, record: PipelineData): void => {
			const keys = [];
			if (expanded && record.id) {
				keys.push(record?.id);
			}
			setExpandedRowKeys(keys);
			setExpandedPipelineId(record.id);
		},
		[],
	);

	const getExpandIcon = (
		expanded: boolean,
		onExpand: (record: PipelineData, e: React.MouseEvent<HTMLElement>) => void,
		record: PipelineData,
	): JSX.Element => (
		<TableExpandIcon expanded={expanded} onExpand={onExpand} record={record} />
	);

	const addNewPipelineHandler = useCallback((): void => {
		setActionType(ActionType.AddPipeline);

		trackEvent('Logs: Pipelines: Clicked Add New Pipeline', {
			source: 'signoz-ui',
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [setActionType]);

	const footer = useCallback((): JSX.Element | undefined => {
		if (isEditingActionMode) {
			return (
				<FooterButton
					type="link"
					onClick={addNewPipelineHandler}
					icon={<PlusOutlined />}
				>
					{t('add_new_pipeline')}
				</FooterButton>
			);
		}
		return undefined;
	}, [isEditingActionMode, addNewPipelineHandler, t]);

	const onSaveConfigurationHandler = useCallback(async () => {
		const modifiedPipelineData = currentPipelines.map((item: PipelineData) => {
			const pipelineData = { ...item };
			delete pipelineData?.id;
			return pipelineData;
		});
		const response = await savePipeline({
			data: { pipelines: modifiedPipelineData },
		});
		if (response.statusCode === 200) {
			refetchPipelineLists();
			setActionMode(ActionMode.Viewing);

			const pipelinesInDB = response.payload?.pipelines || [];
			setCurrentPipelines(cloneDeep(pipelinesInDB));
			setSavedPipelines(cloneDeep(pipelinesInDB));

			trackEvent('Logs: Pipelines: Saved Pipelines', {
				count: pipelinesInDB.length,
				enabled: pipelinesInDB.filter((p) => p.enabled).length,
				source: 'signoz-ui',
			});
		} else {
			modifiedPipelineData.forEach((item: PipelineData) => {
				const pipelineData = item;
				pipelineData.id = v4();
				return pipelineData;
			});
			setActionMode(ActionMode.Editing);
			notifications.error({
				message: 'Error',
				description: response.error || t('something_went_wrong'),
			});
			setCurrentPipelines(cloneDeep(modifiedPipelineData));
			setSavedPipelines(cloneDeep(modifiedPipelineData));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [currentPipelines, notifications, refetchPipelineLists, setActionMode, t]);

	const onCancelConfigurationHandler = useCallback((): void => {
		setActionMode(ActionMode.Viewing);
		savedPipelines.forEach((item, index) => {
			const obj = item;
			obj.orderId = index + 1;
			if (obj.config) {
				obj.config?.forEach((configItem, index) => {
					const config = configItem;
					config.orderId = index + 1;
				});
				for (let i = 0; i < obj.config.length - 1; i += 1) {
					obj.config[i].output = obj.config[i + 1].id;
				}
			}
		});
		setCurrentPipelines(cloneDeep(savedPipelines));
		setExpandedRowKeys([]);
	}, [savedPipelines, setCurrentPipelines, setActionMode]);

	const onRowHandler = (
		_data: PipelineData,
		index?: number,
	): React.HTMLAttributes<unknown> =>
		({
			index,
			moveRow: movePipelineRow,
		} as React.HTMLAttributes<unknown>);

	const expandableConfig: ExpandableConfig<PipelineData> = {
		expandedRowKeys,
		onExpand,
		expandIcon: ({ expanded, onExpand, record }: ExpandRowConfig) =>
			getExpandIcon(expanded, onExpand, record),
	};

	return (
		<>
			{contextHolder}
			<AddNewPipeline
				isActionType={isActionType}
				setActionType={setActionType}
				selectedPipelineData={selectedPipelineData}
				setCurrPipelineData={setCurrentPipelines}
				currPipelineData={currentPipelines}
			/>
			<AddNewProcessor
				isActionType={isActionType}
				setActionType={setActionType}
				selectedProcessorData={selectedProcessorData}
				expandedPipelineData={expandedPipelineData()}
				setExpandedPipelineData={setExpandedPipelineData}
			/>
			{savedPipelines?.length > 0 || currentPipelines?.length > 0 ? (
				<>
					<PipelinesSearchSection setPipelineSearchValue={setPipelineSearchValue} />
					<Container>
						<ModeAndConfiguration
							isActionMode={isActionMode}
							version={savedPipelinesVersion}
						/>
						<DndProvider backend={HTML5Backend}>
							<Table
								rowKey="id"
								columns={columns}
								expandedRowRender={expandedRowView}
								expandable={expandableConfig}
								components={tableComponents}
								dataSource={visibleCurrPipelines}
								onRow={onRowHandler}
								footer={footer}
								pagination={false}
							/>
						</DndProvider>
						{isEditingActionMode && (
							<SaveConfigButton
								showSaveButton={!isEqual(currentPipelines, savedPipelines)}
								onSaveConfigurationHandler={onSaveConfigurationHandler}
								onCancelConfigurationHandler={onCancelConfigurationHandler}
							/>
						)}
					</Container>
				</>
			) : (
				<Container>
					<PipelinesListEmptyState />
				</Container>
			)}
		</>
	);
}

interface PipelineListsViewProps {
	isActionType: string;
	setActionType: (actionType?: ActionType) => void;
	isActionMode: string;
	setActionMode: (actionMode: ActionMode) => void;
	savedPipelinesVersion: number | string;
	savedPipelines: Array<PipelineData>;
	setSavedPipelines: (value: React.SetStateAction<Array<PipelineData>>) => void;
	currentPipelines: Array<PipelineData>;
	setCurrentPipelines: (
		value: React.SetStateAction<Array<PipelineData>>,
	) => void;
	refetchPipelineLists: VoidFunction;
}

interface ExpandRowConfig {
	expanded: boolean;
	onExpand: (record: PipelineData, e: React.MouseEvent<HTMLElement>) => void;
	record: PipelineData;
}

export interface AlertMessage {
	title: string;
	descrition: string;
	buttontext: string;
	onOk: VoidFunction;
	onCancel?: VoidFunction;
}

export default PipelineListsView;
