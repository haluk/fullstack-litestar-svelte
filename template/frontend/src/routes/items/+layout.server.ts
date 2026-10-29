import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = ({ locals, url }) => {
	if (!locals.token) throw redirect(303, `/login?returnTo=${encodeURIComponent(url.pathname)}`);
	return {};
};
