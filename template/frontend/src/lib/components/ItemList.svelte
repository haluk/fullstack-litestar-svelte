<script lang="ts">
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table/index.js';
	import { Button } from '$lib/components/ui/button/index.js';

	export interface Item {
		id: string;
		name: string;
		description: string | null;
		created_at: string;
	}

	let { items }: { items: Item[] } = $props();
</script>

{#if items.length === 0}
	<p class="text-muted-foreground">No items yet.</p>
{:else}
	<Table>
		<TableHeader>
			<TableRow>
				<TableHead>Name</TableHead>
				<TableHead>Description</TableHead>
				<TableHead>Actions</TableHead>
			</TableRow>
		</TableHeader>
		<TableBody>
			{#each items as item (item.id)}
				<TableRow>
					<TableCell>{item.name}</TableCell>
					<TableCell>{item.description ?? '—'}</TableCell>
					<TableCell>
						<form method="POST" action="?/delete">
							<input type="hidden" name="id" value={item.id} />
							<Button type="submit" variant="destructive" size="sm">Delete</Button>
						</form>
					</TableCell>
				</TableRow>
			{/each}
		</TableBody>
	</Table>
{/if}
