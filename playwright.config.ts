import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['html', { open: 'never' }]],
  timeout: 240_000,

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3333',
    // Record video of every test
    video: 'on',
    // Viewport matching mobile-first design
    viewport: { width: 430, height: 932 },
    // Mild slowdown so the video is watchable but doesn't choke the AI
    launchOptions: {
      slowMo: 100,
    },
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], viewport: { width: 430, height: 932 } },
    },
  ],

  // Start dev server before running tests (skipped if PLAYWRIGHT_BASE_URL is set)
  ...(!process.env.PLAYWRIGHT_BASE_URL && {
    webServer: {
      command: 'pnpm dev --port 3333',
      url: 'http://localhost:3333',
      reuseExistingServer: true,
      timeout: 60_000,
    },
  }),
});
