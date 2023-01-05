import { PlusOutlined } from '@ant-design/icons';
import { Typography } from 'antd';
import getAll from 'api/channels/getAll';
import Spinner from 'components/Spinner';
import TextToolTip from 'components/TextToolTip';
import ROUTES from 'constants/routes';
import useComponentPermission from 'hooks/useComponentPermission';
import history from 'lib/history';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from 'react-query';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import AppReducer from 'types/reducer/app';

import AlertChannelsComponent from './AlertChannels';
import { Button, ButtonContainer, RightActionContainer } from './styles';

const { Paragraph } = Typography;

function AlertChannels(): JSX.Element {
	const { t } = useTranslation(['channels']);
	const { role } = useSelector<AppState, AppReducer>((state) => state.app);
	const [addNewChannelPermission] = useComponentPermission(
		['add_new_channel'],
		role,
	);
	const onToggleHandler = useCallback(() => {
		history.push(ROUTES.CHANNELS_NEW);
	}, []);

	const { isLoading, data, isError } = useQuery('channels', getAll);

	if (isError || data?.error) {
		return <Typography>{data?.error || 'Something went wrong'}</Typography>;
	}

	if (isLoading || data?.payload === undefined || data.payload === null) {
		return <Spinner tip={t('loading_channels_message')} height="90vh" />;
	}

	return (
		<>
			<ButtonContainer>
				<Paragraph ellipsis type="secondary">
					{t('sending_channels_note')}
				</Paragraph>

				<RightActionContainer>
					<TextToolTip
						text={t('tooltip_notification_channels')}
						url="https://signoz.io/docs/userguide/alerts-management/#setting-notification-channel"
					/>

					{addNewChannelPermission && (
						<Button onClick={onToggleHandler} icon={<PlusOutlined />}>
							{t('button_new_channel')}
						</Button>
					)}
				</RightActionContainer>
			</ButtonContainer>

			<AlertChannelsComponent allChannels={data.payload} />
		</>
	);
}

export default AlertChannels;
