import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Share,
  Modal,
  Alert,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import useGroupStore from '@/stores/groupStore';
import useAuthStore from '@/stores/authStore';
import useFeedStore from '@/stores/feedStore';
import { formatDuration } from '@/utils/time';
import { exerciseDatabase } from '@/data/exercises';

export default function SessionCompleteScreen() {
  // 테마 및 색상 설정
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Safe Area Insets - 상단/하단 안전 영역 패딩 설정
  const insets = useSafeAreaInsets();
  const { lastWorkout, clearCurrentSession } = useWorkoutStore();
  const { groups, createSharedCard, fetchUserGroups } = useGroupStore();
  const { user } = useAuthStore();
  const { createWorkoutPost } = useFeedStore();
  const [showCardModal, setShowCardModal] = useState(false);
  const [showFeedShareModal, setShowFeedShareModal] = useState(false);
  const [feedShareMessage, setFeedShareMessage] = useState('');

  // 운동 완료 화면 진입 시 현재 세션 정리 → 운동 탭에서 '운동 시작' 화면이 보이도록
  useEffect(() => {
    clearCurrentSession();
  }, [clearCurrentSession]);
  const [showGroupShareModal, setShowGroupShareModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<'horizontal' | 'vertical'>('horizontal');
  const [splitPosition, setSplitPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [cardType, setCardType] = useState<'solo' | 'collaborative'>('solo'); // 카드 타입 추가

  // 그룹 데이터 로드
  useEffect(() => {
    if (user) {
      fetchUserGroups(user.id);
    }
  }, [user]);

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

  // Feed 공유 모달 열기
  const handleOpenFeedShare = () => {
    setShowCardModal(false);
    setShowFeedShareModal(true);
  };

  // Feed에 운동 공유
  const handleShareToFeed = async () => {
    if (!lastWorkout) return;

    try {
      await createWorkoutPost(
        lastWorkout,
        feedShareMessage,
        'gradient', // 카드 스타일
        undefined, // 카드 이미지 URL (나중에 구현)
        'public' // 공개 범위
      );

      setShowFeedShareModal(false);
      Alert.alert('공유 완료', '운동 기록이 피드에 공유되었습니다!');

      // 피드 화면으로 이동
      setTimeout(() => {
        router.dismissAll();
        router.replace('/(tabs)');
      }, 300);
    } catch (error) {
      Alert.alert('오류', '피드 공유에 실패했습니다.');
    }
  };

  const handleDone = () => {
    // 모든 모달 닫기 (session-complete와 active-session 모두 닫힘)
    router.dismissAll();
    // 짧은 딜레이 후 운동 탭으로 이동 (세션이 초기화되었으므로 운동 시작 화면이 표시됨)
    setTimeout(() => {
      router.replace('/(tabs)/workout');
    }, 300);
  };

  // 그룹 공유 카드 생성 모달 열기
  const handleOpenGroupShare = () => {
    setShowCardModal(false);
    // 사용자가 속한 그룹이 있는지 확인
    const userGroups = groups.filter(g => g.members.includes(user?.id || ''));
    if (userGroups.length === 0) {
      Alert.alert('그룹 없음', '먼저 그룹에 가입해주세요.');
      return;
    }
    setShowGroupShareModal(true);
  };

  // 그룹 공유 카드 생성
  const handleCreateGroupCard = async () => {
    if (!selectedGroup || !lastWorkout || !user) {
      Alert.alert('오류', '필요한 정보가 없습니다.');
      return;
    }

    try {
      // 분할 방향에 따른 위치 조정
      const adjustedPosition = splitType === 'horizontal'
        ? (splitPosition === 'top' || splitPosition === 'bottom' ? splitPosition : 'top')
        : (splitPosition === 'left' || splitPosition === 'right' ? splitPosition : 'left');

      await createSharedCard(
        selectedGroup,
        user.id,
        lastWorkout.id,
        splitType,
        adjustedPosition,
        'gradient',
        undefined, // customOptions
        cardType // 카드 타입 전달
      );

      // 모달 먼저 닫기
      setShowGroupShareModal(false);

      Alert.alert(
        cardType === 'collaborative' ? '협업 카드 생성 완료' : '공유 카드 생성 완료',
        cardType === 'collaborative'
          ? '그룹 멤버가 함께 운동 카드를 완성할 수 있습니다. 24시간 내에 완성되지 않으면 자동으로 삭제됩니다.'
          : '운동 카드가 그룹에 공유되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              // 모든 모달 닫기 (운동 완료 모달 포함) → 루트로 복귀
              router.dismissAll();
              // 루트에서 그룹 탭으로 완전히 이동 (모달이 아닌 홈 탭으로)
              setTimeout(() => {
                router.replace('/(tabs)/groups');
              }, 300);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('오류', '공유 카드 생성에 실패했습니다.');
      console.error(error);
    }
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

          {/* Feed 공유 버튼 */}
          <Pressable
            style={[styles.actionButton, {
              backgroundColor: colorScheme === 'dark' ? '#4a90e2' : '#4a90e2',
            }]}
            onPress={handleOpenFeedShare}
          >
            <Ionicons name="newspaper-outline" size={24} color="white" />
            <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>피드에 공유</ThemedText>
          </Pressable>

          {/* 그룹 공유 카드 버튼 - 그룹에 속한 경우에만 표시 */}
          {groups.filter(g => g.members.includes(user?.id || '')).length > 0 && (
            <Pressable
              style={[styles.actionButton, {
                backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#f0f0f0', // 다크모드 대응
              }]}
              onPress={handleOpenGroupShare}
            >
              <Ionicons name="people-outline" size={24} color={colors.text} />
              <ThemedText style={styles.actionButtonText}>그룹 공유 카드</ThemedText>
            </Pressable>
          )}

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

      {/* 그룹 공유 카드 생성 모달 */}
      <Modal
        visible={showGroupShareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGroupShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.groupShareModalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>그룹 공유 카드 만들기</ThemedText>
              <Pressable onPress={() => setShowGroupShareModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ThemedText style={styles.modalSubtitle}>
              그룹 멤버와 함께 2분할 운동 카드를 만들어보세요!
            </ThemedText>

            {/* 그룹 선택 */}
            <View style={styles.selectionSection}>
              <ThemedText style={styles.sectionLabel}>그룹 선택</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionList}>
                {groups
                  .filter(g => g.members.includes(user?.id || ''))
                  .map(group => (
                    <Pressable
                      key={group.id}
                      style={[
                        styles.optionItem,
                        selectedGroup === group.id && styles.selectedOption,
                        { borderColor: selectedGroup === group.id ? colors.tint : '#ddd' }
                      ]}
                      onPress={() => setSelectedGroup(group.id)}
                    >
                      <Ionicons
                        name="people"
                        size={20}
                        color={selectedGroup === group.id ? colors.tint : colors.text}
                      />
                      <ThemedText style={styles.optionText}>{group.name}</ThemedText>
                    </Pressable>
                  ))}
              </ScrollView>
            </View>

            {/* 카드 타입 선택 */}
            <View style={styles.selectionSection}>
              <ThemedText style={styles.sectionLabel}>카드 타입</ThemedText>
              <View style={styles.cardTypeRow}>
                <Pressable
                  style={[
                    styles.cardTypeOption,
                    cardType === 'solo' && styles.selectedCardType,
                    { borderColor: cardType === 'solo' ? colors.tint : '#ddd' }
                  ]}
                  onPress={() => setCardType('solo')}
                >
                  <Ionicons
                    name="person"
                    size={24}
                    color={cardType === 'solo' ? colors.tint : colors.text}
                  />
                  <ThemedText style={styles.cardTypeText}>혼자 완성하기</ThemedText>
                  <ThemedText style={styles.cardTypeDescription}>
                    내 운동 기록만으로 카드를 완성합니다
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.cardTypeOption,
                    cardType === 'collaborative' && styles.selectedCardType,
                    { borderColor: cardType === 'collaborative' ? colors.tint : '#ddd' }
                  ]}
                  onPress={() => setCardType('collaborative')}
                >
                  <Ionicons
                    name="people"
                    size={24}
                    color={cardType === 'collaborative' ? colors.tint : colors.text}
                  />
                  <ThemedText style={styles.cardTypeText}>함께 완성하기</ThemedText>
                  <ThemedText style={styles.cardTypeDescription}>
                    그룹원과 함께 2분할 카드를 만듭니다
                  </ThemedText>
                </Pressable>
              </View>
            </View>

            {/* 분할 방향 선택 */}
            <View style={styles.selectionSection}>
              <ThemedText style={styles.sectionLabel}>분할 방향</ThemedText>
              <View style={styles.splitTypeRow}>
                <Pressable
                  style={[
                    styles.splitTypeOption,
                    splitType === 'horizontal' && styles.selectedSplitType,
                    { borderColor: splitType === 'horizontal' ? colors.tint : '#ddd' }
                  ]}
                  onPress={() => {
                    setSplitType('horizontal');
                    setSplitPosition('top');
                  }}
                >
                  <View style={styles.splitPreview}>
                    <View style={[styles.splitBox, styles.horizontalTop, {
                      backgroundColor: splitType === 'horizontal' ? colors.tint : '#ddd'
                    }]} />
                    <View style={[styles.splitBox, styles.horizontalBottom]} />
                  </View>
                  <ThemedText style={styles.splitTypeText}>상하 분할</ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.splitTypeOption,
                    splitType === 'vertical' && styles.selectedSplitType,
                    { borderColor: splitType === 'vertical' ? colors.tint : '#ddd' }
                  ]}
                  onPress={() => {
                    setSplitType('vertical');
                    setSplitPosition('left');
                  }}
                >
                  <View style={styles.splitPreview}>
                    <View style={[styles.splitBox, styles.verticalLeft, {
                      backgroundColor: splitType === 'vertical' ? colors.tint : '#ddd'
                    }]} />
                    <View style={[styles.splitBox, styles.verticalRight]} />
                  </View>
                  <ThemedText style={styles.splitTypeText}>좌우 분할</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* 위치 선택 */}
            <View style={styles.selectionSection}>
              <ThemedText style={styles.sectionLabel}>내 운동 위치</ThemedText>
              <View style={styles.positionRow}>
                {splitType === 'horizontal' ? (
                  <>
                    <Pressable
                      style={[
                        styles.positionOption,
                        splitPosition === 'top' && styles.selectedPosition,
                        { borderColor: splitPosition === 'top' ? colors.tint : '#ddd' }
                      ]}
                      onPress={() => setSplitPosition('top')}
                    >
                      <Ionicons name="arrow-up" size={20} color={colors.text} />
                      <ThemedText style={styles.positionText}>위쪽</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.positionOption,
                        splitPosition === 'bottom' && styles.selectedPosition,
                        { borderColor: splitPosition === 'bottom' ? colors.tint : '#ddd' }
                      ]}
                      onPress={() => setSplitPosition('bottom')}
                    >
                      <Ionicons name="arrow-down" size={20} color={colors.text} />
                      <ThemedText style={styles.positionText}>아래쪽</ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      style={[
                        styles.positionOption,
                        splitPosition === 'left' && styles.selectedPosition,
                        { borderColor: splitPosition === 'left' ? colors.tint : '#ddd' }
                      ]}
                      onPress={() => setSplitPosition('left')}
                    >
                      <Ionicons name="arrow-back" size={20} color={colors.text} />
                      <ThemedText style={styles.positionText}>왼쪽</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.positionOption,
                        splitPosition === 'right' && styles.selectedPosition,
                        { borderColor: splitPosition === 'right' ? colors.tint : '#ddd' }
                      ]}
                      onPress={() => setSplitPosition('right')}
                    >
                      <Ionicons name="arrow-forward" size={20} color={colors.text} />
                      <ThemedText style={styles.positionText}>오른쪽</ThemedText>
                    </Pressable>
                  </>
                )}
              </View>
            </View>

            {/* 액션 버튼 */}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleCreateGroupCard}
                disabled={!selectedGroup}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <ThemedText style={styles.modalButtonText}>공유 카드 생성</ThemedText>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.cancelButton, {
                  borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                }]}
                onPress={() => setShowGroupShareModal(false)}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.text }]}>
                  취소
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.text} />
              <ThemedText style={styles.infoText}>
                생성된 공유 카드는 24시간 동안 유효하며,{'\n'}
                그룹 멤버가 나머지 절반을 완성할 수 있습니다.
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>

      {/* Feed 공유 모달 */}
      <Modal
        visible={showFeedShareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFeedShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <ThemedText style={styles.modalTitle}>피드에 공유하기</ThemedText>
              <Pressable onPress={() => setShowFeedShareModal(false)}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* 운동 요약 정보 */}
            <View style={[styles.summaryCard, { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' }]}>
              <View style={styles.summaryRow}>
                <Ionicons name="time-outline" size={20} color={colors.tint} />
                <ThemedText style={styles.summaryText}>
                  운동 시간: {formatDuration(lastWorkout?.totalDuration || 0)}
                </ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="barbell-outline" size={20} color={colors.tint} />
                <ThemedText style={styles.summaryText}>
                  총 볼륨: {totalVolume.toLocaleString()}kg
                </ThemedText>
              </View>
              <View style={styles.summaryRow}>
                <Ionicons name="fitness-outline" size={20} color={colors.tint} />
                <ThemedText style={styles.summaryText}>
                  {lastWorkout?.exercises.length}개 운동 · {completedSets}세트
                </ThemedText>
              </View>
            </View>

            {/* 메시지 입력 */}
            <View style={styles.messageInputContainer}>
              <ThemedText style={styles.inputLabel}>메시지 (선택)</ThemedText>
              <TextInput
                style={[styles.messageInput, {
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                  color: colors.text,
                }]}
                placeholder="오늘의 운동 소감을 적어보세요..."
                placeholderTextColor="#999"
                multiline
                maxLength={200}
                value={feedShareMessage}
                onChangeText={setFeedShareMessage}
              />
              <ThemedText style={styles.charCount}>
                {feedShareMessage.length}/200
              </ThemedText>
            </View>

            {/* 액션 버튼 */}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleShareToFeed}
              >
                <Ionicons name="send" size={20} color="white" />
                <ThemedText style={styles.modalButtonText}>피드에 공유</ThemedText>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.cancelButton, {
                  borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                }]}
                onPress={() => setShowFeedShareModal(false)}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.text }]}>
                  취소
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
  // 그룹 공유 모달 스타일
  groupShareModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  closeButton: {
    padding: 5,
  },
  selectionSection: {
    marginVertical: 15,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    opacity: 0.8,
  },
  optionList: {
    flexDirection: 'row',
    maxHeight: 50,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
    gap: 8,
  },
  selectedOption: {
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
  },
  splitTypeRow: {
    flexDirection: 'row',
    gap: 15,
  },
  splitTypeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectedSplitType: {
    borderWidth: 2,
  },
  // 카드 타입 선택 스타일
  cardTypeRow: {
    flexDirection: 'row',
    gap: 15,
  },
  cardTypeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectedCardType: {
    borderWidth: 2,
  },
  cardTypeText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 4,
  },
  cardTypeDescription: {
    fontSize: 11,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 15,
  },
  splitPreview: {
    width: 60,
    height: 80,
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  splitBox: {
    flex: 1,
  },
  horizontalTop: {
    height: '50%',
    width: '100%',
  },
  horizontalBottom: {
    height: '50%',
    width: '100%',
    backgroundColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
  },
  verticalLeft: {
    width: '50%',
    height: '100%',
  },
  verticalRight: {
    width: '50%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  splitTypeText: {
    fontSize: 12,
  },
  positionRow: {
    flexDirection: 'row',
    gap: 15,
  },
  positionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  selectedPosition: {
    borderWidth: 2,
  },
  positionText: {
    fontSize: 14,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
  // Feed 공유 모달 스타일
  summaryCard: {
    padding: 15,
    borderRadius: 10,
    marginVertical: 15,
    gap: 8,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  summaryText: {
    fontSize: 14,
  },
  messageInputContainer: {
    width: '100%',
    marginVertical: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    opacity: 0.8,
  },
  messageInput: {
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    maxHeight: 120,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'right',
    marginTop: 5,
  },
});