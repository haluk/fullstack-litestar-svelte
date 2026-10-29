import { render, screen } from '@testing-library/svelte';
import Package from '@lucide/svelte/icons/package';
import { describe, expect, it } from 'vitest';
import StatTile from './StatTile.svelte';

describe('StatTile', () => {
	it('shows the value and a signed delta with its period', () => {
		render(StatTile, { label: 'Added this week', value: '12', icon: Package, delta: 3, deltaLabel: 'vs. previous 7 days' });
		expect(screen.getByText('Added this week')).toBeInTheDocument();
		expect(screen.getByText('12')).toBeInTheDocument();
		expect(screen.getByText('+3')).toBeInTheDocument();
		expect(screen.getByText(/vs\. previous 7 days/)).toBeInTheDocument();
	});

	it('falls back to the hint without a delta', () => {
		render(StatTile, { label: 'Total items', value: '0', icon: Package, hint: 'All time' });
		expect(screen.getByText('All time')).toBeInTheDocument();
	});
});
