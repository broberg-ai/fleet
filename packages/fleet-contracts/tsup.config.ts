import { defineConfig } from 'tsup';

// Used by the EXTRACTED, published package (F072.7) to emit dist/.
// In the buddy monorepo the package resolves from `src` (main→src) so
// bun/pnpm read source directly — same pattern as @broberg/db-sdk.
export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  sourcemap: true,
});
