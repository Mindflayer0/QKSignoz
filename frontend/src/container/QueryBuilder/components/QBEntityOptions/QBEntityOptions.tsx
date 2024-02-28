import './QBEntityOptions.styles.scss';

import { Button } from 'antd';
import { noop } from 'antd/lib/_util/warning';
import cx from 'classnames';
import { isFunction } from 'lodash-es';
import { ChevronDown, ChevronRight, Eye, EyeOff, Trash2 } from 'lucide-react';
import {
	IBuilderQuery,
	QueryFunctionProps,
} from 'types/api/queryBuilder/queryBuilderData';

import QueryFunctions from '../QueryFunctions/QueryFunctions';

interface QBEntityOptionsProps {
	query?: IBuilderQuery;
	isMetricsDataSource?: boolean;
	showFunctions?: boolean;
	isCollapsed: boolean;
	entityType: string;
	entityData: any;
	onDelete: () => void;
	onCloneQuery?: (type: string, query: IBuilderQuery) => void;
	onToggleVisibility: () => void;
	onCollapseEntity: () => void;
	onQueryFunctionsUpdates?: (functions: QueryFunctionProps[]) => void;
	showDeleteButton: boolean;
	isListViewPanel?: boolean;
}

export default function QBEntityOptions({
	query,
	isMetricsDataSource,
	isCollapsed,
	showFunctions,
	entityType,
	entityData,
	onDelete,
	onCloneQuery,
	onToggleVisibility,
	onCollapseEntity,
	showDeleteButton,
	onQueryFunctionsUpdates,
	isListViewPanel,
}: QBEntityOptionsProps): JSX.Element {
	const handleCloneEntity = (): void => {
		if (isFunction(onCloneQuery)) {
			onCloneQuery(entityType, entityData);
		}
	};

	return (
		<div className="qb-entity-options">
			<div className="left-col-items">
				<div className="options periscope-btn-group">
					<Button.Group>
						<Button
							value="search"
							className="periscope-btn collapse"
							onClick={onCollapseEntity}
						>
							{isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
						</Button>
						<Button
							value="query-builder"
							className="periscope-btn visibility-toggle"
							onClick={onToggleVisibility}
							disabled={isListViewPanel}
						>
							{entityData.disabled ? <EyeOff size={16} /> : <Eye size={16} />}
						</Button>

						{entityType === 'query' && (
							<Tooltip title="Clone Query">
								<Button className={cx('periscope-btn')} onClick={handleCloneEntity}>
									<Copy size={14} />
								</Button>
							</Tooltip>
						)}

						<Button
							className={cx(
								'periscope-btn',
								entityType === 'query' ? 'query-name' : 'formula-name',
							)}
						>
							{entityData.queryName}
						</Button>

						<Button
							className={cx(
								'periscope-btn',
								entityType === 'query' ? 'query-name' : 'formula-name',
							)}
						>
							{entityData.queryName}
						</Button>

						{showFunctions &&
							isMetricsDataSource &&
							query &&
							onQueryFunctionsUpdates && (
								<QueryFunctions
									queryFunctions={query.functions}
									onChange={onQueryFunctionsUpdates}
								/>
							)}
					</Button.Group>

					{isCollapsed && (
						<div className="title">
							<span className="entityType"> {entityType} </span> -{' '}
							<span className="entityData"> {entityData.queryName} </span>
						</div>
					)}

					{showDeleteButton && (
						<Button className="periscope-btn ghost" onClick={onDelete}>
							<Trash2 size={14} />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

QBEntityOptions.defaultProps = {
	isListViewPanel: false,
	query: undefined,
	isMetricsDataSource: false,
	onQueryFunctionsUpdates: undefined,
	showFunctions: false,
	onCloneQuery: noop,
};
