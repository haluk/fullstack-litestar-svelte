import { describe, expect, it, vi } from 'vitest';
import {
	authorizeUrl,
	exchangeCode,
	logoutUrl,
	oidcConfig,
	pkceChallenge,
	safeReturnTo,
	secondsUntilExpiry
} from './oidc';

const cfg = oidcConfig({
	KEYCLOAK_URL: 'http://localhost:8080/',
	KEYCLOAK_INTERNAL_URL: 'http://keycloak:8080',
	KEYCLOAK_REALM: 'acme',
	KEYCLOAK_CLIENT_ID: 'acme-web',
	KEYCLOAK_CLIENT_SECRET: 's3cret'
});

const jwt = (payload: object) =>
	`h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;

describe('oidc', () => {
	it('falls back to the public URL for server calls when no internal URL is set', () => {
		const c = oidcConfig({ KEYCLOAK_URL: 'http://kc.example.com' });
		expect(c.internalUrl).toBe('http://kc.example.com');
	});

	it('builds a PKCE authorize URL on the public Keycloak host', async () => {
		const url = new URL(
			await authorizeUrl(cfg, { origin: 'http://localhost:3000', state: 'st', verifier: 'v' })
		);
		expect(url.origin + url.pathname).toBe(
			'http://localhost:8080/realms/acme/protocol/openid-connect/auth'
		);
		expect(url.searchParams.get('client_id')).toBe('acme-web');
		expect(url.searchParams.get('redirect_uri')).toBe('http://localhost:3000/login/callback');
		expect(url.searchParams.get('state')).toBe('st');
		expect(url.searchParams.get('code_challenge_method')).toBe('S256');
		expect(url.searchParams.get('code_challenge')).toBe(await pkceChallenge('v'));
	});

	it('computes the RFC 7636 S256 challenge', async () => {
		// test vector from RFC 7636 appendix B
		expect(await pkceChallenge('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk')).toBe(
			'E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM'
		);
	});

	it('exchanges the code on the internal host with client credentials', async () => {
		const fetchSpy = vi.fn(async () => Response.json({ access_token: 'a', expires_in: 300 }));
		await exchangeCode(cfg, fetchSpy as unknown as typeof fetch, {
			code: 'c',
			verifier: 'v',
			origin: 'http://localhost:3000'
		});
		const [url, init] = fetchSpy.mock.calls[0] as unknown as [string, RequestInit];
		expect(url).toBe('http://keycloak:8080/realms/acme/protocol/openid-connect/token');
		const body = new URLSearchParams(init.body as URLSearchParams);
		expect(body.get('grant_type')).toBe('authorization_code');
		expect(body.get('client_secret')).toBe('s3cret');
		expect(body.get('code_verifier')).toBe('v');
	});

	it('builds an end-session URL that returns to the app', () => {
		const url = new URL(logoutUrl(cfg, { origin: 'http://localhost:3000', idToken: 'idt' }));
		expect(url.pathname).toBe('/realms/acme/protocol/openid-connect/logout');
		expect(url.searchParams.get('post_logout_redirect_uri')).toBe('http://localhost:3000/');
		expect(url.searchParams.get('id_token_hint')).toBe('idt');
	});

	it('only accepts same-site relative return paths', () => {
		expect(safeReturnTo('/items')).toBe('/items');
		expect(safeReturnTo('//evil.com')).toBe('/');
		expect(safeReturnTo('/\\evil.com')).toBe('/');
		expect(safeReturnTo('https://evil.com')).toBe('/');
		expect(safeReturnTo(null)).toBe('/');
	});

	it('reads token expiry without verifying', () => {
		const now = Date.now();
		expect(secondsUntilExpiry(jwt({ exp: Math.floor(now / 1000) + 60 }), now)).toBe(60);
		expect(secondsUntilExpiry('garbage', now)).toBe(-1);
	});
});
