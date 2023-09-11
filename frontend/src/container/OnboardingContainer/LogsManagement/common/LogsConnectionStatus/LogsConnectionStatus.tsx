/* eslint-disable no-plusplus */
import './LogsConnectionStatus.styles.scss';

import {
	CheckCircleTwoTone,
	CloseCircleTwoTone,
	LoadingOutlined,
} from '@ant-design/icons';
import { PANEL_TYPES } from 'constants/queryBuilder';
import Header from 'container/OnboardingContainer/common/Header/Header';
import { useGetExplorerQueryRange } from 'hooks/queryBuilder/useGetExplorerQueryRange';
import { useEffect, useState } from 'react';
import { ILog } from 'types/api/logs/log';
import { Query } from 'types/api/queryBuilder/queryBuilderData';
import { EQueryType } from 'types/common/dashboard';
import { DataSource } from 'types/common/queryBuilder';

interface ConnectionStatusProps {
	logType: string;
	activeStep: number;
}

const LogsTypePropertyMap = {
	kubernetes: 'k8s_pod_name',
	docker: 'container_id',
	otel: 'telemetry_sdk_language',
};

const enum ApplicationLogsType {
	FROM_LOG_FILE = 'from-log-file',
	USING_OTEL_COLLECTOR = 'using-otel-sdk',
}

export default function LogsConnectionStatus({
	logType,
	activeStep,
}: ConnectionStatusProps): JSX.Element {
	const [loading, setLoading] = useState(true);
	const [isReceivingData, setIsReceivingData] = useState(false);
	const [pollingInterval, setPollingInterval] = useState<number | false>(15000); // initial Polling interval of 15 secs , Set to false after 5 mins
	const [retryCount, setRetryCount] = useState(20); // Retry for 5 mins

	const requestData: Query = {
		queryType: EQueryType.QUERY_BUILDER,
		panelType: PANEL_TYPES.LIST,
		builder: {
			queryData: [
				{
					dataSource: DataSource.LOGS,
					queryName: 'A',
					aggregateOperator: 'noop',
					aggregateAttribute: {
						id: '------false',
						dataType: '',
						key: '',
						isColumn: false,
						type: '',
					},
					filters: {
						items: [],
						op: 'AND',
					},
					expression: 'A',
					disabled: false,
					having: [],
					stepInterval: 60,
					limit: null,
					orderBy: [
						{
							columnName: 'timestamp',
							order: 'desc',
						},
					],
					groupBy: [],
					legend: '',
					reduceTo: 'sum',
					offset: 0,
					pageSize: 100,
				},
			],
			queryFormulas: [],
		},
	};

	const {
		data,
		isFetching,
		error,
		isError,
		refetch: fetchLogs,
	} = useGetExplorerQueryRange(requestData, PANEL_TYPES.LIST, {
		keepPreviousData: true,
		refetchInterval: pollingInterval,
	});

	const verifyLogsData = (response): void => {
		if (response || !isError) {
			setLoading(false);
			setRetryCount(retryCount - 1);

			if (retryCount < 0) {
				setPollingInterval(false);
			}
		}

		const currentData = data?.payload.data.newResult.data.result || [];
		if (currentData.length > 0 && currentData[0].list) {
			const currentLogs: ILog[] = currentData[0].list.map((item) => ({
				...item.data,
				timestamp: item.timestamp,
			}));

			for (let index = 0; index < currentLogs.length; index++) {
				const log = currentLogs[index];

				if (
					(logType === 'kubernetes' && log['attributes_string']['k8s_pod_name']) ||
					(logType === 'docker' && log['attributes_string']['container_id'])
				) {
					setIsReceivingData(true);
					break;
				}
			}
		}
	};

	useEffect(() => {
		verifyLogsData(data);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isFetching, data, error, isError]);

	useEffect(() => {
		fetchLogs();
	}, []);

	const renderDocsReference = (): JSX.Element => {
		switch (logType) {
			case 'kubernetes':
				return (
					<Header
						entity="kubernetes"
						heading="Collecting Kubernetes Pod logs"
						imgURL="/Logos/kubernetes.svg"
						docsURL="https://signoz.io/docs/userguide/collect_kubernetes_pod_logs/#collect-kubernetes-pod-logs-in-signoz-cloud"
						imgClassName="supported-logs-type-img"
					/>
				);

			case 'docker':
				return (
					<Header
						entity="docker"
						heading="Collecting Docker container logs"
						imgURL="/Logos/docker.svg"
						docsURL="https://signoz.io/docs/userguide/collect_docker_logs/"
						imgClassName="supported-logs-type-img"
					/>
				);

			case 'syslogs':
				return (
					<Header
						entity="syslog"
						heading="Collecting Syslogs"
						imgURL="/Logos/syslogs.svg"
						docsURL="https://signoz.io/docs/userguide/collecting_syslogs/"
						imgClassName="supported-logs-type-img"
					/>
				);
			case 'nodejs':
				return (
					<Header
						entity="nodejs"
						heading="Collecting NodeJS winston logs"
						imgURL="/Logos/node-js.svg"
						docsURL="https://signoz.io/docs/userguide/collecting_nodejs_winston_logs/"
						imgClassName="supported-logs-type-img"
					/>
				);
			case 'nodejs':
				return (
					<Header
						entity="nodejs"
						heading="Collecting NodeJS winston logs"
						imgURL="/Logos/node-js.svg"
						docsURL="https://signoz.io/docs/userguide/collecting_nodejs_winston_logs/"
						imgClassName="supported-logs-type-img"
					/>
				);

			default:
				return (
					<Header
						entity="docker"
						heading={
							logType === ApplicationLogsType.FROM_LOG_FILE
								? 'Collecting Application Logs from Log file'
								: 'Collecting Application Logs Using OTEL SDK'
						}
						imgURL={`/Logos/${
							logType === ApplicationLogsType.FROM_LOG_FILE
								? 'software-window'
								: 'cmd-terminal'
						}.svg`}
						docsURL={
							logType === ApplicationLogsType.FROM_LOG_FILE
								? 'https://signoz.io/docs/userguide/collect_logs_from_file/'
								: 'https://signoz.io/docs/userguide/collecting_application_logs_otel_sdk_java/'
						}
						imgClassName="supported-logs-type-img"
					/>
				);
		}
	};

	return (
		<div className="connection-status-container">
			<div className="full-docs-link">{renderDocsReference()}</div>
			<div className="status-container">
				<div className="service-info">
					<div className="label"> Logs Type </div>
					<div className="language text-capitalize"> {logType} </div>
				</div>

				<div className="status-info">
					<div className="label"> Status </div>

					<div className="status">
						{(loading || isFetching) && <LoadingOutlined />}
						{!(loading || isFetching) && isReceivingData && (
							<>
								<CheckCircleTwoTone twoToneColor="#52c41a" />
								<span> Success </span>
							</>
						)}
						{!(loading || isFetching) && !isReceivingData && (
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
						{(loading || isFetching) && <div> Waiting for Update </div>}
						{!(loading || isFetching) && isReceivingData && (
							<div> Received logs successfully. </div>
						)}
						{!(loading || isFetching) && !isReceivingData && (
							<div> Couldn't detect the logs </div>
						)}
					</div>
				</div>
			</div>
		</div>
	);
}
