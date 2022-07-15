import { StyledButton } from 'components/Styled';
import React from 'react';

import { styles } from './styles';

function EllipsedButton({
	onToggleHandler,
	setText,
	value,
	event,
	buttonText = 'View full log event message',
}: Props): JSX.Element {
	const isFullValueButton = buttonText === 'View full value';

	const style = [styles.removePadding];

	if (!isFullValueButton) {
		style.push(styles.removeMargin);
	} else {
		style.push(styles.selectedSpanDetailsContainer);
		style.push(styles.buttonContainer);
	}

	return (
		<StyledButton
			styledclass={style}
			onClick={(): void => {
				onToggleHandler(true);
				setText({
					subText: value,
					text: event,
				});
			}}
			type="link"
		>
			{buttonText}
		</StyledButton>
	);
}

interface Props {
	onToggleHandler: (isOpen: boolean) => void;
	setText: (text: { subText: string; text: string }) => void;
	value: string;
	event: string;
	buttonText: string;
}

export default EllipsedButton;
