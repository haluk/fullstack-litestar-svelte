<script lang="ts">
	import LoginForm from '$lib/components/LoginForm.svelte';
	let { form } = $props();
</script>

<h1 class="mb-4 text-xl font-semibold">Log in</h1>
<LoginForm error={form?.error} />
