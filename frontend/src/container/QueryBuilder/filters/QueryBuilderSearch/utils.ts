import { OPERATORS } from 'constants/queryBuilder';
import { MetricsType } from 'container/MetricsApplication/constant';
import { Option } from 'container/QueryBuilder/type';
import { queryFilterTags } from 'hooks/queryBuilder/useTag';
import { parse } from 'papaparse';
import { TagFilter } from 'types/api/queryBuilder/queryBuilderData';

import { orderByValueDelimiter } from '../OrderByFilter/utils';

// eslint-disable-next-line no-useless-escape
export const tagRegexp = /^\s*(.*?)\s*(\bIN\b|\bNOT_IN\b|\bLIKE\b|\bNOT_LIKE\b|\bREGEX\b|\bNOT_REGEX\b|=|!=|\bEXISTS\b|\bNOT_EXISTS\b|\bCONTAINS\b|\bNOT_CONTAINS\b|>=|>|<=|<|\bHAS\b|\bNHAS\b)\s*(.*)$/gi;

export enum OptionGroups {
	SUGGESTED_FILTERS = 'Suggested Filters',
}

export interface IOptionGroup {
	label: OptionGroups;
	title: string;
	options: Option[];
}

const baseOptionGroups = [
	{
		label: OptionGroups.SUGGESTED_FILTERS,
		title: 'Suggested Filters',
		options: [],
	},
];
export function isInNInOperator(value: string): boolean {
	return value === OPERATORS.IN || value === OPERATORS.NIN;
}

interface ITagToken {
	tagKey: string;
	tagOperator: string;
	tagValue: string[];
}

export function getTagToken(tag: string): ITagToken {
	const matches = tag?.matchAll(tagRegexp);
	const [match] = matches ? Array.from(matches) : [];

	if (match) {
		const [, matchTagKey, matchTagOperator, matchTagValue] = match;
		return {
			tagKey: matchTagKey,
			tagOperator: matchTagOperator.toUpperCase(),
			tagValue: isInNInOperator(matchTagOperator.toUpperCase())
				? parse(matchTagValue).data.flat()
				: matchTagValue,
		} as ITagToken;
	}

	return {
		tagKey: tag,
		tagOperator: '',
		tagValue: [],
	};
}

export function isExistsNotExistsOperator(value: string): boolean {
	const { tagOperator } = getTagToken(value);
	return (
		tagOperator?.trim() === OPERATORS.NOT_EXISTS ||
		tagOperator?.trim() === OPERATORS.EXISTS
	);
}

export function getRemovePrefixFromKey(tag: string): string {
	return tag?.replace(/^(tag_|resource_)/, '').trim();
}

export function getOperatorValue(op: string): string {
	switch (op) {
		case 'IN':
			return 'in';
		case 'NOT_IN':
			return 'nin';
		case OPERATORS.REGEX:
			return 'regex';
		case OPERATORS.HAS:
			return 'has';
		case OPERATORS.NHAS:
			return 'nhas';
		case OPERATORS.NREGEX:
			return 'nregex';
		case 'LIKE':
			return 'like';
		case 'NOT_LIKE':
			return 'nlike';
		case 'EXISTS':
			return 'exists';
		case 'NOT_EXISTS':
			return 'nexists';
		case 'CONTAINS':
			return 'contains';
		case 'NOT_CONTAINS':
			return 'ncontains';
		default:
			return op;
	}
}

export function getOperatorFromValue(op: string): string {
	switch (op) {
		case 'in':
			return 'IN';
		case 'nin':
			return 'NOT_IN';
		case 'like':
			return 'LIKE';
		case 'regex':
			return OPERATORS.REGEX;
		case 'nregex':
			return OPERATORS.NREGEX;
		case 'nlike':
			return 'NOT_LIKE';
		case 'exists':
			return 'EXISTS';
		case 'nexists':
			return 'NOT_EXISTS';
		case 'contains':
			return 'CONTAINS';
		case 'ncontains':
			return 'NOT_CONTAINS';
		case 'has':
			return OPERATORS.HAS;
		case 'nhas':
			return OPERATORS.NHAS;
		default:
			return op;
	}
}

export function replaceStringWithMaxLength(
	mainString: string,
	array: string[],
	replacementString: string,
): string {
	const lastSearchValue = array.pop() ?? '';
	if (lastSearchValue === '') {
		return `${mainString}${replacementString},`;
	}
	/**
	 * We need to escape the special characters in the lastSearchValue else the
	 * new RegExp fails with error range out of order in char class
	 */
	const escapedLastSearchValue = lastSearchValue.replace(
		/[-/\\^$*+?.()|[\]{}]/g,
		'\\$&',
	);

	const updatedString = mainString.replace(
		new RegExp(`${escapedLastSearchValue}(?=[^${escapedLastSearchValue}]*$)`),
		replacementString,
	);
	return `${updatedString},`;
}

export function checkCommaInValue(str: string): string {
	return str.includes(',') ? `"${str}"` : str;
}

export function getRemoveOrderFromValue(tag: string): string {
	const match = parse(tag, { delimiter: orderByValueDelimiter });
	if (match) {
		const [key] = match.data.flat() as string[];
		return key;
	}
	return tag;
}

export function getOptionType(label: string): MetricsType | undefined {
	let optionType;

	if (label.startsWith('tag_')) {
		optionType = MetricsType.Tag;
	} else if (label.startsWith('resource_')) {
		optionType = MetricsType.Resource;
	}

	return optionType;
}

/**
 *
 * @param exampleQueries the example queries based on recommendation engine
 * @returns the data formatted to the Option[]
 */
export function convertExampleQueriesToOptions(
	exampleQueries: TagFilter[],
): Option[] {
	return exampleQueries.map((query) => ({
		value: queryFilterTags(query).join(' , '),
		label: queryFilterTags(query).join(' , '),
	}));
}

export const sampleExampleQueries = [
	{
		items: [
			{
				id: '7cbade63',
				key: {
					key: 'container_id',
					dataType: 'string',
					type: 'tag',
					isColumn: false,
					isJSON: false,
					id: 'container_id--string--tag--false',
				},
				op: '=',
				value: 'debian',
			},
			{
				id: '4094be10',
				key: {
					key: 'container_name',
					dataType: 'string',
					type: 'tag',
					isColumn: false,
					isJSON: false,
					id: 'container_name--string--tag--false',
				},
				op: '=',
				value: 'hotrod',
			},
		],
		op: 'AND',
	},
	{
		items: [
			{
				id: '7cbade63',
				key: {
					key: 'container_id',
					dataType: 'string',
					type: 'tag',
					isColumn: false,
					isJSON: false,
					id: 'container_id--string--tag--false',
				},
				op: '=',
				value: 'debian',
			},
			{
				id: '4094be10',
				key: {
					key: 'container_name',
					dataType: 'string',
					type: 'tag',
					isColumn: false,
					isJSON: false,
					id: 'container_name--string--tag--false',
				},
				op: '=',
				value: 'xyz',
			},
		],
		op: 'AND',
	},
];

export function getOptionGroupsForLogsExplorer(keys: Option[]): IOptionGroup[] {
	return baseOptionGroups.map((optionGroup) => {
		if (optionGroup.label === OptionGroups.SUGGESTED_FILTERS) {
			return { ...optionGroup, options: keys };
		}
		return optionGroup;
	});
}
