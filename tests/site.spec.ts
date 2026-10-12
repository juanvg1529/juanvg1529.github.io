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

  test('every project links only to its live report, and every report is up', async ({ page, request }) => {
    await page.goto('/');
    await expect(page.locator('article.project')).toHaveCount(4);
    await expect(page.locator('.project-links a', { hasText: /Código|Code/ })).toHaveCount(0);

    const links = await page.locator('.project-links a').evaluateAll(as => as.map(a => (a as HTMLAnchorElement).href));
    expect(links).toHaveLength(4);
    expect(links.every(url => url.startsWith('https://juanvg1529.github.io/'))).toBe(true);
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

test('the published dashboard data is fresh', async ({ request }) => {
  test.skip(!process.env.SITE_URL, 'only meaningful against the deployed site');
  const stats = await (await request.get('/data/stats.json')).json();
  expect(stats.repos).toHaveLength(5);
  expect(Date.now() - Date.parse(stats.generatedAt)).toBeLessThan(26 * 3600_000);
});

test('the CV download matches the page language and serves a PDF', async ({ page, request }) => {
  await page.goto('/');
  const cv = page.locator('.cv-link').first();
  await expect(cv).toHaveAttribute('href', 'cv/Juan-Diego-Vera-SDET-CV-ES.pdf');
  await page.getByRole('button', { name: 'Switch to English' }).click();
  await expect(cv).toHaveAttribute('href', 'cv/Juan-Diego-Vera-SDET-CV-EN.pdf');
  await expect(cv).toHaveText('Download CV ↓');

  for (const file of ['cv/Juan-Diego-Vera-SDET-CV-ES.pdf', 'cv/Juan-Diego-Vera-SDET-CV-EN.pdf']) {
    const response = await request.get(file);
    expect(response.status(), file).toBe(200);
    expect((await response.body()).subarray(0, 5).toString(), file).toBe('%PDF-');
  }
});


test('the home page anchors the UI lab and its Playwright report', async ({ page }) => {
  await page.goto('/#lab');
  await expect(page.getByRole('heading', { name: 'Ejecuta mis pruebas de UI con un clic' })).toBeVisible();
  await page.getByRole('link', { name: 'Abrir el laboratorio →' }).click();
  await expect(page).toHaveURL(/\/lab\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Laboratorio de automatización UI');
});

test('the published lab has its Playwright report', async ({ request }) => {
  test.skip(!process.env.SITE_URL, 'the report is generated in CI');
  const response = await request.get('/lab/report/');
  expect(response.status()).toBe(200);
  expect(await response.text()).toContain('Playwright');
});

test.describe('sharing and search metadata', () => {
  for (const [path, image] of [['/', 'og-home.png'], ['/lab/', 'og-lab.png']] as const) {
    test(`${path} has a complete link preview`, async ({ page, request }) => {
      await page.goto(path);
      const meta = async (attr: string, key: string) => page.locator(`meta[${attr}="${key}"]`).getAttribute('content');
      expect(await meta('property', 'og:title')).toContain('Juan Diego Vera');
      expect(await meta('property', 'og:description')).toContain('Especialista en Ingeniería de Software');
      expect(await meta('property', 'og:url')).toBe(`https://juanvg1529.github.io${path}`);
      expect(await meta('name', 'twitter:card')).toBe('summary_large_image');
      expect(await page.locator('link[rel="canonical"]').getAttribute('href')).toBe(`https://juanvg1529.github.io${path}`);

      // Crawlers need an absolute image URL; check the file the site serves is a 1200x630 PNG.
      const imageUrl = (await meta('property', 'og:image'))!;
      expect(imageUrl).toBe(`https://juanvg1529.github.io/og/${image}`);
      const png = await (await request.get(`/og/${image}`)).body();
      expect(png.subarray(1, 4).toString()).toBe('PNG');
      expect([png.readUInt32BE(16), png.readUInt32BE(20)]).toEqual([1200, 630]);
    });
  }

  test('structured data describes the person and the specialist credential', async ({ page }) => {
    await page.goto('/');
    const data = JSON.parse((await page.locator('script[type="application/ld+json"]').textContent())!);
    expect(data['@type']).toBe('Person');
    expect(data.jobTitle).toBe('QA Automation Engineer / SDET');
    expect(data.hasCredential[0].name).toBe('Especialista en Ingeniería de Software con énfasis en Pruebas');
    expect(data.sameAs).toContain('https://github.com/juanvg1529');
  });

  test('the specialist credential is shown prominently in both languages', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.credential')).toContainText('Especialista en Ingeniería de Software');
    await expect(page.locator('.credential')).toBeInViewport();
    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(page.locator('.credential')).toContainText('Specialist in Software Engineering');
  });
});
