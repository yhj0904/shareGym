/**
 * 전체 운동 내역 화면
 * - workoutHistory 전체 목록 표시
 */

import React from 'react';
import { StyleSheet, Pressable, View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import useWorkoutStore from '@/stores/workoutStore';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { exerciseDatabase } from '@/data/exercises';
import { formatDuration } from '@/utils/time';

export default function WorkoutHistoryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { workoutHistory } = useWorkoutStore();

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            paddingBottom: 15,
            borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee',
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle">전체 운동 내역</ThemedText>
        <View style={styles.backButton} />
      </ThemedView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {!workoutHistory || workoutHistory.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' },
            ]}
          >
            <Ionicons name="fitness-outline" size={48} color="#999" />
            <ThemedText style={styles.emptyText}>아직 운동 기록이 없습니다</ThemedText>
            <ThemedText style={styles.emptySubtext}>운동을 시작하고 기록을 쌓아보세요</ThemedText>
          </View>
        ) : (
          workoutHistory.map((session) => {
            const totalSets = session.exercises.reduce(
              (acc, ex) => acc + ex.sets.filter((s) => s.completed).length,
              0
            );
            const exerciseNames = session.exercises
              .map(
                (ex) =>
                  exerciseDatabase.find((e) => e.id === ex.exerciseTypeId)?.nameKo ??
                  ex.exerciseTypeId
              )
              .slice(0, 3)
              .join(', ');

            return (
              <Pressable
                key={session.id}
                style={[
                  styles.historyCard,
                  { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : 'white' },
                ]}
                onPress={() =>
                  router.push(`/card/view?type=mine&sessionId=${session.id}`)
                }
              >
                <View style={styles.historyCardRow}>
                  <Ionicons name="fitness" size={22} color={colors.tint} />
                  <View style={styles.historyCardContent}>
                    <ThemedText style={styles.historyCardTitle} numberOfLines={1}>
                      {exerciseNames || '운동'}
                    </ThemedText>
                    <ThemedText style={styles.historyCardMeta}>
                      {new Date(session.date).toLocaleDateString('ko-KR')} ·{' '}
                      {session.exercises.length}개 운동 · {totalSets}세트
                      {session.totalDuration > 0 &&
                        ` · ${formatDuration(session.totalDuration)}`}
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              </Pressable>
            );
          })
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: { padding: 5, width: 38 },
  content: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  emptyCard: {
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: { fontSize: 15, opacity: 0.8 },
  emptySubtext: { fontSize: 13, opacity: 0.5 },
  historyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  historyCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  historyCardContent: { flex: 1 },
  historyCardTitle: { fontSize: 15, fontWeight: '600' },
  historyCardMeta: { fontSize: 13, opacity: 0.7, marginTop: 4 },
});
