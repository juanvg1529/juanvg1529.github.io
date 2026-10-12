// Spanish is written in the HTML; English lives here. The Spanish text is read from the
// page at load time, so there is a single source for each language.
(function () {
  const en = {
    'skip': 'Skip to content',
    'nav.projects': 'Projects',
    'nav.approach': 'How I work',
    'nav.experience': 'Experience',
    'nav.contact': 'Contact',
    'hero.available': 'Open to new challenges · Remote',
    'hero.hello': 'Hi, my name is',
    'hero.lead': 'I build test automation that teams trust: frameworks from scratch for APIs and UIs, wired into CI/CD, with traceability from requirement to defect. Three of my five years were spent on FDA-regulated healthcare software for Roche.',
    'hero.cta.projects': 'See projects',
    'hero.tag.location': '📍 Medellín, Colombia',
    'hero.tag.lang': '🗣️ Spanish · English C1 · French',
    'hero.tag.edu': '🧬 Biomedical engineer',
    'cred.title': 'Specialist in Software Engineering',
    'cred.detail': '· Software Testing emphasis · Autonomous University of Manizales',
    'edu.badge': 'Specialist · Postgraduate',
    'edu.t1': 'ISO/IEC 25000 (SQuaRE) and 25010 quality models',
    'edu.t2': 'ISO 9000-3 and ISO/IEC 33000 (process assessment)',
    'edu.t3': 'Functional and non-functional requirements; load and performance testing (JMeter)',
    'edu.t4': 'Automation design with Page Object Model and Screenplay',
    'stats.years': 'years in test automation',
    'stats.health': 'years on FDA-regulated healthcare software (Roche · HL7)',
    'cv.download': 'Download CV ↓',
    'stats.frameworks': 'public frameworks with CI and live reports',
    'stats.defects': 'real defects found and documented',
    'projects.kicker': 'Portfolio',
    'projects.title': 'Projects you can run today',
    'projects.lead': 'Every project runs in GitHub Actions and publishes its live report. My professional code is under NDA, so this is how I design frameworks, shown on public systems.',
    'term.hint': 'It’s interactive: type a command or tap one.',
    'scenarios': 'scenarios',
    'runs': 'runs',
    'code': 'Code ↗',
    'report': 'Live report ↗',
    'p.fhir.badge': 'Healthcare · Interoperability',
    'p.fhir.desc': 'BDD tests for the HL7 FHIR R4 standard, the language hospitals and labs use to exchange clinical data. A passing test must prove the data is clinically correct: right patient, right code, right unit.',
    'p.fhir.h1': 'Versioning and <code>vread</code>; <code>410 Gone</code> vs <code>404</code>; referential integrity (<code>409</code>)',
    'p.fhir.h2': 'Vital signs with LOINC + UCUM, errors as <code>OperationOutcome</code>',
    'p.fhir.h3': 'Finding: the server’s search cache hid newly created data',
    'p.pw.badge': 'Hybrid API + UI',
    'p.pw.desc': 'Data is arranged and verified through the API; behaviour is tested through the UI on Chromium, Firefox and WebKit. Fast, independent, and it checks what reached the backend, not just what the screen shows.',
    'p.pw.h1': 'Admin session via API (<em>storage state</em>) and automatic cleanup',
    'p.pw.h2': 'WCAG 2.1 AA accessibility with axe-core as a regression gate',
    'p.pw.h3': '2 defects: home page shows only 3 rooms; a deleted room crashes its page (API 500)',
    'p.net.badge': 'API · BDD',
    'p.net.desc': 'BDD framework with a client library separate from the tests, isolated data for parallel runs, JSON Schema contract checks and response-time limits.',
    'p.net.h1': 'Test plan (ISO 25010), traceability matrix and bug reports',
    'p.net.h2': '4 defects documented with <code>@known-defect</code> and <code>curl</code> evidence',
    'p.net.h3': 'Diagnosed and fixed a flaky test caused by random data',
    'p.java.badge': 'Java · UI + API',
    'p.java.desc': 'Selenium WebDriver and RestAssured with Cucumber. I started it in 2024 and modernised it: Java 21, dependency injection, parallel runs and stable locators.',
    'p.java.h1': 'Total = subtotal + tax verified with <code>BigDecimal</code>',
    'p.java.h2': 'Fixed a runner that never executed the UI tests on Linux',
    'p.java.h3': 'No static state: every scenario gets its own browser',
    'approach.kicker': 'How I work',
    'approach.title': 'Quality you can prove',
    'a1.t': 'Arrange via API, test via UI',
    'a1.d': 'Data is created and verified through the API: fast, independent tests that confirm what was really stored.',
    'a2.t': 'A test must be able to fail',
    'a2.d': 'Before trusting a green test, I deliberately break what it checks. If it doesn’t fail, it isn’t testing anything.',
    'a3.t': 'Defects visible, not hidden',
    'a3.d': 'A known bug is documented with evidence and its own test, which fails on purpose once it’s fixed.',
    'a4.t': 'End-to-end traceability',
    'a4.d': 'Requirement → scenario → defect. Healthcare taught me that quality means being able to prove what was tested and why.',
    'exp.kicker': 'Experience',
    'exp.title': 'Career',
    'exp.solvo.when': 'Dec 2024 — Present',
    'exp.solvo.d': 'Designed a hybrid API + UI automation framework from scratch (C#, NUnit, Playwright, RestSharp) with ~300 tests, which cut regression from ~4 hours of manual testing to under 30 minutes (the API suite runs in ~4 minutes). Integrated into Azure DevOps with results in Qase.',
    'exp.globant.client': '(client: Roche)',
    'exp.globant.d': 'Backend and HL7 integration test automation for FDA-regulated healthcare software with .NET and SpecFlow; test evidence for releases, tool selection and code reviews.',
    'exp.acamica.d': 'HTML, CSS and JavaScript: the foundation that helps me write robust locators and speak the developers’ language.',
    'skills.kicker': 'Skills',
    'skills.title': 'Stack',
    'skills.lang': 'Languages',
    'skills.domain': 'Domain & quality',
    'edu.title': 'Education',
    'edu.spec': '<strong>Specialization in Software Engineering with an emphasis on Software Testing</strong> · Autonomous University of Manizales · 2025',
    'edu.bio': '<strong>B.Eng. in Bioengineering</strong> · University of Antioquia · 2021',
    'contact.title': 'Looking for an SDET who raises your team’s quality bar?',
    'contact.lead': 'Let’s talk. I answer in English, Spanish or French.',
    'contact.email': 'Email me',
    "nav.dashboard": "Live",
    "nav.lab": "UI Lab",
    "labt.kicker": "Live lab",
    "labt.title": "Run my UI tests with one click",
    "labt.lead": "A medical appointments app and a Playwright-style test runner. Press a button and watch the tests log in, book and cancel appointments for real; then download the report as HTML, JUnit XML or JSON.",
    "labt.h1": "4 suites: smoke, regression, negative and all (11 tests)",
    "labt.h2": "Inject a bug and watch the regression suite catch it",
    "labt.h3": "The same tests run with Playwright in CI, with their official report",
    "labt.cta": "Open the lab →",
    "labt.ci": "Playwright report ↗",
    "nav.bughunt": "Find the bug",
    "nav.cases": "Cases",
    "dash.kicker": "Live quality",
    "dash.title": "My tests run every day",
    "dash.lead": "Real GitHub Actions data: every repository runs on each change and every weekday morning. This dashboard is rebuilt daily.",
    "bh.kicker": "Game",
    "bh.title": "Find the bug",
    "bh.lead": "This checkout has 5 bugs planted on purpose. Use it like a curious tester would: each bug you trigger turns into a report with the automated test that would catch it.",
    "bh.hints": "Need hints?",
    "bh.h1": "What happens if a coupon is used more than once?",
    "bh.h2": "Do quantities have limits?",
    "bh.h3": "Check the cents with several units of the cheapest product.",
    "bh.h4": "What does an impatient user do with the Pay button?",
    "bh.h5": "Can you buy… nothing?",
    "bh.reset": "Reset",
    "cases.kicker": "Case files",
    "cases.title": "Hard bugs, solved with evidence",
    "cases.lead": "Real cases from these projects. I don't assume, I prove: every hypothesis is confirmed or ruled out with a test.",
    "case.step.symptom": "Symptom",
    "case.step.hypothesis": "Hypothesis",
    "case.step.evidence": "Evidence",
    "case.step.cause": "Root cause",
    "case.step.fix": "Outcome",
    "case.kind.defect": "Product defect",
    "case.kind.flaky": "Flaky test",
    "case.kind.env": "Environment",
    "case1.title": "New rooms never showed up on the home page",
    "case1.symptom": "The test \"a room created through the API is shown on the home page\" failed on Chromium, Firefox and WebKit.",
    "case1.hypothesis": "Browser or server cache? Was my test looking for the card the wrong way?",
    "case1.evidence": "I intercepted the network: the page received 4 rooms from /api/room but rendered only 3. Then I searched the published JavaScript.",
    "case1.cause": "The front end does rooms.slice(0, 3): rooms after the third are never offered to guests.",
    "case1.fix": "BUG-001 documented with evidence and a @known-defect test; the hybrid check now compares the cards with the API.",
    "case2.title": "A search passed once, then failed every time",
    "case2.symptom": "\"Find a patient by family name and birth date\" passed on the first run and failed on every run after.",
    "case2.hypothesis": "The HAPI FHIR server reuses the results of identical recent searches.",
    "case2.evidence": "Reproduced with curl: created a patient and the same search did not return it; with Cache-Control: no-cache it did.",
    "case2.cause": "Server search cache: documented HAPI behaviour, not a defect, but it hides newly created data.",
    "case2.fix": "The client sends Cache-Control: no-cache on every search → 14 green runs in a row.",
    "case3.title": "Chrome was swallowing clicks",
    "case3.symptom": "The cart stayed at 0 after adding products and the logout menu never opened. Only in Chrome.",
    "case3.hypothesis": "Broken locators after a change on the site?",
    "case3.evidence": "I dumped every data-test attribute on each page: all the locators existed. Hypothesis ruled out.",
    "case3.cause": "SauceDemo’s public credentials trigger Chrome’s \"password found in a data breach\" dialog, which blocks the page.",
    "case3.fix": "Password manager and leak detection turned off with Chrome preferences in the DriverFactory.",
    "case4.title": "StaleElementReferenceException when removing from the cart",
    "case4.symptom": "One scenario failed intermittently with StaleElementReferenceException.",
    "case4.hypothesis": "React re-renders the list between Selenium finding the row and clicking it.",
    "case4.evidence": "The stack trace pointed at the product lookup inside the cart, right after navigating.",
    "case4.cause": "References to elements React had already replaced.",
    "case4.fix": "Lookup and click retried together ignoring stale elements, plus a wait for one fewer item → 8 green runs.",
    "case5.title": "A random null broke schema validation",
    "case5.symptom": "\"Create a booking\" sometimes failed JSON Schema validation.",
    "case5.hypothesis": "The random test data produces a case the schema does not accept.",
    "case5.evidence": "The schema error named the exact field: /additionalneeds: Value is \"null\" but should be \"string\".",
    "case5.cause": "The builder sometimes sent additionalneeds: null and the API echoed it back.",
    "case5.fix": "The optional field is omitted instead of being sent as null. Verified by forcing the case across all 21 scenarios and with 37 repeated runs.",
    "fc.cred.t": "Specialist",
    "fc.cred.s": "Software Engineering · Testing",
    "fc.tests.t": "94 tests passing",
    "fc.tests.s": "4 frameworks · daily CI",
    "fc.health.t": "Regulated healthcare",
    "ts.kicker": "Try it",
    "ts.title": "My test runner, in your browser",
    "ts.lead": "Type a command and watch a run built from the real scenarios in my repositories, or launch a UI test that fills in a form in front of you.",
    "ts.c1": "simulates the 4 suites (94 real scenarios)",
    "ts.c2": "a live Playwright-style UI test",
    "ts.c3": "the real defects I found",
    "ts.c4": "the lab with 11 real tests",
    'footer.tested': 'This site runs its own automated tests (Playwright + axe) on every change, because a QA tests even their portfolio.'
  };

  const nodes = document.querySelectorAll('[data-i18n]');
  const es = {};
  nodes.forEach(node => { es[node.dataset.i18n] = node.innerHTML; });

  const meta = {
    es: { title: 'Juan Diego Vera · QA Automation Engineer / SDET', toggle: 'EN', toggleLabel: 'Switch to English', nav: 'Principal' },
    en: { title: 'Juan Diego Vera · QA Automation Engineer / SDET', toggle: 'ES', toggleLabel: 'Cambiar a español', nav: 'Main' }
  };

  const toggle = document.getElementById('lang-toggle');

  function apply(lang) {
    const dictionary = lang === 'en' ? en : es;
    document.querySelector('.lab-preview')?.setAttribute('aria-label', lang === 'en' ? 'Open the UI automation lab' : 'Abrir el laboratorio de automatización UI');
    document.querySelectorAll('.cv-link').forEach(a => a.setAttribute('href', `cv/Juan-Diego-Vera-SDET-CV-${lang === 'en' ? 'EN' : 'ES'}.pdf`));
    document.getElementById('terminal-output')?.setAttribute('aria-label', lang === 'en' ? 'Terminal output' : 'Salida de la terminal');
    document.getElementById('preview-close')?.setAttribute('aria-label', lang === 'en' ? 'Close demo' : 'Cerrar demo');
    nodes.forEach(node => {
      const text = dictionary[node.dataset.i18n];
      if (text !== undefined) node.innerHTML = text;
    });
    document.documentElement.lang = lang;
    document.title = meta[lang].title;
    toggle.textContent = meta[lang].toggle;
    toggle.setAttribute('aria-label', meta[lang].toggleLabel);
    document.querySelector('.nav').setAttribute('aria-label', meta[lang].nav);
    try { localStorage.setItem('lang', lang); } catch (e) { /* storage may be blocked */ }
  }

  let initial = 'en';
  try {
    const saved = localStorage.getItem('lang');
    const fromUrl = new URLSearchParams(location.search).get('lang');
    // English by default (international recruiters); ?lang=es or the ES button switches to Spanish.
    initial = fromUrl || saved || 'en';
  } catch (e) { /* default to English */ }
  if (initial === 'es') document.documentElement.lang = 'es';
  else apply('en');
  document.documentElement.classList.remove('lang-pending');

  toggle.addEventListener('click', () => apply(document.documentElement.lang === 'es' ? 'en' : 'es'));
})();
