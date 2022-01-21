import { TraceReducer } from 'types/reducer/trace';

export const UPDATE_TRACE_FILTER = 'UPDATE_TRACE_FILTER';
export const GET_TRACE_FILTER = 'GET_TRACE_FILTER';
export const UPDATE_TRACE_FILTER_LOADING = 'UPDATE_TRACE_FILTER_LOADING';

export const SELECT_TRACE_FILTER = 'SELECT_TRACE_FILTER';
export const UPDATE_ALL_FILTERS = 'UPDATE_ALL_FILTERS';
export const UPDATE_SELECTED_TAGS = 'UPDATE_SELECTED_TAGS';
export const UPDATE_TAG_MODAL_VISIBLITY = 'UPDATE_TAG_MODAL_VISIBLITY';

export const UPDATE_SPANS_AGGREEGATE = 'UPDATE_SPANS_AGGREEGATE';

export const UPDATE_IS_TAG_ERROR = 'UPDATE_IS_TAG_ERROR';

export const UPDATE_SELECTED_FUNCTION = 'UPDATE_SELECTED_FUNCTION';
export const UPDATE_SELECTED_GROUP_BY = 'UPDATE_SELECTED_GROUP_BY';

export const UPDATE_TRACE_GRAPH_LOADING = 'UPDATE_TRACE_GRAPH_LOADING';
export const UPDATE_TRACE_GRAPH_ERROR = 'UPDATE_TRACE_GRAPH_ERROR';
export const UPDATE_TRACE_GRAPH_SUCCESS = 'UPDATE_TRACE_GRAPH_SUCCESS';

export interface UpdateFilter {
	type: typeof UPDATE_TRACE_FILTER;
	payload: {
		filter: TraceReducer['filter'];
	};
}

export interface UpdateSpansAggregate {
	type: typeof UPDATE_SPANS_AGGREEGATE;
	payload: {
		spansAggregate: TraceReducer['spansAggregate'];
	};
}

export interface UpdateTagVisiblity {
	type: typeof UPDATE_TAG_MODAL_VISIBLITY;
	payload: {
		isTagModalOpen: TraceReducer['isTagModalOpen'];
	};
}

export interface UpdateSelectedTags {
	type: typeof UPDATE_SELECTED_TAGS;
	payload: {
		selectedTags: TraceReducer['selectedTags'];
	};
}

export interface UpdateAllFilters {
	type: typeof UPDATE_ALL_FILTERS;
	payload: {
		filter: TraceReducer['filter'];
		selectedFilter: TraceReducer['selectedFilter'];
		filterToFetchData: TraceReducer['filterToFetchData'];
		current: TraceReducer['spansAggregate']['currentPage'];
	};
}

export interface UpdateFilterLoading {
	type: typeof UPDATE_TRACE_FILTER_LOADING;
	payload: {
		filterLoading: TraceReducer['filterLoading'];
	};
}

export interface SelectTraceFilter {
	type: typeof SELECT_TRACE_FILTER;
	payload: {
		selectedFilter: TraceReducer['selectedFilter'];
	};
}

export interface GetTraceFilter {
	type: typeof GET_TRACE_FILTER;
	payload: {
		filter: TraceReducer['filter'];
	};
}

export interface UpdateIsTagError {
	type: typeof UPDATE_IS_TAG_ERROR;
	payload: {
		isTagModalError: TraceReducer['isTagModalError'];
	};
}

export interface UpdateSelectedGroupBy {
	type: typeof UPDATE_SELECTED_GROUP_BY;
	payload: {
		selectedGroupBy: TraceReducer['selectedGroupBy'];
	};
}

export interface UpdateSelectedFunction {
	type: typeof UPDATE_SELECTED_FUNCTION;
	payload: {
		selectedFunction: TraceReducer['selectedFunction'];
	};
}

export type TraceActions =
	| UpdateFilter
	| GetTraceFilter
	| UpdateFilterLoading
	| SelectTraceFilter
	| UpdateAllFilters
	| UpdateSelectedTags
	| UpdateTagVisiblity
	| UpdateSpansAggregate
	| UpdateIsTagError
	| UpdateSelectedGroupBy
	| UpdateSelectedFunction;
