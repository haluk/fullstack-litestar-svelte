// OpenID Connect (authorization code + PKCE) against Keycloak. The SvelteKit server is a
// confidential client: tokens never reach browser JavaScript, they live in httpOnly cookies.
//
// Reads process.env directly (rather than $env/dynamic/private) so it stays testable
// under vitest; the node adapter reads the same variables at runtime.
import type { Cookies } from '@sveltejs/kit';
import { dev } from '$app/env';

export interface OidcConfig {
	/** Browser-facing Keycloak URL (redirects, end-session); also the token issuer base. */
	publicUrl: string;
	/** Server-to-server Keycloak URL for token calls (e.g. http://keycloak:8080 in compose). */
	internalUrl: string;
	realm: string;
	clientId: string;
	clientSecret: string;
}

export interface TokenSet {
	access_token: string;
	refresh_token?: string;
	id_token?: string;
	expires_in: number;
	refresh_expires_in?: number;
}

export function oidcConfig(env: Record<string, string | undefined> = process.env): OidcConfig {
	const publicUrl = (env.KEYCLOAK_URL ?? 'http://localhost:8080').replace(/\/$/, '');
	return {
		publicUrl,
		internalUrl: (env.KEYCLOAK_INTERNAL_URL ?? publicUrl).replace(/\/$/, ''),
		realm: env.KEYCLOAK_REALM ?? '',
		clientId: env.KEYCLOAK_CLIENT_ID ?? '',
		clientSecret: env.KEYCLOAK_CLIENT_SECRET ?? ''
	};
}

const endpoint = (base: string, cfg: OidcConfig, path: string) =>
	`${base}/realms/${encodeURIComponent(cfg.realm)}/protocol/openid-connect/${path}`;

export const redirectUri = (origin: string) => `${origin}/login/callback`;

function base64url(bytes: Uint8Array): string {
	return Buffer.from(bytes).toString('base64url');
}

export function randomToken(): string {
	return base64url(crypto.getRandomValues(new Uint8Array(32)));
}

export async function pkceChallenge(verifier: string): Promise<string> {
	const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
	return base64url(new Uint8Array(digest));
}

export async function authorizeUrl(
	cfg: OidcConfig,
	opts: { origin: string; state: string; verifier: string }
): Promise<string> {
	const url = new URL(endpoint(cfg.publicUrl, cfg, 'auth'));
	url.search = new URLSearchParams({
		client_id: cfg.clientId,
		response_type: 'code',
		scope: 'openid profile email',
		redirect_uri: redirectUri(opts.origin),
		state: opts.state,
		code_challenge: await pkceChallenge(opts.verifier),
		code_challenge_method: 'S256'
	}).toString();
	return url.toString();
}

export function logoutUrl(cfg: OidcConfig, opts: { origin: string; idToken?: string }): string {
	const url = new URL(endpoint(cfg.publicUrl, cfg, 'logout'));
	url.searchParams.set('client_id', cfg.clientId);
	url.searchParams.set('post_logout_redirect_uri', `${opts.origin}/`);
	if (opts.idToken) url.searchParams.set('id_token_hint', opts.idToken);
	return url.toString();
}

async function tokenRequest(
	cfg: OidcConfig,
	fetchFn: typeof fetch,
	params: Record<string, string>
): Promise<TokenSet> {
	const res = await fetchFn(endpoint(cfg.internalUrl, cfg, 'token'), {
		method: 'POST',
		headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
		body: new URLSearchParams({
			client_id: cfg.clientId,
			client_secret: cfg.clientSecret,
			...params
		})
	});
	if (!res.ok) throw new Error(`token endpoint returned ${res.status}`);
	return res.json();
}

export const exchangeCode = (
	cfg: OidcConfig,
	fetchFn: typeof fetch,
	opts: { code: string; verifier: string; origin: string }
) =>
	tokenRequest(cfg, fetchFn, {
		grant_type: 'authorization_code',
		code: opts.code,
		code_verifier: opts.verifier,
		redirect_uri: redirectUri(opts.origin)
	});

export const refreshTokens = (cfg: OidcConfig, fetchFn: typeof fetch, refreshToken: string) =>
	tokenRequest(cfg, fetchFn, { grant_type: 'refresh_token', refresh_token: refreshToken });

/** Decode a JWT payload without verifying it. Only for tokens received directly from
 *  Keycloak's token endpoint; the backend verifies every access token it is sent. */
export function decodeJwt(token: string): Record<string, unknown> {
	try {
		return JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString('utf8'));
	} catch {
		return {};
	}
}

/** Seconds until the token's `exp`, or -1 when it has none / is unreadable. */
export function secondsUntilExpiry(token: string, now = Date.now()): number {
	const exp = decodeJwt(token).exp;
	return typeof exp === 'number' ? exp - Math.floor(now / 1000) : -1;
}

// --- session cookies ---

export const COOKIES = {
	access: 'access_token',
	refresh: 'refresh_token',
	id: 'id_token',
	login: 'oidc_login'
} as const;

const cookieOpts = (maxAge: number) => ({
	path: '/',
	httpOnly: true,
	secure: !dev,
	sameSite: 'lax' as const,
	maxAge
});

export function storeTokens(cookies: Cookies, tokens: TokenSet): void {
	// Keep the session as long as the refresh token lives; hooks refresh the access token.
	const maxAge = tokens.refresh_expires_in || tokens.expires_in;
	cookies.set(COOKIES.access, tokens.access_token, cookieOpts(maxAge));
	if (tokens.refresh_token) cookies.set(COOKIES.refresh, tokens.refresh_token, cookieOpts(maxAge));
	if (tokens.id_token) cookies.set(COOKIES.id, tokens.id_token, cookieOpts(maxAge));
}

export function clearTokens(cookies: Cookies): void {
	for (const name of [COOKIES.access, COOKIES.refresh, COOKIES.id]) {
		cookies.delete(name, { path: '/' });
	}
}

/** Short-lived cookie carrying state + PKCE verifier across the Keycloak round trip. */
export function storeLoginAttempt(
	cookies: Cookies,
	attempt: { state: string; verifier: string; returnTo: string }
): void {
	cookies.set(COOKIES.login, JSON.stringify(attempt), cookieOpts(600));
}

export function takeLoginAttempt(
	cookies: Cookies
): { state: string; verifier: string; returnTo: string } | null {
	const raw = cookies.get(COOKIES.login);
	cookies.delete(COOKIES.login, { path: '/' });
	if (!raw) return null;
	try {
		return JSON.parse(raw);
	} catch {
		return null;
	}
}

/** Only allow same-site relative paths as post-login targets (no open redirects). */
export function safeReturnTo(value: string | null): string {
	return value && value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\')
		? value
		: '/';
}
