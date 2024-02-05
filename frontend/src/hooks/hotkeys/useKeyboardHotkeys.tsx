import { noop, unset } from 'lodash-es';
import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useRef,
} from 'react';

interface KeyboardHotkeysContextReturnValue {
	registerShortcut: (keyCombination: string, callback: () => void) => void;
	deregisterShortcut: (keyCombination: string) => void;
}

const KeyboardHotkeysContext = createContext<KeyboardHotkeysContextReturnValue>(
	{
		registerShortcut: noop,
		deregisterShortcut: noop,
	},
);

const IGNORE_INPUTS = ['input', 'textarea']; // Inputs in which hotkey events will be ignored

const useKeyboardHotkeys = (): KeyboardHotkeysContextReturnValue => {
	const context = useContext(KeyboardHotkeysContext);
	if (!context) {
		throw new Error(
			'useKeyboardHotkeys must be used within a KeyboardHotkeysProvider',
		);
	}

	return context;
};

function KeyboardHotkeysProvider({
	children,
}: {
	children: JSX.Element;
}): JSX.Element {
	const shortcuts = useRef<Record<string, () => void>>({});

	const handleKeyPress = (event: KeyboardEvent): void => {
		const { key, ctrlKey, altKey, shiftKey, metaKey, target } = event;

		if (IGNORE_INPUTS.includes((target as HTMLElement).tagName.toLowerCase())) {
			return;
		}
		const modifiers = { ctrlKey, altKey, shiftKey, metaKey };
		const shortcutKey = `${key}${modifiers.ctrlKey ? '+ctrl' : ''}${
			modifiers.altKey ? '+alt' : ''
		}${modifiers.shiftKey ? '+shift' : ''}${modifiers.metaKey ? '+meta' : ''}`;

		if (shortcuts.current[shortcutKey]) {
			shortcuts.current[shortcutKey]();
		}
	};

	useEffect(() => {
		document.addEventListener('keydown', handleKeyPress);
		return (): void => {
			document.removeEventListener('keydown', handleKeyPress);
		};
	}, []);

	const registerShortcut = useCallback(
		(keyCombination: string, callback: () => void): void => {
			if (!shortcuts.current[keyCombination]) {
				shortcuts.current[keyCombination] = callback;
			} else {
				throw new Error('This shortcut is already present in current scope');
			}
		},
		[shortcuts],
	);

	const deregisterShortcut = useCallback(
		(keyCombination: string): void => {
			if (shortcuts.current[keyCombination]) {
				unset(shortcuts.current, keyCombination);
			}
		},
		[shortcuts],
	);

	const contextValue = useMemo(
		() => ({
			registerShortcut,
			deregisterShortcut,
		}),
		[registerShortcut, deregisterShortcut],
	);

	return (
		<KeyboardHotkeysContext.Provider value={contextValue}>
			{children}
		</KeyboardHotkeysContext.Provider>
	);
}

export { KeyboardHotkeysProvider, useKeyboardHotkeys };
