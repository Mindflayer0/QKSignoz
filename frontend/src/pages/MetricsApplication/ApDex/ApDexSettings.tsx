import { CloseOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import { Card, Input } from 'antd';
import { AxiosResponse } from 'axios';
import Spinner from 'components/Spinner';
import { themeColors } from 'constants/theme';
import { useSetApDexSettings } from 'hooks/apDex/useSetApDexSettings';
import { useNotifications } from 'hooks/useNotifications';
import { useEffect, useState } from 'react';
import { ApDexPayloadProps } from 'types/api/metrics/getApDex';

import {
	AppDexThresholdContainer,
	Button,
	ExcludeErrorCodeContainer,
	SaveAndCancelContainer,
	SaveButton,
	Typography,
} from '../styles';
import { onSaveApDexSettings } from '../utils';

function ApDexSettings({
	servicename,
	handlePopOverClose,
	isLoading,
	data,
	refetch,
}: ApDexSettingsProps): JSX.Element {
	const [thresholdValue, setThresholdValue] = useState(0);
	const { notifications } = useNotifications();

	const { isLoading: setApDexIsLoading, mutateAsync } = useSetApDexSettings({
		servicename,
		threshold: thresholdValue,
		excludeStatusCode: '',
	});

	useEffect(() => {
		if (data) {
			setThresholdValue(data.data[0].threshold);
		}
	}, [data]);

	const handleThreadholdChange = (
		e: React.ChangeEvent<HTMLInputElement>,
	): void => {
		setThresholdValue(Number(e.target.value));
	};

	const onSaveHandler = (): void => {
		onSaveApDexSettings({
			handlePopOverClose,
			mutateAsync,
			notifications,
			refetch,
			servicename,
			thresholdValue,
		});
	};

	if (isLoading) {
		return (
			<Typography.Text style={{ color: themeColors.white }}>
				<Spinner height="5vh" tip="Loading..." />
			</Typography.Text>
		);
	}

	return (
		<Card
			title="Application Settings"
			extra={<CloseOutlined width={10} height={10} onClick={handlePopOverClose} />}
			actions={[
				<SaveAndCancelContainer key="SaveAndCancelContainer">
					<Button onClick={handlePopOverClose}>Cancel</Button>
					<SaveButton
						onClick={onSaveHandler}
						type="primary"
						loading={setApDexIsLoading}
					>
						Save
					</SaveButton>
				</SaveAndCancelContainer>,
			]}
		>
			<AppDexThresholdContainer>
				<Typography>
					AppDex Threshold{' '}
					<Typography.Link>
						<QuestionCircleOutlined />
					</Typography.Link>
				</Typography>
				<Input
					type="number"
					value={thresholdValue}
					onChange={handleThreadholdChange}
					max={1}
					min={0}
				/>
			</AppDexThresholdContainer>
			<ExcludeErrorCodeContainer>
				<Typography.Text>
					Exclude following error codes from error rate calculation
				</Typography.Text>
				<Input placeholder="e.g. 406, 418" />
			</ExcludeErrorCodeContainer>
		</Card>
	);
}

interface ApDexSettingsProps {
	servicename: string;
	handlePopOverClose: () => void;
	isLoading?: boolean;
	data?: AxiosResponse<ApDexPayloadProps[]> | undefined;
	refetch?: () => void;
}

ApDexSettings.defaultProps = {
	isLoading: undefined,
	data: undefined,
	refetch: undefined,
};

export default ApDexSettings;
