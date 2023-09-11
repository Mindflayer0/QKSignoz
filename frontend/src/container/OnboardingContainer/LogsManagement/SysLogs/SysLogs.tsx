import { MDXProvider } from '@mdx-js/react';

import { Steps } from 'antd';

import Post from './syslogs.md';
import ConnectionStatus from '../common/LogsConnectionStatus/LogsConnectionStatus';
import Header from 'container/OnboardingContainer/common/Header/Header';

export default function SysLogs({ activeStep }): JSX.Element {
	return (
		<>
			{activeStep === 2 && (
				<div className="golang-setup-instructions-container">
					<Header
						entity="syslogs"
						heading="Collecting Syslogs"
						imgURL="/Logos/syslogs.svg"
						docsURL="https://signoz.io/docs/userguide/collecting_syslogs/"
						imgClassName="supported-logs-type-img"
					/>

					<div className="content-container">
						<MDXProvider>
							<Post />
						</MDXProvider>
					</div>
				</div>
			)}
			{activeStep === 3 && (
				<div className="connection-status-container">
					<ConnectionStatus logType="syslogs" activeStep={activeStep} />
				</div>
			)}
		</>
	);
}
