import AxeBuilder from '@axe-core/playwright';
import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

// Tests for the in-browser lab itself: the buttons, the live run, the report and its downloads.
test.use({ reducedMotion: 'reduce' }); // the lab switches to fast mode

async function run(page: Page, suite: string, { bug = false } = {}) {
  await page.locator('#bug-toggle').setChecked(bug);
  await page.locator(`[data-suite="${suite}"]`).click();
  await expect(page.locator('#report')).toBeVisible({ timeout: 60_000 });
}

test.describe('UI automation lab', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/lab/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Laboratorio de automatización UI');
  });

  test('running the smoke suite drives the app and reports 2 passed', async ({ page }) => {
    await run(page, 'smoke');
    await expect(page.locator('#run-status')).toHaveText('Terminado: 2 de 2 pruebas pasaron.');
    await expect(page.locator('.r-test.r-passed')).toHaveCount(2);
    await expect(page.locator('#live-log')).toContainText("await page.getByLabel('Correo electrónico').fill('paciente@medicita.test')");
    // The app really reached the end of the flow.
    await expect(page.frameLocator('#aut').getByTestId('appointment')).toHaveCount(1);
  });

  test('the full run executes all 11 tests', async ({ page }) => {
    await run(page, 'all');
    await expect(page.locator('#run-status')).toHaveText('Terminado: 11 de 11 pruebas pasaron.');
  });

  test('with the injected bug, the regression suite catches the double booking', async ({ page }) => {
    await run(page, 'regression', { bug: true });
    await expect(page.locator('#run-status')).toHaveText('Terminado: 6 de 7 pruebas pasaron.');
    const failed = page.locator('.r-test.r-failed');
    await expect(failed).toHaveCount(1);
    await expect(failed.locator('.r-title')).toHaveText('un horario ya reservado no se puede volver a reservar');
    await expect(failed.locator('.r-error')).toContainText('expect(locator).toBeDisabled() failed');
    await expect(failed.locator('.r-error')).toContainText('Esperado: disabled');
    await expect(failed.locator('.r-error')).toContainText('Obtenido: enabled');
    await expect(page.locator('.r-meta')).toContainText('bug inyectado (double-booking)');
  });

  test('the report can be downloaded as JUnit XML, JSON and HTML', async ({ page }) => {
    await run(page, 'regression', { bug: true });

    const junit = await download(page, 'JUnit XML');
    expect(junit.name).toBe('medicita-junit.xml');
    expect(junit.text).toContain('<testsuite name="regression (bug: double-booking)" tests="7" failures="1"');
    expect(junit.text).toMatch(/<failure message="expect\(locator\)\.toBeDisabled\(\) failed">/);

    const json = JSON.parse((await download(page, 'JSON')).text);
    expect(json.tests).toHaveLength(7);
    expect(json.tests.filter((t: { status: string }) => t.status === 'failed')).toHaveLength(1);

    const html = await download(page, 'HTML');
    expect(html.text).toContain('MediCita · UI test report');
  });

  test('a run can be stopped', async ({ page }) => {
    await page.locator('#speed').selectOption('demo');
    await page.locator('[data-suite="all"]').click();
    await expect(page.locator('#live-log li').first()).toBeVisible();
    await page.getByRole('button', { name: 'Detener' }).click();
    await expect(page.locator('#run-status')).toHaveText('Ejecución detenida.');
    await expect(page.locator('[data-suite="smoke"]')).toBeEnabled();
    await expect(page.locator('#report')).toBeHidden();
  });

  test('the lab works in English', async ({ page }) => {
    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('UI Automation Lab');
    await run(page, 'smoke');
    await expect(page.locator('#run-status')).toHaveText('Finished: 2 of 2 tests passed.');
  });

  test('the lab page, with a report open, has no WCAG 2.1 AA violations', async ({ page }) => {
    await run(page, 'regression', { bug: true });
    const results = await new AxeBuilder({ page }).exclude('#aut').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
  });

  test('the app under test has no WCAG 2.1 AA violations', async ({ page }) => {
    await page.goto('/lab/app/#/login');
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
    expect(results.violations.map(v => v.id)).toEqual([]);
  });
});

async function download(page: Page, button: string) {
  const [file] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: button, exact: true }).click()]);
  return { name: file.suggestedFilename(), text: await readFile(await file.path(), 'utf8') };
}
