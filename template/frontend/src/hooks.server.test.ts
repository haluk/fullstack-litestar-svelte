import { describe, expect, it } from 'vitest';
import { handleFetch } from './hooks.server';

function makeEvent(origin = 'https://app.example.com', token?: string) {
	return { url: new URL(origin), locals: { token } } as any;
}

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
