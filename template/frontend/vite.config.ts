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
			adapter: adapter({ out: 'build', precompress: true }),
			// Content-Security-Policy header on every page; SvelteKit adds per-response
			// nonces/hashes for its own inline scripts and styles. Keycloak's login pages are
			// full-page navigations, so they need no entries here.
			csp: {
				mode: 'auto',
				directives: {
					'default-src': ['self'],
					'script-src': ['self'],
					'style-src': ['self'],
					// components position things via style="" attributes (e.g. chart tooltips)
					'style-src-attr': ['unsafe-inline'],
					'img-src': ['self', 'data:'],
					'font-src': ['self', 'data:'],
					'connect-src': ['self'],
					'object-src': ['none'],
					'base-uri': ['self'],
					'frame-ancestors': ['none']
				}
			}
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
