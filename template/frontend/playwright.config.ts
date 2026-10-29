import { defineConfig } from '@playwright/test';

export default defineConfig({
	webServer: process.env.E2E_BASE_URL
		? undefined
		: { command: 'bun run build && bun run preview', port: 4173 },
	testDir: 'e2e',
	testMatch: process.env.E2E_BASE_URL ? '**/fullstack.e2e.ts' : '**/home.e2e.ts',
	use: { baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:4173' }
});
