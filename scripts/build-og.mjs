// Renders the social preview images (1200x630) shown when the site's links are shared.
// Usage: node scripts/build-og.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

// The portrait is inlined as a data URI because setContent pages cannot load local files.
const photo = `data:image/webp;base64,${readFileSync('img/jdv-portrait-1120.webp').toString('base64')}`;

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
  .cred small { font-size: 21px; font-weight: 600; color: #6ee7b7; }
  .cred:has(small) { display: inline-block; border-radius: 22px; line-height: 1.35; }
  .chips.home { width: 680px; bottom: 50px; }
  .chips.home span { font-size: 19px; padding: 8px 14px; }
  body.home h1 { margin-top: 30px; font-size: 66px; }
  body.home .role { margin-top: 14px; font-size: 30px; }
  body.home .cred { margin-top: 20px; padding: 12px 22px; font-size: 25px; }
  /* Same treatment as the site's hero: uncropped cut-out photo rising above a gradient panel. */
  .stage { position: absolute; right: 64px; bottom: 0; width: 380px; height: 520px; }
  .stage .panel { position: absolute; left: 0; right: 0; bottom: -30px; top: 210px; border-radius: 36px; background: radial-gradient(120% 80% at 50% 0%, rgba(255,255,255,.5), transparent 60%), linear-gradient(160deg, #a7f3d0 0%, #34d399 48%, #059669 100%); }
  .stage img { position: absolute; left: -10px; bottom: 0; width: 400px; -webkit-mask-image: linear-gradient(180deg, #000 85%, transparent 100%); filter: drop-shadow(0 16px 26px rgba(2,44,34,.4)); }
`;

const pages = {
  'og/og-home.png': `
    <div class="top"><div class="mark">JD</div><div class="site">juanvg1529.github.io</div></div>
    <div class="stage"><div class="panel"></div><img src="${photo}" alt=""></div>
    <h1>Juan Diego<br><span>Vera Godoy</span></h1>
    <p class="role">QA Automation Engineer / SDET</p>
    <p class="cred">🎓 Especialista en Ingeniería de Software<br><small>énfasis en Pruebas</small></p>
    <div class="chips home"><span>5 años</span><span>FDA · HL7 · Roche</span><span>Playwright</span><span>C# / .NET</span></div>`,
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
  const cls = file.includes('home') ? 'home' : '';
  await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${base}</style></head><body class="${cls}">${body}</body></html>`);
  await page.screenshot({ path: file });
  console.log('wrote', file);
}
await browser.close();
