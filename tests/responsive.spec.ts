import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

// Responsive checks. They set their own viewports, so playwright.config.ts runs them only in the desktop project.

const PAGES = ['/', '/lab/', '/lab/app/#/login'];
const WIDTHS = [320, 360, 390, 414, 768, 1024];

for (const path of PAGES) {
  test(`${path} never scrolls sideways (320–1024 px)`, async ({ page }) => {
    for (const width of WIDTHS) {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${path} at ${width}px`).toBeLessThanOrEqual(0);
    }
  });
}

test.describe('on a phone', () => {
  test.use({ viewport: { width: 375, height: 740 }, hasTouch: true, isMobile: true });

  test('form fields use at least 16px text, so iOS does not zoom in on focus', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      const small = await page.evaluate(() => [...document.querySelectorAll('input:not([type=checkbox]):not([type=radio]), select, textarea')]
        .filter(el => el.getClientRects().length && parseFloat(getComputedStyle(el).fontSize) < 16)
        .map(el => `${el.id || el.className}: ${getComputedStyle(el).fontSize}`));
      expect(small, path).toEqual([]);
    }
  });

  test('the menu opens, navigates and closes', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Abrir menú' });
    const nav = page.getByRole('navigation', { name: 'Principal' });
    await expect(nav).toBeHidden();

    await toggle.tap();
    await expect(nav).toBeVisible();
    await expect(page.getByRole('button', { name: 'Cerrar menú' })).toHaveAttribute('aria-expanded', 'true');

    await nav.getByRole('link', { name: 'Casos' }).tap();
    await expect(nav).toBeHidden();
    await expect(page).toHaveURL(/#cases$/);
    await expect(page.getByRole('heading', { name: 'Bugs difíciles, resueltos con evidencia' })).toBeInViewport();

    await page.getByRole('button', { name: 'Abrir menú' }).tap();
    await page.keyboard.press('Escape');
    await expect(nav).toBeHidden();
    await expect(page.getByRole('button', { name: 'Abrir menú' })).toBeFocused();
  });

  test('the lab shows the run status above the app while tests run', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/lab/');
    await page.locator('[data-suite="smoke"]').tap();
    await expect(page.locator('#mini-status')).toBeVisible();
    await expect(page.locator('#mini-status')).toHaveText('Terminado: 2 de 2 pruebas pasaron.');
  });

  test('touch targets meet WCAG 2.2 target size', async ({ page }) => {
    for (const path of PAGES) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const results = await new AxeBuilder({ page }).withRules(['target-size']).exclude('#aut').analyze();
      expect(results.violations.flatMap(v => v.nodes.map(n => `${path} ${n.target.join(' ')}`))).toEqual([]);
    }
  });
});

test('the desktop navigation is always visible and has no menu button', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  await page.goto('/');
  await expect(page.getByRole('navigation', { name: 'Principal' })).toBeVisible();
  await expect(page.locator('#menu-toggle')).toBeHidden();
});
