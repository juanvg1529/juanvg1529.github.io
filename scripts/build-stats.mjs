// Builds data/stats.json from the GitHub Actions history of each portfolio repository.
// Runs in the deploy job (and locally with GITHUB_TOKEN=$(gh auth token)).
import { mkdirSync, writeFileSync } from 'node:fs';

const OWNER = 'juanvg1529';
const REPOS = [
  { key: 'fhir', repo: 'fhir-api-automation', workflow: 'fhir-tests.yml', report: 'https://juanvg1529.github.io/fhir-api-automation/' },
  { key: 'playwright', repo: 'MonsterAutomation', workflow: 'playwright.yml', report: 'https://juanvg1529.github.io/MonsterAutomation/' },
  { key: 'dotnet', repo: 'dotnet-api-automation-framework', workflow: 'api-tests.yml', report: 'https://juanvg1529.github.io/dotnet-api-automation-framework/' },
  { key: 'java', repo: 'java-selenium-cucumber-framework', workflow: 'tests.yml', report: 'https://juanvg1529.github.io/java-selenium-cucumber-framework/' },
  { key: 'site', repo: 'juanvg1529.github.io', workflow: 'site-tests.yml', report: 'https://github.com/juanvg1529/juanvg1529.github.io/actions' }
];

const headers = { Accept: 'application/vnd.github+json', 'X-GitHub-Api-Version': '2022-11-28' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function runsOf({ repo, workflow }) {
  const url = `https://api.github.com/repos/${OWNER}/${repo}/actions/workflows/${workflow}/runs?status=completed&per_page=20`;
  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error(`${url} → ${response.status} ${await response.text()}`);
  const { workflow_runs: runs } = await response.json();
  return runs.map(run => ({
    conclusion: run.conclusion,
    event: run.event,
    startedAt: run.run_started_at,
    durationSeconds: Math.max(0, Math.round((Date.parse(run.updated_at) - Date.parse(run.run_started_at)) / 1000)),
    url: run.html_url
  }));
}

const repos = [];
for (const entry of REPOS) {
  const runs = await runsOf(entry); // newest first
  repos.push({ ...entry, runs });
  console.log(`${entry.repo}: ${runs.length} runs, latest ${runs[0]?.conclusion ?? 'none'}`);
}

mkdirSync('data', { recursive: true });
writeFileSync('data/stats.json', JSON.stringify({ generatedAt: new Date().toISOString(), repos }, null, 2) + '\n');
console.log('data/stats.json written');
