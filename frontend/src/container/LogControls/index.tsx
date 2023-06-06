import {
	CloudDownloadOutlined,
	FastBackwardOutlined,
	LeftOutlined,
	RightOutlined,
} from '@ant-design/icons';
import { Button, Divider, Dropdown, MenuProps, Select } from 'antd';
import { getGlobalTime } from 'container/LogsSearchFilter/utils';
import { getMinMax } from 'container/TopNav/AutoRefresh/config';
import { defaultSelectStyle } from 'pages/Logs/config';
import * as Papa from 'papaparse';
import { memo, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { AppState } from 'store/reducers';
import AppActions from 'types/actions';
import {
	GET_NEXT_LOG_LINES,
	GET_PREVIOUS_LOG_LINES,
	RESET_ID_START_AND_END,
	SET_LOG_LINES_PER_PAGE,
} from 'types/actions/logs';
import { ILog } from 'types/api/logs/log';
import { GlobalReducer } from 'types/reducer/globalTime';
import { ILogsReducer } from 'types/reducer/logs';

import { ITEMS_PER_PAGE_OPTIONS } from './config';
import { Container, DownloadLogButton } from './styles';

function LogControls(): JSX.Element | null {
	const {
		logLinesPerPage,
		liveTail,
		isLoading: isLogsLoading,
		isLoadingAggregate,
		logs,
	} = useSelector<AppState, ILogsReducer>((state) => state.logs);
	const globalTime = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);

	const dispatch = useDispatch<Dispatch<AppActions>>();

	const handleLogLinesPerPageChange = (e: number): void => {
		dispatch({
			type: SET_LOG_LINES_PER_PAGE,
			payload: {
				logsLinesPerPage: e,
			},
		});
	};

	const handleGoToLatest = (): void => {
		const { maxTime, minTime } = getMinMax(
			globalTime.selectedTime,
			globalTime.minTime,
			globalTime.maxTime,
		);

		const updatedGlobalTime = getGlobalTime(globalTime.selectedTime, {
			maxTime,
			minTime,
		});

		if (updatedGlobalTime) {
			dispatch({
				type: RESET_ID_START_AND_END,
				payload: updatedGlobalTime,
			});
		}
	};

	const handleNavigatePrevious = (): void => {
		dispatch({
			type: GET_PREVIOUS_LOG_LINES,
		});
	};

	const handleNavigateNext = (): void => {
		dispatch({
			type: GET_NEXT_LOG_LINES,
		});
	};

	const flattenObject = useCallback(
		(obj: ILog) =>
			Object.entries(obj).reduce((flattenedObj, [key, value]) => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				const updatedObj: any = { ...flattenedObj };
				if (typeof value === 'object' && value !== null) {
					updatedObj[key] = JSON.stringify(value);
				} else {
					updatedObj[key] = value;
				}
				return updatedObj;
			}, {}),
		[],
	);

	const downloadExcelFile = useCallback((): void => {
		console.log('Write a code here for excel download');
	}, []);

	const downloadCsvFile = useCallback((): void => {
		const flattenLogData = logs.map((entry) => flattenObject(entry));
		const csv = Papa.unparse(flattenLogData);
		const csvBlob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
		const csvUrl = URL.createObjectURL(csvBlob);
		const downloadLink = document.createElement('a');
		downloadLink.href = csvUrl;
		downloadLink.download = 'log_data.csv';
		downloadLink.click();
	}, [flattenObject, logs]);

	const menu: MenuProps = useMemo(
		() => ({
			items: [
				{
					key: 'download-as-excel',
					label: 'Excel',
					onClick: downloadExcelFile,
				},
				{
					key: 'download-as-csv',
					label: 'CSV',
					onClick: downloadCsvFile,
				},
			],
		}),
		[downloadCsvFile, downloadExcelFile],
	);

	const isLoading = isLogsLoading || isLoadingAggregate;

	const isNextAndPreviousDisabled = useMemo(
		() =>
			isLoading ||
			logLinesPerPage === 0 ||
			logs.length === 0 ||
			logs.length < logLinesPerPage,
		[isLoading, logLinesPerPage, logs.length],
	);

	if (liveTail !== 'STOPPED') {
		return null;
	}

	return (
		<Container>
			<Dropdown menu={menu} trigger={['click']}>
				<DownloadLogButton loading={isLoading} size="small" type="link">
					<CloudDownloadOutlined />
					Download
				</DownloadLogButton>
			</Dropdown>
			<Button
				loading={isLoading}
				size="small"
				type="link"
				onClick={handleGoToLatest}
			>
				<FastBackwardOutlined /> Go to latest
			</Button>
			<Divider type="vertical" />
			<Button
				loading={isLoading}
				size="small"
				type="link"
				disabled={isNextAndPreviousDisabled}
				onClick={handleNavigatePrevious}
			>
				<LeftOutlined /> Previous
			</Button>
			<Button
				loading={isLoading}
				size="small"
				type="link"
				disabled={isNextAndPreviousDisabled}
				onClick={handleNavigateNext}
			>
				Next <RightOutlined />
			</Button>
			<Select
				style={defaultSelectStyle}
				loading={isLoading}
				value={logLinesPerPage}
				onChange={handleLogLinesPerPageChange}
			>
				{ITEMS_PER_PAGE_OPTIONS.map((count) => (
					<Select.Option
						key={count}
						value={count}
					>{`${count} / page`}</Select.Option>
				))}
			</Select>
		</Container>
	);
}

export default memo(LogControls);
