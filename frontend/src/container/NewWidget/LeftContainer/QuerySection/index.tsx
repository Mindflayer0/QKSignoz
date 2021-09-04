import { PlusOutlined } from '@ant-design/icons';
import { timePreferance } from 'container/NewWidget/RightContainer/timeItems';
import React, { useCallback } from 'react';
import { connect, useSelector } from 'react-redux';
import { useLocation } from 'react-router';
import { bindActionCreators, Dispatch } from 'redux';
import { ThunkDispatch } from 'redux-thunk';
import { CreateQuery, CreateQueryProps } from 'store/actions';
import { AppState } from 'store/reducers';
import AppActions from 'types/actions';
import { Widgets } from 'types/api/dashboard/getAll';
import DashboardReducer from 'types/reducer/dashboards';

import Query from './Query';
import { QueryButton } from './styles';

const QuerySection = ({
	selectedTime,
	createQuery,
}: QueryProps): JSX.Element => {
	const { dashboards } = useSelector<AppState, DashboardReducer>(
		(state) => state.dashboards,
	);
	const [selectedDashboards] = dashboards;
	const { search } = useLocation();
	const widgets = selectedDashboards.data.widgets;
	console.log({ dashboards });

	const urlQuery = new URLSearchParams(search);

	const getWidget = useCallback(() => {
		const widgetId = urlQuery.get('widgetId');
		return widgets?.find((e) => e.id === widgetId);
	}, [widgets]);

	const selectedWidget = getWidget() as Widgets;

	const { query } = selectedWidget;

	const queryOnClickHandler = useCallback(() => {
		const widgetId = urlQuery.get('widgetId');

		createQuery({
			widgetId: String(widgetId),
		});
	}, []);

	return (
		<div>
			{query.map((e, index) => (
				<Query selectedTime={selectedTime} key={e.query + index} />
			))}

			<QueryButton onClick={queryOnClickHandler} icon={<PlusOutlined />}>
				Query
			</QueryButton>
		</div>
	);
};

interface DispatchProps {
	createQuery: ({
		widgetId,
	}: CreateQueryProps) => (dispatch: Dispatch<AppActions>) => void;
}

const mapDispatchToProps = (
	dispatch: ThunkDispatch<unknown, unknown, AppActions>,
): DispatchProps => ({
	createQuery: bindActionCreators(CreateQuery, dispatch),
});

interface QueryProps extends DispatchProps {
	selectedTime: timePreferance;
}

export default connect(null, mapDispatchToProps)(QuerySection);
