import { Button, Select as DefaultSelect } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';

import { getDefaultOption, getOptions, Time } from './config';
import { Container, Form, FormItem, Typography } from './styles';
const { Option } = DefaultSelect;
import get from 'api/browser/localstorage/get';
import set from 'api/browser/localstorage/set';
import { LOCAL_STORAGE } from 'constants/localStorage';
import moment from 'moment';
import { connect, useSelector } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { GlobalTimeLoading, UpdateTimeInterval } from 'store/actions';
import { AppState } from 'store/reducers';
import AppActions from 'types/actions';
import { GlobalReducer } from 'types/reducer/globalTime';

import CustomDateTimeModal, { DateTimeRangeType } from '../CustomDateTimeModal';

const DateTimeSelection = ({
	location,
	updateTimeInterval,
	globalTimeLoading,
}: Props): JSX.Element => {
	const [form_dtselector] = Form.useForm();
	const [startTime, setStartTime] = useState<moment.Moment>();
	const [endTime, setEndTime] = useState<moment.Moment>();
	const [options, setOptions] = useState(getOptions(location.pathname));
	const [refreshButtonHidden, setRefreshButtonHidden] = useState<boolean>(false);
	const [refreshText, setRefreshText] = useState<string>('');
	const [customDateTimeVisible, setCustomDTPickerVisible] = useState<boolean>(
		false,
	);
	const isOnSelectHandler = useRef<boolean>(false);

	const { maxTime, loading } = useSelector<AppState, GlobalReducer>(
		(state) => state.globalTime,
	);

	const getDefaultTime = (pathName: string): Time => {
		const defaultSelectedOption = getDefaultOption(pathName);

		const routes = get(LOCAL_STORAGE.METRICS_TIME_IN_DURATION);

		if (routes !== null) {
			const routesObject = JSON.parse(routes);
			const selectedTime = routesObject[pathName];

			if (selectedTime) {
				return selectedTime;
			}
		}

		return defaultSelectedOption;
	};

	const [selectedTimeInterval, setSelectedTimeInterval] = useState<Time>(
		getDefaultTime(location.pathname),
	);

	const onSelectHandler = (value: Time): void => {
		isOnSelectHandler.current = true;
		const preRoutes = get(LOCAL_STORAGE.METRICS_TIME_IN_DURATION);

		if (preRoutes !== null) {
			const preRoutesObject = JSON.parse(preRoutes);

			const preRoute = {
				...preRoutesObject,
			};
			preRoute[location.pathname] = value;

			set(LOCAL_STORAGE.METRICS_TIME_IN_DURATION, JSON.stringify(preRoute));
		}

		if (value !== 'custom') {
			updateTimeInterval(value);
			const selectedLabel = getInputLabel(undefined, undefined, value);
			setSelectedTimeInterval(selectedLabel as Time);
		} else {
			setRefreshButtonHidden(true);
			setCustomDTPickerVisible(true);
		}
	};

	const onRefreshHandler = (): void => {
		onSelectHandler(selectedTimeInterval);
		onLastRefreshHandler();
	};

	const getInputLabel = (
		startTime?: moment.Moment,
		endTime?: moment.Moment,
		timeInterval: Time = '15min',
	): string | Time => {
		if (startTime && endTime) {
			const format = 'YYYY/MM/DD HH:mm';

			const startString = startTime.format(format);
			const endString = endTime.format(format);

			return `${startString} - ${endString}`;
		}

		return timeInterval;
	};

	const onLastRefreshHandler = useCallback(() => {
		const currentTime = moment();
		const lastRefresh = moment(maxTime / 1000000);
		const duration = moment.duration(currentTime.diff(lastRefresh));

		const secondsDiff = Math.floor(duration.asSeconds());
		const minutedDiff = Math.floor(duration.asMinutes());
		const hoursDiff = Math.floor(duration.asHours());

		if (hoursDiff > 0) {
			return `Last refresh - ${hoursDiff} hrs ago`;
		}

		if (minutedDiff > 0) {
			return `Last refresh - ${minutedDiff} mins ago`;
		}

		return `Last refresh - ${secondsDiff} sec ago`;
	}, [maxTime]);

	const onCustomDateHandler = (dateTimeRange: DateTimeRangeType): void => {
		if (dateTimeRange !== null) {
			const [startTimeMoment, endTimeMoment] = dateTimeRange;
			if (startTimeMoment && endTimeMoment) {
				setStartTime(startTimeMoment);
				setEndTime(endTimeMoment);
				const interval = getInputLabel(startTimeMoment, endTimeMoment);
				setSelectedTimeInterval(interval as Time);
				setCustomDTPickerVisible(false);
			}
		}
	};

	// this is to update the refresh text
	useEffect(() => {
		const interval = setInterval(() => {
			const text = onLastRefreshHandler();
			setRefreshText(text);
		}, 2000);
		return (): void => {
			clearInterval(interval);
		};
	}, [onLastRefreshHandler]);

	// this is triggred when we change the routes and based on that we are changing the default options
	useEffect(() => {
		if (isOnSelectHandler.current === false) {
			// globalTimeLoading();
			const currentRoute = location.pathname;
			const params = new URLSearchParams(location.search);
			const time = getDefaultTime(currentRoute);

			const currentOptions = getOptions(currentRoute);
			setOptions(currentOptions);

			const searchStartTime = params.get('startTime');
			const searchEndTime = params.get('endTime');

			if (searchEndTime && searchStartTime) {
				if (startTime === undefined && endTime === undefined) {
					setStartTime(moment(new Date(parseInt(searchStartTime, 10))));
					setEndTime(moment(new Date(parseInt(searchEndTime, 10))));
					setSelectedTimeInterval('custom');
				}
			} else {
				if (startTime !== undefined || endTime !== undefined) {
					setStartTime(undefined);
					setEndTime(undefined);
				}
				setSelectedTimeInterval(time);
			}

			if (loading === true) {
				updateTimeInterval(time);
			}
		} else {
			isOnSelectHandler.current = false;
		}
	}, [
		location.pathname,
		location.search,
		startTime,
		endTime,
		updateTimeInterval,
		selectedTimeInterval,
		globalTimeLoading,
		loading,
	]);

	return (
		<Container>
			<Form
				form={form_dtselector}
				layout="inline"
				initialValues={{ interval: selectedTimeInterval }}
			>
				<DefaultSelect
					onSelect={(value): void => onSelectHandler(value as Time)}
					value={getInputLabel(startTime, endTime, selectedTimeInterval)}
				>
					{options.map(({ value, label }) => (
						<Option key={value + label} value={value}>
							{label}
						</Option>
					))}
				</DefaultSelect>

				<FormItem hidden={refreshButtonHidden}>
					<Button type="primary" onClick={onRefreshHandler}>
						Refresh
					</Button>
				</FormItem>
			</Form>

			<Typography>{refreshText}</Typography>

			<CustomDateTimeModal
				visible={customDateTimeVisible}
				onCreate={onCustomDateHandler}
				onCancel={(): void => {
					setCustomDTPickerVisible(false);
				}}
			/>
		</Container>
	);
};

interface DispatchProps {
	updateTimeInterval: (
		interval: Time,
		dateTimeRange?: [number, number],
	) => (dispatch: Dispatch<AppActions>) => void;
	globalTimeLoading: () => void;
}

const mapDispatchToProps = (
	dispatch: ThunkDispatch<unknown, unknown, AppActions>,
): DispatchProps => ({
	updateTimeInterval: bindActionCreators(UpdateTimeInterval, dispatch),
	globalTimeLoading: bindActionCreators(GlobalTimeLoading, dispatch),
});

type Props = DispatchProps & RouteComponentProps;

export default connect(null, mapDispatchToProps)(withRouter(DateTimeSelection));
