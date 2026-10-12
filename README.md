# juanvg1529.github.io

My portfolio site: **https://juanvg1529.github.io** (Spanish by default, [English version](https://juanvg1529.github.io/?lang=en)).

Plain HTML, CSS and a few lines of JavaScript, with no build step. As a QA engineer, I test my own site: every change runs Playwright tests before it is deployed, and the same tests run again against the live site after deployment.

The tests check:
- the greeting and the language switch (ES ⇄ EN, `?lang=en`);
- every project link and live report returns `200`;
- there is no horizontal scroll on mobile;
- there are **zero** WCAG 2.1 AA violations (axe-core), in light and dark mode, on desktop and mobile.

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
