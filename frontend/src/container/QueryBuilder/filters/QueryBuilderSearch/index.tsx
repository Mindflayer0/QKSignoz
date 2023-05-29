import { Select, Spin, Tag, Tooltip } from 'antd';
import useAggregateKeys from 'container/QueryBuilder/hooks/useAggregateKeys';
import { useAutoComplete } from 'hooks/queryBuilder/useAutoComplete';
import {
	KeyboardEvent,
	ReactElement,
	ReactNode,
	useEffect,
	useMemo,
	useState,
} from 'react';
import {
	IBuilderQuery,
	TagFilter,
} from 'types/api/queryBuilder/queryBuilderData';
import { DataSource } from 'types/common/queryBuilder';
import { v4 as uuid } from 'uuid';

import { selectStyle } from './config';
import { StyledCheckOutlined, TypographyText } from './style';
import {
	getOperatorValue,
	getRemovePrefixFromKey,
	getTagToken,
	isExistsNotExistsOperator,
	isInNInOperator,
} from './utils';

function QueryBuilderSearch({
	query,
	onChange,
}: QueryBuilderSearchProps): JSX.Element {
	const [currentSearchValue, setCurrentSearchValue] = useState<string>('');

	const {
		updateTag,
		handleClearTag,
		handleKeyDown,
		handleSearch,
		handleSelect,
		tags,
		options,
		searchValue,
		isMulti,
		isFetching,
		setSearchKey,
	} = useAutoComplete(query);

	const { data } = useAggregateKeys({ query, searchValue: currentSearchValue });

	const onTagRender = ({
		value,
		closable,
		onClose,
	}: CustomTagProps): ReactElement => {
		const { tagOperator } = getTagToken(value);
		const isInNin = isInNInOperator(tagOperator);
		const chipValue = isInNin
			? value?.trim()?.replace(/,\s*$/, '')
			: value?.trim();

		const onCloseHandler = (): void => {
			onClose();
			handleSearch('');
			setSearchKey('');
		};

		const tagEditHandler = (value: string): void => {
			updateTag(value);
			handleSearch(value);
		};

		return (
			<Tag closable={!searchValue && closable} onClose={onCloseHandler}>
				<Tooltip title={chipValue}>
					<TypographyText
						ellipsis
						$isInNin={isInNin}
						disabled={!!searchValue}
						$isEnabled={!!searchValue}
						onClick={(): void => tagEditHandler(value)}
					>
						{chipValue}
					</TypographyText>
				</Tooltip>
			</Tag>
		);
	};

	const onChangeHandler = (value: string[]): void => {
		if (!isMulti) handleSearch(value[value.length - 1]);
	};

	const onInputKeyDownHandler = (event: KeyboardEvent<Element>): void => {
		if (isMulti || event.key === 'Backspace') handleKeyDown(event);
		if (isExistsNotExistsOperator(searchValue)) handleKeyDown(event);
	};

	const isMetricsDataSource = useMemo(
		() => query.dataSource === DataSource.METRICS,
		[query.dataSource],
	);

	const queryTags = useMemo(() => {
		if (!query.aggregateAttribute.key && isMetricsDataSource) return [];
		return tags;
	}, [isMetricsDataSource, query.aggregateAttribute.key, tags]);

	useEffect(() => {
		onChange({
			items: tags.map((tag) => {
				const { tagKey, tagOperator, tagValue } = getTagToken(tag);
				setCurrentSearchValue(getRemovePrefixFromKey(tagKey));
				const filterAttribute = (data?.payload?.attributeKeys || []).find(
					(key) => key.key === getRemovePrefixFromKey(tagKey),
				);
				return {
					id: uuid().slice(0, 8),
					key: filterAttribute ?? {
						key: tagKey,
						dataType: null,
						type: null,
						isColumn: null,
					},
					op: getOperatorValue(tagOperator),
					value:
						tagValue[tagValue.length - 1] === ''
							? tagValue?.slice(0, -1)
							: tagValue ?? '',
				};
			}),
			op: 'AND',
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [data?.payload?.attributeKeys, tags]);

	return (
		<Select
			virtual
			showSearch
			tagRender={onTagRender}
			filterOption={false}
			autoClearSearchValue={false}
			mode="multiple"
			placeholder="Search Filter"
			value={queryTags}
			searchValue={searchValue}
			disabled={isMetricsDataSource && !query.aggregateAttribute.key}
			style={selectStyle}
			onSearch={handleSearch}
			onChange={onChangeHandler}
			onSelect={handleSelect}
			onDeselect={handleClearTag}
			onInputKeyDown={onInputKeyDownHandler}
			notFoundContent={isFetching ? <Spin size="small" /> : null}
		>
			{options.map((option) => (
				<Select.Option key={option.label} value={option.label}>
					{option.label}
					{option.selected && <StyledCheckOutlined />}
				</Select.Option>
			))}
		</Select>
	);
}

interface QueryBuilderSearchProps {
	query: IBuilderQuery;
	onChange: (value: TagFilter) => void;
}

export interface CustomTagProps {
	label: ReactNode;
	value: string;
	disabled: boolean;
	onClose: () => void;
	closable: boolean;
}

export default QueryBuilderSearch;
