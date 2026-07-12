import { render, screen } from '@testing-library/svelte';
import { describe, expect, it } from 'vitest';
import ItemList from './ItemList.svelte';

describe('ItemList', () => {
	it('renders a row per item', () => {
		render(ItemList, {
			items: [
				{ id: '1', name: 'Widget', description: 'a thing', created_at: '2026-01-01T00:00:00Z' },
				{ id: '2', name: 'Gadget', description: null, created_at: '2026-01-02T00:00:00Z' }
			]
		});
		expect(screen.getByText('Widget')).toBeInTheDocument();
		expect(screen.getByText('Gadget')).toBeInTheDocument();
		expect(screen.getAllByRole('button', { name: /delete/i })).toHaveLength(2);
	});

	it('shows an empty state when there are no items', () => {
		render(ItemList, { items: [] });
		expect(screen.getByText(/no items/i)).toBeInTheDocument();
	});
});
