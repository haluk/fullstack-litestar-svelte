<script lang="ts">
	import '../app.css';
	import { page } from '$app/state';
	import { Button } from '#lib/components/ui/button/index.js';
	import { APP_NAME } from '#lib/config.js';
	let { children, data } = $props();

	const links = [
		{ href: '/dashboard', label: 'Dashboard' },
		{ href: '/items', label: 'Items' }
	];
</script>

<div class="flex min-h-screen flex-col bg-background text-foreground">
	<header class="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
		<div class="mx-auto flex h-14 w-full max-w-6xl items-center gap-6 px-4 sm:px-6">
			<a href="/" class="flex items-center gap-2 font-semibold tracking-tight">
				<span
					class="grid size-7 place-items-center rounded-md bg-primary text-xs font-bold text-primary-foreground"
					aria-hidden="true">{APP_NAME.charAt(0)}</span
				>
				{APP_NAME}
			</a>
			<nav class="flex gap-4 text-sm">
				{#each links as link (link.href)}
					<a
						href={link.href}
						class={page.url.pathname.startsWith(link.href)
							? 'font-medium text-foreground'
							: 'text-muted-foreground transition-colors hover:text-foreground'}>{link.label}</a
					>
				{/each}
			</nav>
			<div class="ml-auto flex items-center gap-3 text-sm">
				{#if data.user}
					<span class="hidden text-muted-foreground sm:inline">{data.user.name ?? data.user.username}</span>
					<form method="POST" action="/logout">
						<Button type="submit" variant="outline" size="sm">Logout</Button>
					</form>
				{:else}
					<!-- /login is a server endpoint that redirects to Keycloak -->
					<Button href="/login?returnTo=/dashboard" size="sm" data-sveltekit-reload>Login</Button>
				{/if}
			</div>
		</div>
	</header>
	<main class="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">{@render children()}</main>
	<footer class="border-t py-6 text-center text-xs text-muted-foreground">
		© {new Date().getFullYear()} {APP_NAME}
	</footer>
</div>
