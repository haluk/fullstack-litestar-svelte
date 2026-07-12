import { expect, test } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost';
const email = `e2e-${Date.now()}@example.com`;

test('register → login → create item → see it', async ({ page, request }) => {
	// register via the API (public endpoint)
	const reg = await request.post(`${BASE}/api/register`, {
		data: { email, name: 'E2E', password: 'password123' }
	});
	expect(reg.ok()).toBeTruthy();

	await page.goto(`${BASE}/login`);
	await page.getByLabel('Email').fill(email);
	await page.getByLabel('Password').fill('password123');
	await page.getByRole('button', { name: /log in/i }).click();

	await expect(page).toHaveURL(new RegExp('/items$'));
	await page.getByPlaceholder('Name').fill('E2E Widget');
	await page.getByRole('button', { name: /^add$/i }).click();
	await expect(page.getByText('E2E Widget')).toBeVisible();
});
