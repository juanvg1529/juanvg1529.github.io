import { expect, test } from '@playwright/test';
import { CREDENTIALS, MediCitaPage } from './pages/medicita.page';

// The same scenarios the in-browser lab runs, written with Playwright and a Page Object.
// CI publishes this file's HTML report at /lab/report/.

test.describe('MediCita · smoke', { tag: ['@smoke', '@regression'] }, () => {
  test('el paciente inicia sesión', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.login();
    await expect(app.greeting).toHaveText('Hola, Ana');
    await expect(page.getByRole('heading', { name: 'Encuentra tu médico' })).toBeVisible();
  });

  test('el paciente agenda una cita de principio a fin', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.login();
    await app.book('Dra. Laura Gómez', '10:00');
    await expect(page.getByTestId('appointment-code')).toHaveText(/^MC-\d{4}$/);
    await expect(page.getByTestId('confirmation-time')).toHaveText('10:00');
    await page.getByRole('link', { name: 'Ver mis citas' }).click();
    await expect(app.appointments).toHaveCount(1);
  });
});

test.describe('MediCita · regression', { tag: '@regression' }, () => {
  test('filtra los médicos por especialidad', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.login();
    await page.getByLabel('Especialidad').selectOption('Pediatría');
    await expect(app.doctorCards).toHaveCount(2);
    await expect(app.resultsCount).toHaveText('2 médicos encontrados');
  });

  test('una búsqueda sin resultados lo explica', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.login();
    await page.getByLabel('Buscar médico').fill('Zuluaga');
    await expect(page.getByTestId('empty-doctors')).toBeVisible();
    await expect(app.resultsCount).toHaveText('0 médicos encontrados');
  });

  test('un horario ya reservado no se puede volver a reservar', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.login();
    await app.book('Dr. Andrés Ruiz', '10:00');
    await page.getByRole('link', { name: 'Médicos' }).click();
    await app.startBooking('Dr. Andrés Ruiz');
    await expect(app.slot('10:00 · ocupado')).toBeDisabled();
    await expect(app.slot('09:00 · ocupado')).toBeDisabled();
  });

  test('el paciente cancela una cita', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.login();
    await app.book('Dra. Camila Torres', '11:00');
    await page.getByRole('link', { name: 'Ver mis citas' }).click();
    await page.getByRole('button', { name: 'Cancelar cita MC-1001' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByRole('button', { name: 'Sí, cancelar' }).click();
    await expect(app.toast).toHaveText('Cita cancelada');
    await expect(page.getByTestId('empty-appointments')).toBeVisible();
  });

  test('el paciente cierra sesión', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.login();
    await page.getByRole('button', { name: 'Salir' }).click();
    await expect(page.getByRole('heading', { name: 'Ingresa a tu cuenta' })).toBeVisible();
    await expect(app.toast).toHaveText('Sesión cerrada');
  });
});

test.describe('MediCita · negative', { tag: '@negative' }, () => {
  test('el login exige el correo', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.open();
    await app.loginButton.click();
    await expect(app.alert).toHaveText('Ingresa tu correo electrónico');
  });

  test('una contraseña incorrecta es rechazada', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.login(CREDENTIALS.email, 'Incorrecta1');
    await expect(app.alert).toHaveText('Correo o contraseña incorrectos');
    await expect(app.greeting).toBeHidden();
  });

  test('no se puede agendar sin elegir horario', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.login();
    await app.startBooking('Dr. Mateo Herrera');
    await page.getByLabel('Motivo de la consulta').fill('Dolor de cabeza frecuente');
    await page.getByRole('button', { name: 'Confirmar cita' }).click();
    await expect(app.alert).toHaveText('Selecciona un horario');
  });

  test('el motivo de la consulta exige 10 caracteres', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.login();
    await app.startBooking('Dra. Sofía Vargas');
    await app.slot('08:00').check();
    await page.getByLabel('Motivo de la consulta').fill('Dolor');
    await page.getByRole('button', { name: 'Confirmar cita' }).click();
    await expect(app.alert).toHaveText('Describe el motivo de la consulta (mínimo 10 caracteres)');
  });
});

test.describe('MediCita · injected defect', { tag: '@known-defect' }, () => {
  test('con ?bug=double-booking, un horario ocupado sigue disponible (el test de regresión lo detecta)', async ({ page }) => {
    const app = new MediCitaPage(page);
    await app.login(undefined, undefined, 'double-booking');
    await app.book('Dr. Andrés Ruiz', '10:00');
    await page.getByRole('link', { name: 'Médicos' }).click();
    await app.startBooking('Dr. Andrés Ruiz');
    // Documents the injected defect: the regression test above would fail on this build.
    await expect(app.slot('10:00 · ocupado')).toBeEnabled();
  });
});
