import { CloseCircleFilled } from '@ant-design/icons';
import { useMachine } from '@xstate/react';
import { Button, Select } from 'antd';
import { RefSelectProps } from 'antd/lib/select';
import history from 'lib/history';
import { filter, flattenDeep, map, uniqWith } from 'lodash-es';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { Dashboard } from 'types/api/dashboard/getAll';
import AppReducer from 'types/reducer/app';
import { v4 as uuidv4 } from 'uuid';

import { DashboardSearchAndFilter } from './Dashboard.machine';
import { QueryChipContainer, QueryChipItem, SearchContainer } from './styles';
import { IOptionsData, IQueryStructure, TCategory, TOperator } from './types';
import {
	convertQueriesToURLQuery,
	convertURLQueryStringToQuery,
	executeSearchQueries,
} from './utils';

const OptionsSchemas = {
	attribute: {
		mode: undefined,
		options: [
			{
				name: 'Title',
			},
			{
				name: 'Description',
			},
			{
				name: 'Tags',
			},
		],
	},
	operator: {
		mode: undefined,
		options: [
			{
				value: '=',
				name: 'Equal',
			},
			{
				name: 'Not Equal',
				value: '!=',
			},
		],
	},
};

function QueryChip({
	queryData,
	onRemove,
}: {
	queryData: IQueryStructure;
	onRemove: (id: string) => void;
}): JSX.Element {
	const { category, operator, value, id } = queryData;
	return (
		<QueryChipContainer>
			<QueryChipItem>{category}</QueryChipItem>
			<QueryChipItem>{operator}</QueryChipItem>
			<QueryChipItem closable onClose={(): void => onRemove(id)}>
				{Array.isArray(value) ? value.join(', ') : null}
			</QueryChipItem>
		</QueryChipContainer>
	);
}

