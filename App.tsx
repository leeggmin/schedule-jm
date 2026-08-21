import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar as NativeStatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { CalendarMonth } from './src/components/CalendarMonth';
import { ScheduleCard } from './src/components/ScheduleCard';
import { ScheduleModal } from './src/components/ScheduleModal';
import { cancelReminder, scheduleReminder } from './src/services/notifications';
import { loadSchedules, saveSchedules } from './src/services/storage';
import { colors } from './src/theme';
import { Schedule, ScheduleDraft } from './src/types';
import { combineDateTime, formatSelectedDate, fromDateKey, getRelativeDay, toDateKey } from './src/utils/date';

const sortSchedules = (items: Schedule[]) =>
  [...items].sort((a, b) => `${a.date}${a.time ?? ''}`.localeCompare(`${b.date}${b.time ?? ''}`));

export default function App() {
  const today = useMemo(() => new Date(), []);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [selectedDate, setSelectedDate] = useState(toDateKey(today));
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [modalVisible, setModalVisible] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | undefined>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSchedules().then((stored) => {
      setSchedules(sortSchedules(stored));
      setLoading(false);
    });
  }, []);

  const selectedSchedules = schedules.filter((schedule) => schedule.date === selectedDate);
  const selectedRelative = getRelativeDay(selectedDate);
  const todayKey = toDateKey(new Date());
  const upcomingCount = schedules.filter((schedule) =>
    schedule.time
      ? combineDateTime(schedule.date, schedule.time).getTime() >= Date.now()
      : schedule.date >= todayKey,
  ).length;

  const selectDate = (dateKey: string) => {
    setSelectedDate(dateKey);
    const date = fromDateKey(dateKey);
    if (date.getMonth() !== visibleMonth.getMonth() || date.getFullYear() !== visibleMonth.getFullYear()) {
      setVisibleMonth(new Date(date.getFullYear(), date.getMonth(), 1));
    }
  };

  const goToToday = () => {
    const now = new Date();
    setSelectedDate(toDateKey(now));
    setVisibleMonth(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const openNewSchedule = () => {
    setEditingSchedule(undefined);
    setModalVisible(true);
  };

  const openSchedule = (schedule: Schedule) => {
    setEditingSchedule(schedule);
    setModalVisible(true);
  };

  const upsertSchedule = async (draft: ScheduleDraft, existing?: Schedule) => {
    const id = existing?.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const notificationId = await scheduleReminder(draft, id);
    const nextSchedule: Schedule = {
      ...draft,
      id,
      notificationId,
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    };
    const next = sortSchedules(
      existing
        ? schedules.map((item) => (item.id === existing.id ? nextSchedule : item))
        : [...schedules, nextSchedule],
    );

    try {
      await saveSchedules(next);
    } catch {
      await cancelReminder(notificationId);
      throw new Error('기기에 일정을 저장하지 못했어요.');
    }

    setSchedules(next);
    setSelectedDate(draft.date);
    const savedDate = fromDateKey(draft.date);
    setVisibleMonth(new Date(savedDate.getFullYear(), savedDate.getMonth(), 1));
    if (existing?.notificationId && existing.notificationId !== notificationId) {
      await cancelReminder(existing.notificationId).catch(() => undefined);
    }
  };

  const deleteSchedule = async (schedule: Schedule) => {
    const next = schedules.filter((item) => item.id !== schedule.id);
    await saveSchedules(next);
    setSchedules(next);
    await cancelReminder(schedule.notificationId).catch(() => undefined);
  };

  const changeMonth = (offset: number) => {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(next);
    setSelectedDate(toDateKey(next));
  };

  return (
    <View style={styles.root}>
      <StatusBar style="dark" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.appHeader}>
          <View>
            <Text style={styles.brand}>하루</Text>
            <Text style={styles.tagline}>오늘을 가볍게, 계획은 선명하게</Text>
          </View>
          <View style={styles.counter}>
            <Text style={styles.counterNumber}>{upcomingCount}</Text>
            <Text style={styles.counterLabel}>다가올 일정</Text>
          </View>
        </View>

        <CalendarMonth
          visibleMonth={visibleMonth}
          selectedDate={selectedDate}
          schedules={schedules}
          onSelectDate={selectDate}
          onChangeMonth={changeMonth}
          onToday={goToToday}
        />

        <View style={styles.listHeader}>
          <View>
            <View style={styles.dateTitleRow}>
              <Text style={styles.dateTitle}>{formatSelectedDate(selectedDate)}</Text>
              {selectedRelative && <Text style={styles.relativeBadge}>{selectedRelative}</Text>}
            </View>
            <Text style={styles.listSummary}>
              {selectedSchedules.length ? `${selectedSchedules.length}개의 일정이 있어요` : '비어 있는 하루예요'}
            </Text>
          </View>
          <Pressable style={styles.inlineAdd} onPress={openNewSchedule}>
            <Text style={styles.inlineAddText}>＋ 추가</Text>
          </Pressable>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={styles.loading} />
        ) : selectedSchedules.length ? (
          <View style={styles.scheduleList}>
            {selectedSchedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} onPress={() => openSchedule(schedule)} />
            ))}
          </View>
        ) : (
          <Pressable style={styles.emptyState} onPress={openNewSchedule}>
            <View style={styles.emptyIcon}><Text style={styles.emptyIconText}>✓</Text></View>
            <Text style={styles.emptyTitle}>여유로운 하루네요</Text>
            <Text style={styles.emptyDescription}>새로운 일정을 더해보세요.</Text>
          </Pressable>
        )}
      </ScrollView>

      <Pressable
        accessibilityLabel="새 일정 추가"
        style={({ pressed }) => [styles.fab, pressed && styles.fabPressed]}
        onPress={openNewSchedule}
      >
        <Text style={styles.fabText}>＋</Text>
      </Pressable>

      <ScheduleModal
        visible={modalVisible}
        date={selectedDate}
        schedule={editingSchedule}
        onClose={() => setModalVisible(false)}
        onSubmit={upsertSchedule}
        onDelete={deleteSchedule}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? (NativeStatusBar.currentHeight ?? 0) + 16 : 60,
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  appHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, paddingHorizontal: 3 },
  brand: { color: colors.ink, fontSize: 31, fontWeight: '900', letterSpacing: -1.5 },
  tagline: { color: colors.inkMuted, fontSize: 12, marginTop: 4 },
  counter: { alignItems: 'flex-end' },
  counterNumber: { color: colors.primary, fontSize: 21, fontWeight: '900' },
  counterLabel: { color: colors.inkMuted, fontSize: 10, marginTop: 1 },
  listHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 27, marginBottom: 13, paddingHorizontal: 3 },
  dateTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dateTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  relativeBadge: { color: colors.primary, backgroundColor: colors.primarySoft, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 9, fontSize: 10, fontWeight: '800', overflow: 'hidden' },
  listSummary: { color: colors.inkMuted, fontSize: 11, marginTop: 5 },
  inlineAdd: { paddingHorizontal: 12, paddingVertical: 9, borderRadius: 14, backgroundColor: colors.primarySoft },
  inlineAddText: { color: colors.primary, fontSize: 12, fontWeight: '800' },
  scheduleList: { gap: 9 },
  loading: { marginTop: 40 },
  emptyState: { height: 156, borderRadius: 24, borderWidth: 1, borderStyle: 'dashed', borderColor: '#CBD3CD', alignItems: 'center', justifyContent: 'center' },
  emptyIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyIconText: { color: colors.primary, fontSize: 18, fontWeight: '900' },
  emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  emptyDescription: { color: colors.inkMuted, fontSize: 11, marginTop: 4 },
  fab: { position: 'absolute', right: 22, bottom: 28, width: 60, height: 60, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 14, elevation: 8 },
  fabPressed: { transform: [{ scale: 0.94 }] },
  fabText: { color: colors.white, fontSize: 31, fontWeight: '300', marginTop: -2 },
});
