import React from 'react';
import { Resizable, ResizeCallbackData } from 'react-resizable';

// # Styles import
import { SpanStyle } from './styles';

function ResizableHeader(props: ResizableHeaderProps): JSX.Element {
	const { onResize, width, ...restProps } = props;

	if (!width) {
		// eslint-disable-next-line react/jsx-props-no-spreading
		return <th {...restProps} />;
	}

	return (
		<Resizable
			width={width}
			height={0}
			handle={
				<SpanStyle
					className="react-resizable-handle"
					onClick={(e): void => e.stopPropagation()}
				/>
			}
			onResize={onResize}
			draggableOpts={{ enableUserSelectHack: false }}
		>
			{/* eslint-disable-next-line react/jsx-props-no-spreading */}
			<th {...restProps} />
		</Resizable>
	);
}

interface ResizableHeaderProps {
	onResize: (e: React.SyntheticEvent<Element>, data: ResizeCallbackData) => void;
	width: number;
}

export default ResizableHeader;
