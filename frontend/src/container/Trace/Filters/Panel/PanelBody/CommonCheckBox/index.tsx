import React from 'react';
import { useSelector } from 'react-redux';
import { AppState } from 'store/reducers';
import { TraceFilterEnum, TraceReducer } from 'types/reducer/trace';
import { Checkbox, Typography } from 'antd';
import CheckBoxComponent from '../Common/Checkbox';

const CommonCheckBox = (props: CommonCheckBoxProps): JSX.Element => {
	const { filter } = useSelector<AppState, TraceReducer>(
		(state) => state.traces,
	);

	const status = filter.get(props.name) || {};

	const statusObj = Object.keys(status);

	return (
		<div>
			{statusObj.map((e) => (
				<CheckBoxComponent
					key={e}
					{...{
						name: props.name,
						keyValue: e,
						value: status[e],
					}}
				/>
			))}
		</div>
	);
};

interface CommonCheckBoxProps {
	name: TraceFilterEnum;
}

export default CommonCheckBox;
