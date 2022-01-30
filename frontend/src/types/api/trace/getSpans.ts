import { TraceReducer } from 'types/reducer/trace';

export interface Props {
	start: number;
	end: number;
	function: TraceReducer['selectedFunction'];
	step: number;
	groupBy: TraceReducer['selectedGroupBy'];
	selectedFilter: TraceReducer['selectedFilter'];
	selectedTags: TraceReducer['selectedTags'];
	preSelectedFilter: TraceReducer['preSelectedFilter'];
}

export interface PayloadProps {
	items: Record<string, SpanData>;
}

interface SpanData {
	timestamp: number;
	value?: number;
	groupBy?: Record<string, number>;
}
