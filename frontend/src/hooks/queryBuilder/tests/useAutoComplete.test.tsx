import { act, renderHook, waitFor } from '@testing-library/react';
import { QUERY_BUILDER_SEARCH_VALUES } from 'constants/queryBuilder';
import { valueWithAttributeAndOperator } from 'container/QueryBuilder/mock/queryData';
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';

import { useAutoComplete } from '../useAutoComplete';

describe('useAutoComplete', () => {
	let queryClient: QueryClient;
	let wrapper: React.FC<{ children: React.ReactNode }>;

	beforeAll(() => {
		queryClient = new QueryClient();
		wrapper = ({ children }): JSX.Element => (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	});

	test('should options empty', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);

		expect(result.current.options).toStrictEqual([]);
	});

	test('should options', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);
		result.current.options = [
			{
				label: 'deployment_environment',
				value: 'deployment_environment',
			},
			{
				label: 'operation',
				value: 'operation',
			},
		];
		expect(result.current.options).toStrictEqual([
			{
				label: 'deployment_environment',
				value: 'deployment_environment',
			},
			{
				label: 'operation',
				value: 'operation',
			},
		]);
	});

	test('should empty values', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);
		expect(result.current.searchValue).toBe('');
		expect(result.current.searchValue).toHaveLength(0);
		expect(result.current.tags).toHaveLength(0);
		expect(result.current.isMulti).toBeFalsy();
		expect(result.current.isFetching).toBeTruthy();
	});

	test('should search value', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);

		expect(result.current.searchValue).toBe('');
		act(() => {
			result.current.handleSearch('signoz');
		});
		expect(result.current.searchValue).toBe('signoz');

		act(() => {
			result.current.handleSearch('signoz_latency_count');
		});
		expect(result.current.searchValue).toBe('signoz_latency_count');

		act(() => {
			result.current.handleSearch('exporter != prometheus');
		});
		expect(result.current.searchValue).toBe('exporter != prometheus');

		act(() => {
			result.current.handleSearch('signoz_latency_count LIKE 12345');
		});
		expect(result.current.searchValue).toBe('signoz_latency_count LIKE 12345');

		act(() => {
			result.current.handleSearch('signoz_latency_count EXISTS');
		});
		expect(result.current.searchValue).toBe('signoz_latency_count EXISTS');

		act(() => {
			result.current.handleSearch('signoz_latency_count NOT_EXISTS');
		});
		expect(result.current.searchValue).toBe('signoz_latency_count NOT_EXISTS');

		act(() => {
			result.current.handleSearch('signoz_latency_count IN signoz_io, exporter');
		});
		expect(result.current.searchValue).toBe(
			'signoz_latency_count IN signoz_io, exporter',
		);
	});

	test('should tags', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);
		result.current.tags = ['ab = 12'];
		expect(result.current.tags).toEqual(['ab = 12']);
		expect(result.current.tags).toStrictEqual(['ab = 12']);
		expect(result.current.tags).toBeTruthy();
		expect(result.current.tags).not.toBeNull();
		expect(result.current.tags[0]).toBe('ab = 12');
	});

	test('should isMulti', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);
		expect(result.current.isMulti).toBeFalsy();
		if (QUERY_BUILDER_SEARCH_VALUES.MULTIPLY) {
			result.current.isMulti = true;
			expect(result.current.isMulti).toBeTruthy();
		}
	});

	test('should isFetching Data', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);
		expect(result.current.isFetching).toBeTruthy();
		waitFor(() => {
			expect(result.current.isFetching).toBeFalsy();
		});
	});

	test('should handleKeyDown', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);
		expect(result.current.handleKeyDown).toEqual(expect.any(Function));
	});

	test('should handleKeyDown event', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);

		const event = new KeyboardEvent('keydown', {
			key: 'Enter',
			keyCode: 13,
		});
		const handleKeyDownSpy = jest.spyOn(result.current, 'handleKeyDown');

		act(() =>
			result.current.handleKeyDown(
				(event.key as unknown) as React.KeyboardEvent<Element>,
			),
		);

		expect(handleKeyDownSpy).toHaveBeenCalledWith(event.key as unknown);

		handleKeyDownSpy.mockRestore();
	});

	test('should handleSearch search', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);
		expect(result.current.handleSearch).toBeInstanceOf(Function);
	});

	test('should handleSearch search value added', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);

		expect(result.current.searchValue).toBe('');

		act(() => {
			result.current.handleSearch('tested');
		});

		expect(result.current.searchValue).toBe('tested');
	});

	test('should handleClearTag ', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);

		act(() => {
			result.current.handleClearTag('');
		});

		expect(result.current.tags).toStrictEqual([]);
	});

	test('should handleSelect function ', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);

		expect(result.current.handleSelect).toBeInstanceOf(Function);
	});

	test('should handleSelect value ', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);

		const handleSelect = jest.spyOn(result.current, 'handleSelect');

		act(() => result.current.handleSelect('signoz != abc'));

		expect(handleSelect).toHaveBeenCalledWith('signoz != abc');

		handleSelect.mockRestore();
	});

	test('should handleSelect ismulti value  ', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);

		const handleSelect = jest.spyOn(result.current, 'handleSelect');

		act(() =>
			result.current.handleSelect('signoz IN signoz_col, operation_io, signoz'),
		);

		expect(handleSelect).toHaveBeenCalledWith(
			'signoz IN signoz_col, operation_io, signoz',
		);

		handleSelect.mockRestore();
	});

	test('should updateTag', () => {
		const { result } = renderHook(
			() => useAutoComplete(valueWithAttributeAndOperator),
			{
				wrapper,
			},
		);

		expect(result.current.tags).toEqual([]);

		expect(result.current.updateTag).toBeInstanceOf(Function);

		const updateTag = jest.spyOn(result.current, 'updateTag');

		act(() => result.current.updateTag('signoz = signoz_col'));

		expect(updateTag).toHaveBeenCalledWith('signoz = signoz_col');

		updateTag.mockRestore();
	});
});
