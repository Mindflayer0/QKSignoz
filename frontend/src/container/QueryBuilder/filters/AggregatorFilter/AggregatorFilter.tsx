// ** Components
import { AutoComplete, Spin } from 'antd';
// ** Api
import { getAggregateAttribute } from 'api/queryBuilder/getAggregateAttribute';
import {
	baseAutoCompleteIdKeysOrder,
	QueryBuilderKeys,
	selectValueDivider,
} from 'constants/queryBuilder';
import { DEBOUNCE_DELAY } from 'constants/queryBuilderFilterConfig';
import useDebounce from 'hooks/useDebounce';
import { createIdFromObjectFields } from 'lib/createIdFromObjectFields';
import { chooseAutocompleteFromCustomValue } from 'lib/newQueryBuilder/chooseAutocompleteFromCustomValue';
import { getAutocompleteValueAndType } from 'lib/newQueryBuilder/getAutocompleteValueAndType';
import { transformStringWithPrefix } from 'lib/query/transformStringWithPrefix';
import { memo, useCallback, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from 'react-query';
import { SuccessResponse } from 'types/api';
import {
	BaseAutocompleteData,
	IQueryAutocompleteResponse,
} from 'types/api/queryBuilder/queryAutocompleteResponse';
import { DataSource } from 'types/common/queryBuilder';
import { ExtendedSelectOption } from 'types/common/select';
import { transformToUpperCase } from 'utils/transformToUpperCase';

import { selectStyle } from '../QueryBuilderSearch/config';
// ** Types
import { AgregatorFilterProps } from './AggregatorFilter.intefaces';

export const AggregatorFilter = memo(function AggregatorFilter({
	query,
	disabled,
	onChange,
}: AgregatorFilterProps): JSX.Element {
	const queryClient = useQueryClient();
	const [optionsData, setOptionsData] = useState<ExtendedSelectOption[]>([]);
	const [searchText, setSearchText] = useState<string>('');

	const debouncedSearchText = useMemo(() => {
		// eslint-disable-next-line @typescript-eslint/naming-convention, @typescript-eslint/no-unused-vars
		const [_, value] = getAutocompleteValueAndType(searchText);

		return value;
	}, [searchText]);

	const debouncedValue = useDebounce(debouncedSearchText, DEBOUNCE_DELAY);
	const { isFetching } = useQuery(
		[
			QueryBuilderKeys.GET_AGGREGATE_ATTRIBUTE,
			debouncedValue,
			query.aggregateOperator,
			query.dataSource,
		],
		async () =>
			getAggregateAttribute({
				searchText: debouncedValue,
				aggregateOperator: query.aggregateOperator,
				dataSource: query.dataSource,
			}),
		{
			enabled: !!query.aggregateOperator && !!query.dataSource,
			onSuccess: (data) => {
				const options: ExtendedSelectOption[] =
					data?.payload?.attributeKeys?.map(({ id: _, ...item }) => ({
						label: transformStringWithPrefix({
							str: item.key,
							prefix: item.type || '',
							condition: !item.isColumn,
						}),
						value: `${item.key}${selectValueDivider}${createIdFromObjectFields(
							item,
							baseAutoCompleteIdKeysOrder,
						)}`,
						key: createIdFromObjectFields(item, baseAutoCompleteIdKeysOrder),
					})) || [];

				setOptionsData(options);
			},
		},
	);

	const handleSearchText = useCallback((text: string): void => {
		setSearchText(text);
	}, []);

	const placeholder: string =
		query.dataSource === DataSource.METRICS
			? `${transformToUpperCase(query.dataSource)} name`
			: 'Aggregate attribute';

	const getAttributes = useCallback(
		(): BaseAutocompleteData[] =>
			queryClient.getQueryData<SuccessResponse<IQueryAutocompleteResponse>>([
				QueryBuilderKeys.GET_AGGREGATE_ATTRIBUTE,
				debouncedValue,
				query.aggregateOperator,
				query.dataSource,
			])?.payload.attributeKeys || [],
		[debouncedValue, query.aggregateOperator, query.dataSource, queryClient],
	);

	const handleChangeCustomValue = useCallback(
		(value: string) => {
			const aggregateAttributes = getAttributes();

			const customAttribute: BaseAutocompleteData = chooseAutocompleteFromCustomValue(
				aggregateAttributes,
				value,
			);

			onChange(customAttribute);
		},
		[getAttributes, onChange],
	);

	const handleBlur = useCallback(() => {
		if (searchText) {
			handleChangeCustomValue(searchText);
		}
	}, [handleChangeCustomValue, searchText]);

	const handleChange = useCallback(
		(
			value: string,
			option: ExtendedSelectOption | ExtendedSelectOption[],
		): void => {
			const currentOption = option as ExtendedSelectOption;

			const aggregateAttributes = getAttributes();

			if (currentOption.key) {
				const attribute = aggregateAttributes.find(
					(item) => item.id === currentOption.key,
				);

				if (attribute) {
					onChange(attribute);
				}
			} else {
				handleChangeCustomValue(value);
			}

			setSearchText('');
		},
		[getAttributes, handleChangeCustomValue, onChange],
	);

	const value = transformStringWithPrefix({
		str: query.aggregateAttribute.key,
		prefix: query.aggregateAttribute.type || '',
		condition: !query.aggregateAttribute.isColumn,
	});

	return (
		<AutoComplete
			placeholder={placeholder}
			style={selectStyle}
			showArrow={false}
			filterOption={false}
			onSearch={handleSearchText}
			notFoundContent={isFetching ? <Spin size="small" /> : null}
			options={optionsData}
			value={value}
			onBlur={handleBlur}
			onChange={handleChange}
			disabled={disabled}
		/>
	);
});
