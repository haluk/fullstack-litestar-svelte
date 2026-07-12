<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import ItemList from '$lib/components/ItemList.svelte';
	let { data, form } = $props();
</script>

<h1 class="mb-4 text-xl font-semibold">Items</h1>

<form method="POST" action="?/create" class="mb-6 flex gap-2">
	<Input name="name" placeholder="Name" required />
	<Input name="description" placeholder="Description" />
	<Button type="submit">Add</Button>
</form>
{#if form?.error}<p class="text-sm text-destructive">{form.error}</p>{/if}

<ItemList items={data.items} />
