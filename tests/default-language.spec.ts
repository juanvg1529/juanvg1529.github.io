import { expect, test } from '@playwright/test';

// A first-time visitor (nothing saved) must get the English site.
test.use({ storageState: { cookies: [], origins: [] } });

test('the portfolio opens in English by default', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Hi, my name is\s*Juan Diego Vera\./);
  await expect(page.locator('.credential')).toContainText('Specialist in Software Engineering');
  await expect(page.getByRole('button', { name: 'Cambiar a español' })).toHaveText('ES');
  await expect(page.locator('.cv-link').first()).toHaveAttribute('href', 'cv/Juan-Diego-Vera-SDET-CV-EN.pdf');
  await expect(page.getByRole('log')).toContainText('Type a command and press Enter');
  await expect(page.locator('#dashboard-updated')).toContainText('GitHub Actions data updated');
  // The page is revealed once translated.
  await expect(page.locator('html')).not.toHaveClass(/lang-pending/);
  await expect(page.locator('body')).toBeVisible();
});

test('Spanish text never reaches the screen before the translation, even on a slow connection', async ({ page }) => {
  // Simulate a slow network for the translation script: without the pending state the browser
  // would paint the Spanish markup while waiting for it.
  await page.route('**/i18n.js', async route => {
    const response = await route.fetch();
    await new Promise(resolve => setTimeout(resolve, 700));
    await route.fulfill({ response });
  });
  // Record what is visible on every animation frame from the very first paint.
  await page.addInitScript(() => {
    (window as unknown as { seen: string[] }).seen = [];
    const sample = () => {
      const h1 = document.querySelector('h1');
      if (h1 && getComputedStyle(document.body).visibility !== 'hidden') (window as unknown as { seen: string[] }).seen.push(h1.textContent || '');
      if (performance.now() < 3000) requestAnimationFrame(sample);
    };
    requestAnimationFrame(sample);
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Hi, my name is/);
  await page.waitForTimeout(300);
  const seen = await page.evaluate(() => (window as unknown as { seen: string[] }).seen);
  expect(seen.length).toBeGreaterThan(0);
  expect(seen.filter(text => text.includes('Hola'))).toEqual([]);
});

test('?lang=es opens the Spanish version and the choice is remembered', async ({ page }) => {
  await page.goto('/?lang=es');
  await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Hola, mi nombre es/);

  await page.getByRole('button', { name: 'Switch to English' }).click();
  await page.getByRole('button', { name: 'Cambiar a español' }).click();
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Hola, mi nombre es/);
});

test('the lab opens in English by default', async ({ page }) => {
  await page.goto('/lab/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('UI Automation Lab');
  await expect(page.locator('[data-suite="regression"]')).toHaveText('▶ Regression · 7');
  await expect(page.locator('html')).not.toHaveClass(/lang-pending/);
});

test('link previews are in English', async ({ request }) => {
  for (const path of ['/', '/lab/']) {
    const html = await (await request.get(path)).text();
    expect(html, path).toMatch(/<meta property="og:locale" content="en_US">/);
    expect(html, path).toMatch(/<meta property="og:description" content="[^"]*Specialist in Software Engineering/);
  }
});
