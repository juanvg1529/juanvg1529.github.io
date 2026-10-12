import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('Portfolio site', () => {
  test('greets visitors in Spanish by default', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Hola, mi nombre es\s*Juan Diego Vera\./);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });

  test('switches to English and back', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Hi, my name is\s*Juan Diego Vera\./);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await page.getByRole('button', { name: 'Cambiar a español' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Hola, mi nombre es/);
  });

  test('opens in English with ?lang=en', async ({ page }) => {
    await page.goto('/?lang=en');
    await expect(page.getByRole('heading', { name: 'Projects you can run today' })).toBeVisible();
  });

  test('every project links to its code and its live report', async ({ page, request }) => {
    await page.goto('/');
    const projects = page.locator('article.project');
    await expect(projects).toHaveCount(4);

    const links = await page.locator('.project-links a').evaluateAll(as => as.map(a => (a as HTMLAnchorElement).href));
    expect(links).toHaveLength(8);
    for (const url of links) {
      const response = await request.get(url);
      expect(response.status(), url).toBe(200);
    }
  });

  test('has no horizontal scroll', async ({ page }) => {
    await page.goto('/');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(0);
  });

  for (const colorScheme of ['light', 'dark'] as const) {
    test(`has no WCAG 2.1 AA accessibility violations (${colorScheme} mode)`, async ({ page }) => {
      await page.emulateMedia({ colorScheme });
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
      expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
    });
  }
});
