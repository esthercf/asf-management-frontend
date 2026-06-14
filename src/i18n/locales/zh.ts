import type { AppLocale } from './en'

const zh: AppLocale = {
  common: {
    loading: '加载中…',
    error: '出现错误。',
    save: '保存',
    cancel: '取消',
    delete: '删除',
    confirm: '确认',
    back: '返回',
    search: '搜索',
  },
  auth: {
    login: {
      heading: '欢迎回来。',
      sub: '登录您的账户。',
      email: '电子邮件',
      password: '密码',
      submit: '登录 →',
      submitting: '登录中…',
      error: {
        empty: '请输入您的电子邮件和密码。',
        failed: '登录失败，请重试。',
      },
    },
    logout: '退出登录',
  },
  booking: {
    title: '我的预订',
    create: '新建预订',
    delete: '取消预订',
    empty: '未找到预订。',
    fields: {
      room: '房间',
      date: '日期',
      time: '时间',
      usage: '用途',
    },
  },
  room: {
    title: '房间',
    create: '添加房间',
    edit: '编辑房间',
    delete: '删除房间',
    empty: '未找到房间。',
    fields: {
      name: '名称',
      floor: '楼层',
      roomNumber: '房间号',
    },
  },
  staff: {
    dashboard: '员工控制台',
    bookings: '所有预订',
    rooms: '管理房间',
  },
  user: {
    dashboard: '我的控制台',
    bookings: '我的预订',
  },
}

export default zh
