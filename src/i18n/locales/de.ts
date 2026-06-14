import type { AppLocale } from './en'

const de: AppLocale = {
  common: {
    loading: 'Laden…',
    error: 'Etwas ist schiefgelaufen.',
    save: 'Speichern',
    cancel: 'Abbrechen',
    delete: 'Löschen',
    confirm: 'Bestätigen',
    back: 'Zurück',
    search: 'Suchen',
  },
  auth: {
    login: {
      heading: 'Willkommen zurück.',
      sub: 'Melden Sie sich bei Ihrem Konto an.',
      email: 'E-Mail',
      password: 'Passwort',
      submit: 'Anmelden →',
      submitting: 'Anmeldung läuft…',
      error: {
        empty: 'Bitte geben Sie Ihre E-Mail und Ihr Passwort ein.',
        failed: 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.',
      },
    },
    logout: 'Abmelden',
  },
  booking: {
    title: 'Meine Buchungen',
    create: 'Neue Buchung',
    delete: 'Buchung stornieren',
    empty: 'Keine Buchungen gefunden.',
    fields: {
      room: 'Raum',
      date: 'Datum',
      time: 'Uhrzeit',
      usage: 'Verwendung',
    },
  },
  room: {
    title: 'Räume',
    create: 'Raum hinzufügen',
    edit: 'Raum bearbeiten',
    delete: 'Raum löschen',
    empty: 'Keine Räume gefunden.',
    fields: {
      name: 'Name',
      floor: 'Etage',
      roomNumber: 'Raumnummer',
    },
  },
  staff: {
    dashboard: 'Mitarbeiter-Dashboard',
    bookings: 'Alle Buchungen',
    rooms: 'Räume verwalten',
  },
  user: {
    dashboard: 'Mein Dashboard',
    bookings: 'Meine Buchungen',
  },
}

export default de
