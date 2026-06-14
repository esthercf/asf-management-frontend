import type { AppLocale } from './en'

const ja: AppLocale = {
  common: {
    loading: '読み込み中…',
    error: 'エラーが発生しました。',
    save: '保存',
    cancel: 'キャンセル',
    delete: '削除',
    confirm: '確認',
    back: '戻る',
    search: '検索',
  },
  auth: {
    login: {
      heading: 'おかえりなさい。',
      sub: 'アカウントにサインインしてください。',
      email: 'メールアドレス',
      password: 'パスワード',
      submit: 'サインイン →',
      submitting: 'サインイン中…',
      error: {
        empty: 'メールアドレスとパスワードを入力してください。',
        failed: 'ログインに失敗しました。もう一度お試しください。',
      },
    },
    logout: 'サインアウト',
  },
  booking: {
    title: '予約一覧',
    create: '新規予約',
    delete: '予約をキャンセル',
    empty: '予約が見つかりません。',
    fields: {
      room: '部屋',
      date: '日付',
      time: '時間',
      usage: '用途',
    },
  },
  room: {
    title: '部屋',
    create: '部屋を追加',
    edit: '部屋を編集',
    delete: '部屋を削除',
    empty: '部屋が見つかりません。',
    fields: {
      name: '名前',
      floor: '階',
      roomNumber: '部屋番号',
    },
  },
  staff: {
    dashboard: 'スタッフダッシュボード',
    bookings: 'すべての予約',
    rooms: '部屋を管理',
  },
  user: {
    dashboard: 'マイダッシュボード',
    bookings: '私の予約',
  },
}

export default ja
