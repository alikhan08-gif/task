import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, radii, spacing } from '../theme/colors';
import { PlusIcon } from '../components/icons';
import { TaskRow } from '../components/TaskRow';
import { todayTasks, weekDays } from '../data/mock';
import type { AppNavigationProp } from '../navigation/types';

export function WeeklyScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerBlock}>
        <Text style={styles.heading}>Haftalik reja</Text>
        <Text style={styles.subheading}>22–28 sentyabr, 2026</Text>
      </View>

      <View style={styles.dayStrip}>
        {weekDays.map((day) => (
          <View
            key={`${day.label}-${day.num}`}
            style={[styles.dayCell, day.today && { backgroundColor: colors.accent }]}
          >
            <Text style={[styles.dayLabel, day.today && { color: 'rgba(255,255,255,0.75)' }]}>
              {day.label}
            </Text>
            <Text style={[styles.dayNum, day.today && { color: '#FFFFFF' }]}>{day.num}</Text>
            <View
              style={[
                styles.dayDot,
                {
                  backgroundColor: day.today ? '#FFFFFF' : day.hasTasks ? colors.accent : colors.border,
                },
              ]}
            />
          </View>
        ))}
      </View>

      <View style={styles.selectedDayRow}>
        <View style={styles.dot} />
        <Text style={styles.selectedDayText}>Payshanba, 24-sentyabr</Text>
      </View>

      <FlatList
        data={todayTasks}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <TaskRow task={item} variant="inline" />}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        ListEmptyComponent={<Text style={styles.emptyText}>Bu kun uchun vazifa yo'q</Text>}
      />

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
