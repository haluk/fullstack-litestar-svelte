import type { Handle, HandleFetch } from '@sveltejs/kit';

// Read directly from process.env (rather than $env/dynamic/private) so this
// stays testable under vitest, where the SvelteKit env virtual modules don't
// reflect process.env mutations made at test time. Behavior is identical:
// SvelteKit's node adapter runtime also reads INTERNAL_API_URL from
// process.env, so this has no effect on production behavior.
export const handle: Handle = async ({ event, resolve }) => {
	event.locals.token = event.cookies.get('auth_token');
	return resolve(event);
};

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
	const apiPrefix = event.url.origin + '/api/';
	let target = request;
	const internal = process.env.INTERNAL_API_URL;
	if (internal && request.url.startsWith(apiPrefix)) {
		target = new Request(internal + request.url.slice(event.url.origin.length), request);
	}
	const isApi =
		target.url.startsWith(apiPrefix) || (internal && target.url.startsWith(internal + '/api/'));
	if (event.locals.token && isApi) {
		target.headers.set('Authorization', `Bearer ${event.locals.token}`);
	}
	return fetch(target);
};
