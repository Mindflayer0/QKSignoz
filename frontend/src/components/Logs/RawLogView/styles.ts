import { Col, Row } from 'antd';
import styled from 'styled-components';

export const RawLogViewContainer = styled(Row)<{ $isDarkMode: boolean }>`
	width: 100%;
	padding: 3px 20px 3px 0;

	font-weight: 700;
	font-size: 12px;
	line-height: 20px;

	transition: background-color 0.2s ease-in;

	&:hover {
		background-color: ${({ $isDarkMode }): string =>
			$isDarkMode ? 'rgba(255,255,255, 0.1)' : 'rgba(0, 0, 0, 0.1)'};
	}
`;

export const ExpandIconWrapper = styled(Col)`
	color: #177ddc;
	padding: 4px 6px;
	cursor: pointer;
	font-size: 12px;
`;
