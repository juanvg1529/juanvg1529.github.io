// MediCita: a small appointment-booking app used as the system under test in the UI automation lab.
// State lives in memory, so every page load starts clean (like a fresh browser context).
// ?bug=double-booking injects a real defect: taken time slots can be booked again.
(function () {
  const USER = { email: 'paciente@medicita.test', password: 'Salud2026!', name: 'Ana' };
  const BUG = new URLSearchParams(location.search).get('bug');

  const DOCTORS = [
    { id: 'd1', name: 'Dra. Laura Gómez', specialty: 'Cardiología' },
    { id: 'd2', name: 'Dr. Andrés Ruiz', specialty: 'Pediatría' },
    { id: 'd3', name: 'Dra. Camila Torres', specialty: 'Dermatología' },
    { id: 'd4', name: 'Dr. Mateo Herrera', specialty: 'Medicina general' },
    { id: 'd5', name: 'Dra. Sofía Vargas', specialty: 'Cardiología' },
    { id: 'd6', name: 'Dr. Julián Restrepo', specialty: 'Pediatría' }
  ];
  const SLOTS = ['08:00', '09:00', '10:00', '11:00', '14:00', '15:00'];

  // Next 5 weekdays, so the app always offers future dates.
  const DATES = (() => {
    const dates = [];
    const day = new Date();
    while (dates.length < 5) {
      day.setDate(day.getDate() + 1);
      if (day.getDay() !== 0 && day.getDay() !== 6) dates.push(day.toISOString().slice(0, 10));
    }
    return dates;
  })();

  const state = {
    user: null,
    appointments: [],
    // Pre-booked by other patients: 09:00 and 14:00 on every date.
    taken: new Set(DOCTORS.flatMap(d => DATES.flatMap(date => [`${d.id}|${date}|09:00`, `${d.id}|${date}|14:00`]))),
    filter: { text: '', specialty: 'Todas' },
    lastBooking: null
  };

  const view = document.getElementById('view');
  const nav = document.getElementById('app-nav');
  const toast = document.getElementById('toast');

  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const formatDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
  const notify = text => { toast.textContent = text; clearTimeout(notify.t); notify.t = setTimeout(() => { toast.textContent = ''; }, 2500); };

  function go(hash) { location.hash = hash; }

  function render() {
    const [, route, param] = location.hash.split('/');
    if (!state.user && route !== 'login') return go('#/login');
    nav.hidden = !state.user;
    if (state.user) document.getElementById('greeting').textContent = `Hola, ${state.user.name}`;

    ({ login: renderLogin, doctors: renderDoctors, book: () => renderBook(param), confirmation: renderConfirmation, appointments: renderAppointments }[route] || (() => go(state.user ? '#/doctors' : '#/login')))();
    view.focus({ preventScroll: true });
  }

  // ---------------- Login ----------------
  function renderLogin() {
    if (state.user) return go('#/doctors');
    view.innerHTML = `
      <section class="card narrow">
        <h1>Ingresa a tu cuenta</h1>
        <p class="muted">Usuario de prueba: <code>${USER.email}</code> · <code>${USER.password}</code></p>
        <form id="login-form" novalidate>
          <label for="email">Correo electrónico</label>
          <input id="email" type="email" autocomplete="off">
          <label for="password">Contraseña</label>
          <input id="password" type="password" autocomplete="off">
          <p class="error" id="login-error" role="alert"></p>
          <button type="submit">Ingresar</button>
        </form>
      </section>`;
    document.getElementById('login-form').addEventListener('submit', event => {
      event.preventDefault();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const error = document.getElementById('login-error');
      if (!email) error.textContent = 'Ingresa tu correo electrónico';
      else if (!password) error.textContent = 'Ingresa tu contraseña';
      else if (email.toLowerCase() !== USER.email || password !== USER.password) error.textContent = 'Correo o contraseña incorrectos';
      else { state.user = { ...USER }; go('#/doctors'); }
    });
  }

  // ---------------- Doctors ----------------
  function renderDoctors() {
    const specialties = ['Todas', ...new Set(DOCTORS.map(d => d.specialty))];
    view.innerHTML = `
      <section>
        <h1>Encuentra tu médico</h1>
        <div class="filters">
          <div><label for="search">Buscar médico</label><input id="search" type="search" value="${esc(state.filter.text)}" placeholder="Nombre"></div>
          <div><label for="specialty">Especialidad</label><select id="specialty">${specialties.map(s => `<option${s === state.filter.specialty ? ' selected' : ''}>${s}</option>`).join('')}</select></div>
        </div>
        <p class="muted" id="results-count" data-testid="results-count"></p>
        <ul class="doctor-list" id="doctor-list"></ul>
      </section>`;
    const list = document.getElementById('doctor-list');
    const count = document.getElementById('results-count');

    function update() {
      const text = state.filter.text.toLowerCase();
      const found = DOCTORS.filter(d => (state.filter.specialty === 'Todas' || d.specialty === state.filter.specialty) && d.name.toLowerCase().includes(text));
      count.textContent = `${found.length} ${found.length === 1 ? 'médico encontrado' : 'médicos encontrados'}`;
      list.innerHTML = found.length
        ? found.map(d => `<li class="doctor-card" data-testid="doctor-card"><div><strong>${d.name}</strong><span class="muted">${d.specialty}</span></div><a class="button" href="#/book/${d.id}" aria-label="Agendar con ${d.name}">Agendar</a></li>`).join('')
        : '<li class="empty" data-testid="empty-doctors">No encontramos médicos con esos filtros.</li>';
    }
    document.getElementById('search').addEventListener('input', e => { state.filter.text = e.target.value; update(); });
    document.getElementById('specialty').addEventListener('change', e => { state.filter.specialty = e.target.value; update(); });
    update();
  }

  // ---------------- Booking ----------------
  function renderBook(doctorId) {
    const doctor = DOCTORS.find(d => d.id === doctorId);
    if (!doctor) return go('#/doctors');
    view.innerHTML = `
      <section class="card">
        <a href="#/doctors" class="back">← Volver a médicos</a>
        <h1>Agendar con ${doctor.name}</h1>
        <p class="muted">${doctor.specialty}</p>
        <form id="book-form" novalidate>
          <label for="date">Fecha</label>
          <select id="date">${DATES.map(d => `<option value="${d}">${formatDate(d)}</option>`).join('')}</select>
          <fieldset><legend>Horario</legend><div class="slots" id="slots"></div></fieldset>
          <label for="reason">Motivo de la consulta</label>
          <textarea id="reason" rows="3" placeholder="Cuéntanos brevemente el motivo"></textarea>
          <p class="error" id="book-error" role="alert"></p>
          <button type="submit">Confirmar cita</button>
        </form>
      </section>`;
    const dateSelect = document.getElementById('date');
    const slots = document.getElementById('slots');

    function drawSlots() {
      slots.innerHTML = SLOTS.map(time => {
        const taken = state.taken.has(`${doctor.id}|${dateSelect.value}|${time}`);
        const disabled = taken && BUG !== 'double-booking'; // BUG: taken slots stay selectable
        return `<label class="slot${taken ? ' taken' : ''}"><input type="radio" name="slot" value="${time}"${disabled ? ' disabled' : ''}><span>${time}${taken ? ' · ocupado' : ''}</span></label>`;
      }).join('');
    }
    dateSelect.addEventListener('change', drawSlots);
    drawSlots();

    document.getElementById('book-form').addEventListener('submit', event => {
      event.preventDefault();
      const error = document.getElementById('book-error');
      const slot = view.querySelector('input[name="slot"]:checked');
      const reason = document.getElementById('reason').value.trim();
      if (!slot) { error.textContent = 'Selecciona un horario'; return; }
      if (reason.length < 10) { error.textContent = 'Describe el motivo de la consulta (mínimo 10 caracteres)'; return; }
      const key = `${doctor.id}|${dateSelect.value}|${slot.value}`;
      state.taken.add(key);
      const appointment = { code: 'MC-' + String(1000 + state.appointments.length + 1), doctor: doctor.name, specialty: doctor.specialty, date: dateSelect.value, time: slot.value, reason, key };
      state.appointments.push(appointment);
      state.lastBooking = appointment;
      go('#/confirmation');
    });
  }

  function renderConfirmation() {
    const a = state.lastBooking;
    if (!a) return go('#/doctors');
    view.innerHTML = `
      <section class="card narrow success">
        <h1>Cita confirmada</h1>
        <p>Código de la cita: <strong data-testid="appointment-code">${a.code}</strong></p>
        <dl class="details">
          <dt>Médico</dt><dd data-testid="confirmation-doctor">${a.doctor}</dd>
          <dt>Fecha</dt><dd>${formatDate(a.date)}</dd>
          <dt>Hora</dt><dd data-testid="confirmation-time">${a.time}</dd>
        </dl>
        <a class="button" href="#/appointments">Ver mis citas</a>
      </section>`;
  }

  // ---------------- Appointments ----------------
  function renderAppointments() {
    view.innerHTML = `
      <section>
        <h1>Mis citas</h1>
        <ul class="appointments" id="appointments">${state.appointments.length
          ? state.appointments.map(a => `<li class="appointment" data-testid="appointment" data-code="${a.code}"><div><strong>${a.doctor}</strong><span class="muted">${a.specialty} · ${formatDate(a.date)} · ${a.time}</span><span class="code">${a.code}</span></div><button type="button" class="danger" data-cancel="${a.code}" aria-label="Cancelar cita ${a.code}">Cancelar</button></li>`).join('')
          : '<li class="empty" data-testid="empty-appointments">No tienes citas programadas.</li>'}</ul>
      </section>`;
    view.querySelectorAll('[data-cancel]').forEach(button => button.addEventListener('click', () => askCancel(button.dataset.cancel)));
  }

  function askCancel(code) {
    const modal = document.getElementById('modal');
    const appointment = state.appointments.find(a => a.code === code);
    document.getElementById('modal-text').textContent = `${appointment.doctor} · ${formatDate(appointment.date)} · ${appointment.time}`;
    modal.hidden = false;
    document.getElementById('modal-no').focus();
    const close = () => { modal.hidden = true; yes.removeEventListener('click', onYes); no.removeEventListener('click', close); };
    const onYes = () => {
      state.appointments = state.appointments.filter(a => a.code !== code);
      state.taken.delete(appointment.key);
      close();
      notify('Cita cancelada');
      renderAppointments();
    };
    const yes = document.getElementById('modal-yes');
    const no = document.getElementById('modal-no');
    yes.addEventListener('click', onYes);
    no.addEventListener('click', close);
  }

  document.getElementById('logout').addEventListener('click', () => { state.user = null; notify('Sesión cerrada'); go('#/login'); });
  window.addEventListener('hashchange', render);
  render();
})();
