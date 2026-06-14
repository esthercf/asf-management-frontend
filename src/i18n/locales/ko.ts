import type { AppLocale } from './en'

const ko: AppLocale = {
  common: {
    loading: '로딩 중…',
    error: '오류가 발생했습니다.',
    save: '저장',
    cancel: '취소',
    delete: '삭제',
    confirm: '확인',
    back: '뒤로',
    search: '검색',
  },
  auth: {
    login: {
      heading: '다시 오셨군요.',
      sub: '계정에 로그인하세요.',
      email: '이메일',
      password: '비밀번호',
      submit: '로그인 →',
      submitting: '로그인 중…',
      error: {
        empty: '이메일과 비밀번호를 입력해주세요.',
        failed: '로그인에 실패했습니다. 다시 시도해주세요.',
      },
    },
    logout: '로그아웃',
  },
  booking: {
    title: '내 예약',
    create: '새 예약',
    delete: '예약 취소',
    empty: '예약을 찾을 수 없습니다.',
    fields: {
      room: '방',
      date: '날짜',
      time: '시간',
      usage: '사용 목적',
    },
  },
  room: {
    title: '방',
    create: '방 추가',
    edit: '방 편집',
    delete: '방 삭제',
    empty: '방을 찾을 수 없습니다.',
    fields: {
      name: '이름',
      floor: '층',
      roomNumber: '방 번호',
    },
  },
  staff: {
    dashboard: '직원 대시보드',
    bookings: '모든 예약',
    rooms: '방 관리',
  },
  user: {
    dashboard: '내 대시보드',
    bookings: '내 예약',
  },
}

export default ko
