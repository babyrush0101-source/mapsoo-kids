import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['godot/tests/generate_alpha10_fixture.test.ts'],
    environment: 'node',
  },
});
