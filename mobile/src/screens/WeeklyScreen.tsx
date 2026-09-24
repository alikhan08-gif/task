import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, spacing } from '../theme/colors';
import { PlusIcon } from '../components/icons';
import { TaskRow } from '../components/TaskRow';
import { useTasks } from '../api/TasksContext';
import { addDays, formatWeekdayLong, formatDayShort, isSameCalendarDay, startOfWeek } from '../utils/date';
import { confirmDestructive } from '../utils/confirm';
import type { AppNavigationProp } from '../navigation/types';
import type { Task } from '../api/client';

export function WeeklyScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { tasks, isLoading, error, completeTask, deleteTask } = useTasks();
  const today = useMemo(() => new Date(), []);
  const [selectedDate, setSelectedDate] = useState(today);

  const weekStart = useMemo(() => startOfWeek(today), [today]);
  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = weekDates[6];

  const dayTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          (t.dueAt && isSameCalendarDay(new Date(t.dueAt), selectedDate)) ||
          (!t.dueAt && isSameCalendarDay(today, selectedDate)),
      ),
    [tasks, selectedDate, today],
  );

  const hasTasksOn = (date: Date) => tasks.some((t) => t.dueAt && isSameCalendarDay(new Date(t.dueAt), date));

  const onLongPressTask = (task: Task) => {
    confirmDestructive("Vazifani o'chirish", `"${task.title}" o'chirilsinmi?`, "O'chirish", () =>
      deleteTask(task.id),
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerBlock}>
        <Text style={styles.heading}>Haftalik reja</Text>
        <Text style={styles.subheading}>
          {weekStart.getDate()}–{weekEnd.getDate()}{' '}
          {['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr'][weekEnd.getMonth()]}
          , {weekEnd.getFullYear()}
        </Text>
      </View>

      <View style={styles.dayStrip}>
        {weekDates.map((date) => {
          const { label, num } = formatDayShort(date);
          const isToday = isSameCalendarDay(date, today);
          const isSelected = isSameCalendarDay(date, selectedDate);
          return (
            <Pressable
              key={date.toISOString()}
              onPress={() => setSelectedDate(date)}
              style={[styles.dayCell, isSelected && { backgroundColor: colors.accent }]}
            >
              <Text style={[styles.dayLabel, isSelected && { color: 'rgba(255,255,255,0.75)' }]}>{label}</Text>
              <Text
                style={[
                  styles.dayNum,
                  isSelected && { color: '#FFFFFF' },
                  isToday && !isSelected && { color: colors.accent },
                ]}
              >
                {num}
              </Text>
              <View
                style={[
                  styles.dayDot,
                  {
                    backgroundColor: isSelected
                      ? '#FFFFFF'
                      : hasTasksOn(date)
                        ? colors.accent
                        : colors.border,
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </View>

      <View style={styles.selectedDayRow}>
        <View style={styles.dot} />
        <Text style={styles.selectedDayText}>{formatWeekdayLong(selectedDate, selectedDate.getDate())}</Text>
      </View>

      {isLoading && tasks.length === 0 ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.xl }} />
      ) : error ? (
        <Text style={styles.errorText}>{error}</Text>
      ) : (
        <FlatList
          data={dayTasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TaskRow task={item} variant="inline" onToggle={completeTask} onPress={onLongPressTask} />
          )}
          ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
          ListEmptyComponent={<Text style={styles.emptyText}>Bu kun uchun vazifa yo'q</Text>}
        />
      )}

      <Pressable
        style={({ pressed }) => [styles.fab, pressed && { opacity: 0.9 }]}
        onPress={() => navigation.navigate('CreateTask')}
        accessibilityLabel="Yangi vazifa qo'shish"
      >
        <PlusIcon size={24} />
      </Pressable>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerBlock: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
  },
  heading: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  subheading: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  dayStrip: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radii.md,
    paddingVertical: 8,
    gap: 6,
  },
  dayLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  dayNum: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  dayDot: {
    width: 5,
    height: 5,
    borderRadius: radii.round,
  },
  selectedDayRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.xxl,
    marginTop: spacing.xl,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: radii.round,
    backgroundColor: colors.accent,
  },
  selectedDayText: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
  },
  listContent: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
    paddingBottom: 100,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  errorText: {
    fontSize: 13,
    color: '#B4453A',
    fontWeight: '600',
    marginTop: spacing.xl,
    marginHorizontal: spacing.xxl,
  },
  fab: {
    position: 'absolute',
    right: spacing.xxl,
    bottom: spacing.xxl + 4,
    width: 54,
    height: 54,
    borderRadius: radii.round,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.accent,
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
});
