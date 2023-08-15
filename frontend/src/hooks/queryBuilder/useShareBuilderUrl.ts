import useUrlQuery from 'hooks/useUrlQuery';
import { useEffect } from 'react';
import { Query } from 'types/api/queryBuilder/queryBuilderData';

import { useGetCompositeQueryParam } from './useGetCompositeQueryParam';
import { useQueryBuilder } from './useQueryBuilder';

export type UseShareBuilderUrlParams = { defaultValue: Query };

export const useShareBuilderUrl = (defaultQuery: Query): void => {
	const { redirectWithQueryBuilderData, resetQuery } = useQueryBuilder();
	const urlQuery = useUrlQuery();

	const compositeQuery = useGetCompositeQueryParam();

	useEffect(() => {
		if (!compositeQuery) {
			redirectWithQueryBuilderData(defaultQuery);
		}
	}, [defaultQuery, urlQuery, redirectWithQueryBuilderData, compositeQuery]);

	useEffect(
		() => (): void => {
			resetQuery();
		},
		[resetQuery],
	);
};
