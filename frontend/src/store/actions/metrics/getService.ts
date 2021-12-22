import getService from 'api/metrics/getService';
import { AxiosError } from 'axios';
import GetMinMax from 'lib/getGlobalMinMax';
import { Dispatch } from 'redux';
import { AppState } from 'store/reducers';
import AppActions from 'types/actions';
import { GlobalReducer } from 'types/reducer/globalTime';
import convertSecToNanoSeconds from 'lib/convertSecToNanoSeconds';

export const GetService = (
	props: GetServiceProps,
): ((dispatch: Dispatch<AppActions>, getState: () => AppState) => void) => {
	return async (dispatch, getState): Promise<void> => {
		try {
			const { globalTime } = getState();

			if (
				props.maxTime !== globalTime.maxTime &&
				props.minTime !== globalTime.minTime
			) {
				return;
			}

			const { maxTime, minTime } = GetMinMax(globalTime.selectedTime, [
				globalTime.minTime,
				globalTime.maxTime,
			]);

			dispatch({
				type: 'GET_SERVICE_LIST_LOADING_START',
			});

			const response = await getService({
				end: convertSecToNanoSeconds(maxTime),
				start: convertSecToNanoSeconds(minTime),
			});

			if (response.statusCode === 200) {
				dispatch({
					type: 'GET_SERVICE_LIST_SUCCESS',
					payload: response.payload,
				});
			} else {
				dispatch({
					type: 'GET_SERVICE_LIST_ERROR',
					payload: {
						errorMessage: response.error || 'Something went wrong',
					},
				});
			}
		} catch (error) {
			dispatch({
				type: 'GET_SERVICE_LIST_ERROR',
				payload: {
					errorMessage: (error as AxiosError).toString() || 'Something went wrong',
				},
			});
		}
	};
};

export type GetServiceProps = {
	minTime: GlobalReducer['minTime'];
	maxTime: GlobalReducer['maxTime'];
};
