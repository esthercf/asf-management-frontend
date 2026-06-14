import type { AppLocale } from './en'

const ru: AppLocale = {
  common: {
    loading: 'Загрузка…',
    error: 'Что-то пошло не так.',
    save: 'Сохранить',
    cancel: 'Отмена',
    delete: 'Удалить',
    confirm: 'Подтвердить',
    back: 'Назад',
    search: 'Поиск',
  },
  auth: {
    login: {
      heading: 'С возвращением.',
      sub: 'Войдите в свой аккаунт.',
      email: 'Электронная почта',
      password: 'Пароль',
      submit: 'Войти →',
      submitting: 'Вход…',
      error: {
        empty: 'Пожалуйста, введите email и пароль.',
        failed: 'Ошибка входа. Пожалуйста, попробуйте снова.',
      },
    },
    logout: 'Выйти',
  },
  booking: {
    title: 'Мои бронирования',
    create: 'Новое бронирование',
    delete: 'Отменить бронирование',
    empty: 'Бронирования не найдены.',
    fields: {
      room: 'Комната',
      date: 'Дата',
      time: 'Время',
      usage: 'Использование',
    },
  },
  room: {
    title: 'Комнаты',
    create: 'Добавить комнату',
    edit: 'Редактировать комнату',
    delete: 'Удалить комнату',
    empty: 'Комнаты не найдены.',
    fields: {
      name: 'Название',
      floor: 'Этаж',
      roomNumber: 'Номер комнаты',
    },
  },
  staff: {
    dashboard: 'Панель персонала',
    bookings: 'Все бронирования',
    rooms: 'Управление комнатами',
  },
  user: {
    dashboard: 'Моя панель',
    bookings: 'Мои бронирования',
  },
}

export default ru
