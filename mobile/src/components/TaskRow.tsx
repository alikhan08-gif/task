import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { CheckIcon } from './icons';
import { formatTime } from '../utils/date';
import type { Task } from '../api/client';

type Props = {
  task: Task;
  variant?: 'inline' | 'timeline';
  onToggle?: (id: string) => void;
  onEdit?: (task: Task) => void;
  onDelete?: (task: Task) => void;
};

export function TaskRow({ task, variant = 'inline', onToggle, onEdit, onDelete }: Props) {
  const done = task.status === 'COMPLETED';
  const time = formatTime(task.dueAt);

  const card = (
    <Pressable
      onPress={() => onEdit?.(task)}
      onLongPress={onDelete ? () => onDelete(task) : undefined}
      delayLongPress={450}
      style={styles.card}
    >
      <Pressable
        onPress={() => !done && onToggle?.(task.id)}
        accessibilityLabel={done ? 'Bajarilgan' : "Bajarilgan deb belgilash"}
        hitSlop={8}
        style={[
          styles.checkCircle,
          {
            backgroundColor: done ? colors.accent : colors.surface,
            borderColor: done ? colors.accent : colors.border,
          },
        ]}
      >
        <CheckIcon size={13} color={done ? '#FFFFFF' : 'transparent'} />
      </Pressable>
      <View style={styles.textBlock}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: done ? colors.textMuted : colors.text }, done && styles.strike]}
        >
          {task.title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={1}>
          {variant === 'timeline' ? (task.description || (done ? 'Bajarildi' : "Bajarilmagan")) : time}
        </Text>
      </View>
    </Pressable>
  );

  if (variant === 'timeline') {
    return (
      <View style={styles.timelineRow}>
        <Text style={styles.timeColumn}>{time === "Vaqt yo'q" ? '—' : time}</Text>
        {card}
      </View>
    );
  }

  return card;
}

const styles = StyleSheet.create({
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sm + 2,
  },
  timeColumn: {
    width: 44,
    flexShrink: 0,
    paddingTop: 15,
    fontSize: 12,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'right',
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  checkCircle: {
    width: 26,
    height: 26,
    borderRadius: radii.round,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  textBlock: {
    flexGrow: 1,
    flexShrink: 1,
    minWidth: 0,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  strike: {
    textDecorationLine: 'line-through',
  },
  subtitle: {
    fontSize: 12.5,
    color: colors.textSecondary,
    marginTop: 1,
  },
});
