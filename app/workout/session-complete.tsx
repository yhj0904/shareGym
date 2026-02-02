import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Share,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import { formatDuration } from '@/utils/time';
import { exerciseDatabase } from '@/data/exercises';

export default function SessionCompleteScreen() {
  // 테마 및 색상 설정
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Safe Area Insets - 상단/하단 안전 영역 패딩 설정
  const insets = useSafeAreaInsets();
  const { lastWorkout } = useWorkoutStore();
  const [showCardModal, setShowCardModal] = useState(false);

  // 운동 완료 시 자동으로 카드 생성 모달 표시
  useEffect(() => {
    if (lastWorkout) {
      const timer = setTimeout(() => {
        setShowCardModal(true);
      }, 1000); // 1초 후 모달 표시
      return () => clearTimeout(timer);
    }
  }, [lastWorkout]);

  if (!lastWorkout) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <ThemedView style={styles.emptyContainer}>
          <ThemedText>운동 기록이 없습니다</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  // 통계 계산
  const totalSets = lastWorkout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = lastWorkout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
    0
  );

  // 웨이트 트레이닝 통계
  const totalVolume = lastWorkout.exercises.reduce((acc, ex) => {
    const exerciseType = exerciseDatabase.find(e => e.id === ex.exerciseTypeId);
    if (exerciseType?.category !== 'cardio') {
      return acc + ex.sets.reduce((setAcc, set) => {
        if (set.completed && set.weight) {
          return setAcc + (set.weight * set.reps);
        }
        return setAcc;
      }, 0);
    }
    return acc;
  }, 0);

  // 유산소 운동 통계
  const cardioStats = lastWorkout.exercises.reduce((acc, ex) => {
    const exerciseType = exerciseDatabase.find(e => e.id === ex.exerciseTypeId);
    if (exerciseType?.category === 'cardio') {
      ex.sets.forEach(set => {
        if (set.completed) {
          if (set.distance) acc.totalDistance += set.distance;
          if (set.duration) acc.totalDuration += set.duration;
          acc.cardioSets += 1;
        }
      });
    }
    return acc;
  }, { totalDistance: 0, totalDuration: 0, cardioSets: 0 });

  const totalReps = lastWorkout.exercises.reduce((acc, ex) => {
    return acc + ex.sets.reduce((setAcc, set) => {
      if (set.completed) {
        return setAcc + set.reps;
      }
      return setAcc;
    }, 0);
  }, 0);

  const handleShare = async () => {
    const exerciseList = lastWorkout.exercises.map(ex => {
      const exerciseType = exerciseDatabase.find(e => e.id === ex.exerciseTypeId);
      return `${exerciseType?.nameKo || ex.exerciseTypeId}: ${ex.sets.filter(s => s.completed).length}세트`;
    }).join('\n');

    const message = `💪 오늘의 운동 완료!\n\n` +
      `⏱ 운동 시간: ${formatDuration(lastWorkout.totalDuration)}\n` +
      `📊 총 볼륨: ${totalVolume.toLocaleString()}kg\n` +
      `🎯 완료 세트: ${completedSets}/${totalSets}\n\n` +
      `운동 내용:\n${exerciseList}\n\n` +
      `#쉐어핏 #오운완`;

    try {
      await Share.share({
        message,
      });
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateCard = () => {
    // 모달을 먼저 닫고 애니메이션이 완료된 후 화면 이동
    setShowCardModal(false);
    setTimeout(() => {
      router.push('/card/create');
    }, 300); // 모달 페이드 아웃 애니메이션 시간
  };

  const handleSkipCard = () => {
    setShowCardModal(false);
  };

  const handleDone = () => {
    router.replace('/(tabs)/');
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* 헤더 */}
        <ThemedView style={styles.header}>
          <Ionicons name="checkmark-circle" size={64} color={colors.tint} />
          <ThemedText type="title" style={styles.title}>운동 완료! 🎉</ThemedText>
          <ThemedText style={styles.subtitle}>오늘도 수고하셨습니다</ThemedText>
        </ThemedView>

        {/* 요약 통계 */}
        <ThemedView style={styles.summaryContainer}>
          <ThemedView style={[styles.statCard, {
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
          }]}>
            <Ionicons name="time-outline" size={24} color={colors.tint} />
            <ThemedText style={styles.statValue}>
              {formatDuration(lastWorkout.totalDuration)}
            </ThemedText>
            <ThemedText style={styles.statLabel}>운동 시간</ThemedText>
          </ThemedView>

          {/* 웨이트 트레이닝 볼륨 (있는 경우만 표시) */}
          {totalVolume > 0 && (
            <ThemedView style={[styles.statCard, {
              backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
            }]}>
              <Ionicons name="barbell-outline" size={24} color={colors.tint} />
              <ThemedText style={styles.statValue}>
                {totalVolume.toLocaleString()}kg
              </ThemedText>
              <ThemedText style={styles.statLabel}>총 볼륨</ThemedText>
            </ThemedView>
          )}

          {/* 유산소 운동 거리 (있는 경우만 표시) */}
          {cardioStats.totalDistance > 0 && (
            <ThemedView style={[styles.statCard, {
              backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
            }]}>
              <Ionicons name="navigate-outline" size={24} color={colors.tint} />
              <ThemedText style={styles.statValue}>
                {cardioStats.totalDistance.toFixed(1)}km
              </ThemedText>
              <ThemedText style={styles.statLabel}>총 거리</ThemedText>
            </ThemedView>
          )}

          {/* 유산소 운동 시간 (있는 경우만 표시) */}
          {cardioStats.totalDuration > 0 && (
            <ThemedView style={[styles.statCard, {
              backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
            }]}>
              <Ionicons name="timer-outline" size={24} color={colors.tint} />
              <ThemedText style={styles.statValue}>
                {Math.round(cardioStats.totalDuration / 60)}분
              </ThemedText>
              <ThemedText style={styles.statLabel}>유산소 시간</ThemedText>
            </ThemedView>
          )}

          <ThemedView style={[styles.statCard, {
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
          }]}>
            <Ionicons name="fitness-outline" size={24} color={colors.tint} />
            <ThemedText style={styles.statValue}>
              {completedSets}/{totalSets}
            </ThemedText>
            <ThemedText style={styles.statLabel}>완료 세트</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* 운동 상세 */}
        <ThemedView style={styles.exerciseList}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>운동 내역</ThemedText>
          {lastWorkout.exercises.map((exercise, index) => {
            const exerciseType = exerciseDatabase.find(e => e.id === exercise.exerciseTypeId);
            const completedSets = exercise.sets.filter(s => s.completed);
            const isCardio = exerciseType?.category === 'cardio';
            const unit = exerciseType?.unit || 'kg';

            // 운동 타입에 따른 요약 정보
            let summaryText = `${completedSets.length}세트`;
            if (isCardio) {
              if (unit === 'km') {
                const totalDistance = completedSets.reduce((acc, s) => acc + (s.distance || 0), 0);
                summaryText += ` • 총 ${totalDistance.toFixed(1)}km`;
              } else if (unit === 'level') {
                const maxLevel = Math.max(...completedSets.map(s => s.level || 0));
                summaryText += ` • 최고 레벨 ${maxLevel}`;
              }
            } else {
              const maxWeight = Math.max(...completedSets.map(s => s.weight || 0));
              if (maxWeight > 0) {
                summaryText += ` • 최고 ${maxWeight}kg`;
              }
            }

            return (
              <ThemedView key={index} style={[styles.exerciseItem, {
                backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
              }]}>
                <ThemedText style={styles.exerciseName}>
                  {exerciseType?.nameKo || exercise.exerciseTypeId}
                </ThemedText>
                <ThemedText style={styles.exerciseDetail}>
                  {summaryText}
                </ThemedText>
                <View style={styles.setDetails}>
                  {completedSets.map((set, setIndex) => {
                    let setDetailText = `세트 ${setIndex + 1}: `;

                    if (isCardio) {
                      if (unit === 'km') {
                        setDetailText += `${set.distance || 0}km`;
                        if (set.duration) {
                          setDetailText += ` • ${Math.round(set.duration / 60)}분`;
                        }
                      } else if (unit === 'level') {
                        setDetailText += `레벨 ${set.level || 0}`;
                        if (set.duration) {
                          setDetailText += ` • ${Math.round(set.duration / 60)}분`;
                        }
                      } else {
                        setDetailText += `${set.reps}회`;
                      }
                    } else {
                      setDetailText += `${set.weight || 0}kg × ${set.reps}회`;
                    }

                    return (
                      <ThemedText key={setIndex} style={styles.setDetail}>
                        {setDetailText}
                      </ThemedText>
                    );
                  })}
                </View>
              </ThemedView>
            );
          })}
        </ThemedView>

        {/* 액션 버튼 */}
        <ThemedView style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={handleCreateCard}
          >
            <Ionicons name="image-outline" size={24} color="white" />
            <ThemedText style={styles.actionButtonText}>운동 카드 만들기</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.secondaryButton, {
              backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5', // 다크모드 대응
            }]}
            onPress={handleShare}
          >
            <Ionicons name="share-outline" size={24} color={colors.text} />
            <ThemedText style={styles.actionButtonText}>공유하기</ThemedText>
          </Pressable>
        </ThemedView>

        <Pressable style={styles.doneButton} onPress={handleDone}>
          <ThemedText style={[styles.doneButtonText, { color: colors.tint }]}>
            홈으로 돌아가기
          </ThemedText>
        </Pressable>
      </ScrollView>

      {/* 운동 카드 생성 팝업 */}
      <Modal
        visible={showCardModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCardModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalIcon}>
              <Ionicons name="trophy" size={48} color={colors.tint} />
            </View>

            <ThemedText style={styles.modalTitle}>축하합니다! 🎉</ThemedText>
            <ThemedText style={styles.modalSubtitle}>
              오늘의 운동을 완료했어요!{'\n'}
              인스타그램에 공유할 운동 카드를 만들어보세요.
            </ThemedText>

            <View style={styles.modalStats}>
              <View style={styles.modalStatItem}>
                <Ionicons name="time-outline" size={20} color={colors.tint} />
                <ThemedText style={styles.modalStatText}>
                  {formatDuration(lastWorkout?.totalDuration || 0)}
                </ThemedText>
              </View>
              <View style={styles.modalStatItem}>
                <Ionicons name="barbell-outline" size={20} color={colors.tint} />
                <ThemedText style={styles.modalStatText}>
                  {totalVolume.toLocaleString()}kg
                </ThemedText>
              </View>
              <View style={styles.modalStatItem}>
                <Ionicons name="fitness-outline" size={20} color={colors.tint} />
                <ThemedText style={styles.modalStatText}>
                  {lastWorkout?.exercises.length}개 운동
                </ThemedText>
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleCreateCard}
              >
                <Ionicons name="image" size={20} color="white" />
                <ThemedText style={styles.modalButtonText}>카드 만들기</ThemedText>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.skipButton, {
                  borderColor: colorScheme === 'dark' ? '#444' : '#ddd', // 다크모드 대응
                }]}
                onPress={handleSkipCard}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.text }]}>
                  건너뛰기
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
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
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 30,
  },
  title: {
    marginTop: 20,
    fontSize: 28,
  },
  subtitle: {
    marginTop: 8,
    fontSize: 16,
    opacity: 0.7,
  },
  summaryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 15,
    gap: 15,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  statLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 5,
  },
  exerciseList: {
    padding: 20,
  },
  sectionTitle: {
    marginBottom: 15,
  },
  exerciseItem: {
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  exerciseDetail: {
    fontSize: 14,
    opacity: 0.7,
    marginTop: 5,
  },
  setDetails: {
    marginTop: 10,
  },
  setDetail: {
    fontSize: 12,
    opacity: 0.6,
    marginVertical: 2,
  },
  actions: {
    padding: 20,
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  secondaryButton: {
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  doneButton: {
    alignItems: 'center',
    padding: 20,
    marginBottom: 30,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIcon: {
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  modalStats: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 30,
  },
  modalStatItem: {
    alignItems: 'center',
    gap: 5,
  },
  modalStatText: {
    fontSize: 14,
    fontWeight: '600',
  },
  modalActions: {
    width: '100%',
    gap: 12,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    // borderColor는 인라인으로 동적 적용 (다크모드 대응)
  },
});