import getDynamicConfigs from 'api/dynamicConfigs/getDynamicConfigs';
import getFeaturesFlags from 'api/features/getFeatureFlags';
import getUserLatestVersion from 'api/user/getLatestVersion';
import getUserVersion from 'api/user/getVersion';
import Header from 'container/Header';
import SideNav from 'container/SideNav';
import TopNav from 'container/TopNav';
import { useNotifications } from 'hooks/useNotifications';
import { ReactNode, useEffect, useMemo, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import { useQueries } from 'react-query';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Dispatch } from 'redux';
import { AppState } from 'store/reducers';
import AppActions from 'types/actions';
import {
	UPDATE_CONFIGS,
	UPDATE_CURRENT_ERROR,
	UPDATE_CURRENT_VERSION,
	UPDATE_FEATURE_FLAG_RESPONSE,
	UPDATE_LATEST_VERSION,
	UPDATE_LATEST_VERSION_ERROR,
} from 'types/actions/app';
import AppReducer from 'types/reducer/app';

import { ChildrenContainer, Layout } from './styles';
import { getRouteKey } from './utils';

function AppLayout(props: AppLayoutProps): JSX.Element {
	const { isLoggedIn, user } = useSelector<AppState, AppReducer>(
		(state) => state.app,
	);
	const { pathname } = useLocation();
	const { t } = useTranslation(['titles']);

	const [
		getUserVersionResponse,
		getUserLatestVersionResponse,
		getFeaturesResponse,
		getDynamicConfigsResponse,
	] = useQueries([
		{
			queryFn: getUserVersion,
			queryKey: ['getUserVersion', user?.accessJwt],
			enabled: isLoggedIn,
		},
		{
			queryFn: getUserLatestVersion,
			queryKey: ['getUserLatestVersion', user?.accessJwt],
			enabled: isLoggedIn,
		},
		{
			queryFn: getFeaturesFlags,
			queryKey: ['getFeatureFlags', user?.accessJwt],
		},
		{
			queryFn: getDynamicConfigs,
			queryKey: ['getDynamicConfigs', user?.accessJwt],
		},
	]);

	useEffect(() => {
		if (getFeaturesResponse.status === 'idle') {
			getFeaturesResponse.refetch();
		}

		if (getUserLatestVersionResponse.status === 'idle' && isLoggedIn) {
			getUserLatestVersionResponse.refetch();
		}

		if (getUserVersionResponse.status === 'idle' && isLoggedIn) {
			getUserVersionResponse.refetch();
		}
		if (getFeaturesResponse.status === 'idle') {
			getFeaturesResponse.refetch();
		}
		if (getDynamicConfigsResponse.status === 'idle') {
			getDynamicConfigsResponse.refetch();
		}
	}, [
		getFeaturesResponse,
		getUserLatestVersionResponse,
		getUserVersionResponse,
		isLoggedIn,
		getDynamicConfigsResponse,
	]);

	const { children } = props;

	const dispatch = useDispatch<Dispatch<AppActions>>();

	const latestCurrentCounter = useRef(0);
	const latestVersionCounter = useRef(0);
	const latestConfigCounter = useRef(0);

	const { notifications } = useNotifications();

	useEffect(() => {
		if (
			getUserLatestVersionResponse.isFetched &&
			getUserLatestVersionResponse.isError &&
			latestCurrentCounter.current === 0
		) {
			latestCurrentCounter.current = 1;

			dispatch({
				type: UPDATE_LATEST_VERSION_ERROR,
				payload: {
					isError: true,
				},
			});
			notifications.error({
				message: t('oops_something_went_wrong_version'),
			});
		}

		if (
			getUserVersionResponse.isFetched &&
			getUserVersionResponse.isError &&
			latestVersionCounter.current === 0
		) {
			latestVersionCounter.current = 1;

			dispatch({
				type: UPDATE_CURRENT_ERROR,
				payload: {
					isError: true,
				},
			});
			notifications.error({
				message: t('oops_something_went_wrong_version'),
			});
		}

		if (
			getUserVersionResponse.isFetched &&
			getUserLatestVersionResponse.isSuccess &&
			getUserVersionResponse.data &&
			getUserVersionResponse.data.payload
		) {
			dispatch({
				type: UPDATE_CURRENT_VERSION,
				payload: {
					currentVersion: getUserVersionResponse.data.payload.version,
					ee: getUserVersionResponse.data.payload.ee,
					setupCompleted: getUserVersionResponse.data.payload.setupCompleted,
				},
			});
		}

		if (
			getUserLatestVersionResponse.isFetched &&
			getUserLatestVersionResponse.isSuccess &&
			getUserLatestVersionResponse.data &&
			getUserLatestVersionResponse.data.payload
		) {
			dispatch({
				type: UPDATE_LATEST_VERSION,
				payload: {
					latestVersion: getUserLatestVersionResponse.data.payload.tag_name,
				},
			});
		}

		if (
			getDynamicConfigsResponse.isFetched &&
			getDynamicConfigsResponse.isSuccess &&
			getDynamicConfigsResponse.data &&
			getDynamicConfigsResponse.data.payload &&
			latestConfigCounter.current === 0
		) {
			latestConfigCounter.current = 1;

			dispatch({
				type: UPDATE_CONFIGS,
				payload: {
					configs: getDynamicConfigsResponse.data.payload,
				},
			});
		}
	}, [
		dispatch,
		isLoggedIn,
		pathname,
		t,
		getUserLatestVersionResponse.isLoading,
		getUserLatestVersionResponse.isError,
		getUserLatestVersionResponse.data,
		getUserVersionResponse.isLoading,
		getUserVersionResponse.isError,
		getUserVersionResponse.data,
		getUserLatestVersionResponse.isFetched,
		getUserVersionResponse.isFetched,
		getUserLatestVersionResponse.isSuccess,
		getFeaturesResponse.isFetched,
		getFeaturesResponse.isSuccess,
		getFeaturesResponse.data,
		getDynamicConfigsResponse.data,
		getDynamicConfigsResponse.isFetched,
		getDynamicConfigsResponse.isSuccess,
		notifications,
	]);

	useEffect(() => {
		if (
			getFeaturesResponse.isFetched &&
			getFeaturesResponse.isSuccess &&
			getFeaturesResponse.data &&
			getFeaturesResponse.data.payload
		) {
			dispatch({
				type: UPDATE_FEATURE_FLAG_RESPONSE,
				payload: {
					featureFlag: getFeaturesResponse.data.payload,
					refetch: getFeaturesResponse.refetch,
				},
			});
		}
	}, [
		dispatch,
		getFeaturesResponse.data,
		getFeaturesResponse.isFetched,
		getFeaturesResponse.isSuccess,
		getFeaturesResponse.refetch,
	]);

	const isToDisplayLayout = isLoggedIn;

	const routeKey = useMemo(() => getRouteKey(pathname), [pathname]);
	const pageTitle = t(routeKey);

	return (
		<Layout>
			<Helmet>
				<title>{pageTitle}</title>
			</Helmet>

			{isToDisplayLayout && <Header />}
			<Layout>
				{isToDisplayLayout && <SideNav />}
				<Layout.Content>
					<ChildrenContainer>
						{isToDisplayLayout && <TopNav />}
						{children}
					</ChildrenContainer>
				</Layout.Content>
			</Layout>
		</Layout>
	);
}

interface AppLayoutProps {
	children: ReactNode;
}

export default AppLayout;
