// Live quality dashboard: renders data/stats.json (real GitHub Actions history, rebuilt on every deploy and daily).
(function () {
  const root = document.getElementById('dashboard-grid');
  const updated = document.getElementById('dashboard-updated');
  if (!root) return;

  const NAMES = {
    fhir: 'FHIR R4 API', playwright: 'Playwright Hybrid', dotnet: '.NET API Framework',
    java: 'Java Selenium Cucumber', site: 'Este sitio · This site'
  };
  const T = {
    es: {
      passing: 'En verde', failing: 'Falló', noRuns: 'Sin ejecuciones',
      passRate: 'éxito', avg: 'promedio', last: 'última',
      spark: (n, ok, ko) => `${n === 1 ? 'Última ejecución' : `Últimas ${n} ejecuciones`}: ${ok} ${ok === 1 ? 'exitosa' : 'exitosas'}, ${ko} ${ko === 1 ? 'fallida' : 'fallidas'}`,
      runs: n => (n === 1 ? 'última ejecución' : `últimas ${n} ejecuciones`), updated: 'Datos de GitHub Actions actualizados',
      error: 'No se pudieron cargar los datos del dashboard.', open: 'Ver ejecución', site: 'Este sitio'
    },
    en: {
      passing: 'Passing', failing: 'Failed', noRuns: 'No runs',
      passRate: 'pass rate', avg: 'average', last: 'last run',
      spark: (n, ok, ko) => `${n === 1 ? 'Last run' : `Last ${n} runs`}: ${ok} passed, ${ko} failed`,
      runs: n => (n === 1 ? 'last run' : `last ${n} runs`), updated: 'GitHub Actions data updated',
      error: 'The dashboard data could not be loaded.', open: 'Open run', site: 'This site'
    }
  };

  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  let data = null;

  function relative(iso) {
    const seconds = (Date.parse(iso) - Date.now()) / 1000;
    const units = [['year', 31536000], ['month', 2592000], ['day', 86400], ['hour', 3600], ['minute', 60]];
    const rtf = new Intl.RelativeTimeFormat(lang(), { numeric: 'auto' });
    for (const [unit, size] of units) if (Math.abs(seconds) >= size) return rtf.format(Math.round(seconds / size), unit);
    return rtf.format(Math.round(seconds), 'second');
  }

  const formatDuration = s => (s >= 60 ? `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s` : `${s}s`);

  /** Pure summary of a repository's runs; exported on window for the tests. */
  function summarize(runs) {
    const decided = runs.filter(r => r.conclusion === 'success' || r.conclusion === 'failure');
    const passed = decided.filter(r => r.conclusion === 'success').length;
    const failed = decided.length - passed;
    return {
      total: decided.length,
      passed,
      failed,
      passRate: decided.length ? Math.round((passed / decided.length) * 100) : null,
      avgSeconds: decided.length ? Math.round(decided.reduce((sum, r) => sum + r.durationSeconds, 0) / decided.length) : null,
      latest: runs[0] || null,
      status: !runs[0] ? 'none' : runs[0].conclusion === 'success' ? 'pass' : 'fail'
    };
  }
  window.__dashboardSummarize = summarize;

  function el(tag, attrs = {}, ...children) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'class') node.className = value; else if (key === 'text') node.textContent = value; else node.setAttribute(key, value);
    }
    node.append(...children);
    return node;
  }

  function render() {
    const t = T[lang()];
    root.replaceChildren();
    if (!data) return;

    for (const repo of data.repos) {
      const sum = summarize(repo.runs);
      const statusText = sum.status === 'pass' ? t.passing : sum.status === 'fail' ? t.failing : t.noRuns;

      const spark = el('div', { class: 'spark', role: 'img', 'aria-label': t.spark(sum.total, sum.passed, sum.failed) });
      // Oldest on the left, newest on the right, like a CI history.
      [...repo.runs].reverse().forEach(run => {
        const height = 30 + Math.min(70, (run.durationSeconds / Math.max(...repo.runs.map(r => r.durationSeconds), 1)) * 70);
        spark.append(el('span', { class: 'bar ' + (run.conclusion === 'success' ? 'ok' : 'ko'), style: `height:${height}%`, title: `${run.conclusion} · ${formatDuration(run.durationSeconds)}` }));
      });

      // Empty slots up to 20 make it clear the history grows with every scheduled run.
      for (let i = repo.runs.length; i < 20; i++) spark.prepend(el('span', { class: 'bar empty' }));

      const card = el('article', { class: 'dash-card', 'data-repo': repo.key },
        el('div', { class: 'dash-head' },
          el('h3', { text: repo.key === 'site' ? t.site : NAMES[repo.key] }),
          el('span', { class: 'pill pill-' + sum.status, text: statusText })),
        el('dl', { class: 'dash-metrics' },
          el('div', {}, el('dt', { text: t.passRate }), el('dd', { class: 'm-rate', text: sum.passRate === null ? '—' : `${sum.passRate}%` })),
          el('div', {}, el('dt', { text: t.avg }), el('dd', { class: 'm-avg', text: sum.avgSeconds === null ? '—' : formatDuration(sum.avgSeconds) })),
          el('div', {}, el('dt', { text: t.last }), el('dd', { class: 'm-last', text: sum.latest ? relative(sum.latest.startedAt) : '—' }))),
        spark,
        el('p', { class: 'dash-foot' },
          el('span', { text: t.runs(sum.total) }),
          ...(sum.latest ? [el('a', { href: sum.latest.url, target: '_blank', rel: 'noopener', text: t.open + ' ↗' })] : [])));
      root.append(card);
    }
    if (updated) updated.textContent = `${t.updated} ${relative(data.generatedAt)}.`;
  }

  fetch('data/stats.json', { cache: 'no-store' })
    .then(response => { if (!response.ok) throw new Error(response.status); return response.json(); })
    .then(json => { data = json; render(); })
    .catch(() => { root.replaceChildren(el('p', { class: 'dash-error', text: T[lang()].error })); });

  document.getElementById('lang-toggle')?.addEventListener('click', render);
})();
