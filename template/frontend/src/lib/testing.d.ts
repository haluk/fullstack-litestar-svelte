// Ambient module augmentation so `svelte-check` sees the jest-dom matchers
// registered at runtime by `vitest-setup.ts` (which sits outside `src/` and
// therefore outside the TypeScript program svelte-check type-checks).
import '@testing-library/jest-dom/vitest';
