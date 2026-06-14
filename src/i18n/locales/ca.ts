import type { AppLocale } from './en'

const ca: AppLocale = {
  common: {
    loading: 'Carregant…',
    error: 'Alguna cosa ha anat malament.',
    save: 'Desar',
    cancel: 'Cancel·lar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    back: 'Tornar',
    search: 'Cercar',
  },
  auth: {
    login: {
      heading: 'Benvingut de nou.',
      sub: 'Accedeix al teu compte.',
      email: 'Correu electrònic',
      password: 'Contrasenya',
      submit: 'Entrar →',
      submitting: 'Entrant…',
      error: {
        empty: 'Si us plau, introdueix el teu correu i contrasenya.',
        failed: 'Error en iniciar sessió. Torna-ho a intentar.',
      },
    },
    logout: 'Tancar sessió',
  },
  booking: {
    title: 'Les meves reserves',
    create: 'Nova reserva',
    delete: 'Cancel·lar reserva',
    empty: 'No s\'han trobat reserves.',
    fields: {
      room: 'Sala',
      date: 'Data',
      time: 'Hora',
      usage: 'Ús',
    },
  },
  room: {
    title: 'Sales',
    create: 'Afegir sala',
    edit: 'Editar sala',
    delete: 'Eliminar sala',
    empty: 'No s\'han trobat sales.',
    fields: {
      name: 'Nom',
      floor: 'Planta',
      roomNumber: 'Número de sala',
    },
  },
  staff: {
    dashboard: 'Tauler d\'staff',
    bookings: 'Totes les reserves',
    rooms: 'Gestionar sales',
  },
  user: {
    dashboard: 'El meu tauler',
    bookings: 'Les meves reserves',
  },
}

export default ca
