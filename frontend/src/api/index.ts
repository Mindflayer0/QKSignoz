import getLocalStorageApi from 'api/browser/localstorage/get';
import axios, { AxiosInstance } from 'axios';
import { ENVIRONMENT } from 'constants/env';
import { LOCALSTORAGE } from 'constants/localStorage';
import store from 'store';

import apiV1, { apiV2 } from './apiV1';
import { Logout } from './utils';

const token =
	store.getState().app.user?.accessJwt ||
	getLocalStorageApi(LOCALSTORAGE.AUTH_TOKEN) ||
	'';

const handleLogoutInterceptor = (instance: AxiosInstance): void => {
	instance.interceptors.response.use((value) => {
		if (value.status === 401) {
			// token is expired
			Logout();
			return Promise.reject(value);
		}
		return Promise.resolve(value);
	});
};

const instance = axios.create({
	baseURL: `${ENVIRONMENT.baseURL}${apiV1}`,
	headers: {
		Authorization: `bearer ${token}`,
	},
});

handleLogoutInterceptor(instance);

export const AxiosAlertManagerInstance = axios.create({
	baseURL: `${ENVIRONMENT.baseURL}${apiV2}`,
	headers: {
		Authorization: `bearer ${token}`,
	},
});

handleLogoutInterceptor(AxiosAlertManagerInstance);

export { apiV1 };
export default instance;
