import { defineConfig } from '@playwright/test';

// The API keeps its game/gallery state in memory for the lifetime of the process, so every
// spec must see a freshly booted server. `reuseExistingServer` is therefore deliberately off:
// a leftover dev server (or a previous run) would otherwise leak collected photo cards into
// the next run and make assertions like "1 / 6 unlocked" depend on execution order.
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  retries: 0,
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:4176',
    browserName: 'chromium',
    channel: 'chrome',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure'
  },
  webServer: {
    command: 'node apps/api/server.mjs',
    url: 'http://127.0.0.1:4176/health',
    env: { PORT: '4176' },
    reuseExistingServer: false,
    timeout: 30_000
  }
});
