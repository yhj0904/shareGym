/**
 * 알림 화면
 * - SSE로 실시간 알림 수신 (좋아요, 댓글, 팔로우 등)
 */

import React from 'react';
import { StyleSheet, View, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import useNotificationStore, {
  type NotificationItem,
  type NotificationType,
} from '@/stores/notificationStore';
import { formatDistanceToNow } from '@/utils/time';

/** 알림 타입별 아이콘 */
function getNotificationIcon(type: NotificationType): keyof typeof Ionicons.glyphMap {
  switch (type) {
    case 'like':
      return 'heart';
    case 'comment':
      return 'chatbubble';
    case 'follow':
      return 'person-add';
    case 'group_invite':
      return 'people';
    case 'cheer':
      return 'flash';
    case 'workout_shared':
      return 'barbell';
    default:
      return 'notifications';
  }
}

function NotificationRow({
  item,
  colors,
  isDark,
  onPress,
}: {
  item: NotificationItem;
  colors: Record<string, string>;
  isDark: boolean;
  onPress: () => void;
}) {
  const icon = getNotificationIcon(item.type);
  return (
    <Pressable
      style={[
        styles.notificationRow,
        { borderBottomColor: isDark ? '#333' : 'rgba(0,0,0,0.06)' },
        !item.read && { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' },
      ]}
      onPress={onPress}
    >
      <View style={[styles.iconCircle, { backgroundColor: colors.tint + '20' }]}>
        <Ionicons name={icon} size={22} color={colors.tint} />
      </View>
      <View style={styles.notificationContent}>
        <ThemedText style={styles.notificationTitle}>{item.title}</ThemedText>
        {item.body && (
          <ThemedText style={styles.notificationBody} numberOfLines={2}>
            {item.body}
          </ThemedText>
        )}
        <ThemedText style={styles.notificationTime}>
          {formatDistanceToNow(item.createdAt)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    notifications,
    markAsRead,
    markAllAsRead,
  } = useNotificationStore();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ThemedView style={styles.container}>
        <View
          style={[
            styles.header,
            {
              backgroundColor: colors.background,
              borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee',
            },
          ]}
        >
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>알림</ThemedText>
          {notifications.length > 0 ? (
            <Pressable
              onPress={markAllAsRead}
              style={styles.markAllButton}
            >
              <ThemedText style={[styles.markAllText, { color: colors.tint }]}>
                전체 읽음
              </ThemedText>
            </Pressable>
          ) : (
            <View style={styles.backButton} />
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' },
              ]}
            >
              <Ionicons name="notifications-outline" size={48} color="#999" />
            </View>
            <ThemedText style={styles.emptyTitle}>알림이 없습니다</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              팔로우, 좋아요, 댓글 등의 알림이 여기에 표시됩니다.
            </ThemedText>
          </View>
        ) : (
          <FlatList
            data={notifications}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <NotificationRow
                item={item}
                colors={colors}
                isDark={colorScheme === 'dark'}
                onPress={() => markAsRead(item.id)}
              />
            )}
            contentContainerStyle={styles.listContent}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 24,
  },
  notificationRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  notificationBody: {
    fontSize: 13,
    opacity: 0.8,
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    opacity: 0.5,
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
