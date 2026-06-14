import type { AppLocale } from './en'

const pt: AppLocale = {
  common: {
    loading: 'A carregar…',
    error: 'Algo correu mal.',
    save: 'Guardar',
    cancel: 'Cancelar',
    delete: 'Eliminar',
    confirm: 'Confirmar',
    back: 'Voltar',
    search: 'Pesquisar',
  },
  auth: {
    login: {
      heading: 'Bem-vindo de volta.',
      sub: 'Inicie sessão na sua conta.',
      email: 'E-mail',
      password: 'Palavra-passe',
      submit: 'Entrar →',
      submitting: 'A entrar…',
      error: {
        empty: 'Por favor, introduza o seu e-mail e palavra-passe.',
        failed: 'Falha ao iniciar sessão. Tente novamente.',
      },
    },
    logout: 'Terminar sessão',
  },
  booking: {
    title: 'As minhas reservas',
    create: 'Nova reserva',
    delete: 'Cancelar reserva',
    empty: 'Nenhuma reserva encontrada.',
    fields: {
      room: 'Sala',
      date: 'Data',
      time: 'Hora',
      usage: 'Utilização',
    },
  },
  room: {
    title: 'Salas',
    create: 'Adicionar sala',
    edit: 'Editar sala',
    delete: 'Eliminar sala',
    empty: 'Nenhuma sala encontrada.',
    fields: {
      name: 'Nome',
      floor: 'Andar',
      roomNumber: 'Número da sala',
    },
  },
  staff: {
    dashboard: 'Painel de staff',
    bookings: 'Todas as reservas',
    rooms: 'Gerir salas',
  },
  user: {
    dashboard: 'O meu painel',
    bookings: 'As minhas reservas',
  },
}

export default pt