function OptionsValueResolution(
	category: TCategory,
	searchData: Dashboard[],
): Record<string, unknown> | IOptionsData {
	const OptionsValueSchema = {
		title: {
			mode: 'tags',
			options: uniqWith(
				map(searchData, (searchItem) => ({ name: searchItem.data.title })),
				(prev, next) => prev.name === next.name,
			),
		},
		description: {
			mode: 'tags',
			options: uniqWith(
				map(searchData, (searchItem) =>
					searchItem.data.description
						? {
								name: searchItem.data.description,
								value: searchItem.data.description,
						  }
						: null,
				).filter(Boolean),
				(prev, next) => prev?.name === next?.name,
			),
		},
		tags: {
			mode: 'tags',
			options: uniqWith(
				map(
					flattenDeep(
						map(searchData, (searchItem) => searchItem.data.tags).filter(Boolean),
					),
					(tag) => ({ name: tag }),
				),
				(prev, next) => prev.name === next.name,
			),
		},
	};

	return (
		OptionsValueSchema[category] ||
		({ mode: undefined, options: [] } as IOptionsData)
	);
}
function SearchFilter({
	searchData,
	filterDashboards,
}: {
	searchData: Dashboard[];
	filterDashboards: (filteredDashboards: Dashboard[]) => void;
}): JSX.Element {
	const { isDarkMode } = useSelector<AppState, AppReducer>((state) => state.app);
	const [category, setCategory] = useState<TCategory>();
	const [optionsData, setOptionsData] = useState<IOptionsData>(
		OptionsSchemas.attribute,
	);
	const selectRef = useRef() as React.MutableRefObject<RefSelectProps>;
	const [selectedValues, setSelectedValues] = useState<string[]>([]);
	const [staging, setStaging] = useState<string[] | string[][] | unknown[]>([]);
	const [queries, setQueries] = useState<IQueryStructure[]>([]);

	useEffect(() => {
		const searchQueryString = new URLSearchParams(history.location.search).get(
			'search',
		);
		if (searchQueryString)
			setQueries(convertURLQueryStringToQuery(searchQueryString) || []);
	}, []);
	useEffect(() => {
		filterDashboards(executeSearchQueries(queries, searchData));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [queries, searchData]);

	const updateURLWithQuery = useCallback(
		(inputQueries?: IQueryStructure[]): void => {
			history.push({
				pathname: history.location.pathname,
				search:
					inputQueries || queries
						? `?search=${convertQueriesToURLQuery(inputQueries || queries)}`
						: '',
			});
		},
		[queries],
	);

	useEffect(() => {
		if (Array.isArray(queries) && queries.length > 0) {
			updateURLWithQuery();
		}
	}, [queries, updateURLWithQuery]);

	const [state, send] = useMachine(DashboardSearchAndFilter, {
		actions: {
			onSelectCategory: () => {
				setOptionsData(OptionsSchemas.attribute);
			},
			onSelectOperator: () => {
				setOptionsData(OptionsSchemas.operator);
			},
			onSelectValue: () => {
				setOptionsData(
					OptionsValueResolution(category as TCategory, searchData) as IOptionsData,
				);
			},
			onBlurPurge: () => {
				setSelectedValues([]);
				setStaging([]);
			},
			onValidateQuery: () => {
				if (staging.length <= 2 && selectedValues.length === 0) {
					return;
				}
				setQueries([
					...queries,
					{
						id: uuidv4(),
						category: staging[0] as string,
						operator: staging[1] as TOperator,
						value: selectedValues,
					},
				]);
			},
		},
	});

	const nextState = (): void => {
		send('NEXT');
	};

	const removeQueryById = (queryId: string): void => {
		setQueries((queries) => {
			const updatedQueries = filter(queries, ({ id }) => id !== queryId);
			updateURLWithQuery(updatedQueries);
			return updatedQueries;
		});
	};

	const handleChange = (value: never | string[]): void => {
		if (!value) {
			return;
		}
		if (optionsData.mode) {
			setSelectedValues(value.filter(Boolean));
			return;
		}
		setStaging([...staging, value]);

		if (state.value === 'Category') {
			setCategory(`${value}`.toLowerCase() as TCategory);
		}
		nextState();
		setSelectedValues([]);
	};
	const handleFocus = (): void => {
		if (state.value === 'Idle') {
			send('NEXT');
			selectRef.current?.focus();
		}
	};

	const handleBlur = (): void => {
		send('onBlur');
		selectRef?.current?.blur();
	};

	const clearQueries = (): void => {
		setQueries([]);
		history.push({
			pathname: history.location.pathname,
			search: ``,
		});
	};

	return (
		<SearchContainer isDarkMode={isDarkMode}>
			<div
				style={{
					maxWidth: '70%',
					display: 'flex',
					overflowX: 'auto',
				}}
			>
				{map(queries, (query) => (
					<QueryChip key={query.id} queryData={query} onRemove={removeQueryById} />
				))}
				{map(staging, (value) => (
					<QueryChipItem key={JSON.stringify(value)}>
						{value as string}
					</QueryChipItem>
				))}
			</div>
			{optionsData && (
				<Select
					placeholder={
						!queries.length &&
						!staging.length &&
						!selectedValues.length &&
						'Search or Filter results'
					}
					size="small"
					ref={selectRef}
					mode={optionsData.mode as 'tags' | 'multiple'}
					style={{ flex: 1 }}
					onChange={handleChange}
					bordered={false}
					suffixIcon={null}
					value={selectedValues}
					onFocus={handleFocus}
					onBlur={handleBlur}
				>
					{optionsData.options &&
						Array.isArray(optionsData.options) &&
						optionsData.options.map(
							(optionItem): JSX.Element => {
								return (
									<Select.Option
										key={(optionItem.value as string) || (optionItem.name as string)}
										value={optionItem.value || optionItem.name}
									>
										{optionItem.name}
									</Select.Option>
								);
							},
						)}
				</Select>
			)}
			{queries && queries.length > 0 && (
				<Button icon={<CloseCircleFilled />} type="text" onClick={clearQueries} />
			)}
		</SearchContainer>
	);
}

export default SearchFilter;
