import { PayloadProps as OrgPayload } from 'types/api/user/getOrganization';
import AppReducer, { User } from 'types/reducer/app';
import { ROLES } from 'types/roles';

export const SWITCH_DARK_MODE = 'SWITCH_DARK_MODE';
export const LOGGED_IN = 'LOGGED_IN';
export const SIDEBAR_COLLAPSE = 'SIDEBAR_COLLAPSE';

export const UPDATE_CURRENT_VERSION = 'UPDATE_CURRENT_VERSION';
export const UPDATE_LATEST_VERSION = 'UPDATE_LATEST_VERSION';

export const UPDATE_CURRENT_ERROR = 'UPDATE_CURRENT_ERROR';
export const UPDATE_LATEST_VERSION_ERROR = 'UPDATE_LATEST_VERSION_ERROR';
export const UPDATE_USER_ACCESS_REFRESH_ACCESS_TOKEN =
	'UPDATE_USER_ACCESS_REFRESH_ACCESS_TOKEN';
export const UPDATE_USER_IS_FETCH = 'UPDATE_USER_IS_FETCH';
export const UPDATE_USER_ORG_ROLE = 'UPDATE_USER_ORG_ROLE';

export interface SwitchDarkMode {
	type: typeof SWITCH_DARK_MODE;
}

export interface LoggedInUser {
	type: typeof LOGGED_IN;
	payload: {
		isLoggedIn: boolean;
	};
}

export interface SideBarCollapse {
	type: typeof SIDEBAR_COLLAPSE;
	payload: boolean;
}

export interface UpdateAppVersion {
	type: typeof UPDATE_CURRENT_VERSION;
	payload: {
		currentVersion: AppReducer['currentVersion'];
	};
}

export interface UpdateLatestVersion {
	type: typeof UPDATE_LATEST_VERSION;
	payload: {
		latestVersion: AppReducer['latestVersion'];
	};
}

export interface UpdateVersionError {
	type: typeof UPDATE_CURRENT_ERROR | typeof UPDATE_LATEST_VERSION_ERROR;
	payload: {
		isError: boolean;
	};
}

export interface UpdateUserOrgRole {
	type: typeof UPDATE_USER_ORG_ROLE;
	payload: {
		role: ROLES | null;
		org: OrgPayload | null;
	};
}

export interface UpdateAccessRenewToken {
	type: typeof UPDATE_USER_ACCESS_REFRESH_ACCESS_TOKEN;
	payload: {
		accessJwt: User['accessJwt'];
		refreshJwt: User['refreshJwt'];
	};
}

export interface UpdateUserIsFetched {
	type: typeof UPDATE_USER_IS_FETCH;
	payload: {
		isUserFetching: AppReducer['isUserFetching'];
	};
}

export type AppAction =
	| SwitchDarkMode
	| LoggedInUser
	| SideBarCollapse
	| UpdateAppVersion
	| UpdateLatestVersion
	| UpdateVersionError
	| UpdateAccessRenewToken
	| UpdateUserIsFetched
	| UpdateUserOrgRole;
