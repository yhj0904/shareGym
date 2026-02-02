import React, { useMemo } from 'react';
import {
  StyleSheet,
  View,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import useGroupStore from '@/stores/groupStore';
import useAuthStore from '@/stores/authStore';
import WorkoutCardTemplate from '@/components/card/WorkoutCardTemplate';
import type { WorkoutSession } from '@/types';

const CARD_ASPECT = 0.65;

/** JSON에서 복원된 workout의 date 필드를 Date 객체로 복구 */
function reviveWorkoutSession(raw: any): WorkoutSession | null {
  if (!raw || !raw.id || !Array.isArray(raw.exercises)) return null;
  return {
    ...raw,
    date: raw.date ? new Date(raw.date) : new Date(),
    startTime: raw.startTime ? new Date(raw.startTime) : new Date(raw.date || Date.now()),
    endTime: raw.endTime ? new Date(raw.endTime) : undefined,
    exercises: raw.exercises,
    totalDuration: typeof raw.totalDuration === 'number' ? raw.totalDuration : 0,
    isPublic: raw.isPublic !== false,
  };
}

export default function CardViewScreen() {
  const { type, postId, sessionId } = useLocalSearchParams<{ type: string; postId?: string; sessionId?: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const { user } = useAuthStore();
  const { workoutHistory } = useWorkoutStore();
  const { getPostById, groups } = useGroupStore();

  const workout = useMemo(() => {
    if (type === 'mine' && sessionId) {
      const session = workoutHistory?.find(s => s.id === sessionId) ?? null;
      return session ? reviveWorkoutSession(session) : null;
    }
    if (type === 'group' && postId) {
      const post = getPostById(postId);
      const snapshot = post?.workoutSnapshot;
      if (snapshot) return reviveWorkoutSession(snapshot);
      return null;
    }
    return null;
  }, [type, postId, sessionId, workoutHistory, getPostById]);

  const post = type === 'group' && postId ? getPostById(postId) : null;
  const groupName = post && groups.length ? (groups.find(g => g.id === post.groupId)?.name ?? '그룹') : '';

  const cardWidth = Math.min(windowWidth - 32, 400);
  const cardHeight = cardWidth / CARD_ASPECT;

  if (!workout) {
    return (
      <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.closeBtn}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <ThemedText type="subtitle">운동 카드</ThemedText>
          <View style={styles.closeBtn} />
        </View>
        <View style={styles.empty}>
          {type === 'group' && post ? (
            <>
              <ThemedText style={styles.emptyTitle}>공유된 운동 내용</ThemedText>
              <ThemedText style={styles.emptyContent}>{post.content || '운동 공유'}</ThemedText>
              <ThemedText style={styles.emptyMeta}>{groupName} · {new Date(post.createdAt).toLocaleDateString('ko-KR')}</ThemedText>
            </>
          ) : (
            <>
              <Ionicons name="document-text-outline" size={48} color="#999" />
              <ThemedText style={styles.emptyText}>운동 정보를 불러올 수 없습니다</ThemedText>
            </>
          )}
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <View style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle">
          {type === 'group' ? `${groupName} 공유 카드` : '내 운동 카드'}
        </ThemedText>
        <View style={styles.closeBtn} />
      </View>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cardWrapper, { width: cardWidth, height: cardHeight }]}>
          <WorkoutCardTemplate
            workout={workout}
            style="gradient"
            width={cardWidth}
            height={cardHeight}
          />
        </View>
        <ThemedText style={styles.dateText}>
          {new Date(workout.date).toLocaleDateString('ko-KR')} · {workout.exercises.length}개 운동
        </ThemedText>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  closeBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    alignItems: 'center',
    paddingBottom: 40,
  },
  cardWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  dateText: {
    marginTop: 16,
    fontSize: 14,
    opacity: 0.7,
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyContent: {
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.9,
  },
  emptyMeta: {
    marginTop: 16,
    fontSize: 14,
    opacity: 0.6,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    opacity: 0.6,
  },
});
