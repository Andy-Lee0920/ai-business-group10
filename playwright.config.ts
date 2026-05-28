import { defineConfig, devices } from '@playwright/test';

const ciBrowserChannel = process.env.CI ? { channel: 'chrome' as const } : {};

const e2eEnv = {
  ...process.env,
  NEXT_PUBLIC_FEVIO_PRESENTATION_MODE: '1',
  FEVIO_PRESENTATION_MODE: '1',
  NEXT_PUBLIC_SUPABASE_URL:
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? 'https://example.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY:
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'test-anon-key',
};

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run build && npm run start -- --hostname 127.0.0.1',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: e2eEnv,
  },
  projects: [
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'], ...ciBrowserChannel },
    },
  ],
});
