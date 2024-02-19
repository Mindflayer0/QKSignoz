import { SelectProps } from 'antd';
import { DataSource } from 'types/common/queryBuilder';

export type QueryLabelProps = {
	onChange: (value: DataSource) => void;
	isDashboardPanel?: boolean;
} & Omit<SelectProps, 'onChange'>;
