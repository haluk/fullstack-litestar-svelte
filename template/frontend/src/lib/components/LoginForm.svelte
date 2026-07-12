<script lang="ts">
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import { Label } from '$lib/components/ui/label/index.js';
	let { error = null }: { error?: string | null } = $props();
</script>

<form method="POST" class="flex max-w-sm flex-col gap-3">
	<div class="grid gap-1.5">
		<Label for="email">Email</Label>
		<Input id="email" name="email" type="email" required />
	</div>
	<div class="grid gap-1.5">
		<Label for="password">Password</Label>
		<Input id="password" name="password" type="password" required />
	</div>
	{#if error}<p class="text-sm text-destructive">{error}</p>{/if}
	<Button type="submit">Log in</Button>
</form>
