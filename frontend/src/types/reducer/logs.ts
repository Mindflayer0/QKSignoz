import { LogViewMode } from 'container/LogsTable';
import { ILogQLParsedQueryItem } from 'lib/logql/types';
import { IFields } from 'types/api/logs/fields';
import { TLogsLiveTailState } from 'types/api/logs/liveTail';
import { ILog } from 'types/api/logs/log';
import { ILogsAggregate } from 'types/api/logs/logAggregate';

export interface ILogsReducer {
	fields: IFields;
	searchFilter: {
		queryString: string;
		parsedQuery: ILogQLParsedQueryItem[];
	};
	logs: ILog[];
	logLinesPerPage: number;
	linesPerRow: number;
	viewMode: LogViewMode;
	idEnd: string;
	idStart: string;
	isLoading: boolean;
	isLoadingAggregate: boolean;
	logsAggregate: ILogsAggregate[];
	selectedLogId: string | null;
	detailedLog: null | ILog;
	liveTail: TLogsLiveTailState;
	liveTailStartRange: number; // time in minutes
	order: 'desc' | 'asc';
}

export default ILogsReducer;
