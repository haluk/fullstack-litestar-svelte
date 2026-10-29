import { error, redirect } from '@sveltejs/kit';
import { API_BASE } from '#lib/config.js';
import type { PageServerLoad } from './$types';

export interface DashboardSummary {
	total_items: number;
	created_last_7_days: number;
	created_previous_7_days: number;
	described_items: number;
	daily: { day: string; count: number }[];
	recent: { id: string; name: string; description: string | null; created_at: string }[];
}

export const load: PageServerLoad = async ({ locals, fetch }) => {
	if (!locals.token) throw redirect(303, '/login?returnTo=/dashboard');
	const res = await fetch(`${API_BASE}/dashboard`); // Authorization injected by handleFetch
	if (res.status === 401) throw redirect(303, '/login?returnTo=/dashboard');
	if (!res.ok) throw error(502, 'Could not load the dashboard');
	return { summary: (await res.json()) as DashboardSummary };
};
