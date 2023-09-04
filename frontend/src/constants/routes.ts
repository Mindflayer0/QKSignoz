const ROUTES = {
	SIGN_UP: '/signup',
	LOGIN: '/login',
	SERVICE_METRICS: '/services/:servicename',
	SERVICE_MAP: '/service-map',
	TRACE: '/trace',
	TRACE_DETAIL: '/trace/:id',
	TRACES_EXPLORER: '/traces-explorer',
	SETTINGS: '/settings',
	INSTRUMENTATION: '/get-started',
	ONBOARDING: '/onboarding',
	USAGE_EXPLORER: '/usage-explorer',
	APPLICATION: '/services',
	ALL_DASHBOARD: '/dashboard',
	DASHBOARD: '/dashboard/:dashboardId',
	DASHBOARD_WIDGET: '/dashboard/:dashboardId/:widgetId',
	EDIT_ALERTS: '/alerts/edit',
	LIST_ALL_ALERT: '/alerts',
	ALERTS_NEW: '/alerts/new',
	ALL_CHANNELS: '/settings/channels',
	CHANNELS_NEW: '/settings/channels/new',
	CHANNELS_EDIT: '/settings/channels/:id',
	ALL_ERROR: '/exceptions',
	ERROR_DETAIL: '/error-detail',
	VERSION: '/status',
	MY_SETTINGS: '/my-settings',
	ORG_SETTINGS: '/settings/org-settings',
	SOMETHING_WENT_WRONG: '/something-went-wrong',
	UN_AUTHORIZED: '/un-authorized',
	NOT_FOUND: '/not-found',
	LOGS: '/logs',
	LOGS_EXPLORER: '/logs-explorer',
	LIVE_LOGS: '/logs-explorer/live',
	HOME_PAGE: '/',
	PASSWORD_RESET: '/password-reset',
	LIST_LICENSES: '/licenses',
	LOGS_INDEX_FIELDS: '/logs-explorer/index-fields',
	LOGS_PIPELINE: '/logs-explorer/pipeline',
	TRACE_EXPLORER: '/trace-explorer',
	PIPELINES: '/pipelines',
};

export default ROUTES;
