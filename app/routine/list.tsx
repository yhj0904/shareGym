import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useRoutineStore from '@/stores/routineStore';
import useWorkoutStore from '@/stores/workoutStore';
import { exerciseDatabase } from '@/data/exercises';

export default function RoutineListScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { routines, toggleFavorite, deleteRoutine, duplicateRoutine } = useRoutineStore();
  const { loadFromRoutine } = useWorkoutStore();
  const [showOnlyFavorites, setShowOnlyFavorites] = useState(false);

  const displayRoutines = showOnlyFavorites
    ? routines.filter(r => r.isFavorite)
    : routines;

  const handleStartRoutine = (routineId: string) => {
    const routine = routines.find(r => r.id === routineId);
    if (routine) {
      loadFromRoutine(routine);
      router.replace('/workout/active-session');
    }
  };

  const handleEditRoutine = (routineId: string) => {
    router.push(`/routine/edit/${routineId}`);
  };

  const handleDeleteRoutine = (routineId: string) => {
    Alert.alert(
      '루틴 삭제',
      '이 루틴을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => deleteRoutine(routineId),
        },
      ]
    );
  };

  const handleDuplicateRoutine = (routineId: string) => {
    duplicateRoutine(routineId);
    Alert.alert('알림', '루틴이 복사되었습니다.');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <ThemedView style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle">루틴</ThemedText>
        <Pressable onPress={() => router.push('/routine/create')} style={styles.addButton}>
          <Ionicons name="add" size={28} color={colors.text} />
        </Pressable>
      </ThemedView>

      {/* 필터 토글 */}
      <View style={styles.filterContainer}>
        <Pressable
          style={[
            styles.filterChip,
            !showOnlyFavorites && { backgroundColor: colors.tint },
          ]}
          onPress={() => setShowOnlyFavorites(false)}
        >
          <ThemedText
            style={[styles.filterText, !showOnlyFavorites && { color: 'white' }]}
          >
            전체
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.filterChip,
            showOnlyFavorites && { backgroundColor: colors.tint },
          ]}
          onPress={() => setShowOnlyFavorites(true)}
        >
          <ThemedText
            style={[styles.filterText, showOnlyFavorites && { color: 'white' }]}
          >
            즐겨찾기
          </ThemedText>
        </Pressable>
      </View>

      {/* 루틴 목록 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {displayRoutines.length === 0 ? (
          <ThemedView style={styles.emptyState}>
            <Ionicons name="list-outline" size={48} color="#ccc" />
            <ThemedText style={styles.emptyText}>
              {showOnlyFavorites ? '즐겨찾기한 루틴이 없습니다' : '저장된 루틴이 없습니다'}
            </ThemedText>
            <Pressable
              style={[styles.createButton, { backgroundColor: colors.tint }]}
              onPress={() => router.push('/routine/create')}
            >
              <ThemedText style={styles.createButtonText}>루틴 만들기</ThemedText>
            </Pressable>
          </ThemedView>
        ) : (
          displayRoutines.map((routine) => (
            <ThemedView key={routine.id} style={styles.routineCard}>
              <View style={styles.routineHeader}>
                <View style={styles.routineInfo}>
                  <ThemedText style={styles.routineName}>{routine.name}</ThemedText>
                  <ThemedText style={styles.exerciseCount}>
                    {routine.exercises.length}개 운동
                  </ThemedText>
                </View>
                <Pressable onPress={() => toggleFavorite(routine.id)}>
                  <Ionicons
                    name={routine.isFavorite ? 'star' : 'star-outline'}
                    size={24}
                    color={routine.isFavorite ? '#FFD700' : '#ccc'}
                  />
                </Pressable>
              </View>

              {/* 운동 목록 미리보기 */}
              <View style={styles.exercisePreview}>
                {routine.exercises.slice(0, 3).map((exercise, index) => {
                  const exerciseType = exerciseDatabase.find(
                    e => e.id === exercise.exerciseTypeId
                  );
                  return (
                    <ThemedText key={index} style={styles.exercisePreviewItem}>
                      • {exerciseType?.nameKo || exercise.exerciseTypeId} ({exercise.sets}세트)
                    </ThemedText>
                  );
                })}
                {routine.exercises.length > 3 && (
                  <ThemedText style={styles.moreExercises}>
                    +{routine.exercises.length - 3}개 더...
                  </ThemedText>
                )}
              </View>

              {/* 액션 버튼 */}
              <View style={styles.routineActions}>
                <Pressable
                  style={[styles.actionButton, { backgroundColor: colors.tint }]}
                  onPress={() => handleStartRoutine(routine.id)}
                >
                  <Ionicons name="play" size={16} color="white" />
                  <ThemedText style={styles.startButtonText}>시작</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => handleEditRoutine(routine.id)}
                >
                  <Ionicons name="pencil" size={16} color={colors.text} />
                  <ThemedText>편집</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.secondaryButton]}
                  onPress={() => handleDuplicateRoutine(routine.id)}
                >
                  <Ionicons name="copy-outline" size={16} color={colors.text} />
                  <ThemedText>복사</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.actionButton, styles.dangerButton]}
                  onPress={() => handleDeleteRoutine(routine.id)}
                >
                  <Ionicons name="trash-outline" size={16} color="#ff4444" />
                </Pressable>
              </View>

              {routine.lastUsed && (
                <ThemedText style={styles.lastUsed}>
                  마지막 사용: {new Date(routine.lastUsed).toLocaleDateString('ko-KR')}
                </ThemedText>
              )}
            </ThemedView>
          ))
        )}
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  addButton: {
    padding: 5,
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    gap: 10,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    opacity: 0.6,
    marginBottom: 20,
  },
  createButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  routineCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  routineHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  routineInfo: {
    flex: 1,
  },
  routineName: {
    fontSize: 18,
    fontWeight: '600',
  },
  exerciseCount: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  exercisePreview: {
    marginVertical: 10,
  },
  exercisePreviewItem: {
    fontSize: 14,
    opacity: 0.7,
    marginVertical: 2,
  },
  moreExercises: {
    fontSize: 14,
    opacity: 0.5,
    fontStyle: 'italic',
    marginTop: 4,
  },
  routineActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    gap: 4,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  dangerButton: {
    backgroundColor: '#fff5f5',
  },
  startButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  lastUsed: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 8,
  },
});