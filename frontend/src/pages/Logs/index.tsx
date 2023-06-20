import { Button, Col, Divider, Popover, Row, Select, Space } from 'antd';
import LogControls from 'container/LogControls';
import LogDetailedView from 'container/LogDetailedView';
import LogLiveTail from 'container/LogLiveTail';
import LogsAggregate from 'container/LogsAggregate';
import LogsFilters from 'container/LogsFilters';
import LogsSearchFilter from 'container/LogsSearchFilter';
import LogsTable from 'container/LogsTable';
import history from 'lib/history';
import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dispatch } from 'redux';
import { AppState } from 'store/reducers';
import AppActions from 'types/actions';
import { SET_DETAILED_LOG_DATA, SET_LOGS_ORDER } from 'types/actions/logs';
import { ILog } from 'types/api/logs/log';
import ILogsReducer from 'types/reducer/logs';

import { defaultSelectStyle, logsOptions } from './config';
import { useSelectedLogView } from './hooks';
import PopoverContent from './PopoverContent';
import SpaceContainer from './styles';

function Logs(): JSX.Element {
	const dispatch = useDispatch<Dispatch<AppActions>>();
	const { order } = useSelector<AppState, ILogsReducer>((store) => store.logs);

	const showExpandedLog = useCallback(
		(logData: ILog) => {
			dispatch({
				type: SET_DETAILED_LOG_DATA,
				payload: logData,
			});
		},
		[dispatch],
	);

	const {
		viewModeOptionList,
		viewModeOption,
		viewMode,
		handleViewModeOptionChange,
		linesPerRow,
		handleLinesPerRowChange,
	} = useSelectedLogView();

	const renderPopoverContent = useCallback(
		() => (
			<PopoverContent
				linesPerRow={linesPerRow}
				handleLinesPerRowChange={handleLinesPerRowChange}
			/>
		),
		[linesPerRow, handleLinesPerRowChange],
	);

	const isFormatButtonVisible = useMemo(() => logsOptions.includes(viewMode), [
		viewMode,
	]);

	const selectedViewModeOption = useMemo(() => viewModeOption.value.toString(), [
		viewModeOption.value,
	]);

	const onChangeVeiwMode = useCallback(
		(key: string) => {
			handleViewModeOptionChange({
				key,
			});
		},
		[handleViewModeOptionChange],
	);

	const handleChangeOrder = (value: 'asc' | 'desc'): void => {
		dispatch({
			type: SET_LOGS_ORDER,
			payload: value,
		});
		const params = new URLSearchParams(window.location.search);
		params.set('order', value);
		history.push({ search: params.toString() });
	};

	return (
		<>
			<SpaceContainer
				split={<Divider type="vertical" />}
				align="center"
				direction="horizontal"
			>
				<LogsSearchFilter />
				<LogLiveTail />
			</SpaceContainer>

			<LogsAggregate />

			<Row gutter={20} wrap={false}>
				<LogsFilters />
				<Col flex={1}>
					<Row>
						<Col flex={1}>
							<Space align="baseline" direction="horizontal">
								<Select
									style={defaultSelectStyle}
									value={selectedViewModeOption}
									onChange={onChangeVeiwMode}
								>
									{viewModeOptionList.map((option) => (
										<Select.Option key={option.value}>{option.label}</Select.Option>
									))}
								</Select>

								{isFormatButtonVisible && (
									<Popover placement="right" content={renderPopoverContent}>
										<Button>Format</Button>
									</Popover>
								)}

								<Select
									style={defaultSelectStyle}
									defaultValue={order}
									onChange={handleChangeOrder}
								>
									<Select.Option key="desc">Descending</Select.Option>
									<Select.Option key="asc">Ascending</Select.Option>
								</Select>
							</Space>
						</Col>

						<Col>
							<LogControls />
						</Col>
					</Row>

					<LogsTable
						viewMode={viewMode}
						linesPerRow={linesPerRow}
						onClickExpand={showExpandedLog}
					/>
				</Col>
			</Row>

			<LogDetailedView />
		</>
	);
}

export default Logs;
