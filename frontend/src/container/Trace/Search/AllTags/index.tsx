import { CaretRightFilled, PlusOutlined } from '@ant-design/icons';
import { Button, Space, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

import {
	ButtonContainer,
	Container,
	CurrentTagsContainer,
	ErrorContainer,
	Wrapper,
} from './styles';
import Tags from './Tag';
const { Text } = Typography;
import { isEqual } from 'lodash-es';
import { connect, useSelector } from 'react-redux';
import { bindActionCreators } from 'redux';
import type { ThunkDispatch } from 'redux-thunk';
import { UpdateTagIsError } from 'store/actions/trace/updateIsTagsError';
import { UpdateTagVisiblity } from 'store/actions/trace/updateTagPanelVisiblity';
import { AppState } from 'store/reducers';
import AppActions from 'types/actions';
import { TraceReducer } from 'types/reducer/trace';

import { parseTagsToQuery } from '../util';

const { Paragraph } = Typography;

const AllTags = ({
	updateTagIsError,
	onChangeHandler,
	updateTagVisiblity,
	updateFilters,
}: AllTagsProps): JSX.Element => {
	const traces = useSelector<AppState, TraceReducer>((state) => state.traces);

	const [localSelectedTags, setLocalSelectedTags] = useState<
		TraceReducer['selectedTags']
	>(traces.selectedTags);

	const onTagAddHandler = (): void => {
		setLocalSelectedTags((tags) => [
			...tags,
			{
				Key: [],
				Operator: 'in',
				Values: [],
			},
		]);
	};

	useEffect(() => {
		if (!isEqual(traces.selectedTags, localSelectedTags)) {
			setLocalSelectedTags(traces.selectedTags);
		}
	}, [traces.selectedTags, localSelectedTags]);

	const onCloseHandler = (index: number): void => {
		setLocalSelectedTags([
			...localSelectedTags.slice(0, index),
			...localSelectedTags.slice(index + 1, localSelectedTags.length),
		]);
	};

	const onRunQueryHandler = (): void => {
		const parsedQuery = parseTagsToQuery(localSelectedTags);

		if (parsedQuery.isError) {
			updateTagIsError(true);
		} else {
			onChangeHandler(parsedQuery.payload);
			updateFilters(localSelectedTags);
			updateTagIsError(false);
			updateTagVisiblity(false);
		}
	};

	const onResetHandler = (): void => {
		setLocalSelectedTags([]);
	};

	if (traces.isTagModalError) {
		return (
			<ErrorContainer>
				<Paragraph style={{ color: '#E89A3C' }}>
					Unrecognised query format. Please reset your query by clicking `X` in the
					search bar above.
				</Paragraph>

				<Paragraph style={{ color: '#E89A3C' }}>
					Please click on the search bar to get a drop down to select relevant tags
				</Paragraph>
			</ErrorContainer>
		);
	}

	return (
		<>
			<Container>
				<Wrapper>
					<Typography>Tags</Typography>

					<CurrentTagsContainer>
						{localSelectedTags.map((tags, index) => (
							<Tags
								key={tags.Key.join(',')}
								tag={tags}
								index={index}
								onCloseHandler={(): void => onCloseHandler(index)}
								setLocalSelectedTags={setLocalSelectedTags}
							/>
						))}
					</CurrentTagsContainer>

					<Space wrap direction="horizontal">
						<Button type="primary" onClick={onTagAddHandler} icon={<PlusOutlined />}>
							Add Tags Filter
						</Button>

						<Text ellipsis>
							Results will include spans with ALL the specified tags ( Rows are `anded`
							)
						</Text>
					</Space>
				</Wrapper>

				<ButtonContainer>
					<Button onClick={onResetHandler}>Reset</Button>
					<Button
						type="primary"
						onClick={onRunQueryHandler}
						icon={<CaretRightFilled />}
					>
						Run Query
					</Button>
				</ButtonContainer>
			</Container>
		</>
	);
};

interface DispatchProps {
	updateTagIsError: (value: boolean) => void;
	updateTagVisiblity: (value: boolean) => void;
}

const mapDispatchToProps = (
	dispatch: ThunkDispatch<unknown, unknown, AppActions>,
): DispatchProps => ({
	updateTagIsError: bindActionCreators(UpdateTagIsError, dispatch),
	updateTagVisiblity: bindActionCreators(UpdateTagVisiblity, dispatch),
});

interface AllTagsProps extends DispatchProps {
	updateFilters: (tags: TraceReducer['selectedTags']) => void;
	onChangeHandler: (search: string) => void;
}

export default connect(null, mapDispatchToProps)(AllTags);
