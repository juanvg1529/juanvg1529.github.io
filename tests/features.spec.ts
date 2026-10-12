import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

test.use({ reducedMotion: 'reduce' });

// ---------------- Live dashboard ----------------
const run = (conclusion: string, minutesAgo: number, durationSeconds = 120) => ({
  conclusion, event: 'push', durationSeconds, url: 'https://github.com/juanvg1529/x/actions/runs/1',
  startedAt: new Date(Date.now() - minutesAgo * 60_000).toISOString()
});

const mockStats = {
  generatedAt: new Date(Date.now() - 2 * 3600_000).toISOString(),
  repos: [
    // newest first: the latest run failed, 19 of 20 passed
    { key: 'fhir', repo: 'fhir-api-automation', runs: [run('failure', 30, 90), ...Array.from({ length: 19 }, (_, i) => run('success', 60 * (i + 2), 150))] },
    { key: 'java', repo: 'java-selenium-cucumber-framework', runs: [run('success', 5, 75), run('cancelled', 50, 10), run('success', 90, 45)] },
    { key: 'dotnet', repo: 'dotnet-api-automation-framework', runs: [] }
  ]
};

const card = (page: Page, key: string) => page.locator(`.dash-card[data-repo="${key}"]`);

test.describe('Live quality dashboard', () => {
  test('shows one card per repository from the real snapshot', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('.dash-card');
    await expect(cards).toHaveCount(5);
    for (const key of ['fhir', 'playwright', 'dotnet', 'java', 'site']) {
      await expect(card(page, key).locator('.pill')).toBeVisible();
      await expect(card(page, key).getByRole('img')).toHaveAttribute('aria-label', /(Últimas \d+ ejecuciones|Última ejecución): /);
    }
    await expect(page.locator('#dashboard-updated')).toContainText('Datos de GitHub Actions actualizados');
  });

  test('computes status, pass rate, duration and history from the run data', async ({ page }) => {
    await page.route('**/data/stats.json', route => route.fulfill({ json: mockStats }));
    await page.goto('/');

    const fhir = card(page, 'fhir');
    await expect(fhir.locator('.pill')).toHaveText('Falló');
    await expect(fhir.locator('.m-rate')).toHaveText('95%');
    await expect(fhir.locator('.m-avg')).toHaveText('2m 27s'); // (90 + 19 × 150) / 20 = 147 s
    await expect(fhir.locator('.m-last')).toHaveText('hace 30 minutos');
    await expect(fhir.getByRole('img')).toHaveAttribute('aria-label', 'Últimas 20 ejecuciones: 19 exitosas, 1 fallida');
    await expect(fhir.locator('.bar:not(.empty)')).toHaveCount(20);
    await expect(fhir.locator('.bar.ko')).toHaveCount(1);
    await expect(fhir.locator('.bar').last()).toHaveClass(/ko/); // newest run is drawn on the right

    // Cancelled runs are shown but don't count towards the pass rate.
    const java = card(page, 'java');
    await expect(java.locator('.pill')).toHaveText('En verde');
    await expect(java.locator('.m-rate')).toHaveText('100%');
    await expect(java.getByRole('img')).toHaveAttribute('aria-label', 'Últimas 2 ejecuciones: 2 exitosas, 0 fallidas');
    await expect(java.locator('.bar:not(.empty)')).toHaveCount(3); // cancelled run is still drawn
    await expect(java.locator('.bar.empty')).toHaveCount(17);

    const dotnet = card(page, 'dotnet');
    await expect(dotnet.locator('.pill')).toHaveText('Sin ejecuciones');
    await expect(dotnet.locator('.m-rate')).toHaveText('—');

    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(fhir.locator('.pill')).toHaveText('Failed');
    await expect(fhir.locator('.m-last')).toHaveText('30 minutes ago');
    await expect(fhir.getByRole('img')).toHaveAttribute('aria-label', 'Last 20 runs: 19 passed, 1 failed');
  });

  test('uses singular forms for a single run', async ({ page }) => {
    await page.route('**/data/stats.json', route => route.fulfill({ json: { ...mockStats, repos: [{ key: 'fhir', repo: 'fhir-api-automation', runs: [run('failure', 10)] }] } }));
    await page.goto('/');
    await expect(card(page, 'fhir').getByRole('img')).toHaveAttribute('aria-label', 'Última ejecución: 0 exitosas, 1 fallida');
    await expect(card(page, 'fhir').locator('.dash-foot')).toContainText('última ejecución');
  });

  test('explains the problem when the data cannot be loaded', async ({ page }) => {
    await page.route('**/data/stats.json', route => route.abort());
    await page.goto('/');
    await expect(page.locator('.dash-error')).toHaveText('No se pudieron cargar los datos del dashboard.');
  });
});

// ---------------- Find the bug ----------------
const shop = (page: Page) => {
  const app = page.locator('#bh-app');
  return {
    qty: (product: string) => app.getByLabel(`Cantidad de ${product}`),
    line: (id: string) => app.locator(`.bh-line-total[data-product="${id}"]`),
    coupon: app.getByLabel('Cupón'),
    apply: app.getByRole('button', { name: 'Aplicar' }),
    pay: app.getByRole('button', { name: 'Pagar' }),
    orders: app.locator('#bh-orders li'),
    discount: app.locator('#bh-discount'),
    report: (bug: string) => page.locator(`.bh-report[data-bug="${bug}"]`),
    progress: page.locator('#bh-progress')
  };
};

