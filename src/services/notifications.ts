import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { ReminderMinutes, ScheduleDraft } from '../types';
import { combineDateTime, formatShortDate } from '../utils/date';

export const REMINDER_LABELS: Record<Exclude<ReminderMinutes, null>, string> = {
  0: '정시',
  10: '10분 전',
  30: '30분 전',
  60: '1시간 전',
};

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function ensureNotificationPermission() {
  if (Platform.OS === 'web') return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('schedule-reminders', {
      name: '일정 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 180, 250],
      lightColor: '#1D6B4F',
    });
  }

  const allowsNotifications = (settings: Notifications.NotificationPermissionsStatus) =>
    settings.granted ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.AUTHORIZED ||
    settings.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL;

  const current = await Notifications.getPermissionsAsync();
  if (allowsNotifications(current)) return true;
  const requested = await Notifications.requestPermissionsAsync();
  return allowsNotifications(requested);
}

export async function scheduleReminder(draft: ScheduleDraft, eventId: string) {
  if (draft.reminderMinutes === null || draft.time === null) return undefined;

  const triggerDate = combineDateTime(draft.date, draft.time);
  triggerDate.setMinutes(triggerDate.getMinutes() - draft.reminderMinutes);
  if (triggerDate.getTime() <= Date.now()) {
    throw new Error('알림 시간은 현재보다 이후여야 해요.');
  }

  if (!(await ensureNotificationPermission())) {
    throw new Error('기기 설정에서 알림 권한을 허용해 주세요.');
  }

  return Notifications.scheduleNotificationAsync({
    content: {
      title: draft.title,
      body: `${formatShortDate(draft.date)} ${draft.time} 일정이 있어요.`,
      sound: 'default',
      data: { eventId },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
      channelId: Platform.OS === 'android' ? 'schedule-reminders' : undefined,
    },
  });
}

export async function cancelReminder(notificationId?: string) {
  if (!notificationId || Platform.OS === 'web') return;
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}
