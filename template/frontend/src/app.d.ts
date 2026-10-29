// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			/** Keycloak access token, forwarded to the API as a Bearer token. */
			token?: string;
			user?: { username: string; name?: string; email?: string };
			/** Correlates this request across nginx, SvelteKit and API logs. */
			requestId?: string;
		}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
