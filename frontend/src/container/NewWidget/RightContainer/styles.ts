import { Card, Typography } from 'antd';
import styled, { css, FlattenSimpleInterpolation } from 'styled-components';

export const Container = styled(Card)`
	height: 100%;
	.ant-card-body {
		height: 100%;
	}
`;

interface TitleProps {
	textLighter?: boolean;
}

export const Title = styled(Typography)<TitleProps>`
	&&& {
		margin-top: 0.5rem;
		margin-bottom: 1rem;
		font-weight: ${({ textLighter }): string => (textLighter ? 'none' : 'bold')};
	}
`;

interface TextContainerProps {
	noButtonMargin?: boolean;
}

export const TextContainer = styled.div<TextContainerProps>`
	display: flex;
	margin-top: 1rem;
	margin-bottom: 1rem;

	> button {
		margin-left: ${({ noButtonMargin }): string => {
			return noButtonMargin ? '0' : '0.5rem';
		}}
`;

export const NullButtonContainer = styled.div`
	margin-bottom: 1rem;
`;
