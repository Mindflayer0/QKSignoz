import { Dispatch, Store } from 'redux';
import { AppState } from 'store/reducers';
import AppActions from 'types/actions';
import { GlobalReducer } from 'types/reducer/globalTime';
import getFiltersApi from 'api/trace/getFilters';
import {
	parseQuery,
	parseSelectedFilter,
	parseFilterToFetchData,
} from './util';
import {
	UPDATE_ALL_FILTERS,
	UPDATE_TRACE_FILTER_LOADING,
} from 'types/actions/trace';
import isEqual from 'lodash-es/isEqual';
import { TraceFilterEnum } from 'types/reducer/trace';

export const GetFilter = (
	query: string,
	minTime: GlobalReducer['minTime'],
	maxTime: GlobalReducer['maxTime'],
): ((
	dispatch: Dispatch<AppActions>,
	getState: Store<AppState>['getState'],
) => void) => {
	return async (dispatch, getState): Promise<void> => {
		const { globalTime, traces } = getState();
		const initialSelectedFilter = new Map<TraceFilterEnum, string[]>();

		if (globalTime.maxTime !== maxTime && globalTime.minTime !== minTime) {
			return;
		}

		const parsedQueryFilter = parseQuery(query);
		const parsedQuerySelectedFilter = parseSelectedFilter(query);
		const parsedQueryFetchSelectedData = parseFilterToFetchData(query);

		const parsedFilter = Object.fromEntries(parsedQueryFilter);
		const parsedSelectedFilter = Object.fromEntries(parsedQuerySelectedFilter);

		const parsedFilterInState = Object.fromEntries(traces.filter);
		const parsedSelectedFilterInState = Object.fromEntries(traces.selectedFilter);

		// if filter in state and in query are same no need to fetch the filters
		if (
			isEqual(parsedFilter, parsedFilterInState) &&
			isEqual(parsedSelectedFilter, parsedSelectedFilterInState) &&
			isEqual(parsedQueryFetchSelectedData, traces.filterToFetchData)
		) {
			console.log('filters are equal');
			return;
		}

		// now filter are not matching we need to fetch the data and make in sync
		dispatch({
			type: UPDATE_TRACE_FILTER_LOADING,
			payload: {
				filterLoading: true,
			},
		});

		const response = await getFiltersApi({
			end: String(maxTime),
			getFilters: parsedQueryFetchSelectedData,
			start: String(minTime),
			other: parsedSelectedFilter,
		});

		if (response.statusCode === 200) {
			// updating the trace filter
			parsedQueryFetchSelectedData.map((e) => {
				traces.filter.set(e, response.payload[e]);
			});

			parsedQuerySelectedFilter.forEach((value, key) => {
				// @TODO need to check the type of the key
				initialSelectedFilter.set(key as TraceFilterEnum, value);
			});

			dispatch({
				type: UPDATE_ALL_FILTERS,
				payload: {
					filter: traces.filter,
					selectedFilter: initialSelectedFilter,
					filterToFetchData: parsedQueryFetchSelectedData,
				},
			});
		}

		dispatch({
			type: UPDATE_TRACE_FILTER_LOADING,
			payload: {
				filterLoading: false,
			},
		});
	};
};
