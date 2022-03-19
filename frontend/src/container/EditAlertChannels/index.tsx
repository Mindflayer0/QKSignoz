import { Form, notification } from 'antd';
import editSlackApi from 'api/channels/editSlack';
import editWebhookApi from 'api/channels/editWebhook';
import ROUTES from 'constants/routes';
import {
	ChannelType,
	SlackChannel,
	SlackType,
	WebhookChannel,
	WebhookType,
} from 'container/CreateAlertChannels/config';
import FormAlertChannels from 'container/FormAlertChannels';
import history from 'lib/history';
import { Store } from 'rc-field-form/lib/interface';
import React, { useCallback, useState } from 'react';
import { useParams } from 'react-router';

const EditAlertChannels = ({
	initialValue,
}: EditAlertChannelsProps): JSX.Element => {
	const [formInstance] = Form.useForm();
	const [selectedConfig, setSelectedConfig] = useState<
		Partial<SlackChannel & WebhookChannel>
	>({
		...initialValue,
	});
	const [savingState, setSavingState] = useState<boolean>(false);
	const [notifications, NotificationElement] = notification.useNotification();
	const { id } = useParams<{ id: string }>();

	const [type, setType] = useState<ChannelType>(
		initialValue?.type ? initialValue.type : SlackType,
	);

	const onTypeChangeHandler = useCallback((value: string) => {
		setType(value as ChannelType);
	}, []);

	const onSlackEditHandler = useCallback(async () => {
		setSavingState(true);
		const response = await editSlackApi({
			api_url: selectedConfig?.api_url || '',
			channel: selectedConfig?.channel || '',
			name: selectedConfig?.name || '',
			send_resolved: true,
			text: selectedConfig?.text || '',
			title: selectedConfig?.title || '',
			id,
		});

		if (response.statusCode === 200) {
			notifications.success({
				message: 'Success',
				description: 'Channels Edited Successfully',
			});

			setTimeout(() => {
				history.replace(ROUTES.SETTINGS);
			}, 2000);
		} else {
			notifications.error({
				message: 'Error',
				description: response.error || 'error while updating the Channels',
			});
		}
		setSavingState(false);
	}, [selectedConfig, notifications, id]);

	const onWebhookEditHandler = useCallback(async () => {
		setSavingState(true);
		const { api_url, name, username, password } = selectedConfig;

		const showError = (msg: string) => {
			notifications.error({
				message: 'Error',
				description: msg,
			});
			setSavingState(false);
		};

		if (api_url == '') {
			showError('Webhook URL is mandatory');
			return;
		}

		if (username && (!password || password === '')) {
			showError('Please enter a password');
			return;
		}

		const response = await editWebhookApi({
			api_url: api_url || '',
			name: name || '',
			send_resolved: true,
			username: username,
			password: password,
			id,
		});

		if (response.statusCode === 200) {
			notifications.success({
				message: 'Success',
				description: 'Channels Edited Successfully',
			});

			setTimeout(() => {
				history.replace(ROUTES.SETTINGS);
			}, 2000);
		} else {
			showError(response.error || 'error while updating the Channels');
		}
		setSavingState(false);
	}, [selectedConfig, notifications, id]);

	const onSaveHandler = useCallback(
		(value: ChannelType) => {
			if (value === SlackType) {
				onSlackEditHandler();
			} else if (value === WebhookType) {
				onWebhookEditHandler();
			}
		},
		[onSlackEditHandler, onWebhookEditHandler],
	);

	const onTestHandler = useCallback(() => {
		console.log('test');
	}, []);

	return (
		<>
			<FormAlertChannels
				{...{
					formInstance,
					onTypeChangeHandler,
					setSelectedConfig,
					type,
					onTestHandler,
					onSaveHandler,
					savingState,
					NotificationElement,
					title: 'Edit Notification Channels',
					initialValue,
					nameDisable: true,
				}}
			/>
		</>
	);
};

interface EditAlertChannelsProps {
	initialValue: Store;
}

export default EditAlertChannels;
