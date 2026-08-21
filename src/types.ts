export type ReminderMinutes = null | 0 | 10 | 30 | 60;

export type Schedule = {
  id: string;
  title: string;
  note: string;
  date: string;
  time: string | null;
  color: string;
  reminderMinutes: ReminderMinutes;
  notificationId?: string;
  createdAt: string;
};

export type ScheduleDraft = Omit<Schedule, 'id' | 'notificationId' | 'createdAt'>;
