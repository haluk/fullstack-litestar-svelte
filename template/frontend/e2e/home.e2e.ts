import { expect, test } from '@playwright/test';

test('home page renders the app name and a link to items', async ({ page }) => {
	await page.goto('/');
	await expect(page.getByRole('heading', { level: 1 })).toContainText('Welcome to');
	await expect(page.getByRole('link', { name: 'Items' })).toBeVisible();
});

test('login page shows the login form', async ({ page }) => {
	await page.goto('/login');
	await expect(page.getByLabel('Email')).toBeVisible();
	await expect(page.getByLabel('Password')).toBeVisible();
});
