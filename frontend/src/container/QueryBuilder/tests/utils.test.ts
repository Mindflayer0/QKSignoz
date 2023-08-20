import { BaseAutocompleteData } from 'types/api/queryBuilder/queryAutocompleteResponse';

import {
	getLabelFromValue,
	mapLabelValuePairs,
} from '../filters/OrderByFilter/utils';
import {
	isExistsNotExistsOperator,
	isInNInOperator,
} from '../filters/QueryBuilderSearch/utils';

describe('isInNInOperator', () => {
	test('returns true if the value contains the IN operator', () => {
		expect(isInNInOperator('service_name IN ab, cd, 1')).toBe(true);
	});

	test('returns true if the value contains the NIN operator', () => {
		expect(isInNInOperator('service_name NIN ab, cd, 1')).toBe(true);
	});
});

describe('isExistsNotExistsOperator', () => {
	test('returns true if the value contains the EXISTS operator', () => {
		expect(isExistsNotExistsOperator('service_name EXISTS')).toBe(true);
	});

	test('returns true if the value contains the NOT_EXISTS operator', () => {
		expect(isExistsNotExistsOperator('service_name NOT_EXISTS')).toBe(true);
	});
});

describe('mapLabelValuePairs', () => {
	it('should return an array of label-value pairs', () => {
		const arr: BaseAutocompleteData[] = [
			{ key: 'name', dataType: 'string', isColumn: true, type: 'tag' },
			{ key: 'age', dataType: 'float64', isColumn: true, type: 'tag' },
			{ key: 'created_at', dataType: 'int64', isColumn: true, type: 'tag' },
		];
		const result = mapLabelValuePairs(arr);
		expect(result).toEqual([
			[
				{ label: 'name asc', value: 'name|asc' },
				{ label: 'name desc', value: 'name|desc' },
			],
			[
				{ label: 'age asc', value: 'age|asc' },
				{ label: 'age desc', value: 'age|desc' },
			],
			[
				{ label: 'created_at asc', value: 'created_at|asc' },
				{ label: 'created_at desc', value: 'created_at|desc' },
			],
		]);
	});
});

describe('getLabelFromValue', () => {
	it('should return an array of labels from an array of OrderByFilterValue objects', () => {
		const arr: string[] = ['service_name asc', 'service_namespace desc'];
		const result = getLabelFromValue(arr);
		expect(result).toEqual(['service_name', 'service_namespace']);
	});
});
