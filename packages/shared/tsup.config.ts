import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  // Disabled to avoid TS recursion issues during declaration generation.
  // This package is used internally; runtime JS build is sufficient for deploy.
  dts: false,
  sourcemap: true,
  clean: true,
});

