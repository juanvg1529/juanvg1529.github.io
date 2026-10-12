import { expect, test, type Page } from '@playwright/test';

// User-action tests: they drive the interactive terminal and the demo app the way a visitor does.
// Reduced motion makes the simulated runs instant, so the tests stay fast and deterministic.
test.use({ reducedMotion: 'reduce' });

const terminal = (page: Page) => ({
  input: page.getByRole('textbox', { name: '$' }),
  output: page.getByRole('log'),
  async type(command: string) {
    await this.input.fill(command);
    await this.input.press('Enter');
  }
});

test.describe('Interactive terminal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('welcomes the visitor and suggests commands', async ({ page }) => {
    await expect(terminal(page).output).toContainText('Escribe un comando y pulsa Enter');
    await expect(page.getByRole('button', { name: 'run all' })).toBeVisible();
  });

  test('typing help lists the available commands', async ({ page }) => {
    const term = terminal(page);
    await term.type('help');
    for (const command of ['run <suite>', 'demo', 'projects', 'defects', 'contact', 'cv', 'clear']) {
      await expect(term.output).toContainText(command);
    }
  });

  test('typing a suite command simulates its real scenarios', async ({ page }) => {
    const term = terminal(page);
    await term.type('run java');
    await expect(term.output).toContainText('Buy a single product - Sauce Labs Onesie');
    await expect(term.output).toContainText('18 passed');
    await expect(term.output.getByRole('link', { name: /java-selenium-cucumber-framework/ })).toHaveAttribute('href', /juanvg1529\.github\.io\/java-selenium-cucumber-framework/);
  });

  test('stack commands are understood too', async ({ page }) => {
    const term = terminal(page);
    await term.type('npx playwright test');
    await expect(term.output).toContainText('36 passed');
    await term.type('dotnet test');
    await expect(term.output).toContainText('21 passed');
  });

  test('tapping "run all" runs every suite and reports the total', async ({ page }) => {
    await page.getByRole('button', { name: 'run all' }).click();
    const output = terminal(page).output;
    await expect(output).toContainText('ALL GREEN');
    await expect(output).toContainText('94 passed across 4 repositories');
    await expect(output).toContainText('@known-defect');
  });

  test('an unknown command explains what to do', async ({ page }) => {
    const term = terminal(page);
    await term.type('rm -rf /');
    await expect(term.output).toContainText('comando no encontrado: rm -rf /');
  });

  test('typed text is shown as text, never run as HTML', async ({ page }) => {
    const term = terminal(page);
    await term.type('<img src=x onerror="window.hacked=1">');
    await expect(term.output).toContainText('<img src=x onerror="window.hacked=1">');
    expect(await page.evaluate(() => (window as unknown as { hacked?: number }).hacked)).toBeUndefined();
    await expect(term.output.locator('img')).toHaveCount(0);
  });

  test('arrow up recalls the previous command and clear empties the output', async ({ page }) => {
    const term = terminal(page);
    await term.type('whoami');
    await expect(term.output).toContainText('QA Automation Engineer / SDET');
    await term.input.press('ArrowUp');
    await expect(term.input).toHaveValue('whoami');

    await term.type('clear');
    await expect(term.output.locator('.line')).toHaveCount(0);
  });

  test('works in English too', async ({ page }) => {
    await page.getByRole('button', { name: 'Switch to English' }).click();
    await expect(terminal(page).output).toContainText('Type a command and press Enter');
    await terminal(page).type('foo');
    await expect(terminal(page).output).toContainText('command not found: foo');
  });
});

test.describe('UI test demo', () => {
  test('the demo command shows a UI test filling the booking form', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'demo' }).click();

    const demo = page.locator('#preview');
    await expect(demo).toBeVisible();
    await expect(terminal(page).output).toContainText('2 passed');
    await expect(demo.getByRole('status')).toHaveText('Booking confirmed for Ada Lovelace · Suite');
    await expect(demo.getByLabel('Email')).toHaveValue('ada@example.com');
  });

  test('a visitor can use the demo form by hand', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'demo' }).click();
    await expect(terminal(page).output).toContainText('2 passed');

    const demo = page.locator('#preview');
    await demo.getByLabel('Name').fill('Grace Hopper');
    await demo.getByLabel('Email').fill('not-an-email');
    await demo.getByRole('button', { name: 'Book' }).click();
    await expect(demo.getByRole('alert')).toHaveText('Email is not valid');
    await expect(demo.getByRole('status')).toBeHidden();

    await demo.getByLabel('Email').fill('grace@example.com');
    await demo.getByLabel('Room').selectOption('Double');
    await demo.getByRole('button', { name: 'Book' }).click();
    await expect(demo.getByRole('status')).toHaveText('Booking confirmed for Grace Hopper · Double');
    await expect(demo.locator('#demo-error')).toBeEmpty(); // hidden when empty, so not exposed as an alert
  });

  test('the demo can be closed', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'demo' }).click();
    await page.getByRole('button', { name: 'Cerrar demo' }).click();
    await expect(page.locator('#preview')).toBeHidden();
  });
});

test('the terminal and the open demo have no WCAG 2.1 AA violations', async ({ page }) => {
  const { default: AxeBuilder } = await import('@axe-core/playwright');
  await page.goto('/');
  await page.getByRole('button', { name: 'demo' }).click();
  await expect(terminal(page).output).toContainText('2 passed');
  const results = await new AxeBuilder({ page }).include('.lab').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map(v => `${v.id}: ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)).toEqual([]);
});
