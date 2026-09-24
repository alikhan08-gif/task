import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radii, spacing } from '../theme/colors';
import { CheckIcon } from './icons';
import type { MockTask } from '../data/mock';

type Props = {
  task: MockTask;
  variant?: 'inline' | 'timeline';
};

export function TaskRow({ task, variant = 'inline' }: Props) {
  const card = (
    <View style={styles.card}>
      <View
        style={[
          styles.checkCircle,
          {
            backgroundColor: task.done ? colors.accent : colors.surface,
            borderColor: task.done ? colors.accent : colors.border,
          },
        ]}
      >
        <CheckIcon size={13} color={task.done ? '#FFFFFF' : 'transparent'} />
      </View>
      <View style={styles.textBlock}>
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            { color: task.done ? colors.textMuted : colors.text },
            task.done && styles.strike,
          ]}
        >
          {task.title}
        </Text>
        <Text style={styles.subtitle}>{variant === 'timeline' ? task.duration : task.time}</Text>
      </View>
    </View>
  );

  if (variant === 'timeline') {
    return (
      <View style={styles.timelineRow}>
        <Text style={styles.timeColumn}>{task.time}</Text>
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
