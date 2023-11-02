import './WidgetFullView.styles.scss';

import { Button } from 'antd';
import { ToggleGraphProps } from 'components/Graph/types';
import Spinner from 'components/Spinner';
import TimePreference from 'components/TimePreferenceDropDown';
import GridPanelSwitch from 'container/GridPanelSwitch';
import {
	timeItems,
	timePreferance,
} from 'container/NewWidget/RightContainer/timeItems';
import { useGetQueryRange } from 'hooks/queryBuilder/useGetQueryRange';
import { useStepInterval } from 'hooks/queryBuilder/useStepInterval';
import { useChartMutable } from 'hooks/useChartMutable';
import { useIsDarkMode } from 'hooks/useDarkMode';
import { getDashboardVariables } from 'lib/dashbaordVariables/getDashboardVariables';
import {
	getUPlotChartData,
	getUPlotChartOptions,
} from 'lib/uPlotLib/getUplotChartData';
import { useDashboard } from 'providers/Dashboard/Dashboard';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { GlobalReducer } from 'types/reducer/globalTime';
import uPlot from 'uplot';

import { PANEL_TYPES_VS_FULL_VIEW_TABLE } from './contants';
import GraphManager from './GraphManager';
// import GraphManager from './GraphManager';
import { GraphContainer, TimeContainer } from './styles';
import { FullViewProps } from './types';

function FullView({
	widget,
	fullViewOptions = true,
	onClickHandler,
	name,
	yAxisUnit,
	onDragSelect,
	isDependedDataLoaded = false,
	graphsVisibilityStates,
	onToggleModelHandler,
	parentChartRef,
}: FullViewProps): JSX.Element {
	const { selectedTime: globalSelectedTime } = useSelector<
		AppState,
		GlobalReducer
	>((state) => state.globalTime);

	const fullViewRef = useRef<HTMLDivElement>(null);

	const [chartOptions, setChartOptions] = useState<uPlot.Options>();

	const { selectedDashboard } = useDashboard();

	const getSelectedTime = useCallback(
		() =>
			timeItems.find((e) => e.enum === (widget?.timePreferance || 'GLOBAL_TIME')),
		[widget],
	);

	const lineChartRef = useRef<ToggleGraphProps>();

	const [selectedTime, setSelectedTime] = useState<timePreferance>({
		name: getSelectedTime()?.name || '',
		enum: widget?.timePreferance || 'GLOBAL_TIME',
	});

	const updatedQuery = useStepInterval(widget?.query);

	const response = useGetQueryRange(
		{
			selectedTime: selectedTime.enum,
			graphType: widget.panelTypes,
			query: updatedQuery,
			globalSelectedInterval: globalSelectedTime,
			variables: getDashboardVariables(selectedDashboard?.data.variables),
		},
		{
			queryKey: `FullViewGetMetricsQueryRange-${selectedTime.enum}-${globalSelectedTime}-${widget.id}`,
			enabled: !isDependedDataLoaded,
		},
	);

	const canModifyChart = useChartMutable({
		panelType: widget.panelTypes,
		panelTypeAndGraphManagerVisibility: PANEL_TYPES_VS_FULL_VIEW_TABLE,
	});

	const chartData = getUPlotChartData(response?.data?.payload);

	const isDarkMode = useIsDarkMode();

	useEffect(() => {
		if (!response.isFetching) {
			const width = fullViewRef.current?.clientWidth
				? fullViewRef.current.clientWidth - 50
				: 700;

			const height = fullViewRef.current?.clientWidth
				? fullViewRef.current.clientHeight
				: 300;

			const newChartOptions = getUPlotChartOptions({
				yAxisUnit: yAxisUnit || '',
				apiResponse: response.data?.payload,
				dimensions: {
					height,
					width,
				},
				isDarkMode,
				onDragSelect,
			});

			setChartOptions(newChartOptions);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [response.isFetching]);

	useEffect(() => {
		if (!response.isFetching && lineChartRef.current) {
			graphsVisibilityStates?.forEach((e, i) => {
				lineChartRef.current?.toggleGraph(i, e);
				parentChartRef?.current?.toggleGraph(i, e);
			});
		}
	}, [graphsVisibilityStates, response.isFetching, parentChartRef]);

	if (response.isFetching) {
		return <Spinner height="100%" size="large" tip="Loading..." />;
	}

	return (
		<div className="full-view-container">
			<div className="full-view-header-container">
				{fullViewOptions && (
					<TimeContainer $panelType={widget.panelTypes}>
						<TimePreference
							selectedTime={selectedTime}
							setSelectedTime={setSelectedTime}
						/>
						<Button
							onClick={(): void => {
								response.refetch();
							}}
							type="primary"
						>
							Refresh
						</Button>
					</TimeContainer>
				)}
			</div>

			{chartOptions && (
				<>
					<div className="graph-container" ref={fullViewRef}>
						<GraphContainer
							style={{ height: '90%' }}
							isGraphLegendToggleAvailable={canModifyChart}
						>
							{chartOptions && (
								<GridPanelSwitch
									panelType={widget.panelTypes}
									data={chartData}
									options={chartOptions}
									onClickHandler={onClickHandler}
									name={name}
									yAxisUnit={yAxisUnit}
									onDragSelect={onDragSelect}
									panelData={response.data?.payload.data.newResult.data.result || []}
									query={widget.query}
									ref={lineChartRef}
								/>
							)}
						</GraphContainer>
					</div>

					{canModifyChart && (
						<GraphManager
							data={chartData}
							name={name}
							options={chartOptions}
							yAxisUnit={yAxisUnit}
							onToggleModelHandler={onToggleModelHandler}
							// setGraphsVisibilityStates={setGraphsVisibilityStates}
							// graphsVisibilityStates={graphsVisibilityStates}
							lineChartRef={lineChartRef}
							parentChartRef={parentChartRef}
						/>
					)}
				</>
			)}
		</div>
	);
}

FullView.defaultProps = {
	fullViewOptions: undefined,
	onClickHandler: undefined,
	yAxisUnit: undefined,
	onDragSelect: undefined,
	isDependedDataLoaded: undefined,
};

FullView.displayName = 'FullView';

export default FullView;
