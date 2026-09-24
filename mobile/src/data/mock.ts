export type MockTask = {
  id: string;
  time: string;
  title: string;
  duration: string;
  done: boolean;
};

export const todayTasks: MockTask[] = [
  { id: '1', time: '07:30', title: 'Ertalabki mashqlar', duration: '20 daqiqa', done: true },
  { id: '2', time: '09:00', title: 'Matematika — takrorlash', duration: '45 daqiqa', done: true },
  { id: '3', time: '11:30', title: "Loyiha bo'yicha ishlash", duration: '1 soat', done: true },
  { id: '4', time: '14:00', title: 'Ingliz tili darsi', duration: '40 daqiqa', done: false },
  { id: '5', time: '17:30', title: 'Sport zali', duration: '1 soat', done: false },
  { id: '6', time: '19:00', title: "Kitob o'qish — 20 bet", duration: '25 daqiqa', done: false },
];

export type WeekDay = {
  label: string;
  num: number;
  hasTasks: boolean;
  today?: boolean;
};

export const weekDays: WeekDay[] = [
  { label: 'Du', num: 22, hasTasks: true },
  { label: 'Se', num: 23, hasTasks: true },
  { label: 'Pa', num: 24, hasTasks: true, today: true },
  { label: 'Ju', num: 25, hasTasks: false },
  { label: 'Ju', num: 26, hasTasks: true },
  { label: 'Sh', num: 27, hasTasks: false },
  { label: 'Ya', num: 28, hasTasks: false },
];

export const profileStats = {
  name: 'Alixon Motabarov',
  email: 'alixon@timeup.uz',
  initials: 'AM',
  xp: 240,
  currentStreak: 5,
  longestStreak: 18,
  timezone: 'Asia/Tashkent (UTC+5)',
};
