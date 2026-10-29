import type { Handle, HandleFetch } from '@sveltejs/kit/hooks';
import {
	clearTokens,
	COOKIES,
	decodeJwt,
	oidcConfig,
	refreshTokens,
	secondsUntilExpiry,
	storeTokens
} from '#lib/server/oidc.js';

// Refresh a little before expiry so a token never lapses mid-request to the API.
const REFRESH_LEEWAY_SECONDS = 30;

// Same rule as the API: reuse nginx's X-Request-ID if well-formed, otherwise mint one.
const VALID_REQUEST_ID = /^[A-Za-z0-9._-]{1,128}$/;

// Read directly from process.env (rather than $env/dynamic/private) so this
// stays testable under vitest, where the SvelteKit env virtual modules don't
// reflect process.env mutations made at test time. Behavior is identical:
// SvelteKit's node adapter runtime also reads INTERNAL_API_URL from
// process.env, so this has no effect on production behavior.
export const handle: Handle = async ({ event, resolve }) => {
	const { cookies } = event;
	const incomingId = event.request.headers.get('x-request-id') ?? '';
	event.locals.requestId = VALID_REQUEST_ID.test(incomingId)
		? incomingId
		: crypto.randomUUID().replaceAll('-', '');

	let token = cookies.get(COOKIES.access);
	const refreshToken = cookies.get(COOKIES.refresh);

	if (refreshToken && (!token || secondsUntilExpiry(token) < REFRESH_LEEWAY_SECONDS)) {
		try {
			const tokens = await refreshTokens(oidcConfig(), fetch, refreshToken);
			storeTokens(cookies, tokens);
			token = tokens.access_token;
		} catch {
			// refresh token expired or session ended in Keycloak: sign out locally
			clearTokens(cookies);
			token = undefined;
		}
	}

	if (token) {
		event.locals.token = token;
		const claims = decodeJwt(cookies.get(COOKIES.id) ?? token);
		event.locals.user = {
			username: String(claims.preferred_username ?? claims.sub ?? ''),
			name: typeof claims.name === 'string' ? claims.name : undefined,
			email: typeof claims.email === 'string' ? claims.email : undefined
		};
	}

	const response = await resolve(event);
	try {
		response.headers.set('x-request-id', event.locals.requestId);
	} catch {
		// some responses (e.g. a proxied fetch() result) have immutable headers
	}
	return response;
};

export const handleFetch: HandleFetch = async ({ event, request, fetch }) => {
	const apiPrefix = event.url.origin + '/api/';
	let target = request;
	const internal = process.env.INTERNAL_API_URL;
	if (internal && request.url.startsWith(apiPrefix)) {
		target = new Request(internal + request.url.slice(event.url.origin.length), request);
	}

	const isApi = target.url.startsWith(apiPrefix) || internal && target.url.startsWith(internal + '/api/');

	if (isApi && event.locals.requestId) {
		target.headers.set('X-Request-ID', event.locals.requestId);
	}
	if (event.locals.token && isApi) {
		target.headers.set('Authorization', `Bearer ${event.locals.token}`);
	}
	return fetch(target);
};
