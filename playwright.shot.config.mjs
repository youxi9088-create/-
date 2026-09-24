import { defineConfig } from '@playwright/test';

// Screenshot-only config. Reuses the already-running preview server on 4173 so we can
// capture the real rendered page without booting a second authoritative game service.
export default defineConfig({
  testDir: './tests/shots',
  testMatch: /.*\.mjs/,
  timeout: 60000,
  retries: 0,
  workers: 1,
  outputDir: './test-results/shots',
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    screenshot: 'off'
  }
});
