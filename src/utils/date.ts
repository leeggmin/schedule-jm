const DAY_MS = 24 * 60 * 60 * 1000;

export const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const fromDateKey = (key: string) => {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const combineDateTime = (dateKey: string, time: string) => {
  const [hours, minutes] = time.split(':').map(Number);
  const date = fromDateKey(dateKey);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

export const getCalendarDays = (visibleMonth: Date) => {
  const first = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
  const start = new Date(first);
  start.setDate(first.getDate() - first.getDay());

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return date;
  });
};

export const formatMonth = (date: Date) =>
  new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long' }).format(date);

export const formatSelectedDate = (key: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    month: 'long',
    day: 'numeric',
    weekday: 'long',
  }).format(fromDateKey(key));

export const formatShortDate = (key: string) =>
  new Intl.DateTimeFormat('ko-KR', { month: 'long', day: 'numeric' }).format(fromDateKey(key));

export const getRelativeDay = (key: string) => {
  const today = fromDateKey(toDateKey(new Date())).getTime();
  const target = fromDateKey(key).getTime();
  const difference = Math.round((target - today) / DAY_MS);
  if (difference === 0) return '오늘';
  if (difference === 1) return '내일';
  if (difference === -1) return '어제';
  return null;
};
