<script lang="ts">
	import FileText from '@lucide/svelte/icons/file-text';
	import Package from '@lucide/svelte/icons/package';
	import Plus from '@lucide/svelte/icons/plus';
	import Sparkles from '@lucide/svelte/icons/sparkles';
	import DailyBarChart from '#lib/components/dashboard/DailyBarChart.svelte';
	import StatTile from '#lib/components/dashboard/StatTile.svelte';
	import { Button } from '#lib/components/ui/button/index.js';
	import * as Card from '#lib/components/ui/card/index.js';
	import * as Table from '#lib/components/ui/table/index.js';
	let { data } = $props();

	const s = $derived(data.summary);
	const describedPct = $derived(
		s.total_items ? Math.round((s.described_items / s.total_items) * 100) : 0
	);
	let view = $state<'chart' | 'table'>('chart');

	const fmt = new Intl.NumberFormat('en-US', { notation: 'compact' });
	// UTC like the chart, so server and browser render the same text
	const fmtDate = (iso: string) =>
		new Date(iso).toLocaleDateString('en-US', {
			timeZone: 'UTC',
			month: 'short',
			day: 'numeric',
			year: 'numeric'
		});
	const fmtDay = (day: string) =>
		new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', {
			timeZone: 'UTC',
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
</script>

<div class="flex flex-wrap items-end justify-between gap-4">
	<div>
		<h1 class="text-3xl font-semibold tracking-tight">Dashboard</h1>
		<p class="mt-1 text-muted-foreground">
			Welcome back{data.user ? `, ${data.user.name ?? data.user.username}` : ''}. Here's what's
			happening with your items.
		</p>
	</div>
	<Button href="/items"><Plus class="size-4" /> Add item</Button>
</div>

<div class="mt-8 grid gap-4 md:grid-cols-3">
	<StatTile label="Total items" value={fmt.format(s.total_items)} icon={Package} hint="All time" hero />
	<StatTile
		label="Added this week"
		value={fmt.format(s.created_last_7_days)}
		icon={Sparkles}
		delta={s.created_last_7_days - s.created_previous_7_days}
		deltaLabel="vs. previous 7 days"
	/>
	<StatTile
		label="With a description"
		value={`${describedPct}%`}
		icon={FileText}
		hint={`${s.described_items} of ${s.total_items} items`}
	/>
</div>

<div class="mt-4 grid gap-4 lg:grid-cols-5">
	<Card.Root class="lg:col-span-3">
		<Card.Header class="flex flex-row items-start justify-between gap-4">
			<div class="grid gap-1.5">
				<Card.Title>Items created per day</Card.Title>
				<Card.Description>Last {s.daily.length} days (UTC)</Card.Description>
			</div>
			<div class="flex rounded-md border p-0.5 text-xs" role="group" aria-label="View">
				{#each ['chart', 'table'] as const as v (v)}
					<button
						type="button"
						class="rounded px-2 py-1 capitalize {view === v
							? 'bg-muted font-medium'
							: 'text-muted-foreground hover:text-foreground'}"
						aria-pressed={view === v}
						onclick={() => (view = v)}>{v}</button
					>
				{/each}
			</div>
		</Card.Header>
		<Card.Content>
			{#if view === 'chart'}
				<DailyBarChart data={s.daily} />
			{:else}
				<div class="max-h-[260px] overflow-y-auto">
					<Table.Root>
						<Table.Header>
							<Table.Row><Table.Head>Day</Table.Head><Table.Head class="text-right">Items</Table.Head></Table.Row>
						</Table.Header>
						<Table.Body>
							{#each [...s.daily].reverse() as d (d.day)}
								<Table.Row>
									<Table.Cell>{fmtDay(d.day)}</Table.Cell>
									<Table.Cell class="text-right tabular-nums">{d.count}</Table.Cell>
								</Table.Row>
							{/each}
						</Table.Body>
					</Table.Root>
				</div>
			{/if}
		</Card.Content>
	</Card.Root>

	<Card.Root class="lg:col-span-2">
		<Card.Header>
			<Card.Title>Recent items</Card.Title>
			<Card.Description>The latest additions</Card.Description>
		</Card.Header>
		<Card.Content>
			{#if s.recent.length === 0}
				<div class="flex flex-col items-center gap-3 rounded-lg border border-dashed py-10 text-center">
					<Package class="size-8 text-muted-foreground" />
					<p class="text-sm text-muted-foreground">No items yet.</p>
					<Button href="/items" size="sm" variant="outline">Create your first item</Button>
				</div>
			{:else}
				<ul class="divide-y">
					{#each s.recent as item (item.id)}
						<li class="flex items-center justify-between gap-4 py-3">
							<div class="min-w-0">
								<p class="truncate text-sm font-medium">{item.name}</p>
								<p class="truncate text-xs text-muted-foreground">{item.description ?? 'No description'}</p>
							</div>
							<span class="shrink-0 text-xs text-muted-foreground">{fmtDate(item.created_at)}</span>
						</li>
					{/each}
				</ul>
			{/if}
		</Card.Content>
	</Card.Root>
</div>
