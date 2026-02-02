import React, { useEffect } from 'react';
import { StyleSheet, Pressable, View, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import useWorkoutStore from '@/stores/workoutStore';
import useAuthStore from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, gradientColors } from '@/constants/Colors';
import { exerciseDatabase } from '@/data/exercises';
import { formatDuration } from '@/utils/time';

export default function WorkoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets(); // Safe area insets 추가
  const { user } = useAuthStore();
  const {
    currentSession,
    lastWorkout,
    workoutHistory,
    startSession,
    copyLastWorkout,
    cancelSession,
    loadWorkoutHistory
  } = useWorkoutStore();

  // 사용자 운동 기록 로드
  useEffect(() => {
    if (user) {
      loadWorkoutHistory(user.id);
    }
  }, [user, loadWorkoutHistory]);

  const handleQuickStart = () => {
    // 기존 세션이 있어도 새로운 세션 시작
    if (currentSession) {
      Alert.alert(
        '새로운 운동 시작',
        '진행 중인 운동이 있습니다. 새로운 운동을 시작하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '새로 시작',
            onPress: () => {
              startSession();
              router.push('/workout/active-session');
            },
          },
        ]
      );
    } else {
      startSession();
      router.push('/workout/active-session');
    }
  };

  const handleCopyLastWorkout = () => {
    if (!lastWorkout) {
      Alert.alert('알림', '이전 운동 기록이 없습니다.');
      return;
    }
    copyLastWorkout();
    router.push('/workout/active-session');
  };

  const handleStartFromRoutine = () => {
    router.push('/routine/list');
  };

  const handleContinueSession = () => {
    router.push('/workout/active-session');
  };

  const handleCancelSession = () => {
    Alert.alert(
      '운동 세션 취소',
      '진행 중인 운동 세션을 취소하시겠습니까?\n모든 기록이 삭제됩니다.',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예, 취소합니다',
          style: 'destructive',
          onPress: () => {
            cancelSession();
          },
        },
      ]
    );
  };

  if (currentSession) {
    // 진행중인 세션의 정보 계산
    const totalExercises = currentSession.exercises.length;
    const totalSets = currentSession.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
    const completedSets = currentSession.exercises.reduce((total, exercise) =>
      total + exercise.sets.filter(s => s.completed).length, 0);

    return (
      <ThemedView style={styles.container}>
        <ThemedView style={[styles.header, {
          paddingTop: insets.top,
          borderBottomColor: colorScheme === 'dark' ? '#333' : '#F2F2F4'
        }]}>
          <ThemedText type="title">운동 중</ThemedText>
          <ThemedText type="subtitle">진행 중인 운동이 있습니다</ThemedText>
        </ThemedView>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.continueButtonWrapper}
            onPress={handleContinueSession}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Ionicons name="play-circle" size={32} color="white" />
              <ThemedText style={styles.continueButtonText}>운동 계속하기</ThemedText>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={[styles.cancelButton, {
              backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4'
            }]}
            onPress={handleCancelSession}
          >
            <Ionicons name="close-circle-outline" size={28} color={colors.error || '#FF3B30'} />
            <ThemedText style={[styles.cancelButtonText, { color: colors.error || '#FF3B30' }]}>
              세션 취소
            </ThemedText>
          </Pressable>
        </View>

        {/* 진행중인 세션 정보 표시 */}
        <ThemedView style={[styles.sessionInfoCard, {
          backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4'
        }]}>
          <ThemedText type="subtitle" style={styles.sessionInfoTitle}>진행 중인 세션</ThemedText>
          <ThemedText style={styles.sessionInfoDate}>
            {new Date(currentSession.date).toLocaleDateString('ko-KR', {
              month: 'long',
              day: 'numeric',
              weekday: 'short'
            })}
          </ThemedText>

          {/* 세션 통계 */}
          <View style={styles.sessionStats}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{totalExercises}</ThemedText>
              <ThemedText style={styles.statLabel}>운동</ThemedText>
            </View>
            <View style={styles.statItem}>
              <ThemedText style={styles.statValue}>{completedSets}/{totalSets}</ThemedText>
              <ThemedText style={styles.statLabel}>완료 세트</ThemedText>
            </View>
          </View>

          {/* 운동 목록 */}
          {currentSession.exercises.length > 0 && (
            <View style={styles.exerciseList}>
              {currentSession.exercises.map((exercise, index) => {
                const completedCount = exercise.sets.filter(s => s.completed).length;
                const totalCount = exercise.sets.length;
                // exerciseType이 없으면 exerciseDatabase에서 찾기
                const exerciseType = exercise.exerciseType ||
                  exerciseDatabase.find(e => e.id === exercise.exerciseTypeId);
                const exerciseName = exerciseType?.nameKo || exercise.exerciseTypeId;

                return (
                  <View key={exercise.id} style={styles.exerciseRow}>
                    <ThemedText style={styles.exerciseItem}>
                      • {exerciseName}
                    </ThemedText>
                    <ThemedText style={[styles.exerciseSetCount, {
                      color: completedCount === totalCount && totalCount > 0
                        ? colors.tint
                        : colors.text
                    }]}>
                      {completedCount}/{totalCount} 세트
                    </ThemedText>
                  </View>
                );
              })}
            </View>
          )}
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, {
        paddingTop: insets.top,
        borderBottomColor: colorScheme === 'dark' ? '#333' : '#F2F2F4'
      }]}>
        <ThemedText type="title">운동 시작</ThemedText>
        <ThemedText type="subtitle">오늘의 운동을 시작해보세요</ThemedText>
      </ThemedView>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.buttonContainer}>
        <Pressable
          style={styles.startButtonWrapper}
          onPress={handleQuickStart}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButton}
          >
            <Ionicons name="flash" size={28} color="white" />
            <ThemedText style={[styles.buttonText, { color: 'white' }]}>빈 세션 시작</ThemedText>
            <ThemedText style={[styles.buttonSubtext, { color: 'rgba(255,255,255,0.9)' }]}>바로 시작하기</ThemedText>
          </LinearGradient>
        </Pressable>

        {lastWorkout && (
          <Pressable
            style={[styles.startButton, styles.secondaryButton, {
              backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4'
            }]}
            onPress={handleCopyLastWorkout}
          >
            <Ionicons name="copy-outline" size={28} color={colors.tint} />
            <ThemedText style={[styles.buttonText, { color: colors.text }]}>최근 운동 복사</ThemedText>
            <ThemedText style={[styles.buttonSubtext, { color: colors.text, opacity: 0.7 }]}>
              {lastWorkout.exercises.length}개 운동
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          style={[styles.startButton, styles.secondaryButton, {
            backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4'
          }]}
          onPress={handleStartFromRoutine}
        >
          <Ionicons name="list-outline" size={28} color={colors.tint} />
          <ThemedText style={[styles.buttonText, { color: colors.text }]}>루틴에서 선택</ThemedText>
          <ThemedText style={[styles.buttonSubtext, { color: colors.text, opacity: 0.7 }]}>저장된 루틴 사용</ThemedText>
        </Pressable>
      </View>

      {lastWorkout && (
        <ThemedView style={[styles.lastWorkoutCard, {
          backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4'
        }]}>
          <ThemedText type="subtitle">최근 운동</ThemedText>
          <ThemedText style={styles.lastWorkoutDate}>
            {new Date(lastWorkout.date).toLocaleDateString('ko-KR')}
          </ThemedText>
          {lastWorkout.exercises.map((exercise, index) => {
            // exerciseType이 없으면 exerciseDatabase에서 찾기
            const exerciseType = exercise.exerciseType ||
              exerciseDatabase.find(e => e.id === exercise.exerciseTypeId);
            const exerciseName = exerciseType?.nameKo || exercise.exerciseTypeId;

            return (
              <ThemedText key={index} style={styles.exerciseItem}>
                • {exerciseName} ({exercise.sets.length}세트)
              </ThemedText>
            );
          })}
        </ThemedView>
      )}

      {/* 내 운동 내역 섹션 */}
      <View style={styles.historySection}>
        <ThemedText style={styles.sectionTitle}>내 운동 내역</ThemedText>
        {!workoutHistory || workoutHistory.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' }]}>
            <Ionicons name="fitness-outline" size={32} color="#999" />
            <ThemedText style={styles.emptyText}>아직 운동 기록이 없습니다</ThemedText>
            <ThemedText style={styles.emptySubtext}>운동을 시작하고 기록을 쌓아보세요</ThemedText>
          </View>
        ) : (
          workoutHistory.slice(0, 10).map((session) => {
            const totalSets = session.exercises.reduce((acc, ex) =>
              acc + ex.sets.filter(s => s.completed).length, 0
            );
            const exerciseNames = session.exercises
              .map(ex => exerciseDatabase.find(e => e.id === ex.exerciseTypeId)?.nameKo ?? ex.exerciseTypeId)
              .slice(0, 3)
              .join(', ');

            return (
              <Pressable
                key={session.id}
                style={[styles.historyCard, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : 'white' }]}
                onPress={() => router.push(`/card/view?type=mine&sessionId=${session.id}`)}
              >
                <View style={styles.historyCardRow}>
                  <Ionicons name="fitness" size={22} color={colors.tint} />
                  <View style={styles.historyCardContent}>
                    <ThemedText style={styles.historyCardTitle} numberOfLines={1}>
                      {exerciseNames || '운동'}
                    </ThemedText>
                    <ThemedText style={styles.historyCardMeta}>
                      {new Date(session.date).toLocaleDateString('ko-KR')} · {session.exercises.length}개 운동 · {totalSets}세트
                      {session.totalDuration > 0 && ` · ${formatDuration(session.totalDuration)}`}
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#999" />
                </View>
              </Pressable>
            );
          })
        )}

        {workoutHistory && workoutHistory.length > 10 && (
          <Pressable
            style={[styles.moreButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/workout/history')}
          >
            <ThemedText style={styles.moreButtonText}>전체 내역 보기</ThemedText>
          </Pressable>
        )}
      </View>
    </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 15, // 기본 paddingTop 설정, insets.top이 추가됨
    borderBottomWidth: 1,
    // borderBottomColor는 동적으로 적용됨
  },
  buttonContainer: {
    padding: 20,
    gap: 15,
  },
  startButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden', // 그라데이션이 border radius 내에 있도록
  },
  startButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    // backgroundColor는 인라인 스타일로 처리
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSubtext: {
    fontSize: 14,
  },
  continueButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButton: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastWorkoutCard: {
    margin: 20,
    padding: 20,
    // backgroundColor는 동적으로 적용됨
    borderRadius: 12,
  },
  lastWorkoutDate: {
    marginTop: 5,
    marginBottom: 10,
    opacity: 0.6,
  },
  exerciseItem: {
    marginVertical: 2,
    flex: 1,
  },
  sessionInfoCard: {
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  sessionInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  sessionInfoDate: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 16,
  },
  sessionStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(128,128,128,0.2)',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
  },
  exerciseList: {
    gap: 8,
  },
  exerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  exerciseSetCount: {
    fontSize: 13,
    fontWeight: '500',
  },
  historySection: {
    paddingHorizontal: 20,
    marginTop: 24,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 8,
  },
  emptyText: {
    fontSize: 15,
    opacity: 0.8,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 13,
    opacity: 0.5,
    marginTop: 4,
  },
  historyCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'transparent',
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
  historyCardContent: {
    flex: 1,
  },
  historyCardTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  historyCardMeta: {
    fontSize: 13,
    opacity: 0.7,
    marginTop: 4,
  },
  moreButton: {
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  moreButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
});