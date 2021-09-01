import api from 'api';
import { Dispatch } from 'redux';
import { GlobalTime } from 'store/actions/global';
import { toUTCEpoch } from 'utils/timeUtils';

import { MetricsActionTypes } from './metricsActionTypes';
import * as MetricsInterfaces from './metricsInterfaces';

export const getServicesList = (globalTime: GlobalTime) => {
	return async (dispatch: Dispatch) => {
		const request_string =
			'/services?start=' + globalTime.minTime + '&end=' + globalTime.maxTime;

		const response = await api.get<MetricsInterfaces.servicesListItem[]>(
			request_string,
		);

		dispatch<MetricsInterfaces.getServicesListAction>({
			type: MetricsActionTypes.getServicesList,
			payload: response.data,
			//PNOTE - response.data in the axios response has the actual API response
		});
	};
};

export const getDbOverViewMetrics = (
	serviceName: string,
	globalTime: GlobalTime,
) => {
	return async (dispatch: Dispatch) => {
		const request_string =
			'/service/dbOverview?service=' +
			serviceName +
			'&start=' +
			globalTime.minTime +
			'&end=' +
			globalTime.maxTime +
			'&step=60';
		const response = await api.get<MetricsInterfaces.dbOverviewMetricsItem[]>(
			request_string,
		);
		dispatch<MetricsInterfaces.getDbOverViewMetricsAction>({
			type: MetricsActionTypes.getDbOverviewMetrics,
			payload: response.data,
		});
	};
};

export const getExternalMetrics = (
	serviceName: string,
	globalTime: GlobalTime,
) => {
	return async (dispatch: Dispatch) => {
		const request_string =
			'/service/external?service=' +
			serviceName +
			'&start=' +
			globalTime.minTime +
			'&end=' +
			globalTime.maxTime +
			'&step=60';
		const response = await api.get<MetricsInterfaces.externalMetricsItem[]>(
			request_string,
		);
		dispatch<MetricsInterfaces.getExternalMetricsAction>({
			type: MetricsActionTypes.getExternalMetrics,
			payload: response.data,
		});
	};
};

export const getExternalAvgDurationMetrics = (
	serviceName: string,
	globalTime: GlobalTime,
) => {
	return async (dispatch: Dispatch) => {
		const request_string =
			'/service/externalAvgDuration?service=' +
			serviceName +
			'&start=' +
			globalTime.minTime +
			'&end=' +
			globalTime.maxTime +
			'&step=60';

		const response = await api.get<
			MetricsInterfaces.externalMetricsAvgDurationItem[]
		>(request_string);
		dispatch<MetricsInterfaces.externalMetricsAvgDurationAction>({
			type: MetricsActionTypes.getAvgDurationMetrics,
			payload: response.data,
		});
	};
};
export const getExternalErrCodeMetrics = (
	serviceName: string,
	globalTime: GlobalTime,
) => {
	return async (dispatch: Dispatch) => {
		const request_string =
			'/service/externalErrors?service=' +
			serviceName +
			'&start=' +
			globalTime.minTime +
			'&end=' +
			globalTime.maxTime +
			'&step=60';
		const response = await api.get<
			MetricsInterfaces.externalErrCodeMetricsItem[]
		>(request_string);

		dispatch<MetricsInterfaces.externalErrCodeMetricsActions>({
			type: MetricsActionTypes.getErrCodeMetrics,
			payload: response.data,
		});
	};
};

export const getServicesMetrics = (
	serviceName: string,
	globalTime: GlobalTime,
) => {
	return async (dispatch: Dispatch) => {
		const request_string =
			'/service/overview?service=' +
			serviceName +
			'&start=' +
			globalTime.minTime +
			'&end=' +
			globalTime.maxTime +
			'&step=60';
		const response = await api.get<MetricsInterfaces.metricItem[]>(
			request_string,
		);

		dispatch<MetricsInterfaces.getServiceMetricsAction>({
			type: MetricsActionTypes.getServiceMetrics,
			payload: response.data,
			//PNOTE - response.data in the axios response has the actual API response
		});
	};
};

export const getTopEndpoints = (
	serviceName: string,
	globalTime: GlobalTime,
) => {
	return async (dispatch: Dispatch) => {
		const request_string =
			'/service/top_endpoints?service=' +
			serviceName +
			'&start=' +
			globalTime.minTime +
			'&end=' +
			globalTime.maxTime;
		const response = await api.get<MetricsInterfaces.topEndpointListItem[]>(
			request_string,
		);

		dispatch<MetricsInterfaces.getTopEndpointsAction>({
			type: MetricsActionTypes.getTopEndpoints,
			payload: response.data,
			//PNOTE - response.data in the axios response has the actual API response
		});
	};
};

export const getFilteredTraceMetrics = (
	filter_params: string,
	globalTime: GlobalTime,
) => {
	return async (dispatch: Dispatch) => {
		const request_string =
			'/spans/aggregates?start=' +
			toUTCEpoch(globalTime.minTime) +
			'&end=' +
			toUTCEpoch(globalTime.maxTime) +
			'&' +
			filter_params;
		const response = await api.get<MetricsInterfaces.customMetricsItem[]>(
			request_string,
		);

		dispatch<MetricsInterfaces.getFilteredTraceMetricsAction>({
			type: MetricsActionTypes.getFilteredTraceMetrics,
			payload: response.data,
			//PNOTE - response.data in the axios response has the actual API response
		});
	};
};
