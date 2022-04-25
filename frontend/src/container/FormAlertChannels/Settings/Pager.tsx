import { Input } from 'antd';
import FormItem from 'antd/lib/form/FormItem';
import React from 'react';
import { useTranslation } from 'react-i18next';

import { PagerChannel } from '../../CreateAlertChannels/config';

const { TextArea } = Input;

function PagerForm({ setSelectedConfig }: PagerFormProps): JSX.Element {
	const { t } = useTranslation('channels');
	return (
		<>
			<FormItem name="routing_key" label={t('field_pager_routing_key')} required>
				<Input
					onChange={(event): void => {
						setSelectedConfig((value) => ({
							...value,
							routing_key: event.target.value,
						}));
					}}
				/>
			</FormItem>

			<FormItem
				name="description"
				help={t('help_pager_description')}
				label={t('field_pager_description')}
				required
			>
				<TextArea
					rows={4}
					onChange={(event): void =>
						setSelectedConfig((value) => ({
							...value,
							description: event.target.value,
						}))
					}
					placeholder={t('placeholder_pager_description')}
				/>
			</FormItem>

			<FormItem
				name="severity"
				help={t('help_pager_severity')}
				label={t('field_pager_severity')}
			>
				<Input
					onChange={(event): void =>
						// todo: add validation
						setSelectedConfig((value) => ({
							...value,
							severity: event.target.value,
						}))
					}
				/>
			</FormItem>

			<FormItem
				name="details"
				help={t('help_pager_details')}
				label={t('field_pager_details')}
			>
				<TextArea
					rows={4}
					onChange={(event): void =>
						setSelectedConfig((value) => ({
							...value,
							details: event.target.value,
						}))
					}
				/>
			</FormItem>

			<FormItem
				name="component"
				help={t('help_pager_component')}
				label={t('field_pager_component')}
			>
				<Input
					onChange={(event): void =>
						setSelectedConfig((value) => ({
							...value,
							component: event.target.value,
						}))
					}
				/>
			</FormItem>

			<FormItem
				name="group"
				help={t('help_pager_group')}
				label={t('field_pager_group')}
			>
				<Input
					onChange={(event): void =>
						setSelectedConfig((value) => ({
							...value,
							group: event.target.value,
						}))
					}
				/>
			</FormItem>

			<FormItem
				name="class"
				help={t('help_pager_class')}
				label={t('field_pager_class')}
			>
				<Input
					onChange={(event): void =>
						setSelectedConfig((value) => ({
							...value,
							class: event.target.value,
						}))
					}
				/>
			</FormItem>
			<FormItem
				name="client"
				help={t('help_pager_client')}
				label={t('field_pager_client')}
			>
				<Input
					onChange={(event): void =>
						setSelectedConfig((value) => ({
							...value,
							client: event.target.value,
						}))
					}
				/>
			</FormItem>

			<FormItem
				name="client_url"
				help={t('help_pager_client_url')}
				label={t('field_pager_client_url')}
			>
				<Input
					onChange={(event): void =>
						setSelectedConfig((value) => ({
							...value,
							client_url: event.target.value,
						}))
					}
				/>
			</FormItem>
		</>
	);
}

interface PagerFormProps {
	setSelectedConfig: React.Dispatch<React.SetStateAction<Partial<PagerChannel>>>;
}

export default PagerForm;
