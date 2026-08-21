import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { ReminderMinutes, Schedule, ScheduleDraft } from '../types';
import { colors, scheduleColors } from '../theme';
import { formatSelectedDate, fromDateKey, toDateKey } from '../utils/date';
import { REMINDER_LABELS } from '../services/notifications';

type Props = {
  visible: boolean;
  date: string;
  schedule?: Schedule;
  onClose: () => void;
  onSubmit: (draft: ScheduleDraft, existing?: Schedule) => Promise<void>;
  onDelete: (schedule: Schedule) => Promise<void>;
};

const reminderOptions: ReminderMinutes[] = [null, 0, 10, 30, 60];

function getSuggestedTime() {
  const next = new Date();
  next.setMinutes(next.getMinutes() + 30);
  next.setMinutes(Math.ceil(next.getMinutes() / 30) * 30, 0, 0);
  return `${String(next.getHours()).padStart(2, '0')}:${String(next.getMinutes()).padStart(2, '0')}`;
}

function getInitialDraft(date: string, schedule?: Schedule): ScheduleDraft {
  if (schedule) {
    return {
      title: schedule.title,
      note: schedule.note,
      date: schedule.date,
      time: schedule.time,
      color: schedule.color,
      reminderMinutes: schedule.time ? schedule.reminderMinutes : null,
    };
  }

  return {
    title: '',
    note: '',
    date,
    time: getSuggestedTime(),
    color: scheduleColors[0],
    reminderMinutes: 10,
  };
}

