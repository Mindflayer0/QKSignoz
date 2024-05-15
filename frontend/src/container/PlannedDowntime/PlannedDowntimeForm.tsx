import './PlannedDowntime.styles.scss';
import 'dayjs/locale/en';

import { CheckOutlined } from '@ant-design/icons';
import {
	Button,
	DatePicker,
	Divider,
	Form,
	FormInstance,
	Input,
	Modal,
	Select,
	Spin,
	Typography,
} from 'antd';
import { DefaultOptionType } from 'antd/es/select';
import { SelectProps } from 'antd/lib';
import {
	DowntimeSchedules,
	Recurrence,
} from 'api/plannedDowntime/getAllDowntimeSchedules';
import { DowntimeScheduleUpdatePayload } from 'api/plannedDowntime/updateDowntimeSchedule';
import {
	ModalButtonWrapper,
	ModalTitle,
} from 'container/PipelinePage/PipelineListsView/styles';
import dayjs from 'dayjs';
import { useNotifications } from 'hooks/useNotifications';
import { defaultTo } from 'lodash-es';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import {
	DropdownWithSubMenu,
	Option,
	recurrenceOption,
} from './DropdownWithSubMenu/DropdownWithSubMenu';
import { AlertRuleTags } from './PlannedDowntimeList';
import {
	createEditDowntimeSchedule,
	getAlertOptionsFromIds,
} from './PlannedDowntimeutils';

interface PlannedDowntimeFormData {
	name: string;
	startTime: dayjs.Dayjs | string;
	endTime: dayjs.Dayjs | string;
	recurrence?: Recurrence | null;
	alertRules: DefaultOptionType[];
	recurrenceSelect?: Recurrence;
}

const customFormat = 'Do MMMM, YYYY ⎯ HH:mm:ss';

interface PlannedDowntimeFormProps {
	initialValues: Partial<
		DowntimeSchedules & {
			editMode: boolean;
		}
	>;
	alertOptions: DefaultOptionType[];
	isError: boolean;
	isLoading: boolean;
	isOpen: boolean;
	setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
	refetchAllSchedules: () => void;
	isEditMode: boolean;
	form: FormInstance<any>;
}

