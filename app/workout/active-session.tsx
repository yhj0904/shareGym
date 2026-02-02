import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  View,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import useWorkoutStore from '@/stores/workoutStore';
import useLiveWorkoutStore from '@/stores/liveWorkoutStore';
import useAuthStore from '@/stores/authStore';
import useGroupStore from '@/stores/groupStore';
import useWorkoutAnalyticsStore from '@/stores/workoutAnalyticsStore';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, gradientColors } from '@/constants/Colors';
import { formatDuration } from '@/utils/time';
import ExerciseCard from '@/components/workout/ExerciseCard';
import RestTimer from '@/components/workout/RestTimer';
import SmartCheerNotification from '@/components/workout/SmartCheerNotification';
import { exerciseDatabase } from '@/data/exercises';

export default function ActiveSessionScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets(); // Safe Area Insets 추가
  const { user } = useAuthStore();
  const { currentGroup } = useGroupStore();
  const {
    currentSession,
    sessionTimer,
    activeExerciseIndex,
    isWorkoutStarted,
    startSession,
    endSession,
    cancelSession,
    startWorkout,
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
  const [smartCheer, setSmartCheer] = useState<any>(null);
  const { generateSmartCheer, analyzeWorkoutSession } = useWorkoutAnalyticsStore();
  const [sessionInitialized, setSessionInitialized] = useState(false);

  // currentSession이 없으면 새로운 세션 시작 (한 번만 실행)
  useEffect(() => {
    if (!currentSession && !sessionInitialized) {
      startSession();
      setSessionInitialized(true);
    }
  }, [currentSession, sessionInitialized]);

  // 세션 타이머 업데이트 - 운동이 시작되었을 때만 작동
  useEffect(() => {
    // 운동이 시작되고 운동이 최소 1개 이상 있을 때만 타이머 작동
    if (currentSession && isWorkoutStarted && currentSession.exercises.length > 0) {
      const interval = setInterval(() => {
        updateSessionTimer();
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [updateSessionTimer, currentSession?.exercises.length, isWorkoutStarted]);

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
    // currentSession이 없으면 새로 생성
    if (!currentSession) {
      startSession();
      // 약간의 지연 후 exercise-select로 이동
      setTimeout(() => {
        router.replace('/workout/exercise-select'); // push 대신 replace 사용
      }, 100);
    } else {
      router.replace('/workout/exercise-select'); // push 대신 replace 사용
    }
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
              // 운동 세션 분석하여 패턴 저장
              analyzeWorkoutSession(completed);
              router.push('/workout/session-complete');
            }
          },
        },
      ]
    );
  };

  // 세트 완료 시 스마트 응원 생성
  const handleSetComplete = useCallback((exercise: any, setIndex: number, weight?: number, reps?: number) => {
    const cheer = generateSmartCheer(
      exercise,
      setIndex,
      exercise.sets.length,
      weight,
      reps
    );

    if (cheer) {
      setSmartCheer(cheer);
    }
  }, [generateSmartCheer]);

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
            // 운동 시작 화면으로 직접 이동
            router.replace('/(tabs)/workout');
          },
        },
      ]
    );
  };

  // 세션이 아직 로드되지 않았을 때 (자동으로 생성 중)
  if (!currentSession) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <ThemedView style={[styles.emptyContainer, { paddingTop: insets.top }]}>
          <ThemedText>운동 준비 중...</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  const hasExercises = currentSession.exercises.length > 0;

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 - 모달에서 최소한의 SafeArea 적용 */}
      <ThemedView style={[styles.header, {
        marginTop: Math.min(insets.top, 20),
        borderBottomColor: colorScheme === 'dark' ? '#333' : '#F2F2F4', // 다크모드 대응
      }]}>
        <Pressable onPress={handleCancelWorkout} style={styles.headerButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>

        <ThemedView style={styles.headerCenter}>
          <ThemedText type="subtitle">
            {isWorkoutStarted ? '운동 중' : '운동 준비'}
          </ThemedText>
          <ThemedText style={styles.timer}>
            {isWorkoutStarted ? formatDuration(sessionTimer) : (hasExercises ? '운동을 시작하세요' : '운동을 추가하세요')}
          </ThemedText>
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

      {/* 스마트 응원 알림 */}
      {smartCheer && (
        <SmartCheerNotification
          message={smartCheer.message}
          emoji={smartCheer.emoji}
          trigger={smartCheer.trigger}
          context={smartCheer.context}
          onDismiss={() => setSmartCheer(null)}
          position="top"
        />
      )}

      {/* 휴식 타이머 */}
      <RestTimer />

      {/* 운동 목록 */}
      <ScrollView
        ref={scrollRef}
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        {currentSession.exercises.length === 0 ? (
          <ThemedView style={styles.emptyExercises}>
            <Ionicons name="barbell-outline" size={64} color={colors.text} style={{ opacity: 0.3 }} />
            <ThemedText style={styles.emptyText}>운동을 추가하여 시작하세요</ThemedText>
            <ThemedText style={styles.emptySubtext}>
              아래 버튼을 눌러 운동을 추가하세요
            </ThemedText>
          </ThemedView>
        ) : (
          currentSession.exercises.map((exercise, index) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isActive={index === activeExerciseIndex}
              onPress={() => setActiveExercise(index)}
              onSetComplete={(setIndex, weight, reps) =>
                handleSetComplete(exercise, setIndex, weight, reps)
              }
            />
          ))
        )}

      </ScrollView>

      {/* 하단 액션 버튼 - 최소한의 SafeArea 적용 */}
      <ThemedView style={[styles.bottomActions, { bottom: Math.max(20, insets.bottom) }]}>
        {/* 운동이 추가되었고 아직 시작하지 않은 경우 운동 시작 버튼 표시 */}
        {hasExercises && !isWorkoutStarted ? (
          <View style={styles.bottomButtonContainer}>
            <Pressable
              style={[styles.startButtonWrapper, { flex: 2 }]}
              onPress={() => startWorkout()}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.startButton}
              >
                <Ionicons name="play-circle" size={24} color="white" />
                <ThemedText style={styles.startButtonText}>운동 시작</ThemedText>
              </LinearGradient>
            </Pressable>
            <Pressable
              style={[styles.addButton, {
                backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4', // 다크모드 대응
                flex: 1
              }]}
              onPress={handleAddExercise}
            >
              <Ionicons name="add" size={24} color={colors.tint} />
              <ThemedText style={[styles.addButtonText, { color: colors.tint }]}>추가</ThemedText>
            </Pressable>
          </View>
        ) : (
          <Pressable
            style={styles.addButtonWrapper}
            onPress={handleAddExercise}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.addButton}
            >
              <Ionicons name="add-circle-outline" size={24} color="white" />
              <ThemedText style={styles.addButtonText}>운동 추가</ThemedText>
            </LinearGradient>
          </Pressable>
        )}
      </ThemedView>
    </ThemedView>
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
    paddingHorizontal: '4%', // 반응형
    paddingVertical: 15,
    borderBottomWidth: 1,
    // borderBottomColor는 인라인으로 동적 적용 (다크모드 대응)
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
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.4,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  addButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  startButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomButtonContainer: {
    flexDirection: 'row',
    gap: 10,
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