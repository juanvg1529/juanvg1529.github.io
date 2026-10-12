# juanvg1529.github.io

My portfolio site: **https://juanvg1529.github.io** (Spanish by default, [English version](https://juanvg1529.github.io/?lang=en)).

Plain HTML, CSS and a few lines of JavaScript, with no build step. As a QA engineer, I test my own site: every change runs Playwright tests before it is deployed, and the same tests run again against the live site after deployment.

## Interactive terminal

The hero is a working terminal. Type `help`, `run all`, `run fhir`, `dotnet test`, `npx playwright test` or `mvn test` to watch a simulated run that uses the **real scenario names** from each repository and links to its live report.

`demo` opens a small app inside the terminal, and a Playwright-style UI test fills it in step by step: a negative case and a booking. Visitors can then use the form themselves.

## Live quality dashboard

`scripts/build-stats.mjs` reads the last 20 GitHub Actions runs of each project (and of this site) and writes `data/stats.json`. The deploy job runs it every day. The dashboard shows status, pass rate, average duration, last run and a run history for each repository.

## Find the bug

A tiny checkout with **5 deliberate defects**: a stacking coupon, negative quantities, a floating-point cent, a double charge on double-click, and paying an empty cart. Triggering one reveals a bug report, with steps, expected vs. actual, severity and the Playwright test that would catch it.

## Case files

Five real debugging stories from the projects, each told as symptom → hypothesis → evidence → root cause → outcome.

## Tests (70+ runs on desktop + mobile)

- **Dashboard:** tested with **mocked network data**, which checks pass rate, status, average duration, history bars, singular/plural, English mode and the error state when the data can't load.
- **Find the bug:** every bug is triggered through real user actions; also the full game, reset, an invalid coupon and the language switch.
- **Case files:** they open and are translated to English.

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
- **Accessibility:** zero WCAG 2.1 AA violations (axe-core) in light and dark mode, with the demo open, and with bug reports and case files expanded.
- **Live checks:** after deploying, the suite runs against the live site and checks that the dashboard data is less than 26 hours old.

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
