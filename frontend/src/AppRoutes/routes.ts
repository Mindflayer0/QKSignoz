import ROUTES from 'constants/routes';
import DashboardWidget from 'pages/DashboardWidget';
import { RouteProps } from 'react-router-dom';

import {
	AllAlertChannels,
	AllErrors,
	CreateAlertChannelAlerts,
	CreateNewAlerts,
	DashboardPage,
	EditAlertChannelsAlerts,
	EditRulesPage,
	ErrorDetails,
	InstrumentationPage,
	ListAllALertsPage,
	MySettings,
	NewDashboardPage,
	OrganizationSettings,
	ServiceMapPage,
	ServiceMetricsPage,
	ServicesTablePage,
	SettingsPage,
	SignupPage,
	StatusPage,
	TraceDetail,
	TraceFilter,
	UsageExplorerPage,
} from './pageComponents';

const routes: AppRoutes[] = [
	{
		component: SignupPage,
		path: ROUTES.SIGN_UP,
		exact: true,
	},
	{
		component: ServicesTablePage,
		path: ROUTES.APPLICATION,
		exact: true,
	},
	{
		path: ROUTES.SERVICE_METRICS,
		exact: true,
		component: ServiceMetricsPage,
	},
	{
		path: ROUTES.SERVICE_MAP,
		component: ServiceMapPage,
		exact: true,
	},
	{
		path: ROUTES.TRACE_DETAIL,
		exact: true,
		component: TraceDetail,
	},
	{
		path: ROUTES.SETTINGS,
		exact: true,
		component: SettingsPage,
	},
	{
		path: ROUTES.USAGE_EXPLORER,
		exact: true,
		component: UsageExplorerPage,
	},
	{
		path: ROUTES.INSTRUMENTATION,
		exact: true,
		component: InstrumentationPage,
	},
	{
		path: ROUTES.ALL_DASHBOARD,
		exact: true,
		component: DashboardPage,
	},
	{
		path: ROUTES.DASHBOARD,
		exact: true,
		component: NewDashboardPage,
	},
	{
		path: ROUTES.DASHBOARD_WIDGET,
		exact: true,
		component: DashboardWidget,
	},
	{
		path: ROUTES.EDIT_ALERTS,
		exact: true,
		component: EditRulesPage,
	},
	{
		path: ROUTES.LIST_ALL_ALERT,
		exact: true,
		component: ListAllALertsPage,
	},
	{
		path: ROUTES.ALERTS_NEW,
		exact: true,
		component: CreateNewAlerts,
	},
	{
		path: ROUTES.TRACE,
		exact: true,
		component: TraceFilter,
	},
	{
		path: ROUTES.CHANNELS_NEW,
		exact: true,
		component: CreateAlertChannelAlerts,
	},
	{
		path: ROUTES.CHANNELS_EDIT,
		exact: true,
		component: EditAlertChannelsAlerts,
	},
	{
		path: ROUTES.ALL_CHANNELS,
		exact: true,
		component: AllAlertChannels,
	},
	{
		path: ROUTES.ALL_ERROR,
		exact: true,
		component: AllErrors,
	},
	{
		path: ROUTES.ERROR_DETAIL,
		exact: true,
		component: ErrorDetails,
	},
	{
		path: ROUTES.VERSION,
		exact: true,
		component: StatusPage,
	},
	{
		path: ROUTES.ORG_SETTINGS,
		exact: true,
		component: OrganizationSettings,
	},
	{
		path: ROUTES.MY_SETTINGS,
		exact: true,
		component: MySettings,
	},
];

interface AppRoutes {
	component: RouteProps['component'];
	path: RouteProps['path'];
	exact: RouteProps['exact'];
	isPrivate?: boolean;
}

export default routes;
