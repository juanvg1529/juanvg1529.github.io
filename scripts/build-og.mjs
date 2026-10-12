// Renders the social preview images (1200x630) shown when the site's links are shared.
// Usage: node scripts/build-og.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

// The portrait is inlined as a data URI because setContent pages cannot load local files.
const photo = `data:image/png;base64,${readFileSync('img/juan-diego-vera-640.png').toString('base64')}`;

const base = `
  * { box-sizing: border-box; margin: 0; }
  body { width: 1200px; height: 630px; font-family: Inter, "Helvetica Neue", Arial, sans-serif; color: #e2e8f0;
         background: radial-gradient(900px 500px at 95% -10%, rgba(52,211,153,.22), transparent 60%), #0b1120; padding: 64px 72px; position: relative; overflow: hidden; }
  .top { display: flex; align-items: center; gap: 16px; }
  .mark { width: 64px; height: 64px; border-radius: 16px; background: #060b16; border: 2px solid #1e293b; color: #34d399; font: 800 26px/60px Inter, Arial; text-align: center; }
  .site { font: 500 24px "JetBrains Mono", Menlo, monospace; color: #8b9bb4; }
  h1 { margin-top: 40px; font-size: 72px; line-height: 1.02; letter-spacing: -2px; font-weight: 800; color: #f8fafc; }
  h1 span { color: #34d399; }
  .role { margin-top: 18px; font: 600 32px "JetBrains Mono", Menlo, monospace; color: #e2e8f0; }
  .cred { display: inline-flex; align-items: center; gap: 12px; margin-top: 26px; padding: 12px 22px; border-radius: 999px; background: rgba(52,211,153,.14); border: 2px solid rgba(52,211,153,.55); color: #a7f3d0; font-size: 26px; font-weight: 700; }
  .chips { position: absolute; left: 72px; bottom: 56px; display: flex; gap: 12px; flex-wrap: wrap; width: 1056px; }
  .chips span { padding: 9px 16px; border-radius: 10px; border: 1px solid #23314d; background: #111a2e; font: 500 21px "JetBrains Mono", Menlo, monospace; color: #cbd5e1; }
  .term { position: absolute; right: 72px; top: 70px; width: 330px; padding: 18px 20px; border-radius: 14px; background: #060b16; border: 1px solid #1e293b; font: 17px/1.75 "JetBrains Mono", Menlo, monospace; color: #cbd5e1; }
  .ok { color: #34d399; font-weight: 700; } .dim { color: #8b9bb4; }
  .photo { position: absolute; right: 70px; top: 64px; width: 340px; height: 340px; border-radius: 50%; overflow: hidden; background: radial-gradient(circle at 50% 35%, #a7f3d0 0%, #34d399 45%, #047857 100%); box-shadow: 0 0 0 8px #0b1120, 0 0 0 11px rgba(52,211,153,.6); }
  .photo img { width: 100%; height: 100%; object-fit: cover; object-position: center top; }
`;

const pages = {
  'og/og-home.png': `
    <div class="top"><div class="mark">JD</div><div class="site">juanvg1529.github.io</div></div>
    <div class="photo"><img src="${photo}" alt=""></div>
    <h1>Juan Diego<br><span>Vera Godoy</span></h1>
    <p class="role">QA Automation Engineer / SDET</p>
    <p class="cred">🎓 Especialista en Ingeniería de Software · énfasis en Pruebas</p>
    <div class="chips"><span>5 años</span><span>Salud regulada FDA · Roche · HL7</span><span>Playwright</span><span>C# / .NET</span><span>CI/CD</span></div>`,
  'og/og-lab.png': `
    <div class="top"><div class="mark">JD</div><div class="site">juanvg1529.github.io/lab</div></div>
    <div class="term"><span class="ok">✓</span> inicia sesión<br><span class="ok">✓</span> agenda una cita<br><span class="ok">✓</span> filtra por especialidad<br><span style="color:#f87171;font-weight:700">✗</span> reserva doble<br><span class="ok">✓</span> cancela una cita<br><span class="ok">6 passed</span> · <span style="color:#f87171">1 failed</span></div>
    <h1>Laboratorio de<br><span>automatización UI</span></h1>
    <p class="role">Ejecuta pruebas reales con un clic</p>
    <p class="cred">Reportes HTML · JUnit XML · JSON</p>
    <div class="chips"><span>Playwright</span><span>Page Object</span><span>11 pruebas</span><span>Bug inyectado</span><span>Juan Diego Vera · SDET</span></div>`
};

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [file, body] of Object.entries(pages)) {
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head><body>${body}</body></html>`);
  await page.screenshot({ path: file });
  console.log('wrote', file);
}
await browser.close();
