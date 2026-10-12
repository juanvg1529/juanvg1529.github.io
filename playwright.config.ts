import { defineConfig, devices } from '@playwright/test';

// Tests run against a local server by default; set SITE_URL to test the live site.
const SITE_URL = process.env.SITE_URL ?? 'http://localhost:4173';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: { baseURL: SITE_URL, trace: 'retain-on-failure' },
  webServer: process.env.SITE_URL ? undefined : {
    command: 'python3 -m http.server 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    // responsive.spec.ts sets its own viewports, so it only runs once (in the desktop project).
    { name: 'mobile', use: { ...devices['Pixel 7'] }, testIgnore: /responsive\.spec\.ts/ }
  ]
});
