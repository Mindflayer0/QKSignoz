import { Card, Tag } from 'antd';
import { InitialRequestPayload, LatencyValue } from 'pages/TraceDetails';
import React from 'react';
import { TagItem } from 'store/actions';

const Filter = (props: FilterStateDisplayProps): JSX.Element => {
	const {
		latency,
		service,
		tags,
		operation,
		setSelectedTags,
		setSelectedOperation,
		setSelectedService,
		setLatencyFilterValues,
	} = props;

	function handleCloseTag(value: string): void {
		if (value === 'service') {
			setSelectedService('');
		}
		if (value === 'operation') {
			setSelectedOperation('');
		}
		if (value === 'maxLatency') {
			setLatencyFilterValues((value) => ({
				max: value.max,
				min: '',
			}));
		}
		if (value === 'minLatency') {
			setLatencyFilterValues((value) => ({
				min: value.min,
				max: '',
			}));
		}
	}

	function handleCloseTagElement(item: TagItem): void {
		setSelectedTags((tags) => tags.filter((e) => e.key !== item.key));
	}

	return (
		<Card>
			{service === '' || operation === undefined ? null : (
				<Tag
					closable
					onClose={(): void => {
						handleCloseTag('service');
					}}
				>
					service:{service}
				</Tag>
			)}
			{operation === '' || operation === undefined ? null : (
				<Tag
					closable
					onClose={(): void => {
						handleCloseTag('operation');
					}}
				>
					operation:{operation}
				</Tag>
			)}
			{latency === undefined || latency?.min === '' ? null : (
				<Tag
					closable
					onClose={(): void => {
						handleCloseTag('minLatency');
					}}
				>
					minLatency:
					{(parseInt(latency?.min || '0') / 1000000).toString()}ms
				</Tag>
			)}
			{latency === undefined || latency?.max === '' ? null : (
				<Tag
					closable
					onClose={(): void => {
						handleCloseTag('maxLatency');
					}}
				>
					maxLatency:
					{(parseInt(latency?.max || '0') / 1000000).toString()}ms
				</Tag>
			)}
			{tags === undefined
				? null
				: tags.map((item) => (
						<Tag
							closable
							key={`${item.key}-${item.operator}-${item.value}`}
							onClose={(): void => {
								handleCloseTagElement(item);
							}}
						>
							{item.key} {item.operator} {item.value}
						</Tag>
				  ))}
		</Card>
	);
};

export default Filter;

interface FilterStateDisplayProps {
	service: string;
	operation: string;
	latency: LatencyValue;
	tags: TagItem[];
	setSelectedTags: React.Dispatch<React.SetStateAction<TagItem[]>>;
	setSelectedOperation: React.Dispatch<React.SetStateAction<string>>;
	setSelectedService: React.Dispatch<React.SetStateAction<string>>;
	setLatencyFilterValues: React.Dispatch<React.SetStateAction<LatencyValue>>;
}
