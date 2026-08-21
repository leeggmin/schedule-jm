import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Schedule } from '../types';
import { colors } from '../theme';
import { REMINDER_LABELS } from '../services/notifications';

type Props = {
  schedule: Schedule;
  onPress: () => void;
};

export function ScheduleCard({ schedule, onPress }: Props) {
  return (
    <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]} onPress={onPress}>
      <View style={[styles.marker, { backgroundColor: schedule.color }]} />
      <View style={styles.timeBlock}>
        <Text style={[styles.time, !schedule.time && styles.noTime]}>
          {schedule.time ?? '시간 없음'}
        </Text>
        {schedule.time && (
          <Text style={styles.meridiem}>{Number(schedule.time.slice(0, 2)) < 12 ? '오전' : '오후'}</Text>
        )}
      </View>
      <View style={styles.content}>
        <Text numberOfLines={1} style={styles.title}>{schedule.title}</Text>
        <Text numberOfLines={1} style={styles.detail}>
          {schedule.note || (schedule.reminderMinutes === null ? '알림 없음' : `알림 ${REMINDER_LABELS[schedule.reminderMinutes]}`)}
        </Text>
      </View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 72,
    backgroundColor: colors.surface,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.72 },
  marker: { position: 'absolute', left: 0, top: 14, bottom: 14, width: 4, borderRadius: 4 },
  timeBlock: { width: 57 },
  time: { color: colors.ink, fontSize: 15, fontWeight: '800' },
  noTime: { color: colors.inkMuted, fontSize: 11, lineHeight: 15 },
  meridiem: { color: colors.inkMuted, fontSize: 10, marginTop: 3 },
  content: { flex: 1, paddingHorizontal: 8 },
  title: { color: colors.ink, fontSize: 15, fontWeight: '700' },
  detail: { color: colors.inkMuted, fontSize: 12, marginTop: 5 },
  chevron: { color: '#A5AEA8', fontSize: 25 },
});
