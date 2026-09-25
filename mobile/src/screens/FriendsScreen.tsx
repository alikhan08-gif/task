import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  TextInput,
  RefreshControl,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { colors, radii, spacing } from '../theme/colors';
import { BackIcon, CheckIcon, FlameIcon, StarIcon, UsersIcon } from '../components/icons';
import { api, ApiError, Friend, FriendRequest } from '../api/client';
import { notify } from '../utils/notify';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'Friends'>;

export function FriendsScreen({ navigation }: Props) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [incoming, setIncoming] = useState<FriendRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [emailInput, setEmailInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [friendsList, incomingList] = await Promise.all([
        api.listFriends(),
        api.listIncomingFriendRequests(),
      ]);
      setFriends(friendsList);
      setIncoming(incomingList);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Yuklab bo'lmadi");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onSendRequest = async () => {
    const email = emailInput.trim();
    if (!email) return;
    setIsSending(true);
    try {
      await api.sendFriendRequest(email);
      setEmailInput('');
      notify('Yuborildi', "Do'stlik so'rovi yuborildi. Ular tasdiqlashini kuting.");
    } catch (err) {
      notify(
        "Yuborib bo'lmadi",
        err instanceof ApiError ? err.message : "So'rov yuborib bo'lmadi",
      );
    } finally {
      setIsSending(false);
    }
  };

  const onAccept = async (request: FriendRequest) => {
    setRespondingId(request.id);
    try {
      await api.acceptFriendRequest(request.id);
      await load();
    } catch (err) {
      notify(
        "Tasdiqlab bo'lmadi",
        err instanceof ApiError ? err.message : "So'rovni tasdiqlab bo'lmadi",
      );
    } finally {
      setRespondingId(null);
    }
  };

  const onDecline = async (request: FriendRequest) => {
    setRespondingId(request.id);
    try {
      await api.declineFriendRequest(request.id);
      setIncoming((prev) => prev.filter((r) => r.id !== request.id));
    } catch (err) {
      notify(
        "Rad etib bo'lmadi",
        err instanceof ApiError ? err.message : "So'rovni rad etib bo'lmadi",
      );
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <Pressable style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Ortga">
          <BackIcon size={18} />
        </Pressable>
        <Text style={styles.heading}>Do'stlar</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={load} />}
      >
        <View style={styles.addRow}>
          <TextInput
            style={styles.addInput}
            placeholder="Do'stingizning email manzili"
            placeholderTextColor={colors.textMuted}
            value={emailInput}
            onChangeText={setEmailInput}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            onSubmitEditing={onSendRequest}
          />
          <Pressable
            style={({ pressed }) => [styles.addButton, pressed && { opacity: 0.8 }]}
            onPress={onSendRequest}
            disabled={isSending || !emailInput.trim()}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.addButtonText}>Do'stlashish</Text>
            )}
          </Pressable>
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}

        {incoming.length > 0 ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Kiruvchi so'rovlar</Text>
            {incoming.map((request) => (
              <View key={request.id} style={styles.requestRow}>
                <Text style={styles.requestEmail} numberOfLines={1}>
                  {request.sender.email}
                </Text>
                <View style={styles.requestActions}>
                  <Pressable
                    style={[styles.iconButton, styles.acceptButton]}
                    onPress={() => onAccept(request)}
                    disabled={respondingId === request.id}
                    accessibilityLabel="Qabul qilish"
                  >
                    {respondingId === request.id ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <CheckIcon size={15} color="#FFFFFF" />
                    )}
                  </Pressable>
                  <Pressable
                    style={[styles.iconButton, styles.declineButton]}
                    onPress={() => onDecline(request)}
                    disabled={respondingId === request.id}
                    accessibilityLabel="Rad etish"
                  >
                    <Text style={styles.declineButtonText}>✕</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        ) : null}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Do'stlar reytingi</Text>
          {isLoading && friends.length === 0 ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.lg }} />
          ) : friends.length === 0 ? (
            <View style={styles.emptyState}>
              <UsersIcon size={28} color={colors.textMuted} />
              <Text style={styles.emptyText}>
                Hali do'stlaringiz yo'q. Yuqoridan email kiritib so'rov yuboring.
              </Text>
            </View>
          ) : (
            friends.map((friend, index) => (
              <View key={friend.id} style={styles.friendRow}>
                <Text style={styles.friendRank}>{index + 1}</Text>
                <Text style={styles.friendEmail} numberOfLines={1}>
                  {friend.email}
                </Text>
                <View style={styles.friendStat}>
                  <StarIcon size={13} />
                  <Text style={styles.friendStatText}>{friend.xp}</Text>
                </View>
                <View style={styles.friendStat}>
                  <FlameIcon size={13} />
                  <Text style={styles.friendStatText}>{friend.streak.current}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.md,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heading: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
  },
  content: {
    paddingHorizontal: spacing.xxl,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  addInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radii.md,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: radii.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13.5,
  },
  errorText: {
    fontSize: 13,
    color: '#B4453A',
    fontWeight: '600',
  },
  section: {
    gap: spacing.sm + 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  requestRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: spacing.sm,
  },
  requestEmail: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  requestActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  iconButton: {
    width: 32,
    height: 32,
    borderRadius: radii.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: colors.accent,
  },
  declineButton: {
    backgroundColor: colors.neutralSoft,
  },
  declineButtonText: {
    color: colors.textSecondary,
    fontWeight: '800',
    fontSize: 13,
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: spacing.md,
  },
  friendRank: {
    width: 20,
    fontSize: 13,
    fontWeight: '800',
    color: colors.textMuted,
  },
  friendEmail: {
    flex: 1,
    fontSize: 13.5,
    fontWeight: '700',
    color: colors.text,
  },
  friendStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  friendStatText: {
    fontSize: 12.5,
    fontWeight: '700',
    color: colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 260,
  },
});
