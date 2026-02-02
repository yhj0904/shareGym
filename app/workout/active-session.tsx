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
  const [smartCheerQueue, setSmartCheerQueue] = useState<any[]>([]); // 응원 큐로 변경
  const [currentSmartCheer, setCurrentSmartCheer] = useState<any>(null); // 현재 표시 중인 응원
  const { generateSmartCheer, analyzeWorkoutSession } = useWorkoutAnalyticsStore();

  // currentSession이 없으면 운동 탭으로 돌아가기 - 세션 시작은 운동 탭에서만
  useEffect(() => {
    if (!currentSession) {
      router.replace('/(tabs)/workout');
    }
  }, [currentSession]);

  // 스마트 응원 큐 관리
  useEffect(() => {
    // 현재 표시 중인 응원이 없고 큐에 응원이 있으면 첫 번째 응원을 표시
    if (!currentSmartCheer && smartCheerQueue.length > 0) {
      // 약간의 지연을 두고 다음 응원 표시 (이전 응원이 완전히 사라진 후)
      const timer = setTimeout(() => {
        const nextCheer = smartCheerQueue[0];
        setCurrentSmartCheer(nextCheer);
        setSmartCheerQueue(prev => prev.slice(1)); // 큐에서 제거
      }, 300); // 300ms 지연

      return () => clearTimeout(timer);
    }
  }, [currentSmartCheer, smartCheerQueue]);

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

  // 실시간 운동 상태 - 운동 시작 후에만 브로드캐스트 (운동 준비 시에는 카운트/전송 없음)
  useEffect(() => {
    if (!isWorkoutStarted || !user || !currentSession) {
      if (user) endLiveWorkout(user.id);
      return;
    }
    const currentExercise = currentSession.exercises[activeExerciseIndex];
    let exerciseName = '운동 중';
    if (currentExercise) {
      const exerciseType = exerciseDatabase.find(e => e.id === currentExercise.exerciseTypeId);
      exerciseName = exerciseType?.nameKo || '운동 중';
    }
    startLiveWorkout(user.id, user.username, exerciseName, currentGroup?.id);
    return () => {
      if (user) endLiveWorkout(user.id);
    };
  }, [isWorkoutStarted, user, currentSession, activeExerciseIndex, currentGroup?.id]);

  // 운동 진행 상황 업데이트 - 운동 시작 후에만 (운동 준비 시 카운트 없음)
  useEffect(() => {
    if (!isWorkoutStarted || !user || !currentSession) return;
    const currentExercise = currentSession.exercises[activeExerciseIndex];
    let exerciseName = '운동 중';
    if (currentExercise) {
      const exerciseType = exerciseDatabase.find(e => e.id === currentExercise.exerciseTypeId);
      exerciseName = exerciseType?.nameKo || '운동 중';
    }
    updateLiveWorkout({
      currentExercise: exerciseName,
      workoutDuration: Math.floor(sessionTimer / 60),
      completedSets: getCompletedSets(),
    });
  }, [isWorkoutStarted, activeExerciseIndex, sessionTimer, currentSession, user]);

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
    // currentSession이 있을 때만 운동 추가 가능
    if (!currentSession) {
      Alert.alert(
        '세션 없음',
        '운동 세션이 없습니다. 운동 탭에서 세션을 시작해주세요.',
        [{ text: '확인', onPress: () => router.replace('/(tabs)/workout') }]
      );
      return;
    }
    router.replace('/workout/exercise-select'); // push 대신 replace 사용
  };

  const handleEndWorkout = () => {
    // 운동을 시작한 후에만 완료 가능
    if (!isWorkoutStarted) {
      Alert.alert(
        '운동을 시작해주세요',
        '우측 하단 "운동 시작" 버튼을 눌러 운동을 시작한 후 완료할 수 있습니다.',
        [{ text: '확인' }]
      );
      return;
    }

    // 운동이 없는지 체크
    if (!currentSession || currentSession.exercises.length === 0) {
      Alert.alert(
        '운동 없음',
        '운동을 추가해주세요.',
        [{ text: '확인' }]
      );
      return;
    }

    // 완료된 세트가 있는지 체크
    const hasCompletedSets = currentSession.exercises.some(exercise =>
      exercise.sets.some(set => set.completed)
    );

    if (!hasCompletedSets) {
      Alert.alert(
        '운동 미완료',
        '최소 1개 이상의 세트를 완료해주세요.',
        [{ text: '확인' }]
      );
      return;
    }

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
    console.log(`세트 완료: ${exercise.exerciseTypeId} - 인덱스: ${setIndex}, 총 세트: ${exercise.sets.length}`); // 더 자세한 디버깅

    const cheer = generateSmartCheer(
      exercise,
      setIndex,
      exercise.sets.length,
      weight,
      reps
    );

    if (cheer) {
      console.log(`응원 생성: [${cheer.trigger}] ${cheer.message}`); // 더 자세한 디버깅
      // 응원을 큐에 추가
      setSmartCheerQueue(prev => [...prev, cheer]);
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
      {/* 스마트 응원 알림 - 모든 UI 요소 위에 표시 (최상단으로 이동) */}
      {currentSmartCheer && (
        <SmartCheerNotification
          message={currentSmartCheer.message}
          emoji={currentSmartCheer.emoji}
          trigger={currentSmartCheer.trigger}
          context={currentSmartCheer.context}
          onDismiss={() => setCurrentSmartCheer(null)} // 현재 응원 종료 시 다음 응원이 자동으로 표시됨
          position="top"
          duration={3000} // 표시 시간을 3초로 단축
        />
      )}

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

        <Pressable
          onPress={handleEndWorkout}
          style={styles.headerButton}
        >
          <ThemedText style={[
            styles.endButton,
            { color: (!hasExercises || getCompletedSets() === 0) ? '#999' : colors.tint }
          ]}>
            완료
          </ThemedText>
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
              canCompleteSet={isWorkoutStarted}
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