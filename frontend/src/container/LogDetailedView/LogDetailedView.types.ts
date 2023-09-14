import { MetricsType } from 'container/MetricsApplication/constant';

export interface BodyTitleRendererProps {
	title: string;
	nodeKey: string;
	value: unknown;
	parentIsArray?: boolean;
}

export type AnyObject = { [key: string]: any };

export interface FieldRendererProps {
	field: string;
}

export interface IFieldAttributes {
	dataType?: string;
	newField?: string;
	logType?: MetricsType;
}