export function ScheduleModal({ visible, date, schedule, onClose, onSubmit, onDelete }: Props) {
  const [draft, setDraft] = useState<ScheduleDraft>(() => getInitialDraft(date, schedule));
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (visible) {
      setDraft(getInitialDraft(date, schedule));
      setError('');
      setPending(false);
    }
  }, [date, schedule, visible]);

  const shiftDate = (offset: number) => {
    const nextDate = fromDateKey(draft.date);
    nextDate.setDate(nextDate.getDate() + offset);
    setDraft((current) => ({ ...current, date: toDateKey(nextDate) }));
  };

  const shiftTime = (offset: number) => {
    if (draft.time === null) return;
    const [hours, minutes] = draft.time.split(':').map(Number);
    const total = (hours * 60 + minutes + offset + 24 * 60) % (24 * 60);
    setDraft((current) => ({
      ...current,
      time: `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`,
    }));
  };

  const setHasTime = (hasTime: boolean) => {
    setDraft((current) => ({
      ...current,
      time: hasTime ? (current.time ?? getSuggestedTime()) : null,
      reminderMinutes: hasTime ? (current.reminderMinutes ?? 10) : null,
    }));
  };

  const submit = async () => {
    if (!draft.title.trim()) {
      setError('일정 제목을 입력해 주세요.');
      return;
    }
    setPending(true);
    setError('');
    try {
      await onSubmit({ ...draft, title: draft.title.trim(), note: draft.note.trim() }, schedule);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : '일정을 저장하지 못했어요.');
    } finally {
      setPending(false);
    }
  };

  const confirmDelete = () => {
    if (!schedule) return;
    Alert.alert('일정을 삭제할까요?', '예약된 알림도 함께 취소됩니다.', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          setPending(true);
          try {
            await onDelete(schedule);
            onClose();
          } catch {
            setError('일정을 삭제하지 못했어요.');
            setPending(false);
          }
        },
      },
    ]);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <Pressable hitSlop={10} onPress={onClose}><Text style={styles.cancel}>취소</Text></Pressable>
          <Text style={styles.headerTitle}>{schedule ? '일정 수정' : '새 일정'}</Text>
          <Pressable hitSlop={10} disabled={pending} onPress={submit}>
            {pending ? <ActivityIndicator size="small" color={colors.primary} /> : <Text style={styles.save}>저장</Text>}
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.label}>일정 이름</Text>
          <TextInput
            autoFocus={!schedule}
            maxLength={60}
            placeholder="무엇을 계획하고 있나요?"
            placeholderTextColor="#A3ADA7"
            style={styles.titleInput}
            value={draft.title}
            onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
          />

          <Text style={styles.label}>날짜</Text>
          <View style={styles.stepperCard}>
            <Pressable style={styles.stepButton} onPress={() => shiftDate(-1)}><Text style={styles.stepText}>−</Text></Pressable>
            <View style={styles.stepValue}>
              <Text style={styles.primaryValue}>{formatSelectedDate(draft.date)}</Text>
              <Text style={styles.secondaryValue}>{draft.date}</Text>
            </View>
            <Pressable style={styles.stepButton} onPress={() => shiftDate(1)}><Text style={styles.stepText}>＋</Text></Pressable>
          </View>

          <Text style={styles.label}>시간</Text>
          <View style={styles.timeModeRow}>
            <Pressable
              style={[styles.timeModeButton, draft.time !== null && styles.timeModeButtonSelected]}
              onPress={() => setHasTime(true)}
            >
              <Text style={[styles.timeModeText, draft.time !== null && styles.timeModeTextSelected]}>시간 지정</Text>
            </Pressable>
            <Pressable
              style={[styles.timeModeButton, draft.time === null && styles.timeModeButtonSelected]}
              onPress={() => setHasTime(false)}
            >
              <Text style={[styles.timeModeText, draft.time === null && styles.timeModeTextSelected]}>시간 없음</Text>
            </Pressable>
          </View>

          {draft.time !== null ? (
            <>
              <View style={[styles.stepperCard, styles.timeStepper]}>
                <Pressable style={styles.stepButton} onPress={() => shiftTime(-30)}><Text style={styles.stepText}>−</Text></Pressable>
                <View style={styles.stepValue}>
                  <Text style={styles.timeValue}>{draft.time}</Text>
                  <Text style={styles.secondaryValue}>30분 단위</Text>
                </View>
                <Pressable style={styles.stepButton} onPress={() => shiftTime(30)}><Text style={styles.stepText}>＋</Text></Pressable>
              </View>

              <Text style={styles.label}>알림</Text>
              <View style={styles.chipRow}>
                {reminderOptions.map((option) => {
                  const selected = option === draft.reminderMinutes;
                  return (
                    <Pressable
                      key={String(option)}
                      style={[styles.chip, selected && styles.chipSelected]}
                      onPress={() => setDraft((current) => ({ ...current, reminderMinutes: option }))}
                    >
                      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                        {option === null ? '없음' : REMINDER_LABELS[option]}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </>
          ) : (
            <View style={styles.noTimeCard}>
              <Text style={styles.noTimeText}>시간이 없는 일정은 알림 없이 저장돼요.</Text>
            </View>
          )}

          <Text style={styles.label}>색상</Text>
          <View style={styles.colorRow}>
            {scheduleColors.map((color) => (
              <Pressable
                key={color}
                accessibilityLabel="일정 색상"
                style={[styles.colorOuter, draft.color === color && { borderColor: color }]}
                onPress={() => setDraft((current) => ({ ...current, color }))}
              >
                <View style={[styles.colorDot, { backgroundColor: color }]} />
              </Pressable>
            ))}
          </View>

          <Text style={styles.label}>메모</Text>
          <TextInput
            multiline
            maxLength={300}
            placeholder="필요한 내용을 자유롭게 적어보세요."
            placeholderTextColor="#A3ADA7"
            style={styles.noteInput}
            textAlignVertical="top"
            value={draft.note}
            onChangeText={(note) => setDraft((current) => ({ ...current, note }))}
          />

          {!!error && <Text style={styles.error}>{error}</Text>}

          {schedule && (
            <Pressable disabled={pending} style={styles.deleteButton} onPress={confirmDelete}>
              <Text style={styles.deleteText}>이 일정 삭제</Text>
            </Pressable>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: {
    height: 62,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 8 : 0,
  },
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  cancel: { color: colors.inkMuted, fontSize: 15, minWidth: 42 },
  save: { color: colors.primary, fontSize: 15, fontWeight: '800', minWidth: 42, textAlign: 'right' },
  content: { padding: 22, paddingBottom: 50 },
  label: { color: colors.inkMuted, fontSize: 12, fontWeight: '800', marginTop: 20, marginBottom: 9, letterSpacing: 0.2 },
  titleInput: {
    height: 58,
    backgroundColor: colors.surface,
    borderRadius: 18,
    paddingHorizontal: 17,
    color: colors.ink,
    fontSize: 18,
    fontWeight: '700',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperCard: {
    height: 76,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
  },
  stepButton: { width: 46, height: 46, borderRadius: 15, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' },
  stepText: { color: colors.primary, fontSize: 23, fontWeight: '600' },
  stepValue: { flex: 1, alignItems: 'center' },
  primaryValue: { color: colors.ink, fontSize: 16, fontWeight: '800' },
  timeValue: { color: colors.ink, fontSize: 24, fontWeight: '800', letterSpacing: 1 },
  secondaryValue: { color: colors.inkMuted, fontSize: 10, marginTop: 4 },
  timeModeRow: { flexDirection: 'row', backgroundColor: colors.surfaceMuted, borderRadius: 16, padding: 4 },
  timeModeButton: { flex: 1, height: 39, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  timeModeButtonSelected: { backgroundColor: colors.surface },
  timeModeText: { color: colors.inkMuted, fontSize: 12, fontWeight: '700' },
  timeModeTextSelected: { color: colors.primary, fontWeight: '900' },
  timeStepper: { marginTop: 10 },
  noTimeCard: { marginTop: 10, paddingHorizontal: 15, paddingVertical: 13, borderRadius: 14, backgroundColor: colors.primarySoft },
  noTimeText: { color: colors.primary, fontSize: 12, fontWeight: '700' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { color: colors.inkMuted, fontSize: 12, fontWeight: '700' },
  chipTextSelected: { color: colors.white },
  colorRow: { flexDirection: 'row', gap: 13 },
  colorOuter: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: 'transparent', alignItems: 'center', justifyContent: 'center' },
  colorDot: { width: 26, height: 26, borderRadius: 13 },
  noteInput: { minHeight: 112, backgroundColor: colors.surface, borderRadius: 18, padding: 16, color: colors.ink, fontSize: 14, lineHeight: 21, borderWidth: 1, borderColor: colors.border },
  error: { color: colors.danger, fontSize: 12, fontWeight: '700', marginTop: 14, textAlign: 'center' },
  deleteButton: { height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 26 },
  deleteText: { color: colors.danger, fontSize: 14, fontWeight: '700' },
});
