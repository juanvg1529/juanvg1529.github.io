// Interactive terminal: visitors type commands and watch simulated runs of the real suites.
// Scenario names and counts are taken from the actual repositories.
(function () {
  const REPORTS = {
    fhir: 'https://juanvg1529.github.io/fhir-api-automation/',
    playwright: 'https://juanvg1529.github.io/MonsterAutomation/',
    dotnet: 'https://juanvg1529.github.io/dotnet-api-automation-framework/',
    java: 'https://juanvg1529.github.io/java-selenium-cucumber-framework/'
  };

  const KD = '@known-defect';
  const SUITES = {
    fhir: {
      title: 'fhir-api-automation', command: 'dotnet test', runner: 'Reqnroll · NUnit · .NET 10', speed: [350, 1300],
      groups: [
        ['CapabilityStatement', ['The server declares FHIR R4 and the interactions under test']],
        ['PatientLifecycle', ['Register a new patient', 'Updating a patient creates a new version and keeps the history',
          'A deleted patient is gone, not unknown', 'A patient referenced by clinical data cannot be deleted']],
        ['PatientSearch', ['Find a patient by business identifier', 'Find a patient by family name and birth date',
          'Searching for an unknown identifier returns an empty bundle']],
        ['Validation', ['An invalid gender code is rejected', 'A birth date in a non-FHIR format is rejected',
          'A resource posted to the wrong endpoint is rejected', 'An update whose body id differs from the URL id is rejected',
          'Reading a patient that never existed returns 404']],
        ['VitalSigns', ['Record a vital sign - Heart rate', 'Record a vital sign - Body temperature', 'Record a vital sign - Respiratory rate',
          'Record a vital sign - Body weight', 'Record a vital sign - Oxygen saturation', "Retrieve a patient's heart rate readings by LOINC code"]]
      ]
    },
    playwright: {
      title: 'playwright-hybrid', command: 'npx playwright test', runner: 'Playwright · TypeScript · 3 browsers', speed: [600, 2600],
      groups: [
        ['setup', ['authenticate admin through the API']],
        ['public ×3 [chromium · firefox · webkit]', ['the home page shows the rooms from the API with matching details',
          'a room created through the API has a reservation page with its details',
          'BUG-001: rooms beyond the third are never offered on the home page ' + KD,
          'BUG-002: the reservation page of a deleted room crashes and the API answers 500 ' + KD,
          'a message sent by a guest reaches the admin inbox', 'submitting an empty form lists every validation error',
          'rejects a phone below its minimum length', 'rejects a subject below its minimum length', 'rejects a description below its minimum length'], 3],
        ['admin [chromium]', ['an admin with valid credentials reaches the room management page', 'invalid credentials are rejected and no session is created',
          'a room created through the API is listed for the admin', 'a room created in the admin form is stored with the right data',
          'a room deleted in the admin panel is removed from the system', 'a message received through the API appears unread in the inbox']],
        ['a11y [chromium]', ['/ has no accessibility violations beyond the documented baseline', '/admin has no accessibility violations beyond the documented baseline']]
      ]
    },
    dotnet: {
      title: 'dotnet-api-automation-framework', command: 'dotnet test', runner: 'Reqnroll · NUnit · RestSharp', speed: [60, 450],
      groups: [
        ['HealthCheck', ['The API is up and running']],
        ['Authentication', ['Valid credentials return a token', 'Invalid credentials are rejected - wrong password ' + KD,
          'Invalid credentials are rejected - unknown user ' + KD, 'Invalid credentials are rejected - empty values ' + KD]],
        ['CreateBooking', ['Create a booking with valid data', 'Create bookings with different payment and extras - true / Breakfast',
          'Create bookings with different payment and extras - false / Airport transfer', 'Create bookings with different payment and extras - true / Late checkout',
          'Creating a booking without a required field - firstname ' + KD, 'Creating a booking without a required field - lastname ' + KD,
          'Creating a booking without a required field - bookingdates ' + KD, 'A booking with checkout before checkin is accepted ' + KD]],
        ['UpdateBooking', ['Fully update a booking with a valid token', 'Partially update a booking with a valid token',
          'Updating a booking without a token is forbidden', 'Updating a booking with an invalid token is forbidden']],
        ['DeleteBooking', ['Delete a booking with a valid token ' + KD, 'Deleting a booking without a token is forbidden']],
        ['SearchBooking', ['Find a booking by guest first and last name', 'Searching for a guest with no bookings returns an empty list']]
      ]
    },
    java: {
      title: 'java-selenium-cucumber-framework', command: 'mvn test', runner: 'Cucumber · Selenium 4 · RestAssured · Java 21', speed: [300, 2200],
      groups: [
        ['Login', ['A standard user logs in and logs out', 'Login is rejected - locked out user', 'Login is rejected - wrong password',
          'Login is rejected - missing username', 'Login is rejected - missing password']],
        ['Purchase', ['Buy a single product - Sauce Labs Bike Light', 'Buy a single product - Test.allTheThings() T-Shirt (Red)',
          'Buy a single product - Sauce Labs Onesie', 'Buy several products after removing one from the cart',
          'Buy the second product after sorting by name from Z to A', "Checkout requires the customer's details"]],
        ['Product sorting', ['Sort products by Name (A to Z)', 'Sort products by Name (Z to A)', 'Sort products by Price (low to high)', 'Sort products by Price (high to low)']],
        ['Petstore API', ['Manage a pet through its whole lifecycle', 'Available pets can be listed by status', 'Requesting a pet that does not exist returns 404']]
      ]
    }
  };

  const DEFECTS = [
    ['BUG', 'dotnet', 'POST /booking without a required field → 500 instead of 400'],
    ['BUG', 'dotnet', 'Booking with checkout before checkin is accepted'],
    ['BUG', 'dotnet', 'DELETE /booking/{id} → 201 Created instead of 204'],
    ['BUG', 'dotnet', 'Invalid credentials on POST /auth → 200 instead of 401'],
    ['BUG', 'playwright', 'Home page only ever shows the first 3 rooms (rooms.slice(0, 3))'],
    ['BUG', 'playwright', 'Deleted room: API answers 500 and the reservation page crashes']
  ];

  const T = {
    es: {
      welcome: 'Bienvenido. Soy el test runner del portafolio de Juan Diego.',
      hint: 'Escribe un comando y pulsa Enter, o toca una sugerencia. Empieza con:',
      notFound: cmd => `comando no encontrado: ${cmd}. Escribe help para ver los comandos.`,
      busy: 'Hay una ejecución en curso. Pulsa Ctrl+C para detenerla.',
      stopped: '^C ejecución detenida',
      simulated: 'Simulación con los escenarios reales del repositorio. Resultados reales →',
      help: [
        ['help', 'muestra esta ayuda'],
        ['run <suite>', 'simula la suite: fhir · playwright · dotnet · java · all'],
        ['demo', 'una prueba de UI llena un formulario en vivo (Playwright)'],
        ['lab', 'abre el laboratorio de automatización UI (11 pruebas reales)'],
        ['projects', 'proyectos y sus reportes en vivo'],
        ['defects', 'defectos reales encontrados'],
        ['whoami', 'quién soy'],
        ['contact', 'cómo contactarme'],
        ['cv', 'descarga mi CV en PDF'],
        ['clear', 'limpia la terminal']
      ],
      aliases: 'También funcionan: dotnet test · npx playwright test · mvn test · npm test',
      whoami: ['Juan Diego Vera Godoy — QA Automation Engineer / SDET', '5 años en automatización · 3 en software de salud regulado por la FDA (Roche · HL7)', 'En Solvo: ~300 pruebas, regresión de 4 h a < 30 min', 'Especialista en Ingeniería de Software con énfasis en Pruebas (UAM)', 'Ingeniero biomédico · Medellín, Colombia'],
      contact: 'Escríbeme:'
    },
    en: {
      welcome: "Welcome. I'm the test runner of Juan Diego's portfolio.",
      hint: 'Type a command and press Enter, or tap a suggestion. Start with:',
      notFound: cmd => `command not found: ${cmd}. Type help to see the commands.`,
      busy: 'A run is in progress. Press Ctrl+C to stop it.',
      stopped: '^C run stopped',
      simulated: 'Simulation using the real scenarios from the repository. Real results →',
      help: [
        ['help', 'show this help'],
        ['run <suite>', 'simulate a suite: fhir · playwright · dotnet · java · all'],
        ['demo', 'watch a UI test fill in a form live (Playwright)'],
        ['lab', 'open the UI automation lab (11 real tests)'],
        ['projects', 'projects and their live reports'],
        ['defects', 'real defects found'],
        ['whoami', 'who I am'],
        ['contact', 'how to reach me'],
        ['cv', 'download my CV as PDF'],
        ['clear', 'clear the terminal']
      ],
      aliases: 'These work too: dotnet test · npx playwright test · mvn test · npm test',
      whoami: ['Juan Diego Vera Godoy — QA Automation Engineer / SDET', '5 years in test automation · 3 on FDA-regulated healthcare software (Roche · HL7)', 'At Solvo: ~300 tests, regression from 4 h to < 30 min', 'Specialist in Software Engineering, Software Testing emphasis (UAM)', 'Biomedical engineer · Medellín, Colombia'],
      contact: 'Email me:'
    }
  };

  const output = document.getElementById('terminal-output');
  const form = document.getElementById('terminal-form');
  const input = document.getElementById('terminal-cmd');
  const preview = document.getElementById('preview');
  if (!output || !form || !input) return;

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  const t = () => T[lang()];
  const history = [];
  let historyIndex = 0;
  let runId = 0;
  let busy = false;

  // ---------- output helpers (textContent only: user input is never parsed as HTML) ----------
  function line(parts, className) {
    const row = document.createElement('div');
    row.className = 'line' + (className ? ' ' + className : '');
    (Array.isArray(parts) ? parts : [parts]).forEach(part => {
      if (typeof part === 'string') row.append(part);
      else if (part.href) {
        const a = document.createElement('a');
        a.href = part.href; a.textContent = part.text; a.target = '_blank'; a.rel = 'noopener';
        row.append(a);
      } else {
        const span = document.createElement('span');
        span.className = part.cls; span.textContent = part.text;
        row.append(span);
      }
    });
    output.append(row);
    output.scrollTop = output.scrollHeight;
    return row;
  }
  const s = (cls, text) => ({ cls, text });
  const link = (href, text) => ({ href, text: text || href });
  const wait = ms => new Promise(resolve => setTimeout(resolve, reducedMotion ? 0 : ms));

  function duration(name, [min, max]) {
    let hash = 0;
    for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
    return min + (hash % (max - min));
  }

  function welcome() {
    line(s('t-ok', t().welcome));
    line(s('t-dim', t().hint));
    line([s('t-cmd', 'help'), '  ', s('t-cmd', 'run all'), '  ', s('t-cmd', 'demo'), '  ', s('t-cmd', 'defects')]);
  }

  // ---------- commands ----------
  async function runSuite(key, id) {
    const suite = SUITES[key];
    line([s('t-dim', '$ '), suite.command, s('t-dim', '   # ' + suite.title)]);
    line(s('t-dim', suite.runner));
    let passed = 0;
    let elapsed = 0;
    for (const [group, scenarios, times = 1] of suite.groups) {
      if (id !== runId) return null;
      line(s('t-group', group));
      for (const scenario of scenarios) {
        if (id !== runId) return null;
        const ms = duration(scenario, suite.speed);
        await wait(Math.min(ms / 6, 220));
        const known = scenario.endsWith(KD);
        const name = known ? scenario.slice(0, -KD.length).trim() : scenario;
        line(['  ', s('t-ok', '✓'), ' ', name, ' ', ...(known ? [s('t-warn', KD), ' '] : []), s('t-dim', `(${(ms / 1000).toFixed(1)}s)`)]);
        passed += times;
        elapsed += ms * times;
      }
    }
    line([s('t-ok', `${passed} passed`), s('t-dim', ` (${(elapsed / 1000 / 3).toFixed(1)}s, parallel)`)]);
    line([s('t-dim', t().simulated + ' '), link(REPORTS[key])]);
    return passed;
  }

  async function runCommand(arg) {
    const id = ++runId;
    busy = true;
    try {
      const keys = arg === 'all' || !arg ? Object.keys(SUITES) : [arg];
      if (keys.some(k => !SUITES[k])) {
        line(s('t-err', `unknown suite: ${arg}. Use fhir · playwright · dotnet · java · all`));
        return;
      }
      let total = 0;
      for (const key of keys) {
        const passed = await runSuite(key, id);
        if (passed === null) return;
        total += passed;
        if (keys.length > 1) line('');
      }
      if (keys.length > 1) line([s('t-ok', 'ALL GREEN'), ' · ', s('t-ok', `${total} passed`), s('t-dim', ` across ${keys.length} repositories`)], 'summary');
    } finally {
      if (id === runId) busy = false;
    }
  }

  const COMMANDS = {
    help() {
      t().help.forEach(([cmd, desc]) => line([s('t-cmd', cmd.padEnd(13)), s('t-dim', desc)]));
      line(s('t-dim', t().aliases));
    },
    run: arg => runCommand(arg),
    demo: () => runDemo(),
    projects() {
      Object.entries(SUITES).forEach(([key, suite]) => line([s('t-cmd', key.padEnd(11)), suite.title.padEnd(34), link(REPORTS[key], 'live report ↗')]));
    },
    defects() {
      DEFECTS.forEach(([, repo, text]) => line([s('t-warn', '!'), ' ', s('t-dim', `[${repo}] `), text]));
      line(s('t-dim', '+ WCAG 2.1 AA accessibility violations documented as a baseline (playwright)'));
    },
    whoami() { t().whoami.forEach((text, i) => line(i === 0 ? s('t-ok', text) : text)); },
    contact() {
      line([t().contact + ' ', link('mailto:rockjdvg1529@gmail.com', 'rockjdvg1529@gmail.com')]);
      line(['LinkedIn: ', link('https://www.linkedin.com/in/juan-diego-vera-godoy-3949a6183', 'linkedin.com/in/juan-diego-vera-godoy-3949a6183')]);
    },
    cv() {
      const file = `cv/Juan-Diego-Vera-SDET-CV-${lang() === 'en' ? 'EN' : 'ES'}.pdf`;
      line([lang() === 'en' ? 'CV (PDF): ' : 'CV (PDF): ', link(file, file.split('/')[1])]);
    },
    lab() {
      line([lang() === 'en' ? 'UI automation lab → ' : 'Laboratorio de automatización UI → ', link('lab/', 'juanvg1529.github.io/lab/')]);
    },
    clear() { output.replaceChildren(); },
    ls() { COMMANDS.projects(); }
  };

  const ALIASES = {
    'dotnet test': 'run dotnet', 'npx playwright test': 'run playwright', 'mvn test': 'run java',
    'npm test': 'run playwright', 'npm run test': 'run playwright', 'sudo hire juan-diego': 'contact'
  };

  async function execute(raw) {
    const text = raw.trim().replace(/\s+/g, ' ');
    if (!text) return;
    line([s('t-prompt', '$ '), text], 'echo');
    history.push(text);
    historyIndex = history.length;
    if (busy) { line(s('t-warn', t().busy)); return; }

    const resolved = ALIASES[text.toLowerCase()] || text.toLowerCase();
    const [name, ...rest] = resolved.split(' ');
    const handler = COMMANDS[name];
    if (!handler) { line(s('t-err', t().notFound(text))); return; }
    await handler(rest.join(' '));
  }

  form.addEventListener('submit', event => {
    event.preventDefault();
    const value = input.value;
    input.value = '';
    execute(value);
  });

  input.addEventListener('keydown', event => {
    if (event.key === 'ArrowUp' && history.length) {
      event.preventDefault();
      historyIndex = Math.max(0, historyIndex - 1);
      input.value = history[historyIndex];
    } else if (event.key === 'ArrowDown' && history.length) {
      event.preventDefault();
      historyIndex = Math.min(history.length, historyIndex + 1);
      input.value = history[historyIndex] || '';
    } else if (event.key === 'Tab' && input.value) {
      const options = [...Object.keys(COMMANDS), 'run fhir', 'run playwright', 'run dotnet', 'run java', 'run all', ...Object.keys(ALIASES)]
        .filter(option => option.startsWith(input.value.toLowerCase()));
      if (options.length === 1) { event.preventDefault(); input.value = options[0]; }
    } else if (event.key === 'c' && event.ctrlKey && busy) {
      event.preventDefault();
      runId++;
      busy = false;
      line(s('t-warn', t().stopped));
    }
  });

  document.querySelectorAll('[data-command]').forEach(button => {
    button.addEventListener('click', () => {
      execute(button.dataset.command);
      input.focus({ preventScroll: true });
    });
  });

  output.addEventListener('click', () => { if (!window.getSelection().toString()) input.focus({ preventScroll: true }); });

  // ---------- UI test demo ----------
  const app = {
    name: document.getElementById('demo-name'),
    email: document.getElementById('demo-email'),
    room: document.getElementById('demo-room'),
    book: document.getElementById('demo-book'),
    error: document.getElementById('demo-error'),
    confirmation: document.getElementById('demo-confirmation'),
    form: document.getElementById('demo-form'),
    cursor: document.getElementById('demo-cursor'),
    close: document.getElementById('preview-close')
  };

  // The tiny app under test. It works for visitors too, not only for the scripted demo.
  function resetApp() {
    app.form.reset();
    app.error.textContent = '';
    app.confirmation.hidden = true;
    app.confirmation.textContent = '';
  }

  app.form.addEventListener('submit', event => {
    event.preventDefault();
    app.confirmation.hidden = true;
    const name = app.name.value.trim();
    const email = app.email.value.trim();
    let error = '';
    if (!name) error = 'Name is required';
    else if (!email) error = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) error = 'Email is not valid';
    app.error.textContent = error;
    if (!error) {
      app.confirmation.textContent = `Booking confirmed for ${name} · ${app.room.value}`;
      app.confirmation.hidden = false;
    }
  });

  app.close.addEventListener('click', () => { preview.hidden = true; input.focus({ preventScroll: true }); });

  async function pointAt(element) {
    element.classList.add('pw-highlight');
    if (!reducedMotion && app.cursor) {
      const box = element.getBoundingClientRect();
      const frame = app.cursor.offsetParent.getBoundingClientRect(); // the cursor is positioned inside the preview page
      app.cursor.style.transform = `translate(${box.left - frame.left + Math.min(40, box.width / 2)}px, ${box.top - frame.top + box.height / 2}px)`;
    }
    await wait(450);
  }
  function unpoint(element) { element.classList.remove('pw-highlight'); }

  async function fill(element, value, id) {
    await pointAt(element);
    element.value = '';
    for (const char of value) {
      if (id !== runId) return;
      element.value += char;
      await wait(45);
    }
    element.dispatchEvent(new Event('input', { bubbles: true }));
    unpoint(element);
  }

  async function step(code, id, action) {
    if (id !== runId) return false;
    line(['  ', s('t-dim', code)]);
    if (action) await action();
    return id === runId;
  }

  async function expectText(code, element, expected, id) {
    if (id !== runId) return false;
    await pointAt(element);
    const ok = element.textContent === expected && !element.hidden;
    line(['  ', s(ok ? 't-ok' : 't-err', ok ? '✓' : '✗'), ' ', s('t-dim', code)]);
    unpoint(element);
    return ok;
  }

  async function runDemo() {
    const id = ++runId;
    busy = true;
    try {
      preview.hidden = false;
      resetApp();
      preview.scrollIntoView({ block: 'nearest', behavior: reducedMotion ? 'auto' : 'smooth' });
      line([s('t-dim', '$ '), 'npx playwright test booking.spec.ts --headed', s('t-dim', '   # demo')]);
      await wait(300);
      let passed = 0;

      line(s('t-group', "test('shows an error when the email is missing')"));
      if (!await step("await page.goto('https://demo.shady-meadows.test')", id, () => wait(300))) return;
      if (!await step("await page.getByLabel('Name').fill('Ada Lovelace')", id, () => fill(app.name, 'Ada Lovelace', id))) return;
      if (!await step("await page.getByRole('button', { name: 'Book' }).click()", id, async () => { await pointAt(app.book); app.book.click(); unpoint(app.book); })) return;
      if (await expectText("expect(page.getByRole('alert')).toHaveText('Email is required')", app.error, 'Email is required', id)) passed++;
      if (id !== runId) return;

      line(s('t-group', "test('a guest books a suite')"));
      if (!await step("await page.getByLabel('Email').fill('ada@example.com')", id, () => fill(app.email, 'ada@example.com', id))) return;
      if (!await step("await page.getByLabel('Room').selectOption('Suite')", id, async () => {
        await pointAt(app.room); app.room.value = 'Suite'; app.room.dispatchEvent(new Event('change', { bubbles: true })); unpoint(app.room);
      })) return;
      if (!await step("await page.getByRole('button', { name: 'Book' }).click()", id, async () => { await pointAt(app.book); app.book.click(); unpoint(app.book); })) return;
      if (await expectText("expect(page.getByRole('status')).toHaveText('Booking confirmed for Ada Lovelace · Suite')",
        app.confirmation, 'Booking confirmed for Ada Lovelace · Suite', id)) passed++;
      if (id !== runId) return;

      line([s(passed === 2 ? 't-ok' : 't-err', `${passed} passed`), s('t-dim', ' · ' + (lang() === 'es'
        ? 'Ahora pruébalo tú: el formulario de arriba funciona.' : 'Now try it yourself: the form above works.'))], 'summary');
      if (app.cursor) app.cursor.style.transform = '';
    } finally {
      if (id === runId) busy = false;
    }
  }

  // Re-render the welcome text when the visitor switches language (only if nothing was typed yet).
  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    if (history.length === 0) { output.replaceChildren(); welcome(); }
  });

  output.replaceChildren();
  welcome();
})();
