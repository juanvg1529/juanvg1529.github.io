// UI Automation Lab: a small Playwright-style test runner that drives the MediCita app (in an iframe)
// for real — clicking, typing and asserting — and produces HTML / JUnit XML / JSON reports.
(function () {
  'use strict';

  // ======================= i18n (lab chrome only; the app under test is in Spanish) =======================
  const I18N = {
    es: {
      back: '← Volver al portafolio', title: 'Laboratorio de automatización UI',
      lead: 'Elige una suite y presiona ejecutar: las pruebas manejan de verdad la app MediCita (clics, escritura y verificaciones) y al final generan un reporte que puedes descargar.',
      suites: 'Suites', run: 'Ejecutar', bug: 'Inyectar bug: permitir reservas dobles', speed: 'Velocidad', demo: 'Demo (lento)', fast: 'Rápido',
      stop: 'Detener', live: 'Ejecución en vivo', idle: 'Elige una suite para empezar.', report: 'Reporte de ejecución',
      passed: 'pasaron', failed: 'fallaron', duration: 'duración', tests: 'pruebas', download: 'Descargar',
      steps: 'Pasos', code: 'Código del test', error: 'Error', expected: 'Esperado', received: 'Obtenido',
      running: (i, n, t) => `Ejecutando ${i}/${n}: ${t}`, done: (p, n) => `Terminado: ${p} de ${n} pruebas pasaron.`,
      stopped: 'Ejecución detenida.', ciTitle: 'Las mismas pruebas, con Playwright en CI',
      ciText: 'Este laboratorio corre en tu navegador. Las mismas pruebas, escritas con Playwright y Page Objects, se ejecutan en GitHub Actions en cada cambio, y este es su reporte oficial:',
      ciLink: 'Ver reporte de Playwright ↗', how: 'Cómo funciona',
      how1: 'App bajo prueba: MediCita, una app de citas médicas con login, búsqueda, agenda con horarios ocupados y cancelación.',
      how2: 'Runner propio con una API al estilo Playwright: localizadores por rol, etiqueta y test id, y aserciones que reintentan hasta 4 s.',
      how3: 'Cada test empieza con la app recién cargada: sin estado compartido, igual que un contexto nuevo de navegador.',
      how4: 'Reportes en HTML, JUnit XML (lo que leen Jenkins, Azure DevOps o GitHub) y JSON.',
      bugOn: 'bug inyectado', suite: 'Suite', date: 'Fecha', mode: 'Modo',
      sSmoke: '▶ Smoke · 2', sRegression: '▶ Regresión · 7', sNegative: '▶ Negativos · 4', sAll: '▶ Todo · 11'
    },
    en: {
      back: '← Back to portfolio', title: 'UI Automation Lab',
      lead: 'Pick a suite and press run: the tests really drive the MediCita app (clicks, typing and assertions) and generate a report you can download.',
      suites: 'Suites', run: 'Run', bug: 'Inject bug: allow double bookings', speed: 'Speed', demo: 'Demo (slow)', fast: 'Fast',
      stop: 'Stop', live: 'Live run', idle: 'Pick a suite to start.', report: 'Run report',
      passed: 'passed', failed: 'failed', duration: 'duration', tests: 'tests', download: 'Download',
      steps: 'Steps', code: 'Test code', error: 'Error', expected: 'Expected', received: 'Received',
      running: (i, n, t) => `Running ${i}/${n}: ${t}`, done: (p, n) => `Finished: ${p} of ${n} tests passed.`,
      stopped: 'Run stopped.', ciTitle: 'The same tests, with Playwright in CI',
      ciText: 'This lab runs in your browser. The same tests, written with Playwright and Page Objects, run in GitHub Actions on every change, and this is their official report:',
      ciLink: 'Open the Playwright report ↗', how: 'How it works',
      how1: 'App under test: MediCita, a medical appointments app with login, search, booking with taken slots, and cancellation.',
      how2: 'A custom runner with a Playwright-style API: role, label and test-id locators, and assertions that retry for up to 4 s.',
      how3: 'Every test starts with a freshly loaded app: no shared state, just like a new browser context.',
      how4: 'Reports in HTML, JUnit XML (what Jenkins, Azure DevOps and GitHub read) and JSON.',
      bugOn: 'bug injected', suite: 'Suite', date: 'Date', mode: 'Mode',
      sSmoke: '▶ Smoke · 2', sRegression: '▶ Regression · 7', sNegative: '▶ Negative · 4', sAll: '▶ All · 11'
    }
  };
  let lang = 'es';
  try { lang = new URLSearchParams(location.search).get('lang') || localStorage.getItem('lang') || 'es'; } catch (e) { /* default */ }
  if (lang !== 'en') lang = 'es';
  const t = () => I18N[lang];

  // ======================= DOM =======================
  const frame = document.getElementById('aut');
  const viewport = document.getElementById('viewport');
  const cursor = document.getElementById('lab-cursor');
  const urlBar = document.getElementById('url-bar');
  const log = document.getElementById('live-log');
  const status = document.getElementById('run-status');
  const miniStatus = document.getElementById('mini-status');
  // Mirrors the run status above the app on small screens, where the live log is below the fold.
  new MutationObserver(() => { miniStatus.textContent = status.textContent; }).observe(status, { childList: true, characterData: true, subtree: true });
  const reportSection = document.getElementById('report');
  const reportBody = document.getElementById('report-body');
  const bugToggle = document.getElementById('bug-toggle');
  const speedSelect = document.getElementById('speed');
  const stopButton = document.getElementById('stop');
  const runButtons = document.querySelectorAll('[data-suite]');

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) speedSelect.value = 'fast';

  // ======================= runner core =======================
  const TIMEOUT = 4000;
  let runId = 0;
  let current = null; // the test being executed

  class StopError extends Error {}
  class AssertionError extends Error {
    constructor(message, expected, received) { super(message); this.expected = expected; this.received = received; }
  }

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const pace = () => (speedSelect.value === 'demo' ? { step: 420, key: 35 } : { step: 0, key: 0 });
  const doc = () => frame.contentDocument;
  const checkStop = id => { if (id !== runId) throw new StopError('stopped'); };
  const fmt = v => (v instanceof RegExp ? v.toString() : typeof v === 'string' ? `'${v.replace(/'/g, "\\'")}'` : JSON.stringify(v));

  function visible(el) { return !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden'; }
  function textOf(el) { return (el.getAttribute('aria-label') || el.textContent || el.value || '').replace(/\s+/g, ' ').trim(); }
  function matches(value, expected) { return expected instanceof RegExp ? expected.test(value) : value === expected; }

  const ROLE_SELECTORS = {
    button: 'button, input[type=submit], a.button, [role=button]',
    link: 'a[href]', heading: 'h1, h2, h3', textbox: 'input:not([type=radio]):not([type=checkbox]), textarea',
    combobox: 'select', alert: '[role=alert]', status: '[role=status]', dialog: '[role=dialog]'
  };

  function labelled(text) {
    const d = doc();
    return [...d.querySelectorAll('label, legend')].filter(l => matches(l.textContent.replace(/\s+/g, ' ').trim(), text))
      .map(l => (l.htmlFor ? d.getElementById(l.htmlFor) : l.querySelector('input, select, textarea'))).filter(Boolean);
  }

  /** A lazy, re-evaluated locator, like Playwright's. */
  class Locator {
    constructor(description, query) { this.description = description; this.query = query; }
    all() { try { return this.query(); } catch (e) { return []; } }
    first() { return this.all()[0] || null; }

    async waitFor(predicate = el => visible(el), what = 'visible') {
      const id = runId;
      const start = performance.now();
      while (performance.now() - start < TIMEOUT) {
        checkStop(id);
        const el = this.first();
        if (el && predicate(el)) return el;
        await sleep(40);
      }
      throw new AssertionError(`Timeout ${TIMEOUT}ms waiting for ${this.description} to be ${what}`, what, this.first() ? 'not ' + what : 'element not found');
    }

    async click() {
      await step(`await ${this.description}.click()`, async () => {
        const el = await this.waitFor(e => visible(e) && !e.disabled, 'visible and enabled');
        await point(el);
        el.click();
      });
    }

    async check() {
      await step(`await ${this.description}.check()`, async () => {
        const el = await this.waitFor(e => !e.disabled && (visible(e) || visible(e.closest('label'))), 'enabled');
        await point(el.closest('label') || el);
        el.checked = true;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }

    async fill(value) {
      await step(`await ${this.description}.fill(${fmt(value)})`, async () => {
        const el = await this.waitFor(e => visible(e) && !e.disabled, 'editable');
        await point(el);
        el.focus();
        el.value = '';
        const { key } = pace();
        for (const char of value) {
          el.value += char;
          el.dispatchEvent(new Event('input', { bubbles: true }));
          if (key) await sleep(key);
        }
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    }

    async selectOption(label) {
      await step(`await ${this.description}.selectOption(${fmt(label)})`, async () => {
        const el = await this.waitFor();
        await point(el);
        const option = [...el.options].find(o => o.textContent.trim() === label || o.value === label);
        if (!option) throw new AssertionError(`Option ${fmt(label)} not found in ${this.description}`, label, [...el.options].map(o => o.textContent.trim()).join(', '));
        el.value = option.value;
        el.dispatchEvent(new Event('change', { bubbles: true }));
      });
    }
  }

  const page = {
    getByRole: (role, { name } = {}) => new Locator(`page.getByRole('${role}'${name !== undefined ? `, { name: ${fmt(name)} }` : ''})`,
      () => [...doc().querySelectorAll(ROLE_SELECTORS[role])].filter(el => name === undefined || matches(textOf(el), name))),
    getByLabel: text => new Locator(`page.getByLabel(${fmt(text)})`, () => labelled(text)),
    getByTestId: id => new Locator(`page.getByTestId('${id}')`, () => [...doc().querySelectorAll(`[data-testid="${id}"]`)]),
    getByText: text => new Locator(`page.getByText(${fmt(text)})`, () => [...doc().querySelectorAll('body *')].filter(el => el.children.length === 0 && matches(el.textContent.trim(), text))),

    async goto(hash, { bug } = {}) {
      await step(`await page.goto('${hash}')`, async () => {
        // Query string (cache-buster and optional bug) must come before the hash route.
        const src = `app/index.html?${bug ? 'bug=' + bug + '&' : ''}run=${Date.now()}${hash}`;
        urlBar.textContent = `https://medicita.lab/${hash.replace('#/', '')}${bug ? '  · ?bug=' + bug : ''}`;
        await new Promise(resolve => { frame.addEventListener('load', resolve, { once: true }); frame.src = src; });
        // Same hash on reload doesn't trigger hashchange, so the app renders on load; wait until it has.
        await new Locator('app view', () => [doc().getElementById('view')].filter(v => v && v.children.length)).waitFor(() => true, 'rendered');
      });
    }
  };

  // Retrying assertions: they poll until the condition holds or the timeout expires, like Playwright's expect.
  function expect(locator) {
    const assert = (title, check, expected, receivedOf) => step(`await expect(${locator.description}).${title}`, async () => {
      const id = runId;
      const start = performance.now();
      let last;
      while (performance.now() - start < TIMEOUT) {
        checkStop(id);
        last = locator.all();
        if (check(last)) { if (last[0]) await point(last[0]); return; }
        await sleep(40);
      }
      throw new AssertionError(`expect(locator).${title.replace(/\(.*\)$/, '()')} failed\nLocator: ${locator.description}`, expected, receivedOf(last));
    });
    const first = els => els[0];
    return {
      toBeVisible: () => assert('toBeVisible()', els => visible(first(els)), 'visible', els => (first(els) ? 'hidden' : 'element not found')),
      toHaveText: text => assert(`toHaveText(${fmt(text)})`, els => first(els) && matches(textOf(first(els)), text), fmt(text), els => (first(els) ? fmt(textOf(first(els))) : 'element not found')),
      toContainText: text => assert(`toContainText(${fmt(text)})`, els => first(els) && textOf(first(els)).includes(text), fmt(text), els => (first(els) ? fmt(textOf(first(els))) : 'element not found')),
      toHaveCount: n => assert(`toHaveCount(${n})`, els => els.filter(visible).length === n, String(n), els => String(els.filter(visible).length)),
      toBeDisabled: () => assert('toBeDisabled()', els => first(els) && first(els).disabled, 'disabled', els => (first(els) ? 'enabled' : 'element not found')),
      toBeEnabled: () => assert('toBeEnabled()', els => first(els) && !first(els).disabled, 'enabled', els => (first(els) ? 'disabled' : 'element not found'))
    };
  }

  async function step(title, action) {
    const id = runId;
    checkStop(id);
    const record = { title, status: 'running', ms: 0 };
    current.steps.push(record);
    const row = logLine(title, 'running');
    const start = performance.now();
    try {
      await action();
      record.status = 'passed';
      row.dataset.status = 'passed';
    } catch (error) {
      record.status = 'failed';
      row.dataset.status = 'failed';
      throw error;
    } finally {
      record.ms = Math.round(performance.now() - start);
      unpoint();
    }
    const { step: delay } = pace();
    if (delay) await sleep(delay);
  }

  let highlighted = null;
  async function point(el) {
    unpoint();
    highlighted = el;
    el.classList.add('lab-highlight');
    el.scrollIntoView({ block: 'nearest' });
    if (!reducedMotion && speedSelect.value === 'demo') {
      const box = el.getBoundingClientRect();
      cursor.hidden = false;
      cursor.style.transform = `translate(${box.left + Math.min(box.width / 2, 60)}px, ${box.top + box.height / 2}px)`;
      await sleep(260);
    }
  }
  function unpoint() { if (highlighted) highlighted.classList.remove('lab-highlight'); highlighted = null; }

  function logLine(text, state, kind = 'step') {
    const li = document.createElement('li');
    li.className = 'log-' + kind;
    li.dataset.status = state;
    li.textContent = text;
    log.append(li);
    log.scrollTop = log.scrollHeight;
    return li;
  }

  // ======================= Page Object (used by the tests below) =======================
  const CREDENTIALS = { email: 'paciente@medicita.test', password: 'Salud2026!' };
  const medicita = {
    async login(email = CREDENTIALS.email, password = CREDENTIALS.password, options = {}) {
      await page.goto('#/login', options);
      await page.getByLabel('Correo electrónico').fill(email);
      await page.getByLabel('Contraseña').fill(password);
      await page.getByRole('button', { name: 'Ingresar' }).click();
    },
    async book(doctor, slot, reason = 'Control anual y revisión de exámenes') {
      await page.getByRole('link', { name: `Agendar con ${doctor}` }).click();
      await page.getByLabel(slot).check();
      await page.getByLabel('Motivo de la consulta').fill(reason);
      await page.getByRole('button', { name: 'Confirmar cita' }).click();
      await expect(page.getByRole('heading', { name: 'Cita confirmada' })).toBeVisible();
    }
  };

  // ======================= Test suites =======================
  const TESTS = [
    { id: 'login', tags: ['smoke', 'regression'], title: 'el paciente inicia sesión', fn: async o => {
      await medicita.login(undefined, undefined, o);
      await expect(page.getByTestId('greeting')).toHaveText('Hola, Ana');
      await expect(page.getByRole('heading', { name: 'Encuentra tu médico' })).toBeVisible();
    } },
    { id: 'book', tags: ['smoke', 'regression'], title: 'el paciente agenda una cita de principio a fin', fn: async o => {
      await medicita.login(undefined, undefined, o);
      await medicita.book('Dra. Laura Gómez', '10:00');
      await expect(page.getByTestId('appointment-code')).toHaveText(/^MC-\d{4}$/);
      await expect(page.getByTestId('confirmation-time')).toHaveText('10:00');
      await page.getByRole('button', { name: 'Ver mis citas' }).click();
      await expect(page.getByTestId('appointment')).toHaveCount(1);
    } },
    { id: 'filter', tags: ['regression'], title: 'filtra los médicos por especialidad', fn: async o => {
      await medicita.login(undefined, undefined, o);
      await page.getByLabel('Especialidad').selectOption('Pediatría');
      await expect(page.getByTestId('doctor-card')).toHaveCount(2);
      await expect(page.getByTestId('results-count')).toHaveText('2 médicos encontrados');
    } },
    { id: 'search-empty', tags: ['regression'], title: 'una búsqueda sin resultados lo explica', fn: async o => {
      await medicita.login(undefined, undefined, o);
      await page.getByLabel('Buscar médico').fill('Zuluaga');
      await expect(page.getByTestId('empty-doctors')).toBeVisible();
      await expect(page.getByTestId('results-count')).toHaveText('0 médicos encontrados');
    } },
    { id: 'double-booking', tags: ['regression'], title: 'un horario ya reservado no se puede volver a reservar', fn: async o => {
      await medicita.login(undefined, undefined, o);
      await medicita.book('Dr. Andrés Ruiz', '10:00');
      await page.getByRole('link', { name: 'Médicos' }).click();
      await page.getByRole('link', { name: 'Agendar con Dr. Andrés Ruiz' }).click();
      await expect(page.getByLabel('10:00 · ocupado')).toBeDisabled(); // the slot this test just booked
      await expect(page.getByLabel('09:00 · ocupado')).toBeDisabled(); // booked by another patient
    } },
    { id: 'cancel', tags: ['regression'], title: 'el paciente cancela una cita', fn: async o => {
      await medicita.login(undefined, undefined, o);
      await medicita.book('Dra. Camila Torres', '11:00');
      await page.getByRole('button', { name: 'Ver mis citas' }).click();
      await page.getByRole('button', { name: 'Cancelar cita MC-1001' }).click();
      await expect(page.getByRole('dialog')).toBeVisible();
      await page.getByRole('button', { name: 'Sí, cancelar' }).click();
      await expect(page.getByRole('status')).toHaveText('Cita cancelada');
      await expect(page.getByTestId('empty-appointments')).toBeVisible();
    } },
    { id: 'logout', tags: ['regression'], title: 'el paciente cierra sesión', fn: async o => {
      await medicita.login(undefined, undefined, o);
      await page.getByRole('button', { name: 'Salir' }).click();
      await expect(page.getByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeVisible();
      await expect(page.getByRole('status')).toHaveText('Sesión cerrada');
    } },
    { id: 'empty-email', tags: ['negative'], title: 'el login exige el correo', fn: async o => {
      await page.goto('#/login', o);
      await page.getByRole('button', { name: 'Ingresar' }).click();
      await expect(page.getByRole('alert')).toHaveText('Ingresa tu correo electrónico');
    } },
    { id: 'wrong-password', tags: ['negative'], title: 'una contraseña incorrecta es rechazada', fn: async o => {
      await medicita.login(CREDENTIALS.email, 'Incorrecta1', o);
      await expect(page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos');
      await expect(page.getByTestId('greeting')).toHaveCount(0);
    } },
    { id: 'no-slot', tags: ['negative'], title: 'no se puede agendar sin elegir horario', fn: async o => {
      await medicita.login(undefined, undefined, o);
      await page.getByRole('link', { name: 'Agendar con Dr. Mateo Herrera' }).click();
      await page.getByLabel('Motivo de la consulta').fill('Dolor de cabeza frecuente');
      await page.getByRole('button', { name: 'Confirmar cita' }).click();
      await expect(page.getByRole('alert')).toHaveText('Selecciona un horario');
    } },
    { id: 'short-reason', tags: ['negative'], title: 'el motivo de la consulta exige 10 caracteres', fn: async o => {
      await medicita.login(undefined, undefined, o);
      await page.getByRole('link', { name: 'Agendar con Dra. Sofía Vargas' }).click();
      await page.getByLabel('08:00').check();
      await page.getByLabel('Motivo de la consulta').fill('Dolor');
      await page.getByRole('button', { name: 'Confirmar cita' }).click();
      await expect(page.getByRole('alert')).toHaveText('Describe el motivo de la consulta (mínimo 10 caracteres)');
    } }
  ];
  const SUITES = { smoke: 'smoke', regression: 'regression', negative: 'negative', all: null };

  // ======================= run & report =======================
  async function runSuite(suite) {
    const id = ++runId;
    const bug = bugToggle.checked ? 'double-booking' : null;
    const tests = TESTS.filter(test => !SUITES[suite] || test.tags.includes(SUITES[suite]));
    const run = { suite, bug, startedAt: new Date().toISOString(), tests: [], ms: 0 };
    log.replaceChildren();
    reportSection.hidden = true;
    setRunning(true);
    if (window.matchMedia('(max-width: 980px)').matches) document.querySelector('.browser').scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
    const runStart = performance.now();

    try {
      for (const [index, test] of tests.entries()) {
        checkStop(id);
        status.textContent = t().running(index + 1, tests.length, test.title);
        logLine(`${test.title}  [${test.tags.join(', ')}]`, 'running', 'test');
        current = { id: test.id, title: test.title, tags: test.tags, status: 'running', steps: [], ms: 0, code: test.fn.toString() };
        const start = performance.now();
        try {
          await test.fn({ bug });
          current.status = 'passed';
        } catch (error) {
          if (error instanceof StopError) throw error;
          current.status = 'failed';
          current.error = { message: error.message, expected: error.expected, received: error.received };
          logLine(error.message.split('\n')[0], 'failed', 'error');
        }
        current.ms = Math.round(performance.now() - start);
        log.querySelectorAll('.log-test')[index].dataset.status = current.status;
        run.tests.push(current);
      }
      run.ms = Math.round(performance.now() - runStart);
      const passed = run.tests.filter(x => x.status === 'passed').length;
      status.textContent = t().done(passed, run.tests.length);
      renderReport(run);
    } catch (error) {
      if (!(error instanceof StopError)) throw error;
      status.textContent = t().stopped;
    } finally {
      if (id === runId) setRunning(false);
      cursor.hidden = true;
      unpoint();
    }
  }

  function setRunning(running) {
    runButtons.forEach(b => { b.disabled = running; });
    bugToggle.disabled = running;
    stopButton.disabled = !running;
  }

  stopButton.addEventListener('click', () => { runId++; setRunning(false); status.textContent = t().stopped; cursor.hidden = true; });
  runButtons.forEach(button => button.addEventListener('click', () => runSuite(button.dataset.suite)));

  let lastRun = null;
  function renderReport(run) {
    lastRun = run;
    const passed = run.tests.filter(x => x.status === 'passed').length;
    const failed = run.tests.length - passed;
    const el = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };

    reportBody.replaceChildren();
    const summary = el('div', 'r-summary');
    summary.append(
      stat(String(passed), t().passed, 'ok'), stat(String(failed), t().failed, failed ? 'ko' : ''),
      stat(String(run.tests.length), t().tests, ''), stat((run.ms / 1000).toFixed(1) + 's', t().duration, ''));
    function stat(value, label, cls) { const s = el('div', 'r-stat ' + cls); s.append(el('strong', '', value), el('span', '', label)); return s; }

    const meta = el('p', 'r-meta', `${t().suite}: ${run.suite} · ${t().date}: ${new Date(run.startedAt).toLocaleString(lang)}${run.bug ? ` · ${t().mode}: ${t().bugOn} (${run.bug})` : ''}`);
    const bar = el('div', 'r-bar');
    bar.setAttribute('role', 'img');
    bar.setAttribute('aria-label', `${passed} ${t().passed}, ${failed} ${t().failed}`);
    const okPart = el('span', 'ok'); okPart.style.width = `${(passed / run.tests.length) * 100}%`;
    const koPart = el('span', 'ko'); koPart.style.width = `${(failed / run.tests.length) * 100}%`;
    bar.append(okPart, koPart);

    const list = el('div', 'r-tests');
    for (const test of run.tests) {
      const details = el('details', 'r-test r-' + test.status);
      details.dataset.test = test.id;
      if (test.status === 'failed') details.open = true;
      const summaryRow = el('summary');
      summaryRow.append(el('span', 'r-icon', test.status === 'passed' ? '✓' : '✗'), el('span', 'r-title', test.title), el('span', 'r-tags', test.tags.join(' · ')), el('span', 'r-ms', (test.ms / 1000).toFixed(2) + 's'));
      details.append(summaryRow);
      if (test.error) {
        const box = el('div', 'r-error');
        box.append(el('pre', '', test.error.message));
        if (test.error.expected !== undefined) box.append(el('p', '', `${t().expected}: ${test.error.expected}`), el('p', '', `${t().received}: ${test.error.received}`));
        details.append(box);
      }
      const steps = el('ol', 'r-steps');
      test.steps.forEach(s => { const li = el('li', 's-' + s.status); li.append(el('code', '', s.title), el('span', '', s.ms + 'ms')); steps.append(li); });
      details.append(el('h4', '', t().steps), steps);
      const codeDetails = el('details', 'r-code');
      codeDetails.append(el('summary', '', t().code), el('pre', '', `test('${test.title}', ${test.code})`));
      codeDetails.querySelector('pre').tabIndex = 0;
      details.append(codeDetails);
      list.append(details);
    }
    reportBody.append(summary, bar, meta, list);
    reportSection.hidden = false;
    reportSection.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  }

  // ---------- downloads ----------
  const xml = s => String(s).replace(/[<>&"']/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' }[c]));

  function junit(run) {
    const failures = run.tests.filter(x => x.status === 'failed').length;
    const cases = run.tests.map(test => `    <testcase classname="medicita.${test.tags[0]}" name="${xml(test.title)}" time="${(test.ms / 1000).toFixed(3)}">${test.error
      ? `\n      <failure message="${xml(test.error.message.split('\n')[0])}">${xml(`${test.error.message}\nExpected: ${test.error.expected}\nReceived: ${test.error.received}`)}</failure>\n    ` : ''}</testcase>`).join('\n');
    return `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites name="MediCita UI lab" tests="${run.tests.length}" failures="${failures}" time="${(run.ms / 1000).toFixed(3)}">\n  <testsuite name="${run.suite}${run.bug ? ' (bug: ' + run.bug + ')' : ''}" tests="${run.tests.length}" failures="${failures}" timestamp="${run.startedAt}" time="${(run.ms / 1000).toFixed(3)}">\n${cases}\n  </testsuite>\n</testsuites>\n`;
  }

  function htmlReport(run) {
    const passed = run.tests.filter(x => x.status === 'passed').length;
    const rows = run.tests.map(test => `<details${test.status === 'failed' ? ' open' : ''} class="${test.status}"><summary>${test.status === 'passed' ? '✓' : '✗'} ${xml(test.title)} <small>${(test.ms / 1000).toFixed(2)}s · ${test.tags.join(', ')}</small></summary>${test.error ? `<pre class="err">${xml(test.error.message)}\nExpected: ${xml(test.error.expected)}\nReceived: ${xml(test.error.received)}</pre>` : ''}<ol>${test.steps.map(s => `<li class="${s.status}"><code>${xml(s.title)}</code> <small>${s.ms}ms</small></li>`).join('')}</ol></details>`).join('');
    return `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><title>MediCita UI test report</title><style>body{font-family:system-ui,sans-serif;max-width:900px;margin:32px auto;padding:0 16px;color:#0f172a}h1{margin:0}.sum{display:flex;gap:24px;margin:16px 0}.sum b{font-size:28px;display:block}.ok{color:#047857}.ko{color:#b91c1c}details{border:1px solid #e2e8f0;border-radius:10px;padding:10px 14px;margin:8px 0}details.failed{border-left:4px solid #b91c1c}details.passed{border-left:4px solid #047857}summary{cursor:pointer;font-weight:600}small{color:#64748b;font-weight:400}code{font-size:12px}li.failed code{color:#b91c1c}.err{background:#fef2f2;color:#991b1b;padding:10px;border-radius:8px;white-space:pre-wrap}</style></head><body><h1>MediCita · UI test report</h1><p>Suite: <b>${run.suite}</b>${run.bug ? ` · bug injected: <b>${run.bug}</b>` : ''} · ${xml(new Date(run.startedAt).toLocaleString())} · Juan Diego Vera Godoy — juanvg1529.github.io/lab/</p><div class="sum"><div class="ok"><b>${passed}</b>passed</div><div class="ko"><b>${run.tests.length - passed}</b>failed</div><div><b>${(run.ms / 1000).toFixed(1)}s</b>duration</div></div>${rows}</body></html>`;
  }

  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const a = Object.assign(document.createElement('a'), { href: url, download: name });
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  document.getElementById('dl-html').addEventListener('click', () => lastRun && download('medicita-report.html', htmlReport(lastRun), 'text/html'));
  document.getElementById('dl-junit').addEventListener('click', () => lastRun && download('medicita-junit.xml', junit(lastRun), 'application/xml'));
  document.getElementById('dl-json').addEventListener('click', () => lastRun && download('medicita-report.json', JSON.stringify(lastRun, (k, v) => (k === 'code' ? undefined : v), 2), 'application/json'));

  // ---------- language ----------
  function applyLang() {
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-l]').forEach(node => { const v = t()[node.dataset.l]; if (typeof v === 'string') node.textContent = v; });
    document.getElementById('lang-toggle').textContent = lang === 'es' ? 'EN' : 'ES';
    document.getElementById('lang-toggle').setAttribute('aria-label', lang === 'es' ? 'Switch to English' : 'Cambiar a español');
    if (!log.children.length) status.textContent = t().idle;
    if (lastRun) renderReport(lastRun);
  }
  document.getElementById('lang-toggle').addEventListener('click', () => {
    lang = lang === 'es' ? 'en' : 'es';
    try { localStorage.setItem('lang', lang); } catch (e) { /* ignore */ }
    applyLang();
  });
  applyLang();

  // Exposed for the site's own Playwright tests.
  window.__lab = { tests: TESTS.map(x => ({ id: x.id, tags: x.tags })) };
})();
