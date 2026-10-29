import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import DailyBarChart from './DailyBarChart.svelte';

const data = [
	{ day: '2026-10-26', count: 2 },
	{ day: '2026-10-27', count: 0 },
	{ day: '2026-10-28', count: 5 }
];

describe('DailyBarChart', () => {
	it('draws one bar per non-empty day and labels only the peak', () => {
		const { container } = render(DailyBarChart, { data });
		expect(container.querySelectorAll('path.bar')).toHaveLength(2);
		expect(container.querySelectorAll('text.value')).toHaveLength(1);
		expect(container.querySelector('text.value')?.textContent).toBe('5');
	});

	it('summarizes the series for assistive tech', () => {
		render(DailyBarChart, { data });
		expect(screen.getByRole('img')).toHaveAccessibleName(
			'Items created per day: 7 over the last 3 days, peak 5.'
		);
	});
});
