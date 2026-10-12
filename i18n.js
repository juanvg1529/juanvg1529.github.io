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
    'hero.lead': 'I build test automation that teams trust: frameworks from scratch for APIs and UIs, wired into CI/CD, with traceability from requirement to defect. Three of my five years were spent on healthcare software for Roche.',
    'hero.cta.projects': 'See projects',
    'hero.tag.location': '📍 Medellín, Colombia',
    'hero.tag.lang': '🗣️ Spanish · English C1 · French',
    'hero.tag.edu': '🎓 Bioengineer · Postgraduate in Software Testing',
    'stats.years': 'years in test automation',
    'stats.health': 'years on healthcare software for Roche',
    'stats.frameworks': 'public frameworks with CI and live reports',
    'stats.defects': 'real defects found and documented',
    'projects.kicker': 'Portfolio',
    'projects.title': 'Projects you can run today',
    'projects.lead': 'Every repository runs in GitHub Actions and publishes its report. My professional code is under NDA, so this is how I design frameworks, shown on public systems.',
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
    'exp.solvo.d': 'Designed a hybrid API + UI automation framework from scratch (C#, NUnit, Playwright), integrated into Azure DevOps with results in Qase. Test plans, regression, requirements with the client and leading defect triage.',
    'exp.globant.client': '(client: Roche)',
    'exp.globant.d': 'Backend automation for healthcare software with .NET and SpecFlow, tool selection, test strategies aligned with project milestones, and code reviews.',
    'exp.acamica.d': 'HTML, CSS and JavaScript: the foundation that helps me write robust locators and speak the developers’ language.',
    'skills.kicker': 'Skills',
    'skills.title': 'Stack',
    'skills.lang': 'Languages',
    'skills.domain': 'Domain & quality',
    'edu.title': 'Education',
    'edu.spec': '<strong>Specialization in Software Engineering (Software Testing)</strong> · Autonomous University of Manizales · 2025',
    'edu.bio': '<strong>B.Eng. in Bioengineering</strong> · University of Antioquia · 2021',
    'contact.title': 'Looking for an SDET who raises your team’s quality bar?',
    'contact.lead': 'Let’s talk. I answer in English, Spanish or French.',
    'contact.email': 'Email me',
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

  let initial = 'es';
  try {
    const saved = localStorage.getItem('lang');
    const fromUrl = new URLSearchParams(location.search).get('lang');
    // Spanish by default; share ?lang=en with English-speaking recruiters.
    initial = fromUrl || saved || 'es';
  } catch (e) { /* default to Spanish */ }
  if (initial !== 'es') apply('en');

  toggle.addEventListener('click', () => apply(document.documentElement.lang === 'es' ? 'en' : 'es'));
})();
