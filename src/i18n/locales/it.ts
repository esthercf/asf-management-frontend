import type { AppLocale } from './en'

const it: AppLocale = {
  common: {
    loading: 'Caricamento…',
    error: 'Qualcosa è andato storto.',
    save: 'Salva',
    cancel: 'Annulla',
    delete: 'Elimina',
    confirm: 'Conferma',
    back: 'Indietro',
    search: 'Cerca',
  },
  auth: {
    login: {
      heading: 'Bentornato.',
      sub: 'Accedi al tuo account.',
      email: 'Email',
      password: 'Password',
      submit: 'Accedi →',
      submitting: 'Accesso in corso…',
      error: {
        empty: 'Inserisci la tua email e la tua password.',
        failed: 'Accesso fallito. Riprova.',
      },
    },
    logout: 'Esci',
  },
  booking: {
    title: 'Le mie prenotazioni',
    create: 'Nuova prenotazione',
    delete: 'Annulla prenotazione',
    empty: 'Nessuna prenotazione trovata.',
    fields: {
      room: 'Sala',
      date: 'Data',
      time: 'Ora',
      usage: 'Utilizzo',
    },
  },
  room: {
    title: 'Sale',
    create: 'Aggiungi sala',
    edit: 'Modifica sala',
    delete: 'Elimina sala',
    empty: 'Nessuna sala trovata.',
    fields: {
      name: 'Nome',
      floor: 'Piano',
      roomNumber: 'Numero sala',
    },
  },
  staff: {
    dashboard: 'Dashboard staff',
    bookings: 'Tutte le prenotazioni',
    rooms: 'Gestisci sale',
  },
  user: {
    dashboard: 'La mia dashboard',
    bookings: 'Le mie prenotazioni',
  },
}

export default it
