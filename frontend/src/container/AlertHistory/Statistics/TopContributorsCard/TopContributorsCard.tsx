import './topContributorsCard.styles.scss';

import { Progress } from 'antd';
import AlertPopover from 'container/AlertHistory/AlertPopover/AlertPopover';
import { ArrowRight } from 'lucide-react';
import AlertLabels from 'pages/AlertDetails/AlertHeader/AlertLabels/AlertLabels';

import { statsData, topContributorsData } from '../mocks';

function TopContributorsCard(): JSX.Element {
	return (
		<div className="top-contributors-card">
			<div className="top-contributors-card__header">
				<div className="title">top contributors</div>
				<div className="view-all">
					<div className="label">View all</div>
					<div className="icon">
						<ArrowRight size={14} color="var(--bg-vanilla-400)" />
					</div>
				</div>
			</div>
			<div className="top-contributors-card__content">
				{topContributorsData.contributors.slice(0, 3).map((contributor, index) => (
					<AlertPopover // eslint-disable-next-line react/no-array-index-key
						key={`contributor-${index}`}
					>
						<div className="contributors-row">
							<div className="labels-wrapper">
								<AlertLabels labels={contributor.labels} />
							</div>
							<div className="contribution-progress-bar">
								<Progress
									percent={(contributor.count / statsData.totalCurrentTriggers) * 100}
									showInfo={false}
									trailColor="rgba(255, 255, 255, 0)"
									strokeColor="var(--bg-robin-500)"
								/>
							</div>
							<div className="total-contribution">
								{contributor.count}/{statsData.totalCurrentTriggers}
							</div>
						</div>
					</AlertPopover>
				))}
			</div>
		</div>
	);
}

export default TopContributorsCard;
