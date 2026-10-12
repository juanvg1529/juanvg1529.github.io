# juanvg1529.github.io

My portfolio site: **https://juanvg1529.github.io** (Spanish by default, [English version](https://juanvg1529.github.io/?lang=en)).

Plain HTML, CSS and a few lines of JavaScript, with no build step. As a QA engineer, I test my own site: every change runs Playwright tests before it is deployed, and the same tests run again against the live site after deployment.

## Interactive terminal

The hero is a working terminal. Type `help`, `run all`, `run fhir`, `dotnet test`, `npx playwright test` or `mvn test` to watch a simulated run that uses the **real scenario names** from each repository and links to its live report.

`demo` opens a small app inside the terminal, and a Playwright-style UI test fills it in step by step: a negative case and a booking. Visitors can then use the form themselves.

## Tests (40 runs on desktop + mobile)

- **User actions on the terminal:**
  - typing commands, tapping suggestions and using stack aliases;
  - unknown commands;
  - history (↑) and `clear`;
  - English mode;
  - typed text is never executed as HTML.
- **UI demo:**
  - the scripted test reaches `2 passed` and the booking is confirmed;
  - a visitor fills the form by hand, including invalid email validation;
  - the demo closes.
- **Site:**
  - the greeting and the language switch (ES ⇄ EN, `?lang=en`);
  - each project links only to its live report, and every report returns `200`;
  - there is no horizontal scroll on mobile.
- **Accessibility:** zero WCAG 2.1 AA violations (axe-core) in light and dark mode, and with the demo open.

```bash
npm ci && npx playwright install chromium
npm test                                        # against a local server
SITE_URL=https://juanvg1529.github.io npm test  # against the live site
```

## Projects
- [FHIR R4 API Automation](https://github.com/juanvg1529/fhir-api-automation): healthcare interoperability (C#, Reqnroll, Firely SDK)
- [Playwright Hybrid Framework](https://github.com/juanvg1529/MonsterAutomation): API + UI (Playwright, TypeScript, axe-core)
- [.NET API Automation Framework](https://github.com/juanvg1529/dotnet-api-automation-framework): BDD API testing (C#, Reqnroll, RestSharp)
- [Java Selenium Cucumber Framework](https://github.com/juanvg1529/java-selenium-cucumber-framework): UI + API (Java 21, Selenium, RestAssured)
