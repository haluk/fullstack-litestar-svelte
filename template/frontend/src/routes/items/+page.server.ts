import { fail, redirect } from '@sveltejs/kit';
import { API_BASE } from '$lib/config';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ fetch }) => {
	const res = await fetch(`${API_BASE}/items`); // Authorization injected by handleFetch
	if (res.status === 401) throw redirect(303, '/login');
	if (!res.ok) return { items: [] };
	return { items: await res.json() };
};

export const actions: Actions = {
	create: async ({ request, fetch }) => {
		const data = await request.formData();
		const res = await fetch(`${API_BASE}/items`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				name: String(data.get('name') ?? ''),
				description: (data.get('description') as string) || null
			})
		});
		if (!res.ok) return fail(400, { error: 'Could not create item' });
		return { success: true };
	},
	delete: async ({ request, fetch }) => {
		const data = await request.formData();
		const res = await fetch(`${API_BASE}/items/${data.get('id')}`, { method: 'DELETE' });
		if (!res.ok) return fail(400, { error: 'Could not delete item' });
		return { success: true };
	}
};
