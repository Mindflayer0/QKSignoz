import { Typography } from 'antd';
import getUserVersion from 'api/user/getVersion';
import Spinner from 'components/Spinner';
import ROUTES from 'constants/routes';
import ResetPasswordContainer from 'container/ResetPassword';
import useLoggedInNavigate from 'hooks/useIfNotLoggedInNavigate';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { useQueries } from 'react-query';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import AppReducer from 'types/reducer/app';

function ResetPassword(): JSX.Element {
	const { t } = useTranslation('common');
	const { isLoggedIn } = useSelector<AppState, AppReducer>((state) => state.app);

	useLoggedInNavigate(ROUTES.APPLICATION);

	const [versionResponse] = useQueries([
		{
			queryFn: getUserVersion,
			queryKey: 'getUserVersion',
			enabled: !isLoggedIn,
		},
	]);

	if (
		versionResponse.status === 'error' ||
		(versionResponse.status === 'success' &&
			versionResponse.data?.statusCode !== 200)
	) {
		return (
			<Typography>
				{versionResponse.data?.error || t('something_went_wrong')}
			</Typography>
		);
	}

	if (
		versionResponse.status === 'loading' ||
		!(versionResponse.data && versionResponse.data.payload)
	) {
		return <Spinner tip="Loading..." />;
	}

	const { version } = versionResponse.data.payload;

	return <ResetPasswordContainer version={version} />;
}

export default ResetPassword;
