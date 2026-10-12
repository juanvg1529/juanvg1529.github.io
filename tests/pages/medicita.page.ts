import { expect, type Locator, type Page } from '@playwright/test';

export const CREDENTIALS = { email: 'paciente@medicita.test', password: 'Salud2026!' };

/** Page Object for MediCita, the app under test in the UI automation lab. */
export class MediCitaPage {
  readonly email: Locator;
  readonly password: Locator;
  readonly loginButton: Locator;
  readonly alert: Locator;
  readonly greeting: Locator;
  readonly doctorCards: Locator;
  readonly resultsCount: Locator;
  readonly appointments: Locator;
  readonly toast: Locator;

  constructor(private readonly page: Page) {
    this.email = page.getByLabel('Correo electrónico');
    this.password = page.getByLabel('Contraseña');
    this.loginButton = page.getByRole('button', { name: 'Ingresar' });
    this.alert = page.getByRole('alert');
    this.greeting = page.getByTestId('greeting');
    this.doctorCards = page.getByTestId('doctor-card');
    this.resultsCount = page.getByTestId('results-count');
    this.appointments = page.getByTestId('appointment');
    this.toast = page.getByRole('status');
  }

  async open(route = '#/login', bug?: string): Promise<void> {
    await this.page.goto(`/lab/app/${bug ? `?bug=${bug}` : ''}${route}`);
  }

  async login(email = CREDENTIALS.email, password = CREDENTIALS.password, bug?: string): Promise<void> {
    await this.open('#/login', bug);
    await this.email.fill(email);
    await this.password.fill(password);
    await this.loginButton.click();
  }

  slot(label: string): Locator {
    return this.page.getByLabel(label, { exact: true });
  }

  async startBooking(doctor: string): Promise<void> {
    await this.page.getByRole('link', { name: `Agendar con ${doctor}` }).click();
  }

  async book(doctor: string, slot: string, reason = 'Control anual y revisión de exámenes'): Promise<void> {
    await this.startBooking(doctor);
    await this.slot(slot).check();
    await this.page.getByLabel('Motivo de la consulta').fill(reason);
    await this.page.getByRole('button', { name: 'Confirmar cita' }).click();
    await expect(this.page.getByRole('heading', { name: 'Cita confirmada' })).toBeVisible();
  }
}
