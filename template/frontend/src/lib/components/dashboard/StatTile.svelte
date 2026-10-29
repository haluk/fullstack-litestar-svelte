<script lang="ts">
	import type { Component } from 'svelte';
	import TrendingDown from '@lucide/svelte/icons/trending-down';
	import TrendingUp from '@lucide/svelte/icons/trending-up';
	import * as Card from '#lib/components/ui/card/index.js';

	let {
		label,
		value,
		icon: Icon,
		hint,
		delta,
		deltaLabel = '',
		hero = false
	}: {
		label: string;
		value: string;
		icon: Component<{ class?: string }>;
		hint?: string;
		/** signed change vs. a named period; up is treated as good */
		delta?: number;
		deltaLabel?: string;
		hero?: boolean;
	} = $props();
</script>

<Card.Root class="gap-3">
	<Card.Header class="flex flex-row items-center justify-between gap-2">
		<Card.Description class="text-sm font-medium">{label}</Card.Description>
		<Icon class="size-4 text-muted-foreground" />
	</Card.Header>
	<Card.Content>
		<p class={hero ? 'text-5xl font-semibold tracking-tight' : 'text-3xl font-semibold tracking-tight'}>
			{value}
		</p>
		{#if delta !== undefined}
			<p class="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
				{#if delta > 0}
					<TrendingUp class="size-3.5 text-emerald-600" />
					<span class="font-medium text-emerald-700 dark:text-emerald-400">+{delta}</span>
				{:else if delta < 0}
					<TrendingDown class="size-3.5 text-rose-600" />
					<span class="font-medium text-rose-700 dark:text-rose-400">{delta}</span>
				{:else}
					<span class="font-medium">±0</span>
				{/if}
				{deltaLabel}
			</p>
		{:else if hint}
			<p class="mt-2 text-xs text-muted-foreground">{hint}</p>
		{/if}
	</Card.Content>
</Card.Root>
