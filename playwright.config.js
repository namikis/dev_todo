import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  use: {
    baseURL: 'http://127.0.0.1:5178',
  },
  webServer: {
    command: 'node test-server.js',
    url: 'http://127.0.0.1:5178',
    reuseExistingServer: false,
    env: { TEST_PORT: '5178' },
  },
});
