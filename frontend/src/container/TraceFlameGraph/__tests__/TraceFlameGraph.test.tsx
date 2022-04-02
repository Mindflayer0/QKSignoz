/**
 * @jest-environment jsdom
 */

import { expect } from '@jest/globals';
import { render } from '@testing-library/react';
import { renderHook } from '@testing-library/react-hooks';
import TraceFlameGraph from 'container/TraceFlameGraph';
import React, { useState } from 'react';
import { Provider } from 'react-redux';
import store from 'store';

test('loads and displays greeting', () => {
	const { rerender } = renderHook(() => useState(''));

	const { asFragment } = render(
		<Provider store={store}>
			<TraceFlameGraph
				{...{
					hoveredSpanId: '',
					intervalUnit: { multiplier: 0, name: 'm' },
					onSpanHover: rerender,
					onSpanSelect: (): void => {},
					selectedSpanId: '',
					traceMetaData: {
						globalEnd: 0,
						globalStart: 0,
						levels: 0,
						spread: 0,
						totalSpans: 0,
					},
					treeData: {
						children: [],
						id: '',
						name: '',
						serviceColour: '',
						serviceName: '',
						startTime: 0,
						tags: [],
						time: 0,
						value: 0,
						event: [],
						hasError: false,
						parent: undefined,
					},
				}}
			/>
		</Provider>,
	);
	expect(asFragment()).toMatchSnapshot();
});