test.describe('Find the bug game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/#bughunt');
    await expect(shop(page).progress).toHaveText('0 de 5 bugs encontrados');
  });

  test('applying the coupon twice reveals the stacking discount bug', async ({ page }) => {
    const s = shop(page);
    await s.coupon.fill('QA10');
    await s.apply.click();
    await expect(s.discount).toHaveText('-10%');
    await expect(s.report('stack')).toHaveCount(0);

    await s.apply.click();
    await expect(s.discount).toHaveText('-20%');
    await expect(s.report('stack')).toContainText('El cupón se puede aplicar varias veces');
    await expect(s.progress).toHaveText('1 de 5 bugs encontrados');
  });

  test('an invalid coupon is rejected without revealing a bug', async ({ page }) => {
    const s = shop(page);
    await s.coupon.fill('FREE');
    await s.apply.click();
    await expect(page.locator('#bh-coupon-msg')).toHaveText('Cupón no válido');
    await expect(s.progress).toHaveText('0 de 5 bugs encontrados');
  });

  test('a negative quantity reveals the missing validation', async ({ page }) => {
    const s = shop(page);
    await s.qty('QA Mug').fill('-2');
    await expect(s.line('mug')).toHaveText('$-25.00');
    await expect(s.report('negative')).toBeVisible();
  });

  test('three sticker packs reveal the floating point rounding bug', async ({ page }) => {
    const s = shop(page);
    await s.qty('Sticker pack').fill('2');
    await expect(s.line('stickers')).toHaveText('$4.80');
    await expect(s.report('rounding')).toHaveCount(0);

    await s.qty('Sticker pack').fill('3');
    await expect(s.line('stickers')).toHaveText('$7.19'); // should be $7.20
    await expect(s.report('rounding')).toContainText('7,20');
  });

  test('double-clicking Pay creates two orders and reveals the bug', async ({ page }) => {
    const s = shop(page);
    await s.pay.dblclick();
    await expect(s.orders).toHaveCount(2);
    await expect(s.report('double')).toContainText('Crítica');
  });

  test('paying an empty cart reveals the bug', async ({ page }) => {
    const s = shop(page);
    for (const product of ['QA Mug', 'Bug Hunter T-Shirt', 'Sticker pack']) await s.qty(product).fill('0');
    await s.pay.click();
    await expect(s.orders.first()).toContainText('$0.00');
    await expect(s.report('empty')).toBeVisible();
  });

  test('finding all five bugs completes the game, and reset starts over', async ({ page }) => {
    const s = shop(page);
    await s.coupon.fill('QA10');
    await s.apply.click();
    await s.apply.click();
    await s.qty('Sticker pack').fill('3');
    await s.qty('QA Mug').fill('-1');
    await s.pay.dblclick();
    for (const product of ['QA Mug', 'Bug Hunter T-Shirt', 'Sticker pack']) await s.qty(product).fill('0');
    await s.pay.click();

    await expect(s.progress).toHaveText('¡Encontraste los 5! Así reporto y automatizo cada defecto.');
    await expect(page.locator('.bh-report')).toHaveCount(5);
    await expect(page.locator('.bh-report .bh-test')).toHaveCount(5);

    await page.getByRole('button', { name: 'Reiniciar' }).click();
    await expect(s.progress).toHaveText('0 de 5 bugs encontrados');
    await expect(page.locator('.bh-report')).toHaveCount(0);
    await expect(s.orders).toHaveCount(0);
  });

  test('reports switch language with the page', async ({ page }) => {
    const s = shop(page);
    await s.pay.dblclick();
    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(s.report('double')).toContainText('Double-clicking Pay creates two orders');
    await expect(page.locator('#bh-progress')).toHaveText('1 of 5 bugs found');
  });
});

// ---------------- Case files ----------------
test.describe('Case files', () => {
  test('each case opens a symptom-to-outcome timeline with its live report', async ({ page }) => {
    await page.goto('/#cases');
    const cases = page.locator('details.case');
    await expect(cases).toHaveCount(5);

    const first = cases.first();
    await expect(first.locator('.case-timeline')).toBeHidden();
    await first.locator('summary').click();
    await expect(first.locator('.case-timeline li')).toHaveCount(5);
    await expect(first).toContainText('rooms.slice(0, 3)');
    await expect(first.getByRole('link', { name: 'Reporte en vivo ↗' })).toHaveAttribute('href', 'https://juanvg1529.github.io/MonsterAutomation/');

    for (const index of [1, 2, 3, 4]) {
      await expect(cases.nth(index).locator('.case-title')).not.toBeEmpty();
      await expect(cases.nth(index).locator(`[data-i18n="case${index + 1}.fix"]`)).not.toBeEmpty();
    }
  });

  test('case files are translated to English', async ({ page }) => {
    await page.goto('/?lang=en#cases');
    await expect(page.locator('details.case').nth(1).locator('.case-title')).toHaveText('A search passed once, then failed every time');
  });
});

test('the page has no WCAG 2.1 AA violations with bug reports and a case file open', async ({ page }) => {
  await page.goto('/');
  const s = shop(page);
  await s.pay.dblclick();
  await s.qty('Sticker pack').fill('3');
  await page.locator('details.case').first().locator('summary').click();
  await expect(page.locator('.dash-card')).toHaveCount(5);
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
});
