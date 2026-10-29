import { afterEach, describe, expect, it, vi } from 'vitest';
import { handle, handleFetch } from './hooks.server';

function makeEvent(origin = 'https://app.example.com', token?: string, requestId?: string) {
	return { url: new URL(origin), locals: { token, requestId } } as any;
}

const jwt = (payload: object) =>
	`h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;
const inSeconds = (s: number) => Math.floor(Date.now() / 1000) + s;

function fakeCookies(initial: Record<string, string>) {
	const jar = new Map(Object.entries(initial));
	return {
		jar,
		get: (name: string) => jar.get(name),
		set: (name: string, value: string) => void jar.set(name, value),
		delete: (name: string) => void jar.delete(name)
	};
}

async function runHandle(cookies: ReturnType<typeof fakeCookies>, headers: HeadersInit = {}) {
	const event = { cookies, locals: {} as App.Locals, request: new Request('http://x/', { headers }) } as any;
	const response: Response = await handle({ event, resolve: async () => new Response('ok') } as any);
	return Object.assign(event.locals as App.Locals, { response });
}

describe('handle', () => {
	afterEach(() => vi.unstubAllGlobals());

	it('exposes a valid access token and the user from the id token', async () => {
		const access = jwt({ exp: inSeconds(300), sub: 'u1' });
		const cookies = fakeCookies({
			access_token: access,
			refresh_token: 'r',
			id_token: jwt({ preferred_username: 'ada', name: 'Ada Lovelace' })
		});
		const locals = await runHandle(cookies);
		expect(locals.token).toBe(access);
		expect(locals.user).toEqual({ username: 'ada', name: 'Ada Lovelace', email: undefined });
	});

	it('refreshes an expiring access token', async () => {
		const fresh = jwt({ exp: inSeconds(300), preferred_username: 'ada' });
		const fetchSpy = vi.fn(async () =>
			Response.json({ access_token: fresh, refresh_token: 'r2', expires_in: 300 })
		);
		vi.stubGlobal('fetch', fetchSpy);
		const cookies = fakeCookies({ access_token: jwt({ exp: inSeconds(5) }), refresh_token: 'r1' });
		const locals = await runHandle(cookies);
		expect(fetchSpy).toHaveBeenCalledOnce();
		expect(locals.token).toBe(fresh);
		expect(cookies.jar.get('refresh_token')).toBe('r2');
	});

	it('signs out locally when the refresh fails', async () => {
		vi.stubGlobal('fetch', vi.fn(async () => new Response('', { status: 400 })));
		const cookies = fakeCookies({ access_token: jwt({ exp: inSeconds(-10) }), refresh_token: 'r1' });
		const locals = await runHandle(cookies);
		expect(locals.token).toBeUndefined();
		expect(cookies.jar.size).toBe(0);
	});
});

describe('request id', () => {
	it('reuses a well-formed upstream id and echoes it', async () => {
		const locals = await runHandle(fakeCookies({}), { 'x-request-id': 'nginx-abc123' });
		expect(locals.requestId).toBe('nginx-abc123');
		expect(locals.response.headers.get('x-request-id')).toBe('nginx-abc123');
	});

	it('mints a new id when the upstream one is missing or malformed', async () => {
		const missing = await runHandle(fakeCookies({}));
		const malformed = await runHandle(fakeCookies({}), { 'x-request-id': 'bad id!' });
		expect(missing.requestId).toMatch(/^[0-9a-f]{32}$/);
		expect(malformed.requestId).toMatch(/^[0-9a-f]{32}$/);
	});

	it('forwards the id to the API', async () => {
		let seen: Request | undefined;
		const fetchSpy = (async (req: Request) => {
			seen = req;
			return new Response('{}');
		}) as any;
		const req = new Request('https://app.example.com/api/items');
		await handleFetch({ event: makeEvent('https://app.example.com', 'tok', 'rid-1'), request: req, fetch: fetchSpy } as any);
		expect(seen!.headers.get('X-Request-ID')).toBe('rid-1');
	});
});

describe('handleFetch', () => {
	it('rewrites same-origin /api to INTERNAL_API_URL and injects auth', async () => {
		process.env.INTERNAL_API_URL = 'http://api:8000';
		let seen: Request | undefined;
		const fetchSpy = (async (req: Request) => {
			seen = req;
			return new Response('{}');
		}) as any;
		const req = new Request('https://app.example.com/api/items');
		await handleFetch({ event: makeEvent('https://app.example.com', 'tok'), request: req, fetch: fetchSpy } as any);
		expect(seen!.url).toBe('http://api:8000/api/items');
		expect(seen!.headers.get('Authorization')).toBe('Bearer tok');
		delete process.env.INTERNAL_API_URL;
	});

	it('leaves the URL unchanged when INTERNAL_API_URL is unset (dev)', async () => {
		let seen: Request | undefined;
		const fetchSpy = (async (req: Request) => {
			seen = req;
			return new Response('{}');
		}) as any;
		const req = new Request('https://app.example.com/api/items');
		await handleFetch({ event: makeEvent('https://app.example.com'), request: req, fetch: fetchSpy } as any);
		expect(seen!.url).toBe('https://app.example.com/api/items');
	});
});
