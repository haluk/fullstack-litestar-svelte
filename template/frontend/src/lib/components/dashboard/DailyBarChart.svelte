<script lang="ts">
	// Single-series column chart: one validated hue, no legend (the card title names it),
	// thin bars with a 4px rounded data-end, hairline grid, hover tooltip per day.
	let { data }: { data: { day: string; count: number }[] } = $props();

	const HEIGHT = 260;
	const M = { top: 20, right: 8, bottom: 24, left: 32 };

	let width = $state(600);
	let active = $state<number | null>(null);

	const fmtDay = (day: string, opts: Intl.DateTimeFormatOptions) =>
		new Date(`${day}T00:00:00Z`).toLocaleDateString('en-US', { timeZone: 'UTC', ...opts });

	// clean y ticks: step from 1/2/5 × 10^k, about four intervals
	const scale = $derived.by(() => {
		const max = Math.max(0, ...data.map((d) => d.count));
		const rough = Math.max(1, max) / 4;
		const pow = 10 ** Math.floor(Math.log10(rough));
		const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? rough;
		const top = Math.max(step * 4, Math.ceil(max / step) * step);
		const ticks = Array.from({ length: Math.round(top / step) + 1 }, (_, i) => i * step);
		return { max, top, ticks };
	});

	const innerW = $derived(Math.max(0, width - M.left - M.right));
	const innerH = HEIGHT - M.top - M.bottom;
	const band = $derived(data.length ? innerW / data.length : 0);
	const barW = $derived(Math.min(24, band * 0.6));
	const labelStep = $derived(band < 36 ? 3 : band < 56 ? 2 : 1);

	const y = (v: number) => M.top + innerH - (v / scale.top) * innerH;
	const cx = (i: number) => M.left + band * i + band / 2;

	// column path: square at the baseline, 4px rounded data-end
	function barPath(i: number, v: number) {
		const h = innerH - (y(v) - M.top);
		const x0 = cx(i) - barW / 2;
		const r = Math.min(4, barW / 2, h);
		const base = M.top + innerH;
		const top = base - h;
		return `M${x0},${base}V${top + r}Q${x0},${top} ${x0 + r},${top}H${x0 + barW - r}Q${x0 + barW},${top} ${x0 + barW},${top + r}V${base}Z`;
	}

	function onMove(event: PointerEvent) {
		const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
		const i = Math.floor((event.clientX - rect.left - M.left) / band);
		active = i >= 0 && i < data.length ? i : null;
	}

	const peak = $derived(scale.max > 0 ? data.findIndex((d) => d.count === scale.max) : -1);
	const total = $derived(data.reduce((s, d) => s + d.count, 0));
</script>

<div
	class="viz relative"
	bind:clientWidth={width}
	role="presentation"
	onpointermove={onMove}
	onpointerleave={() => (active = null)}
>
	<svg
		{width}
		height={HEIGHT}
		role="img"
		aria-label={`Items created per day: ${total} over the last ${data.length} days, peak ${scale.max}.`}
	>
		{#each scale.ticks as tick (tick)}
			<line x1={M.left} x2={width - M.right} y1={y(tick)} y2={y(tick)} class="grid" />
			<text x={M.left - 8} y={y(tick)} dy="0.32em" text-anchor="end" class="axis">{tick}</text>
		{/each}

		{#each data as d, i (d.day)}
			{#if active === i}
				<rect x={M.left + band * i} y={M.top} width={band} height={innerH} class="hover-band" />
			{/if}
			{#if d.count > 0}
				<path d={barPath(i, d.count)} class="bar" class:dim={active !== null && active !== i} />
			{/if}
			{#if (data.length - 1 - i) % labelStep === 0}
				<text x={cx(i)} y={HEIGHT - 6} text-anchor="middle" class="axis">
					{fmtDay(d.day, { month: 'short', day: 'numeric' })}
				</text>
			{/if}
		{/each}

		{#if peak >= 0 && active === null}
			<text x={cx(peak)} y={y(scale.max) - 6} text-anchor="middle" class="value">{scale.max}</text>
		{/if}
	</svg>

	{#if active !== null}
		{@const d = data[active]}
		<div
			class="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-md border bg-popover px-2.5 py-1.5 text-xs whitespace-nowrap text-popover-foreground shadow-md"
			style:left="{cx(active)}px"
			style:top="{y(d.count) - 8}px"
		>
			<div class="text-muted-foreground">{fmtDay(d.day, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
			<div class="font-medium">{d.count} {d.count === 1 ? 'item' : 'items'}</div>
		</div>
	{/if}
</div>

<style>
	/* series hue validated (dataviz checks) on the light and dark card surfaces */
	.viz {
		--viz-series-1: #2a78d6;
	}
	:global(.dark) .viz {
		--viz-series-1: #3987e5;
	}
	.bar {
		fill: var(--viz-series-1);
		transition: opacity 120ms;
	}
	.bar.dim {
		opacity: 0.45;
	}
	.hover-band {
		fill: var(--color-muted);
		opacity: 0.6;
	}
	.grid {
		stroke: var(--color-border);
		stroke-width: 1;
		shape-rendering: crispEdges;
	}
	.axis {
		fill: var(--color-muted-foreground);
		font-size: 11px;
		font-variant-numeric: tabular-nums;
	}
	.value {
		fill: var(--color-foreground);
		font-size: 11px;
		font-weight: 600;
	}
</style>
