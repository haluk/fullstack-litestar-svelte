import { error, redirect } from '@sveltejs/kit';
import { exchangeCode, oidcConfig, storeTokens, takeLoginAttempt } from '#lib/server/oidc.js';
import type { RequestHandler } from './$types';

// Keycloak redirects back here with ?code&state after the user signs in.
export const GET: RequestHandler = async ({ url, cookies, fetch }) => {
	const attempt = takeLoginAttempt(cookies);
	const code = url.searchParams.get('code');
	if (url.searchParams.has('error')) throw redirect(303, '/');
	if (!attempt || !code || url.searchParams.get('state') !== attempt.state) {
		throw error(400, 'Invalid login response. Please try logging in again.');
	}
	try {
		const tokens = await exchangeCode(oidcConfig(), fetch, {
			code,
			verifier: attempt.verifier,
			origin: url.origin
		});
		storeTokens(cookies, tokens);
	} catch {
		throw error(502, 'Could not complete login with the identity provider.');
	}
	throw redirect(303, attempt.returnTo);
};
