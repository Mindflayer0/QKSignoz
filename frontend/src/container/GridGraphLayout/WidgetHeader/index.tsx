import {
	CopyOutlined,
	DeleteOutlined,
	DownOutlined,
	EditFilled,
	ExclamationCircleOutlined,
	FullscreenOutlined,
	InfoCircleOutlined,
} from '@ant-design/icons';
import { Dropdown, MenuProps, Tooltip, Typography } from 'antd';
import { MenuItemType } from 'antd/es/menu/hooks/useItems';
import Spinner from 'components/Spinner';
import { queryParamNamesMap } from 'constants/queryBuilderQueryNames';
import useComponentPermission from 'hooks/useComponentPermission';
import history from 'lib/history';
import { useCallback, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import AppReducer from 'types/reducer/app';

import {
	errorTooltipPosition,
	overlayStyles,
	spinnerStyles,
	tooltipStyles,
} from './config';
import { MENUITEM_KEYS_VS_LABELS, MenuItemKeys } from './contants';
import DisplayThreshold from './DisplayThreshold';
import {
	ArrowContainer,
	HeaderContainer,
	HeaderContentContainer,
	ThesholdContainer,
	WidgetHeaderContainer,
} from './styles';
import {
	IWidgetHeaderProps,
	KeyMethodMappingProps,
	MenuItem,
	TWidgetOptions,
} from './types';
import { generateMenuList, isTWidgetOptions } from './utils';

function WidgetHeader({
	title,
	widget,
	onView,
	onDelete,
	onClone,
	parentHover,
	queryResponse,
	errorMessage,
	allowClone = true,
	allowDelete = true,
	allowEdit = true,
	allowThreshold = false,
	threshold,
}: IWidgetHeaderProps): JSX.Element {
	const [localHover, setLocalHover] = useState(false);
	const [isOpen, setIsOpen] = useState<boolean>(false);

	const onEditHandler = useCallback((): void => {
		const widgetId = widget.id;
		history.push(
			`${window.location.pathname}/new?widgetId=${widgetId}&graphType=${
				widget.panelTypes
			}&${queryParamNamesMap.compositeQuery}=${encodeURIComponent(
				JSON.stringify(widget.query),
			)}`,
		);
	}, [widget.id, widget.panelTypes, widget.query]);

	const keyMethodMapping: KeyMethodMappingProps<TWidgetOptions> = useMemo(
		() => ({
			view: {
				key: MenuItemKeys.View,
				method: onView,
			},
			edit: {
				key: MenuItemKeys.Edit,
				method: onEditHandler,
			},
			delete: {
				key: MenuItemKeys.Delete,
				method: onDelete,
			},
			clone: {
				key: MenuItemKeys.Clone,
				method: onClone,
			},
		}),
		[onDelete, onEditHandler, onView, onClone],
	);

	const onMenuItemSelectHandler: MenuProps['onClick'] = useCallback(
		({ key }: { key: string }): void => {
			if (isTWidgetOptions(key)) {
				const functionToCall = keyMethodMapping[key]?.method;
				if (functionToCall) {
					functionToCall();
					setIsOpen(false);
				}
			}
		},
		[keyMethodMapping],
	);
	const { role } = useSelector<AppState, AppReducer>((state) => state.app);

	const [deleteWidget, editWidget] = useComponentPermission(
		['delete_widget', 'edit_widget'],
		role,
	);

	const actions = useMemo(
		(): MenuItem[] => [
			{
				key: MenuItemKeys.View,
				icon: <FullscreenOutlined />,
				label: MENUITEM_KEYS_VS_LABELS[MenuItemKeys.View],
				isVisible: true,
				disabled: queryResponse.isLoading,
			},
			{
				key: MenuItemKeys.Edit,
				icon: <EditFilled />,
				label: MENUITEM_KEYS_VS_LABELS[MenuItemKeys.Edit],
				isVisible: allowEdit,
				disabled: !editWidget,
			},
			{
				key: MenuItemKeys.Clone,
				icon: <CopyOutlined />,
				label: MENUITEM_KEYS_VS_LABELS[MenuItemKeys.Clone],
				isVisible: allowClone,
				disabled: !editWidget,
			},
			{
				key: MenuItemKeys.Delete,
				icon: <DeleteOutlined />,
				label: MENUITEM_KEYS_VS_LABELS[MenuItemKeys.Delete],
				isVisible: allowDelete,
				disabled: !deleteWidget,
				danger: true,
			},
		],
		[
			allowEdit,
			allowClone,
			allowDelete,
			queryResponse.isLoading,
			deleteWidget,
			editWidget,
		],
	);

	const menuList: MenuItemType[] = useMemo(
		(): MenuItemType[] => generateMenuList(actions, keyMethodMapping),
		[actions, keyMethodMapping],
	);

	const onClickHandler = useCallback(() => {
		setIsOpen((open) => !open);
	}, []);

	const menu = useMemo(
		() => ({
			items: menuList,
			onClick: onMenuItemSelectHandler,
		}),
		[menuList, onMenuItemSelectHandler],
	);

	return (
		<WidgetHeaderContainer>
			<Dropdown
				destroyPopupOnHide
				open={isOpen}
				onOpenChange={setIsOpen}
				menu={menu}
				trigger={['click']}
				overlayStyle={overlayStyles}
			>
				<HeaderContainer
					onMouseOver={(): void => setLocalHover(true)}
					onMouseOut={(): void => setLocalHover(false)}
					hover={localHover}
					onClick={onClickHandler}
				>
					<HeaderContentContainer>
						<Typography.Text style={{ maxWidth: '80%' }} ellipsis>
							{title}
						</Typography.Text>
						<ArrowContainer hover={parentHover}>
							<DownOutlined />
						</ArrowContainer>
					</HeaderContentContainer>
				</HeaderContainer>
			</Dropdown>
			<ThesholdContainer>
				{allowThreshold && (
					<DisplayThreshold threshold={threshold || <InfoCircleOutlined />} />
				)}
			</ThesholdContainer>
			{queryResponse.isFetching && !queryResponse.isError && (
				<Spinner height="5vh" style={spinnerStyles} />
			)}
			{queryResponse.isError && (
				<Tooltip title={errorMessage} placement={errorTooltipPosition}>
					<ExclamationCircleOutlined style={tooltipStyles} />
				</Tooltip>
			)}
		</WidgetHeaderContainer>
	);
}

WidgetHeader.defaultProps = {
	onDelete: undefined,
	onClone: undefined,
	allowDelete: true,
	allowClone: true,
	allowEdit: true,
	allowThreshold: false,
	threshold: undefined,
};

export default WidgetHeader;
