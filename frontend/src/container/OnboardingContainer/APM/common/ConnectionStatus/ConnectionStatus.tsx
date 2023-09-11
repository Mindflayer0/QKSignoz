/* eslint-disable no-plusplus */
import './ConnectionStatus.styles.scss';

import {
	CheckCircleTwoTone,
	CloseCircleTwoTone,
	LoadingOutlined,
} from '@ant-design/icons';
import Header from 'container/OnboardingContainer/common/Header/Header';
import { useQueryService } from 'hooks/useQueryService';
import useResourceAttribute from 'hooks/useResourceAttribute';
import { convertRawQueriesToTraceSelectedTags } from 'hooks/useResourceAttribute/utils';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { GlobalReducer } from 'types/reducer/globalTime';
import { Tags } from 'types/reducer/trace';

interface ConnectionStatusProps {
	serviceName: string;
	language: string;
	framework: string;
	activeStep: number;
}

export default function ConnectionStatus({
	serviceName,
	language,
	framework,
	activeStep,
}: ConnectionStatusProps): JSX.Element {
	const { maxTime, minTime, selectedTime } = useSelector<
		AppState,
		GlobalReducer
	>((state) => state.globalTime);
	const { queries } = useResourceAttribute();
	const selectedTags = useMemo(
		() => (convertRawQueriesToTraceSelectedTags(queries) as Tags[]) || [],
		[queries],
	);

	const [pollingInterval, setPollingInterval] = useState<number | false>(15000); // initial Polling interval of 15 secs , Set to false after 5 mins
	const [retryCount, setRetryCount] = useState(20); // Retry for 5 mins
	const [loading, setLoading] = useState(true);
	const [isReceivingData, setIsReceivingData] = useState(false);

	const { data, error, isLoading, isError, refetch } = useQueryService({
		minTime,
		maxTime,
		selectedTime,
		selectedTags,
		options: {
			refetchInterval: pollingInterval,
		},
	});

	useEffect(() => {
		refetch();
	}, []);

	const renderDocsReference = (): JSX.Element => {
		switch (language) {
			case 'java':
				return (
					<Header
						entity="java"
						heading="Java OpenTelemetry Instrumentation"
						imgURL="/Logos/java.png"
						docsURL="https://signoz.io/docs/instrumentation/java/"
						imgClassName="supported-language-img"
					/>
				);

			case 'python':
				return (
					<Header
						entity="python"
						heading="Python OpenTelemetry Instrumentation"
						imgURL="/Logos/python.png"
						docsURL="https://signoz.io/docs/instrumentation/python/"
						imgClassName="supported-language-img"
					/>
				);

			case 'javascript':
				return (
					<Header
						entity="javascript"
						heading="Javascript OpenTelemetry Instrumentation"
						imgURL="/Logos/javascript.png"
						docsURL="https://signoz.io/docs/instrumentation/javascript/"
						imgClassName="supported-language-img"
					/>
				);
			case 'go':
				return (
					<Header
						entity="go"
						heading="Go OpenTelemetry Instrumentation"
						imgURL="/Logos/go.png"
						docsURL="https://signoz.io/docs/instrumentation/golang/"
						imgClassName="supported-language-img"
					/>
				);

			default:
				return <> </>;
		}
	};

	const verifyApplicationData = (response): void => {
		if (data || isError) {
			setLoading(false);
			setRetryCount(retryCount - 1);

			if (retryCount < 0) {
				setPollingInterval(false);
			}
		}

		if (response && Array.isArray(response)) {
			for (let i = 0; i < response.length; i++) {
				if (response[i]?.serviceName === serviceName) {
					setIsReceivingData(true);

					break;
				}
			}
		}
	};

	useEffect(() => {
		verifyApplicationData(data);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isLoading, data, error, isError]);

	return (
		<div className="connection-status-container">
			<div className="full-docs-link">{renderDocsReference()}</div>
			<div className="status-container">
				<div className="service-info">
					<div className="label"> Service Name </div>
					<div className="language">{serviceName}</div>
				</div>

				<div className="language-info">
					<div className="label"> Language - Framework </div>
					<div className="language">
						{language} - {framework}
					</div>
				</div>

				<div className="status-info">
					<div className="label"> Status </div>

					<div className="status">
						{(loading || isLoading) && <LoadingOutlined />}
						{!(loading || isLoading) && isReceivingData && (
							<>
								<CheckCircleTwoTone twoToneColor="#52c41a" />
								<span> Success </span>
							</>
						)}
						{!(loading || isLoading) && !isReceivingData && (
							<>
								<CloseCircleTwoTone twoToneColor="#e84749" />
								<span> Failed </span>
							</>
						)}
					</div>
				</div>
				<div className="details-info">
					<div className="label"> Details </div>

					<div className="details">
						{(loading || isLoading) && <div> Waiting for Update </div>}
						{!(loading || isLoading) && isReceivingData && (
							<div> Received data from the application successfully. </div>
						)}
						{!(loading || isLoading) && !isReceivingData && (
							<div> Couldn't detect the install </div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
