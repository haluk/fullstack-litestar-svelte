import { expect, test } from '@playwright/test';

const BASE = process.env.E2E_BASE_URL ?? 'http://localhost';
const username = `e2e-${Date.now()}`;

test('register in Keycloak → create item → see it on the dashboard → logout', async ({ page }) => {
	// a too-strict Content-Security-Policy fails silently in the UI; make it fail here
	const cspViolations: string[] = [];
	page.on('console', (msg) => {
		if (/content security policy/i.test(msg.text())) cspViolations.push(msg.text());
	});

	// protected page bounces through /login to the Keycloak sign-in page
	await page.goto(`${BASE}/items`);
	await page.getByRole('link', { name: /register/i }).click();

	await page.locator('#username').fill(username);
	await page.locator('#email').fill(`${username}@example.com`);
	await page.locator('#firstName').fill('E2E');
	await page.locator('#lastName').fill('User');
	await page.locator('#password').fill('password123');
	await page.locator('#password-confirm').fill('password123');
	await page.getByRole('button', { name: /register/i }).click();

	// back in the app with a session, on the page we originally asked for
	await expect(page).toHaveURL(new RegExp('/items$'));
	await page.getByPlaceholder('Name').fill('E2E Widget');
	await page.getByRole('button', { name: /^add$/i }).click();
	await expect(page.getByText('E2E Widget')).toBeVisible();

	// the dashboard aggregates the same data from the API
	await page.getByRole('link', { name: 'Dashboard', exact: true }).click();
	await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
	await expect(page.getByText('E2E Widget')).toBeVisible();
	await expect(page.getByRole('img', { name: /Items created per day/ })).toBeVisible();

	await page.getByRole('button', { name: /logout/i }).click();
	await expect(page.getByRole('link', { name: 'Login' })).toBeVisible();

	expect(cspViolations).toEqual([]);
});
