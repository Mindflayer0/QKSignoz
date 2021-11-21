import { Tag } from 'antd';
import React from 'react';

const Severity = ({ severity }: SeverityProps): JSX.Element => {
	switch (severity) {
		case 'unprocessed': {
			return <Tag color="green">UnProcessed</Tag>;
		}

		case 'active': {
			return <Tag color="green">Active</Tag>;
		}

		case 'suppressed': {
			return <Tag color="red">Suppressed</Tag>;
		}

		default: {
			return <Tag color="default">Unknown Status</Tag>;
		}
	}
};

interface SeverityProps {
	severity: string;
}

export default Severity;
