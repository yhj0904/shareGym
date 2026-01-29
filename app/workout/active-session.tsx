import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  View,
  FlatList,
  SafeAreaView,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import useWorkoutStore from '@/stores/workoutStore';
import useLiveWorkoutStore from '@/stores/liveWorkoutStore';
import useAuthStore from '@/stores/authStore';
import useGroupStore from '@/stores/groupStore';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { formatDuration } from '@/utils/time';
import ExerciseCard from '@/components/workout/ExerciseCard';
import RestTimer from '@/components/workout/RestTimer';
import { exerciseDatabase } from '@/data/exercises';

export default function ActiveSessionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const { currentGroup } = useGroupStore();
  const {
    currentSession,
    sessionTimer,
    activeExerciseIndex,
    endSession,
    cancelSession,
    updateSessionTimer,
    setActiveExercise,
    getCompletedSets,
  } = useWorkoutStore();

  const {
    startLiveWorkout,
    updateLiveWorkout,
    endLiveWorkout,
    receivedCheers,
    unreadCheersCount,
    markCheersAsRead,
  } = useLiveWorkoutStore();

  const scrollRef = useRef<ScrollView>(null);
  const [showCheers, setShowCheers] = useState(false);

  // 세션 타이머 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      updateSessionTimer();
    }, 1000);

    return () => clearInterval(interval);
  }, [updateSessionTimer]);

  // 실시간 운동 상태 시작
  useEffect(() => {
    if (user && currentSession) {
      // 현재 운동 중인 종목 찾기
      const currentExercise = currentSession.exercises[activeExerciseIndex];
      let exerciseName = '운동 중';

      if (currentExercise) {
        const exerciseType = exerciseDatabase.find(
          e => e.id === currentExercise.exerciseTypeId
        );
        exerciseName = exerciseType?.nameKo || '운동 중';
      }

      // 실시간 운동 상태 시작
      startLiveWorkout(
        user.id,
        user.username,
        exerciseName,
        currentGroup?.id
      );
    }

    return () => {
      // 컴포넌트 unmount 시 실시간 상태 종료
      if (user) {
        endLiveWorkout(user.id);
      }
    };
  }, [user, currentSession]);

  // 운동 진행 상황 업데이트
  useEffect(() => {
    if (user && currentSession) {
      const currentExercise = currentSession.exercises[activeExerciseIndex];
      let exerciseName = '운동 중';

      if (currentExercise) {
        const exerciseType = exerciseDatabase.find(
          e => e.id === currentExercise.exerciseTypeId
        );
        exerciseName = exerciseType?.nameKo || '운동 중';
      }

      // 실시간 상태 업데이트
      updateLiveWorkout({
        currentExercise: exerciseName,
        workoutDuration: Math.floor(sessionTimer / 60),
        completedSets: getCompletedSets(),
      });
    }
  }, [activeExerciseIndex, sessionTimer, currentSession]);

  // 받은 응원 확인
  useEffect(() => {
    if (unreadCheersCount > 0) {
      setShowCheers(true);
      setTimeout(() => {
        setShowCheers(false);
        markCheersAsRead();
      }, 3000);
    }
  }, [unreadCheersCount]);

  const handleAddExercise = () => {
    router.push('/workout/exercise-select');
  };

  const handleEndWorkout = () => {
    Alert.alert(
      '운동 종료',
      '운동을 종료하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '종료',
          onPress: async () => {
            const completed = await endSession();
            if (completed) {
              router.replace('/workout/session-complete');
            }
          },
        },
      ]
    );
  };

  const handleCancelWorkout = () => {
    Alert.alert(
      '운동 취소',
      '진행 중인 운동을 취소하시겠습니까? 모든 기록이 삭제됩니다.',
      [
        { text: '계속 운동', style: 'cancel' },
        {
          text: '취소',
          style: 'destructive',
          onPress: () => {
            cancelSession();
            router.back();
          },
        },
      ]
    );
  };

  if (!currentSession) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.emptyContainer}>
          <ThemedText>세션이 없습니다</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <ThemedView style={styles.header}>
        <Pressable onPress={handleCancelWorkout} style={styles.headerButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>

        <ThemedView style={styles.headerCenter}>
          <ThemedText type="subtitle">운동 중</ThemedText>
          <ThemedText style={styles.timer}>{formatDuration(sessionTimer)}</ThemedText>
        </ThemedView>

        <Pressable onPress={handleEndWorkout} style={styles.headerButton}>
          <ThemedText style={[styles.endButton, { color: colors.tint }]}>완료</ThemedText>
        </Pressable>
      </ThemedView>

      {/* 응원 알림 */}
      {showCheers && receivedCheers.length > 0 && (
        <View style={[styles.cheerNotification, { backgroundColor: colors.tint }]}>
          <Ionicons name="heart" size={20} color="white" />
          <ThemedText style={styles.cheerText}>
            {receivedCheers[0].fromUsername}님이 응원을 보냈어요! {receivedCheers[0].content}
          </ThemedText>
        </View>
      )}

      {/* 휴식 타이머 */}
      <RestTimer />

      {/* 운동 목록 */}
      <ScrollView
        ref={scrollRef}
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {currentSession.exercises.length === 0 ? (
          <ThemedView style={styles.emptyExercises}>
            <Ionicons name="barbell-outline" size={48} color={colors.text} style={{ opacity: 0.3 }} />
            <ThemedText style={styles.emptyText}>운동을 추가해주세요</ThemedText>
          </ThemedView>
        ) : (
          currentSession.exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isActive={index === activeExerciseIndex}
              onPress={() => setActiveExercise(index)}
            />
          ))
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* 하단 액션 버튼 */}
      <ThemedView style={styles.bottomActions}>
        <Pressable
          style={[styles.addButton, { backgroundColor: colors.tint }]}
          onPress={handleAddExercise}
        >
          <Ionicons name="add-circle-outline" size={24} color="white" />
          <ThemedText style={styles.addButtonText}>운동 추가</ThemedText>
        </Pressable>
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerButton: {
    padding: 5,
  },
  headerCenter: {
    alignItems: 'center',
  },
  timer: {
    fontSize: 24,
    fontWeight: '600',
    marginTop: 5,
  },
  endButton: {
    fontSize: 17,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyExercises: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    opacity: 0.6,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  cheerNotification: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    margin: 10,
    borderRadius: 8,
    gap: 8,
  },
  cheerText: {
    flex: 1,
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});