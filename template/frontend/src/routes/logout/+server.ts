import { redirect } from '@sveltejs/kit';
import { clearTokens, COOKIES, logoutUrl, oidcConfig } from '#lib/server/oidc.js';
import type { RequestHandler } from './$types';

// Drop the local session, then end the Keycloak SSO session too.
export const POST: RequestHandler = ({ cookies, url }) => {
	const idToken = cookies.get(COOKIES.id);
	clearTokens(cookies);
	const cfg = oidcConfig();
	throw redirect(303, logoutUrl(cfg, { origin: url.origin, idToken }), {
		external: [new URL(cfg.publicUrl).origin]
	});
};
