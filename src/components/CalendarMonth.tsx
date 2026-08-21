import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Schedule } from '../types';
import { colors } from '../theme';
import { formatMonth, getCalendarDays, toDateKey } from '../utils/date';

type Props = {
  visibleMonth: Date;
  selectedDate: string;
  schedules: Schedule[];
  onSelectDate: (dateKey: string) => void;
  onChangeMonth: (offset: number) => void;
  onToday: () => void;
};

const weekdays = ['일', '월', '화', '수', '목', '금', '토'];

export function CalendarMonth({
  visibleMonth,
  selectedDate,
  schedules,
  onSelectDate,
  onChangeMonth,
  onToday,
}: Props) {
  const todayKey = toDateKey(new Date());
  const days = getCalendarDays(visibleMonth);
  const schedulesByDate = schedules.reduce<Record<string, Schedule[]>>((result, schedule) => {
    (result[schedule.date] ??= []).push(schedule);
    return result;
  }, {});

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>MONTHLY PLAN</Text>
          <Text style={styles.month}>{formatMonth(visibleMonth)}</Text>
        </View>
        <View style={styles.actions}>
          <Pressable accessibilityLabel="이전 달" style={styles.iconButton} onPress={() => onChangeMonth(-1)}>
            <Text style={styles.icon}>‹</Text>
          </Pressable>
          <Pressable style={styles.todayButton} onPress={onToday}>
            <Text style={styles.todayText}>오늘</Text>
          </Pressable>
          <Pressable accessibilityLabel="다음 달" style={styles.iconButton} onPress={() => onChangeMonth(1)}>
            <Text style={styles.icon}>›</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.weekRow}>
        {weekdays.map((day, index) => (
          <Text
            key={day}
            style={[styles.weekday, index === 0 && styles.sunday, index === 6 && styles.saturday]}
          >
            {day}
          </Text>
        ))}
      </View>

      <View style={styles.grid}>
        {days.map((date) => {
          const key = toDateKey(date);
          const isSelected = key === selectedDate;
          const isToday = key === todayKey;
          const isCurrentMonth = date.getMonth() === visibleMonth.getMonth();
          const daySchedules = schedulesByDate[key] ?? [];

          return (
            <Pressable
              key={key}
              accessibilityLabel={`${date.getMonth() + 1}월 ${date.getDate()}일`}
              style={({ pressed }) => [styles.dayCell, pressed && styles.dayPressed]}
              onPress={() => onSelectDate(key)}
            >
              <View style={[styles.dayCircle, isSelected && styles.selectedCircle]}>
                <Text
                  style={[
                    styles.dayText,
                    !isCurrentMonth && styles.outsideText,
                    isToday && styles.todayDayText,
                    isSelected && styles.selectedText,
                  ]}
                >
                  {date.getDate()}
                </Text>
              </View>
              <View style={styles.dots}>
                {daySchedules.slice(0, 3).map((schedule) => (
                  <View key={schedule.id} style={[styles.dot, { backgroundColor: schedule.color }]} />
                ))}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 28,
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: '#1B2A21',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 22,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 18,
    paddingHorizontal: 4,
  },
  eyebrow: { color: colors.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  month: { color: colors.ink, fontSize: 23, fontWeight: '800', marginTop: 3, letterSpacing: -0.8 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  icon: { color: colors.ink, fontSize: 27, lineHeight: 29, fontWeight: '400' },
  todayButton: { height: 34, paddingHorizontal: 12, borderRadius: 17, justifyContent: 'center' },
  todayText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  weekRow: { flexDirection: 'row', paddingBottom: 7 },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', color: colors.inkMuted, fontSize: 11, fontWeight: '700' },
  sunday: { color: colors.accent },
  saturday: { color: '#5779C8' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: `${100 / 7}%`, height: 51, alignItems: 'center', paddingTop: 5, borderRadius: 14 },
  dayPressed: { backgroundColor: colors.surfaceMuted },
  dayCircle: { width: 31, height: 31, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  selectedCircle: { backgroundColor: colors.primary },
  dayText: { color: colors.ink, fontSize: 14, fontWeight: '600' },
  outsideText: { color: '#BCC4BF' },
  todayDayText: { color: colors.primary, fontWeight: '900' },
  selectedText: { color: colors.white },
  dots: { height: 6, flexDirection: 'row', gap: 2, paddingTop: 3 },
  dot: { width: 4, height: 4, borderRadius: 2 },
});
