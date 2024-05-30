import { TableProps } from 'antd';
import { LogsExplorerTableProps } from 'container/LogsExplorerTable/LogsExplorerTable.interfaces';
import {
	ThresholdOperators,
	ThresholdProps,
} from 'container/NewWidget/RightContainer/Threshold/types';
import { RowData } from 'lib/query/createTableColumnsFromQuery';
import { SORT_TYPES } from 'types/api/dashboard/getAll';
import { Query } from 'types/api/queryBuilder/queryBuilderData';

export type GridTableComponentProps = {
	query: Query;
	thresholds?: ThresholdProps[];
	tableProcessedDataRef?: React.MutableRefObject<RowData[]>;
	sortColumns?: SORT_TYPES;
} & Pick<LogsExplorerTableProps, 'data'> &
	Omit<TableProps<RowData>, 'columns' | 'dataSource'>;

export type RequiredThresholdProps = Omit<
	ThresholdProps,
	'thresholdTableOptions' | 'thresholdOperator' | 'thresholdValue'
> & {
	thresholdTableOptions: string;
	thresholdOperator: ThresholdOperators;
	thresholdValue: number;
};
