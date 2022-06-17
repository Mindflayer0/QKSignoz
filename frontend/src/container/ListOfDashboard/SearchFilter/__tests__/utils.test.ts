import { TOperator } from '../types';
import { executeSearchQueries } from '../utils';

describe('executeSearchQueries', () => {
	const firstDashboard = {
		id: 11111,
		uuid: 'uuid1',
		created_at: '',
		updated_at: '',
		data: {
			title: 'first dashboard',
		},
	};
	const secondDashboard = {
		id: 22222,
		uuid: 'uuid2',
		created_at: '',
		updated_at: '',
		data: {
			title: 'second dashboard',
		},
	};
	const thirdDashboard = {
		id: 22222,
		uuid: 'uuid2',
		created_at: '',
		updated_at: '',
		data: {
			title: 'third dashboard (with special characters +?\\)',
		},
	};
	const dashboards = [firstDashboard, secondDashboard, thirdDashboard];

	it('should filter dashboards based on title', () => {
		const query = {
			category: 'title',
			id: 'someid',
			operator: '=' as TOperator,
			value: 'first dashboard',
		};

		expect(executeSearchQueries([query], dashboards)).toEqual([firstDashboard]);
	});

	it('should filter dashboards with special characters', () => {
		const query = {
			category: 'title',
			id: 'someid',
			operator: '=' as TOperator,
			value: 'third dashboard (with special characters +?\\)',
		};

		expect(executeSearchQueries([query], dashboards)).toEqual([thirdDashboard]);
	});
});
