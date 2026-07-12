import adapter from '@sveltejs/adapter-node';
import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => ({
	plugins: [
		tailwindcss(),
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},
			adapter: adapter({ out: 'build', precompress: true })
		})
	],
	server: {
		proxy: {
			'/api': {
				target: process.env.VITE_API_PROXY ?? 'http://localhost:8000',
				changeOrigin: true
			}
		}
	},
	resolve: {
		conditions: mode === 'test' ? ['browser'] : undefined
	},
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./vitest-setup.ts'],
		include: ['src/**/*.{test,spec}.{js,ts}', 'src/**/*.svelte.{test,spec}.{js,ts}']
	}
}));
