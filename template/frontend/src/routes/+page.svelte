<script lang="ts">
	import Container from '@lucide/svelte/icons/container';
	import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
	import ShieldCheck from '@lucide/svelte/icons/shield-check';
	import Zap from '@lucide/svelte/icons/zap';
	import ArrowRight from '@lucide/svelte/icons/arrow-right';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import { APP_NAME } from '#lib/config.js';
	let { data } = $props();

	const features = [
		{
			icon: ShieldCheck,
			title: 'Single sign-on',
			text: 'Keycloak handles login, registration and roles. Your app never sees a password.'
		},
		{
			icon: Zap,
			title: 'Fast async API',
			text: 'Litestar with a layered architecture and Postgres via advanced-alchemy.'
		},
		{
			icon: LayoutDashboard,
			title: 'Polished UI',
			text: 'SvelteKit and shadcn-svelte components, styled with Tailwind CSS.'
		},
		{
			icon: Container,
			title: 'Ship anywhere',
			text: 'Docker Compose for development and an nginx-fronted production stack.'
		}
	];
</script>

<section class="relative isolate overflow-hidden rounded-2xl border px-6 py-20 text-center sm:py-28">
	<div
		class="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--color-muted),transparent_70%)]"
		aria-hidden="true"
	></div>
	<div
		class="absolute inset-0 -z-10 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:40px_40px] opacity-40 [mask-image:radial-gradient(ellipse_at_center,black,transparent_75%)]"
		aria-hidden="true"
	></div>

	<span class="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground">
		<span class="size-1.5 rounded-full bg-emerald-500" aria-hidden="true"></span>
		Litestar · SvelteKit · Keycloak
	</span>
	<h1 class="mx-auto mt-6 max-w-3xl text-4xl font-bold tracking-tight text-balance sm:text-6xl">
		Welcome to {APP_NAME}
	</h1>
	<p class="mx-auto mt-5 max-w-xl text-lg text-pretty text-muted-foreground">
		Everything you need to go from idea to production: secure sign-in, a typed API and a
		dashboard wired to real data.
	</p>
	<div class="mt-8 flex flex-wrap justify-center gap-3">
		{#if data.user}
			<Button href="/dashboard" size="lg">
				Open dashboard <ArrowRight class="size-4" />
			</Button>
		{:else}
			<Button href="/login?returnTo=/dashboard" size="lg" data-sveltekit-reload>
				Get started <ArrowRight class="size-4" />
			</Button>
		{/if}
		<Button href="/items" size="lg" variant="outline">Browse items</Button>
	</div>
</section>

<section class="mt-16">
	<h2 class="text-center text-2xl font-semibold tracking-tight">Built on a solid foundation</h2>
	<p class="mt-2 text-center text-muted-foreground">Sensible defaults, so you can focus on your product.</p>
	<div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
		{#each features as feature (feature.title)}
			<Card.Root class="transition-shadow hover:shadow-md">
				<Card.Header>
					<div class="mb-2 grid size-10 place-items-center rounded-lg bg-muted">
						<feature.icon class="size-5" />
					</div>
					<Card.Title>{feature.title}</Card.Title>
					<Card.Description>{feature.text}</Card.Description>
				</Card.Header>
			</Card.Root>
		{/each}
	</div>
</section>

<section class="mt-16 flex flex-col items-center gap-4 rounded-2xl bg-primary px-6 py-12 text-center text-primary-foreground">
	<h2 class="text-2xl font-semibold tracking-tight">Ready when you are</h2>
	<p class="max-w-md opacity-80">Sign in to see the dashboard update as you add items.</p>
	<Button href="/dashboard" variant="secondary" size="lg">Go to dashboard</Button>
</section>
