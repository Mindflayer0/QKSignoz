import { Button, Divider, Form, Modal } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import AppReducer from 'types/reducer/app';
import { v4 as uuid } from 'uuid';

import { ActionMode, ActionType } from '../../Layouts';
import { ModalButtonWrapper, ModalTitle } from '../styles';
import { PipelineColumn } from '../types';
import { getEditedDataSource, getRecordIndex } from '../utils';
import { renderPipelineForm } from './utils';

function AddNewPipeline({
	isActionType,
	setActionType,
	selectedPipelineData,
	setShowSaveButton,
	setCurrPipelineData,
	currPipelineData,
}: AddNewPipelineProps): JSX.Element {
	const [form] = Form.useForm();
	const { t } = useTranslation('pipeline');
	const { user } = useSelector<AppState, AppReducer>((state) => state.app);
	const [count, setCount] = useState(3);
	const [tagsListData, setTagsListData] = useState<PipelineColumn['tags']>();

	const isEdit = useMemo(() => isActionType === 'edit-pipeline', [isActionType]);
	const isAdd = useMemo(() => isActionType === 'add-pipeline', [isActionType]);

	useEffect(() => {
		if (isEdit) {
			setTagsListData(selectedPipelineData?.tags);
			form.setFieldsValue(selectedPipelineData);
		}
		if (isAdd) {
			form.resetFields();
			setTagsListData([]);
		}
	}, [form, isEdit, isAdd, selectedPipelineData]);

	const onFinish = (values: PipelineColumn): void => {
		const newPipeLineData: PipelineColumn = {
			orderid: count,
			uuid: uuid(),
			createdAt: new Date().toISOString(),
			createdBy: {
				username: user?.name || '',
				email: user?.email || '',
			},
			updatedAt: new Date().toISOString(),
			updatedBy: {
				username: user?.name || '',
				email: user?.email || '',
			},
			name: values.name,
			alias: values.alias,
			filter: values.filter,
			tags: tagsListData || [],
			operators: [],
			enabled: false,
			version: '1',
		};

		if (isEdit && selectedPipelineData) {
			const findRecordIndex = getRecordIndex(
				currPipelineData,
				selectedPipelineData,
				'name',
			);
			const updatedPipelineData: PipelineColumn = {
				...currPipelineData[findRecordIndex],
				name: values.name,
				alias: values.alias,
				filter: values.filter,
				tags: tagsListData || [],
			};

			const editedPipelineData = getEditedDataSource(
				currPipelineData,
				selectedPipelineData,
				'name',
				updatedPipelineData,
			);

			setCurrPipelineData(editedPipelineData);
		}
		if (isAdd) {
			setTagsListData([]);
			setCount((prevState) => prevState + 1);
			setCurrPipelineData((prevState) => [...prevState, newPipeLineData]);
		}
		setActionType(undefined);
	};

	const onCancelModalHandler = (): void => {
		setActionType(undefined);
	};

	const modalTitle = useMemo(
		(): string =>
			isEdit
				? `${t('edit_pipeline')} : ${selectedPipelineData?.name}`
				: t('create_pipeline'),
		[isEdit, selectedPipelineData?.name, t],
	);

	const onOkModalHandler = useCallback(
		() => setShowSaveButton(ActionMode.Editing),
		[setShowSaveButton],
	);

	const isOpen = useMemo(() => isEdit || isAdd, [isAdd, isEdit]);

	return (
		<Modal
			title={<ModalTitle level={4}>{modalTitle}</ModalTitle>}
			centered
			open={isOpen}
			width={800}
			footer={null}
			onCancel={onCancelModalHandler}
		>
			<Divider plain />
			<Form
				name="addNewPipeline"
				layout="vertical"
				onFinish={onFinish}
				autoComplete="off"
				form={form}
			>
				{renderPipelineForm(setTagsListData, tagsListData)}
				<Divider plain />
				<Form.Item>
					<ModalButtonWrapper>
						<Button
							key="submit"
							type="primary"
							htmlType="submit"
							onClick={onOkModalHandler}
						>
							{isEdit ? t('update') : t('create')}
						</Button>
						<Button key="cancel" onClick={onCancelModalHandler}>
							{t('cancel')}
						</Button>
					</ModalButtonWrapper>
				</Form.Item>
			</Form>
		</Modal>
	);
}

interface AddNewPipelineProps {
	isActionType: string;
	setActionType: (actionType?: ActionType) => void;
	selectedPipelineData: PipelineColumn | undefined;
	setShowSaveButton: (actionMode: ActionMode) => void;
	setCurrPipelineData: (
		value: React.SetStateAction<Array<PipelineColumn>>,
	) => void;
	currPipelineData: Array<PipelineColumn>;
}

export default AddNewPipeline;
