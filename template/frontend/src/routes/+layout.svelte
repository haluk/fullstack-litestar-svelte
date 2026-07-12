<script lang="ts">
	import '../app.css';
	import { APP_NAME } from '$lib/config';
	let { children, data } = $props();
</script>

<div class="min-h-screen bg-background text-foreground">
	<header class="flex items-center gap-4 border-b p-4">
		<a href="/" class="font-semibold">{APP_NAME}</a>
		<nav class="flex gap-3 text-sm text-muted-foreground">
			<a href="/items">Items</a>
			{#if data.loggedIn}
				<form method="POST" action="/logout" class="inline">
					<button type="submit" class="text-inherit underline-offset-2 hover:underline">Logout</button>
				</form>
			{:else}
				<a href="/login">Login</a>
			{/if}
		</nav>
	</header>
	<main class="p-6">{@render children()}</main>
</div>
