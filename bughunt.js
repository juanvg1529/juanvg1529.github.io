// "Find the bug": a tiny checkout with five seeded defects. When a visitor triggers one,
// it is recorded and its bug report (with the test that would catch it) is revealed.
(function () {
  const app = document.getElementById('bh-app');
  if (!app) return;

  const PRODUCTS = [
    { id: 'mug', name: 'QA Mug', price: 12.5 },
    { id: 'tee', name: 'Bug Hunter T-Shirt', price: 24 },
    { id: 'stickers', name: 'Sticker pack', price: 2.4 }
  ];

  const BUGS = {
    es: {
      stack: { title: 'El cupón se puede aplicar varias veces', severity: 'Alta', steps: 'Aplica el cupón QA10 dos veces.', expected: 'El segundo intento muestra "Cupón ya aplicado" y el descuento queda en 10%.', actual: 'El descuento se acumula en cada clic.', test: "await page.getByLabel('Cupón').fill('QA10');\nawait apply.click(); await apply.click();\nawait expect(discount).toHaveText('-10%');" },
      negative: { title: 'La cantidad acepta valores negativos', severity: 'Alta', steps: 'Escribe un número negativo en una cantidad.', expected: 'El campo no acepta valores negativos.', actual: 'El total baja e incluso puede quedar negativo.', test: "await qty.fill('-2');\nawait expect(qty).toHaveValue('1');\nawait expect(total).not.toContainText('-');" },
      rounding: { title: 'El subtotal pierde un centavo', severity: 'Media', steps: 'Pon 3 paquetes de stickers (2,40 c/u).', expected: 'Subtotal de la línea: 7,20.', actual: 'Muestra 7,19: 2,40 × 3 da 7,1999… en punto flotante y el código trunca en vez de redondear.', test: "await stickersQty.fill('3');\nawait expect(stickersLine).toHaveText('$7.20');" },
      double: { title: 'Doble clic en Pagar crea dos órdenes', severity: 'Crítica', steps: 'Haz clic dos veces seguidas en Pagar.', expected: 'El botón se desactiva tras el primer clic y se crea una sola orden.', actual: 'Se crean dos órdenes: al cliente se le cobra dos veces.', test: "await pay.dblclick();\nawait expect(page.getByText(/Orden #/)).toHaveCount(1);" },
      empty: { title: 'Se puede pagar un carrito vacío', severity: 'Media', steps: 'Deja todas las cantidades en 0 (o quita los productos) y paga.', expected: 'Pagar está deshabilitado con el carrito vacío.', actual: 'Se crea una orden de $0.', test: "await removeAll();\nawait expect(pay).toBeDisabled();" }
    },
    en: {
      stack: { title: 'The coupon can be applied more than once', severity: 'High', steps: 'Apply coupon QA10 twice.', expected: 'The second attempt says "Coupon already applied" and the discount stays at 10%.', actual: 'The discount stacks on every click.', test: "await page.getByLabel('Coupon').fill('QA10');\nawait apply.click(); await apply.click();\nawait expect(discount).toHaveText('-10%');" },
      negative: { title: 'Quantity accepts negative values', severity: 'High', steps: 'Type a negative number in a quantity.', expected: 'The field does not accept negative values.', actual: 'The total drops and can even go negative.', test: "await qty.fill('-2');\nawait expect(qty).toHaveValue('1');\nawait expect(total).not.toContainText('-');" },
      rounding: { title: 'The subtotal loses a cent', severity: 'Medium', steps: 'Set 3 sticker packs (2.40 each).', expected: 'Line subtotal: 7.20.', actual: 'It shows 7.19: 2.40 × 3 is 7.1999… in floating point and the code truncates instead of rounding.', test: "await stickersQty.fill('3');\nawait expect(stickersLine).toHaveText('$7.20');" },
      double: { title: 'Double-clicking Pay creates two orders', severity: 'Critical', steps: 'Click Pay twice quickly.', expected: 'The button is disabled after the first click and one order is created.', actual: 'Two orders are created: the customer is charged twice.', test: "await pay.dblclick();\nawait expect(page.getByText(/Order #/)).toHaveCount(1);" },
      empty: { title: 'An empty cart can be paid', severity: 'Medium', steps: 'Set every quantity to 0 (or remove the products) and pay.', expected: 'Pay is disabled when the cart is empty.', actual: 'A $0 order is created.', test: "await removeAll();\nawait expect(pay).toBeDisabled();" }
    }
  };
  const ORDER = ['stack', 'negative', 'rounding', 'double', 'empty'];
  const UI = {
    es: { found: (n, t) => `${n} de ${t} bugs encontrados`, done: '¡Encontraste los 5! Así reporto y automatizo cada defecto.', coupon: 'Cupón', apply: 'Aplicar', pay: 'Pagar', subtotal: 'Subtotal', discount: 'Descuento', total: 'Total', order: 'Orden', created: 'creada', invalid: 'Cupón no válido', steps: 'Pasos', expected: 'Esperado', actual: 'Obtenido', severity: 'Severidad', test: 'La prueba que lo atrapa', qty: 'Cantidad de', newBug: '🐞 ¡Bug encontrado!' },
    en: { found: (n, t) => `${n} of ${t} bugs found`, done: 'You found all 5! This is how I report and automate each defect.', coupon: 'Coupon', apply: 'Apply', pay: 'Pay', subtotal: 'Subtotal', discount: 'Discount', total: 'Total', order: 'Order', created: 'created', invalid: 'Invalid coupon', steps: 'Steps', expected: 'Expected', actual: 'Actual', severity: 'Severity', test: 'The test that catches it', qty: 'Quantity of', newBug: '🐞 Bug found!' }
  };

  const lang = () => (document.documentElement.lang === 'en' ? 'en' : 'es');
  const state = { qty: { mug: 1, tee: 1, stickers: 1 }, discount: 0, found: [], orders: 0, lastPay: 0 };
  let newest = null; // only the bug found last is animated

  const els = {
    lines: document.getElementById('bh-lines'),
    coupon: document.getElementById('bh-coupon'),
    apply: document.getElementById('bh-apply'),
    couponMsg: document.getElementById('bh-coupon-msg'),
    subtotal: document.getElementById('bh-subtotal'),
    discount: document.getElementById('bh-discount'),
    total: document.getElementById('bh-total'),
    pay: document.getElementById('bh-pay'),
    orders: document.getElementById('bh-orders'),
    progress: document.getElementById('bh-progress'),
    meter: document.getElementById('bh-meter'),
    reports: document.getElementById('bh-reports'),
    reset: document.getElementById('bh-reset'),
    toast: document.getElementById('bh-toast'),
    labels: document.querySelectorAll('[data-bh]')
  };

  // ---- the "application under test" (bugs are intentional) ----
  const lineTotal = product => Math.floor(product.price * state.qty[product.id] * 100) / 100; // BUG rounding: truncates
  const money = n => `$${n.toFixed(2)}`;

  function subtotal() { return PRODUCTS.reduce((sum, p) => sum + lineTotal(p), 0); }

  function renderCart() {
    const ui = UI[lang()];
    els.lines.replaceChildren();
    for (const product of PRODUCTS) {
      const row = document.createElement('div');
      row.className = 'bh-line';
      const name = document.createElement('span');
      name.className = 'bh-name';
      name.textContent = `${product.name} · ${money(product.price)}`;
      const input = document.createElement('input');
      input.type = 'number';
      input.className = 'bh-qty';
      input.value = state.qty[product.id];
      input.setAttribute('aria-label', `${ui.qty} ${product.name}`);
      input.dataset.product = product.id;
      const total = document.createElement('span');
      total.className = 'bh-line-total';
      total.dataset.product = product.id;
      total.textContent = money(lineTotal(product));
      row.append(name, input, total);
      els.lines.append(row);
    }
    renderTotals();
  }

  function renderTotals() {
    const sub = subtotal();
    const total = sub * (1 - state.discount / 100);
    els.subtotal.textContent = money(sub);
    els.discount.textContent = state.discount ? `-${state.discount}%` : '—';
    els.total.textContent = money(total);
    els.lines.querySelectorAll('.bh-line-total').forEach(span => {
      span.textContent = money(lineTotal(PRODUCTS.find(p => p.id === span.dataset.product)));
    });
  }

  els.lines.addEventListener('input', event => {
    const input = event.target.closest('.bh-qty');
    if (!input) return;
    const value = parseInt(input.value, 10);
    state.qty[input.dataset.product] = Number.isNaN(value) ? 0 : value; // BUG negative: no lower bound
    renderTotals();
    if (value < 0) found('negative');
    // Detected generically: any line whose truncated total differs from the exact amount in cents.
    if (PRODUCTS.some(p => state.qty[p.id] > 0 && Math.round(lineTotal(p) * 100) !== Math.round(p.price * 100) * state.qty[p.id])) found('rounding');
  });

  els.apply.addEventListener('click', () => {
    const ui = UI[lang()];
    if (els.coupon.value.trim().toUpperCase() !== 'QA10') { els.couponMsg.textContent = ui.invalid; return; }
    els.couponMsg.textContent = '';
    if (state.discount > 0) found('stack');
    state.discount += 10; // BUG stack: should not accumulate
    renderTotals();
  });

  els.pay.addEventListener('click', () => {
    const ui = UI[lang()];
    const now = Date.now();
    if (subtotal() <= 0) found('empty'); // BUG empty: pay is never disabled
    if (now - state.lastPay < 1200 && state.orders > 0) found('double'); // BUG double: button not disabled
    state.lastPay = now;
    state.orders++;
    const order = document.createElement('li');
    order.textContent = `${ui.order} #${1000 + state.orders} ${ui.created} · ${els.total.textContent}`;
    els.orders.append(order);
  });

  // ---- game ----
  function found(bug) {
    if (state.found.includes(bug)) return;
    state.found.push(bug);
    newest = bug;
    renderProgress();
    renderReports();
    const report = BUGS[lang()][bug];
    els.toast.textContent = `${UI[lang()].newBug} ${report.title}`;
  }

  function renderProgress() {
    const ui = UI[lang()];
    els.progress.textContent = state.found.length === ORDER.length ? ui.done : ui.found(state.found.length, ORDER.length);
    els.meter.value = state.found.length;
    document.getElementById('bughunt')?.classList.toggle('bh-complete', state.found.length === ORDER.length);
  }

  function renderReports() {
    const ui = UI[lang()];
    els.reports.replaceChildren();
    for (const key of ORDER.filter(k => state.found.includes(k))) {
      const bug = BUGS[lang()][key];
      const card = document.createElement('article');
      card.className = 'bh-report' + (key === newest ? ' bh-new' : '');
      card.dataset.bug = key;
      const head = document.createElement('div');
      head.className = 'bh-report-head';
      const h = document.createElement('h4');
      h.textContent = bug.title;
      const sev = document.createElement('span');
      sev.className = 'bh-sev bh-sev-' + key;
      sev.textContent = `${ui.severity}: ${bug.severity}`;
      head.append(h, sev);
      const dl = document.createElement('dl');
      for (const [label, value] of [[ui.steps, bug.steps], [ui.expected, bug.expected], [ui.actual, bug.actual]]) {
        const dt = document.createElement('dt'); dt.textContent = label;
        const dd = document.createElement('dd'); dd.textContent = value;
        dl.append(dt, dd);
      }
      const testLabel = document.createElement('p');
      testLabel.className = 'bh-test-label';
      testLabel.textContent = ui.test;
      const pre = document.createElement('pre');
      pre.className = 'bh-test';
      pre.tabIndex = 0;
      pre.textContent = bug.test;
      card.append(head, dl, testLabel, pre);
      els.reports.append(card);
    }
  }

  function renderStatic() {
    const ui = UI[lang()];
    els.labels.forEach(node => { node.textContent = ui[node.dataset.bh]; });
  }

  function reset() {
    Object.assign(state, { qty: { mug: 1, tee: 1, stickers: 1 }, discount: 0, found: [], orders: 0, lastPay: 0 });
    els.coupon.value = '';
    els.couponMsg.textContent = '';
    els.orders.replaceChildren();
    els.toast.textContent = '';
    renderCart();
    renderProgress();
    renderReports();
  }
  els.reset.addEventListener('click', reset);

  document.getElementById('lang-toggle')?.addEventListener('click', () => {
    newest = null; renderStatic(); renderCart(); renderProgress(); renderReports();
  });

  renderStatic();
  renderCart();
  renderProgress();
})();
