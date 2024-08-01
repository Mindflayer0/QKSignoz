import { ApiV3Instance } from 'api';
import { ErrorResponseHandler } from 'api/ErrorResponseHandler';
import { AxiosError, AxiosResponse } from 'axios';
import { baseAutoCompleteIdKeysOrder } from 'constants/queryBuilder';
import { encode } from 'js-base64';
import { createIdFromObjectFields } from 'lib/createIdFromObjectFields';
import createQueryParams from 'lib/createQueryParams';
import { ErrorResponse, SuccessResponse } from 'types/api';
import {
	IGetAttributeSuggestionsPayload,
	IGetAttributeSuggestionsSuccessResponse,
} from 'types/api/queryBuilder/getAttributeSuggestions';
import { BaseAutocompleteData } from 'types/api/queryBuilder/queryAutocompleteResponse';

export const getAttributeSuggestions = async ({
	searchText,
	dataSource,
	filters,
}: IGetAttributeSuggestionsPayload): Promise<
	SuccessResponse<IGetAttributeSuggestionsSuccessResponse> | ErrorResponse
> => {
	try {
		const base64EncodedFiltersString = encode(JSON.stringify(filters));
		const response: AxiosResponse<{
			data: IGetAttributeSuggestionsSuccessResponse;
		}> = await ApiV3Instance.get(
			`/suggestions?${createQueryParams({
				searchText,
				dataSource,
				filters: base64EncodedFiltersString,
			})}`,
		);

		const payload: BaseAutocompleteData[] =
			response.data.data.attributes?.map(({ id: _, ...item }) => ({
				...item,
				id: createIdFromObjectFields(item, baseAutoCompleteIdKeysOrder),
			})) || [];

		return {
			statusCode: 200,
			error: null,
			message: response.statusText,
			payload: {
				attributes: payload,
				example_queries: response.data.data.example_queries,
			},
		};
	} catch (e) {
		return ErrorResponseHandler(e as AxiosError);
	}
};