import {
	DeleteOutlined,
	DownOutlined,
	EditFilled,
	ExclamationCircleOutlined,
	FullscreenOutlined,
} from '@ant-design/icons';
import { Dropdown, Menu, Tooltip, Typography } from 'antd';
import Spinner from 'components/Spinner';
import useComponentPermission from 'hooks/useComponentPermission';
import history from 'lib/history';
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { Widgets } from 'types/api/dashboard/getAll';
import AppReducer from 'types/reducer/app';

import { GridCardGraphState } from '../Graph';
import { errorTooltipPosition, spinnerStyles, tooltipStyles } from './config';
import {
	ArrowContainer,
	HeaderContainer,
	HeaderContentContainer,
	MenuItemContainer,
} from './styles';

type TWidgetOptions = 'view' | 'edit' | 'delete' | string;
interface IWidgetHeaderProps {
	title: string;
	widget: Widgets;
	onView: VoidFunction;
	onDelete: VoidFunction;
	parentHover: boolean;
	state: GridCardGraphState;
	isEmptyLayout: boolean;
}
function WidgetHeader({
	title,
	widget,
	onView,
	onDelete,
	parentHover,
	state,
	isEmptyLayout,
}: IWidgetHeaderProps): JSX.Element {
	const [localHover, setLocalHover] = useState(false);

	const onEditHandler = (): void => {
		const widgetId = widget.id;
		history.push(
			`${window.location.pathname}/new?widgetId=${widgetId}&graphType=${widget.panelTypes}`,
		);
	};

	const keyMethodMapping: {
		[K in TWidgetOptions]: { key: TWidgetOptions; method: VoidFunction };
	} = {
		view: {
			key: 'view',
			method: onView,
		},
		edit: {
			key: 'edit',
			method: onEditHandler,
		},
		delete: {
			key: 'delete',
			method: onDelete,
		},
	};
	const onMenuItemSelectHandler = ({ key }: { key: TWidgetOptions }): void => {
		keyMethodMapping[key]?.method();
	};
	const { role } = useSelector<AppState, AppReducer>((state) => state.app);

	const [deleteWidget, editWidget] = useComponentPermission(
		['delete_widget', 'edit_widget'],
		role,
	);

	const menu = (
		<Menu onClick={onMenuItemSelectHandler}>
			<Menu.Item key={keyMethodMapping.view.key}>
				<MenuItemContainer>
					<span>View</span> <FullscreenOutlined />
				</MenuItemContainer>
			</Menu.Item>

			{editWidget && (
				<Menu.Item key={keyMethodMapping.edit.key}>
					<MenuItemContainer>
						<span>Edit</span> <EditFilled />
					</MenuItemContainer>
				</Menu.Item>
			)}

			{deleteWidget && (
				<>
					<Menu.Divider />
					<Menu.Item key={keyMethodMapping.delete.key} danger>
						<MenuItemContainer>
							<span>Delete</span> <DeleteOutlined />
						</MenuItemContainer>
					</Menu.Item>
				</>
			)}
		</Menu>
	);

	return (
		<Dropdown
			overlay={menu}
			trigger={['click']}
			overlayStyle={{ minWidth: 100 }}
			placement="bottom"
		>
			<>
				<HeaderContainer
					onMouseOver={(): void => setLocalHover(true)}
					onMouseOut={(): void => setLocalHover(false)}
					hover={localHover}
				>
					<HeaderContentContainer onClick={(e): void => e.preventDefault()}>
						<Typography.Text style={{ maxWidth: '80%' }} ellipsis>
							{title}
						</Typography.Text>
						<ArrowContainer hover={parentHover}>
							<DownOutlined />
						</ArrowContainer>
					</HeaderContentContainer>
				</HeaderContainer>
				{(state.loading === true || state.payload === undefined) &&
					!state.error &&
					!isEmptyLayout && <Spinner height="5vh" customStyle={spinnerStyles} />}
				{state.error && state.errorMessage && !isEmptyLayout && (
					<Tooltip
						title={state.errorMessage}
						placement={errorTooltipPosition}
						zIndex={9999}
					>
						<ExclamationCircleOutlined style={tooltipStyles} />
					</Tooltip>
				)}
			</>
		</Dropdown>
	);
}

export default WidgetHeader;
