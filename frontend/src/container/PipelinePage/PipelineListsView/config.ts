import { ColumnGroupType, ColumnType } from 'antd/lib/table/interface';
import {
	HistoryData,
	PipelineData,
	ProcessorData,
} from 'types/api/pipeline/def';

import DeploymentStage from '../Layouts/ChangeHistory/DeploymentStage';
import DeploymentTime from '../Layouts/ChangeHistory/DeploymentTime';
import DescriptionTextArea from './AddNewPipeline/FormFields/DescriptionTextArea';
import NameInput from './AddNewPipeline/FormFields/NameInput';

export const pipelineFields = [
	{
		id: 1,
		fieldName: 'Filter',
		placeholder: 'search_pipeline_placeholder',
		name: 'filter',
		component: NameInput,
	},
	{
		id: 2,
		fieldName: 'Name',
		placeholder: 'pipeline_name_placeholder',
		name: 'name',
		component: NameInput,
	},
	{
		id: 4,
		fieldName: 'Description',
		placeholder: 'pipeline_description_placeholder',
		name: 'description',
		component: DescriptionTextArea,
	},
];

export const tagInputStyle: React.CSSProperties = {
	width: 78,
	verticalAlign: 'top',
	flex: 1,
};

export const pipelineColumns: Array<
	ColumnType<PipelineData> | ColumnGroupType<PipelineData>
> = [
	{
		key: 'orderId',
		title: '',
		dataIndex: 'orderId',
	},
	{
		key: 'name',
		title: 'Pipeline Name',
		dataIndex: 'name',
	},
	{
		key: 'filter',
		title: 'Filters',
		dataIndex: 'filter',
	},

	{
		key: 'createdAt',
		title: 'Last Edited',
		dataIndex: 'createdAt',
	},
	{
		key: 'createdBy',
		title: 'Edited By',
		dataIndex: 'createdBy',
	},
];

export const processorColumns: Array<
	ColumnType<ProcessorData> | ColumnGroupType<ProcessorData>
> = [
	{
		key: 'id',
		title: '',
		dataIndex: 'orderId',
		width: 142,
	},
	{
		key: 'name',
		title: '',
		dataIndex: 'name',
	},
];

export const changeHistoryColumns: Array<
	ColumnType<HistoryData> | ColumnGroupType<HistoryData>
> = [
	{
		key: 'version',
		title: 'Version',
		dataIndex: 'version',
	},
	{
		title: 'Deployment Stage',
		key: 'deployStatus',
		dataIndex: 'deployStatus',
		render: DeploymentStage,
	},
	{
		key: 'deployResult',
		title: 'Last Deploy Message',
		dataIndex: 'deployResult',
		ellipsis: true,
	},
	{
		key: 'createdAt',
		title: 'Last Deployed Time',
		dataIndex: 'createdAt',
		render: DeploymentTime,
	},
	{
		key: 'createdByName',
		title: 'Edited by',
		dataIndex: 'createdByName',
	},
];

export const formValidationRules = [
	{
		required: true,
	},
];
