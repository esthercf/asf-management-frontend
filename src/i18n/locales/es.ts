import type { AppLocale } from './en'

const es: AppLocale = {
  common: {
    loading: 'Cargando…',
    error: 'Algo salió mal.',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    back: 'Volver',
    search: 'Buscar',
  },
  auth: {
    login: {
      heading: 'Bienvenido de nuevo.',
      sub: 'Accede a tu cuenta.',
      email: 'Correo electrónico',
      password: 'Contraseña',
      submit: 'Entrar →',
      submitting: 'Entrando…',
      error: {
        empty: 'Por favor, introduce tu correo y contraseña.',
        failed: 'Error al iniciar sesión. Inténtalo de nuevo.',
      },
    },
    logout: 'Cerrar sesión',
  },
  booking: {
    title: 'Mis reservas',
    create: 'Nueva reserva',
    delete: 'Cancelar reserva',
    empty: 'No se encontraron reservas.',
    fields: {
      room: 'Sala',
      date: 'Fecha',
      time: 'Hora',
      usage: 'Uso',
    },
  },
  room: {
    title: 'Salas',
    create: 'Añadir sala',
    edit: 'Editar sala',
    delete: 'Eliminar sala',
    empty: 'No se encontraron salas.',
    fields: {
      name: 'Nombre',
      floor: 'Planta',
      roomNumber: 'Número de sala',
    },
  },
  staff: {
    dashboard: 'Panel de staff',
    bookings: 'Todas las reservas',
    rooms: 'Gestionar salas',
  },
  user: {
    dashboard: 'Mi panel',
    bookings: 'Mis reservas',
  },
}

export default es