export function PlannedDowntimeForm(
	props: PlannedDowntimeFormProps,
): JSX.Element {
	const {
		initialValues,
		alertOptions,
		isError,
		isLoading,
		isOpen,
		setIsOpen,
		refetchAllSchedules,
		isEditMode,
		form,
	} = props;

	dayjs.locale('en');
	const [selectedTags, setSelectedTags] = React.useState<
		DefaultOptionType | DefaultOptionType[]
	>([]);
	const alertRuleFormName = 'alertRules';
	const [saveLoading, setSaveLoading] = useState(false);

	const { notifications } = useNotifications();

	const datePickerFooter = (mode: any): any =>
		mode === 'time' ? (
			<span style={{ color: 'gray' }}>Please select the time</span>
		) : null;

	const saveHanlder = useCallback(
		async (values: PlannedDowntimeFormData) => {
			const formatDate = (date: string | dayjs.Dayjs): string =>
				dayjs(date).format('YYYY-MM-DDTHH:mm:ss[Z]');

			const createEditProps: DowntimeScheduleUpdatePayload = {
				data: {
					alertIds: values.alertRules
						.map((alert) => alert.value)
						.filter((alert) => alert !== undefined) as string[],
					name: values.name,
					schedule: {
						startTime: formatDate(values.startTime),
						timezone: 'Asia/Kolkata', // todo
						endTime: formatDate(values.endTime) ?? undefined,
						recurrence: values.recurrence as Recurrence,
					},
				},
				id: isEditMode ? initialValues.id : undefined,
			};

			setSaveLoading(true);
			try {
				const response = await createEditDowntimeSchedule({ ...createEditProps });

				if (response.statusCode === 200) {
					notifications.success({
						message: 'Success',
						description: 'created',
					});
					refetchAllSchedules();
				} else {
					notifications.error({
						message: 'Error',
						description: response.error || 'unexpected_error',
					});
				}
			} catch (e) {
				notifications.error({
					message: 'Error',
					description: 'unexpected_error',
				});
			}
			setSaveLoading(false);
		},
		[initialValues.id, isEditMode, notifications, refetchAllSchedules],
	);
	const onFinish = async (values: PlannedDowntimeFormData): Promise<void> => {
		const recurrenceData: Recurrence | undefined =
			(values?.recurrenceSelect?.repeatType as Option)?.value === 'does-not-repeat'
				? undefined
				: {
						duration: '1h',
						endTime: values.endTime as string,
						startTime: values.startTime as string,
						repeatOn: !values?.recurrenceSelect?.repeatOn?.length
							? undefined
							: values?.recurrenceSelect?.repeatOn,
						repeatType: (values?.recurrenceSelect?.repeatType as Option)?.value,
				  };
		console.log('here-recurrence=change', recurrenceData);

		const payloadValues = { ...values, recurrence: recurrenceData };
		await saveHanlder(payloadValues);
	};

	const formValidationRules = [
		{
			required: true,
		},
	];

	const handleOk = async (): Promise<void> => {
		try {
			await form.validateFields();
			setIsOpen(false);
		} catch (error) {
			// error
		}
	};

	const handleCancel = (): void => {
		setIsOpen(false);
	};

	const handleChange = (
		value: string,
		options: DefaultOptionType | DefaultOptionType[],
	): void => {
		console.log(options, value);
		form.setFieldValue(alertRuleFormName, options);
		setSelectedTags(options);
	};

	const noTagRenderer: SelectProps['tagRender'] = () => (
		// eslint-disable-next-line react/jsx-no-useless-fragment
		<></>
	);

	const handleClose = (removedTag: DefaultOptionType['value']): void => {
		if (!removedTag) {
			return;
		}
		const newTags = selectedTags.filter(
			(tag: DefaultOptionType) => tag.value !== removedTag,
		);
		console.log(newTags);
		form.setFieldValue(alertRuleFormName, newTags);
		setSelectedTags(newTags);
	};

	const formatedInitialValues = useMemo(() => {
		const formData: PlannedDowntimeFormData = {
			name: defaultTo(initialValues.name, ''),
			alertRules: getAlertOptionsFromIds(
				initialValues.alertIds || [],
				alertOptions,
			),
			endTime: initialValues.schedule?.endTime
				? dayjs(initialValues.schedule?.endTime)
				: '',
			startTime: initialValues.schedule?.startTime
				? dayjs(initialValues.schedule?.startTime)
				: '',
			recurrenceSelect: initialValues.schedule?.recurrence
				? initialValues.schedule?.recurrence
				: { repeatType: { label: 'Does not repeat', value: 'does-not-repeat' } },
			recurrence: initialValues.schedule?.recurrence,
		};
		return formData;
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [initialValues]);

	useEffect(() => {
		setSelectedTags(formatedInitialValues.alertRules);
		form.setFieldsValue({ ...formatedInitialValues });
	}, [form, formatedInitialValues, initialValues]);

	const onFormChange = (value: Partial<PlannedDowntimeFormData>): void => {
		if (value.startTime) {
			console.log(value.startTime);
		}
		console.log('here', form.getFieldsValue());
	};

	return (
		<Modal
			title={
				<ModalTitle level={4}>
					{isEditMode ? 'Edit planned downtime' : 'New planned downtime'}
				</ModalTitle>
			}
			centered
			open={isOpen}
			className="createDowntimeModal"
			width={384}
			onCancel={handleCancel}
			footer={null}
		>
			<Divider plain />
			<Form<PlannedDowntimeFormData>
				name={initialValues.editMode ? 'edit-form' : 'create-form'}
				form={form}
				layout="vertical"
				className="createForm"
				onFinish={onFinish}
				onValuesChange={onFormChange}
				autoComplete="off"
			>
				<Form.Item
					label="Name"
					name="name"
					required={false}
					rules={formValidationRules}
				>
					<Input placeholder="e.g. Upgrade downtime" />
				</Form.Item>
				<Form.Item
					label="Starts from"
					name="startTime"
					required={false}
					rules={formValidationRules}
					className="formItemWithBullet"
				>
					<DatePicker
						format={customFormat}
						showTime
						renderExtraFooter={datePickerFooter}
						popupClassName="datePicker"
					/>
				</Form.Item>
				<Form.Item
					label="Ends on"
					name="endTime"
					required={false}
					rules={formValidationRules}
					className="formItemWithBullet"
				>
					<DatePicker
						format={customFormat}
						showTime
						renderExtraFooter={datePickerFooter}
						popupClassName="datePicker"
					/>
				</Form.Item>
				<Form.Item
					label="Repeats every"
					name="recurrenceSelect"
					required={false}
					rules={formValidationRules}
				>
					<DropdownWithSubMenu options={recurrenceOption} form={form} />
				</Form.Item>
				<Form.Item
					label="Duration"
					name="duration"
					required={false}
					rules={formValidationRules}
				>
					<Input
						addonAfter={
							<Select defaultValue="m">
								<Select.Option value="m">Min</Select.Option>
								<Select.Option value="h">Hour</Select.Option>
							</Select>
						}
						className="duration-input"
						type="number"
						placeholder="Enter duration"
						min={0}
						onWheel={(e): void => e.currentTarget.blur()}
					/>
				</Form.Item>
				<div>
					<Typography style={{ marginBottom: 8 }}>Silence Alerts</Typography>
					<Form.Item noStyle shouldUpdate>
						<AlertRuleTags
							closable
							selectedTags={selectedTags}
							handleClose={handleClose}
						/>
					</Form.Item>
					<Form.Item name={alertRuleFormName}>
						<Select
							placeholder="Search for alerts rules or groups..."
							mode="multiple"
							status={isError ? 'error' : undefined}
							loading={isLoading}
							tagRender={noTagRenderer}
							onChange={handleChange}
							options={alertOptions}
							notFoundContent={
								isLoading ? (
									<span>
										<Spin size="small" /> Loading...
									</span>
								) : (
									<span>No alert available.</span>
								)
							}
						>
							{alertOptions?.map((option) => (
								<Select.Option key={option.value} value={option.value}>
									{option.label}
								</Select.Option>
							))}
						</Select>
					</Form.Item>
				</div>
				<Form.Item style={{ marginBottom: 0 }}>
					<ModalButtonWrapper>
						<Button
							key="submit"
							type="primary"
							htmlType="submit"
							icon={<CheckOutlined />}
							onClick={handleOk}
							loading={saveLoading || isLoading}
						>
							{isEditMode ? 'Update downtime schedule' : 'Add downtime schedule'}
						</Button>
					</ModalButtonWrapper>
				</Form.Item>
			</Form>
		</Modal>
	);
}
