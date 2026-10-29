import '@testing-library/jest-dom/vitest';

// jsdom has no layout engine; Svelte's bind:clientWidth needs ResizeObserver to exist.
globalThis.ResizeObserver ??= class {
	observe() {}
	unobserve() {}
	disconnect() {}
};
