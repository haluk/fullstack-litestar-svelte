import { API_BASE } from '$lib/config';

type Fetch = typeof fetch;

export interface LoginResult {
	token: string;
}

export async function login(fetch: Fetch, email: string, password: string): Promise<LoginResult> {
	const res = await fetch(`${API_BASE}/login`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email, password })
	});
	if (!res.ok) throw new Error('login_failed');
	return res.json();
}

export async function register(
	fetch: Fetch,
	data: { email: string; name: string; password: string }
): Promise<void> {
	const res = await fetch(`${API_BASE}/register`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify(data)
	});
	if (!res.ok) throw new Error('register_failed');
}
