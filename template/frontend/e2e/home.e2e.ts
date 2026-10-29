import { expect, test } from '@playwright/test';

test('landing page renders the hero and navigation', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome to');
	await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Items', exact: true })).toBeVisible();
	await expect(page.getByRole('heading', { name: 'Single sign-on' })).toBeVisible();
});

test('anonymous visitors see a login link', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('link', { name: 'Login' })).toHaveAttribute(
		'href',
		'/login?returnTo=/dashboard'
	);
});
