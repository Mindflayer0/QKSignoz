import './tabsAndFilters.styles.scss';

import { TimelineFilter, TimelineTab } from 'container/AlertHistory/types';
import { Info } from 'lucide-react';
import Tabs2 from 'periscope/components/Tabs2/Tabs2';

function ComingSoon(): JSX.Element {
	return (
		<div className="coming-soon">
			<div className="coming-soon__text">Coming Soon</div>
			<div className="coming-soon__icon">
				<Info size={10} color="var(--bg-sienna-400)" />
			</div>
		</div>
	);
}
function TimelineTabs(): JSX.Element {
	const tabs = [
		{
			value: TimelineTab.OVERALL_STATUS,
			label: 'Overall Status',
		},
		{
			value: TimelineTab.TOP_5_CONTRIBUTORS,
			label: (
				<div className="top-5-contributors">
					Top 5 Contributors
					<ComingSoon />
				</div>
			),
			disabled: true,
		},
	];

	return <Tabs2 tabs={tabs} initialSelectedTab={TimelineTab.OVERALL_STATUS} />;
}

function TimelineFilters(): JSX.Element {
	const tabs = [
		{
			value: TimelineFilter.ALL,
			label: 'All',
		},
		{
			value: TimelineFilter.FIRED,
			label: 'Fired',
		},
		{
			value: TimelineFilter.RESOLVED,
			label: 'Resolved',
		},
	];

	return (
		<Tabs2 tabs={tabs} initialSelectedTab={TimelineFilter.ALL} hasResetButton />
	);
}

function TabsAndFilters(): JSX.Element {
	return (
		<div className="timeline-tabs-and-filters">
			<TimelineTabs />
			<TimelineFilters />
		</div>
	);
}

export default TabsAndFilters;
