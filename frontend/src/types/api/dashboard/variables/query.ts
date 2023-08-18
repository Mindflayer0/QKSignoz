import { IDashboardVariable } from '../getAll';

export type PayloadVariables = Record<
	string,
	IDashboardVariable['selectedValue']
>;

export type Props = {
	query: string;
	variables: PayloadVariables;
};

export type PayloadProps = {
	variableValues: string[] | number[];
};
