import { redirect } from '@sveltejs/kit';
import {
	authorizeUrl,
	oidcConfig,
	randomToken,
	safeReturnTo,
	storeLoginAttempt
} from '#lib/server/oidc.js';
import type { RequestHandler } from './$types';

// Start the Keycloak login: remember state + PKCE verifier, then hand off to Keycloak.
export const GET: RequestHandler = async ({ url, cookies }) => {
	const state = randomToken();
	const verifier = randomToken();
	storeLoginAttempt(cookies, {
		state,
		verifier,
		returnTo: safeReturnTo(url.searchParams.get('returnTo'))
	});
	const cfg = oidcConfig();
	throw redirect(303, await authorizeUrl(cfg, { origin: url.origin, state, verifier }), {
		external: [new URL(cfg.publicUrl).origin]
	});
};
