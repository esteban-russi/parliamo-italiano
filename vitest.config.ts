import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    // The server reads credentials at import time; keep tests offline and deterministic
    env: { GCP_PROJECT: '', GEMINI_API_KEY: '', RATE_LIMIT_PER_MINUTE: '1000' },
  },
});
