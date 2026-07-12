import { fail, redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import { login } from '$lib/api/client';
import type { Actions } from './$types';

export const actions: Actions = {
	default: async ({ request, cookies, fetch }) => {
		const data = await request.formData();
		const email = String(data.get('email') ?? '');
		const password = String(data.get('password') ?? '');
		try {
			const { token } = await login(fetch, email, password);
			cookies.set('auth_token', token, {
				path: '/',
				httpOnly: true,
				secure: !dev,
				sameSite: 'lax',
				maxAge: 60 * 60 * 24 * 7
			});
		} catch {
			return fail(401, { error: 'Login failed. Check your credentials and try again.' });
		}
		throw redirect(303, '/items');
	}
};
