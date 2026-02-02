import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useGroupStore from '@/stores/groupStore';
import useAuthStore from '@/stores/authStore';
import { SharedCard } from '@/types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.6; // 화면의 60% 높이로 설정

export default function SharedCardDetailScreen() {
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { getSharedCardById, completeSharedCard } = useGroupStore();
  const [card, setCard] = useState<SharedCard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);

  useEffect(() => {
    loadCard();
  }, [cardId]);

  const loadCard = () => {
    if (!cardId) return;

    // 공유 카드 정보 가져오기
    const sharedCard = getSharedCardById(cardId);
    if (sharedCard) {
      setCard(sharedCard);
    } else {
      Alert.alert('오류', '카드를 찾을 수 없습니다.', [
        { text: '확인', onPress: () => router.back() }
      ]);
    }
    setIsLoading(false);
  };

  const handleCompleteCard = async () => {
    if (!user || !card) return;

    // 이미 완성된 카드인지 확인
    if (card.status === 'completed') {
      Alert.alert('알림', '이미 완성된 카드입니다.');
      return;
    }

    // 내가 만든 카드인지 확인
    if (card.createdBy === user.id) {
      Alert.alert('알림', '본인이 만든 카드는 완성할 수 없습니다.\n다른 그룹원이 완성할 수 있습니다.');
      return;
    }

    Alert.alert(
      '공유 카드 완성',
      '이 카드의 나머지 절반을 완성하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '완성하기',
          onPress: async () => {
            setIsCompleting(true);
            try {
              // 공유 카드 완성 화면으로 이동
              router.push(`/card/complete-shared?cardId=${card.id}`);
            } catch (error) {
              Alert.alert('오류', '카드 완성 화면으로 이동할 수 없습니다.');
            } finally {
              setIsCompleting(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            title: '공유 카드',
            headerLeft: () => (
              <Pressable onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color={colors.text} />
              </Pressable>
            ),
          }}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.tint} />
        </View>
      </ThemedView>
    );
  }

  if (!card) {
    return (
      <ThemedView style={styles.container}>
        <Stack.Screen
          options={{
            title: '공유 카드',
            headerLeft: () => (
              <Pressable onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color={colors.text} />
              </Pressable>
            ),
          }}
        />
        <View style={styles.emptyContainer}>
          <ThemedText>카드를 찾을 수 없습니다.</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const isMyCard = user && card.createdBy === user.id;
  const canComplete = user && !isMyCard && card.status === 'pending';
  const isExpired = new Date(card.expiresAt) < new Date();

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen
        options={{
          title: '공유 카드 상세',
          headerLeft: () => (
            <Pressable onPress={() => router.back()}>
              <Ionicons name="chevron-back" size={28} color={colors.text} />
            </Pressable>
          ),
        }}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 카드 미리보기 */}
        <View style={styles.cardPreviewContainer}>
          <View style={[styles.cardPreview, {
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5',
          }]}>
            {card.splitType === 'horizontal' ? (
              // 상하 분할
              <>
                <View style={[styles.horizontalHalf, {
                  borderBottomWidth: 2,
                  borderBottomColor: colors.tint,
                }]}>
                  {card.firstHalf.imageData ? (
                    <Image
                      source={{ uri: card.firstHalf.imageData }}
                      style={styles.halfImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderHalf}>
                      <Ionicons name="fitness" size={48} color={colors.tint} />
                      <ThemedText style={styles.placeholderText}>
                        {card.splitPosition === 'top' ? '첫 번째 운동' : ''}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.horizontalHalf}>
                  {card.secondHalf?.imageData ? (
                    <Image
                      source={{ uri: card.secondHalf.imageData }}
                      style={styles.halfImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.placeholderHalf, {
                      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0',
                    }]}>
                      {canComplete ? (
                        <>
                          <Ionicons name="add-circle-outline" size={48} color={colors.tint} />
                          <ThemedText style={styles.placeholderText}>
                            완성 대기 중
                          </ThemedText>
                        </>
                      ) : (
                        <>
                          <Ionicons name="time-outline" size={48} color="#999" />
                          <ThemedText style={styles.placeholderText}>
                            {card.splitPosition === 'bottom' ? '두 번째 운동' : '대기 중'}
                          </ThemedText>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </>
            ) : (
              // 좌우 분할
              <View style={styles.verticalContainer}>
                <View style={[styles.verticalHalf, {
                  borderRightWidth: 2,
                  borderRightColor: colors.tint,
                }]}>
                  {card.firstHalf.imageData ? (
                    <Image
                      source={{ uri: card.firstHalf.imageData }}
                      style={styles.halfImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.placeholderHalf}>
                      <Ionicons name="fitness" size={48} color={colors.tint} />
                      <ThemedText style={styles.placeholderText}>
                        {card.splitPosition === 'left' ? '첫 번째 운동' : ''}
                      </ThemedText>
                    </View>
                  )}
                </View>
                <View style={styles.verticalHalf}>
                  {card.secondHalf?.imageData ? (
                    <Image
                      source={{ uri: card.secondHalf.imageData }}
                      style={styles.halfImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.placeholderHalf, {
                      backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#e0e0e0',
                    }]}>
                      {canComplete ? (
                        <>
                          <Ionicons name="add-circle-outline" size={48} color={colors.tint} />
                          <ThemedText style={styles.placeholderText}>
                            완성 대기 중
                          </ThemedText>
                        </>
                      ) : (
                        <>
                          <Ionicons name="time-outline" size={48} color="#999" />
                          <ThemedText style={styles.placeholderText}>
                            {card.splitPosition === 'right' ? '두 번째 운동' : '대기 중'}
                          </ThemedText>
                        </>
                      )}
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>
        </View>

        {/* 카드 정보 */}
        <View style={styles.cardInfo}>
          <View style={[styles.infoCard, {
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
          }]}>
            <ThemedText style={styles.infoTitle}>카드 정보</ThemedText>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>분할 방식:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {card.splitType === 'horizontal' ? '상하 분할' : '좌우 분할'}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>상태:</ThemedText>
              <View style={[styles.statusBadge, {
                backgroundColor: card.status === 'completed'
                  ? 'rgba(52, 199, 89, 0.1)'
                  : 'rgba(255, 149, 0, 0.1)',
              }]}>
                <ThemedText style={[styles.statusText, {
                  color: card.status === 'completed' ? '#34C759' : '#FF9500',
                }]}>
                  {card.status === 'completed' ? '완성됨' : '대기 중'}
                </ThemedText>
              </View>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>생성자:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {isMyCard ? '나' : card.firstHalf.userId}
              </ThemedText>
            </View>

            {card.completedBy && (
              <View style={styles.infoRow}>
                <ThemedText style={styles.infoLabel}>완성자:</ThemedText>
                <ThemedText style={styles.infoValue}>
                  {card.completedBy === user?.id ? '나' : card.secondHalf?.userId}
                </ThemedText>
              </View>
            )}

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>만료 시간:</ThemedText>
              <ThemedText style={[styles.infoValue, isExpired && styles.expiredText]}>
                {isExpired ? '만료됨' : new Date(card.expiresAt).toLocaleString()}
              </ThemedText>
            </View>

            <View style={styles.infoRow}>
              <ThemedText style={styles.infoLabel}>생성 시간:</ThemedText>
              <ThemedText style={styles.infoValue}>
                {new Date(card.createdAt).toLocaleString()}
              </ThemedText>
            </View>
          </View>

          {/* 운동 정보 */}
          {card.firstHalf.workout && (
            <View style={[styles.infoCard, {
              backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
            }]}>
              <ThemedText style={styles.infoTitle}>첫 번째 운동</ThemedText>
              <ThemedText style={styles.workoutDuration}>
                {Math.floor(card.firstHalf.workout.duration / 60)}분 운동
              </ThemedText>
              <ThemedText style={styles.workoutVolume}>
                총 볼륨: {card.firstHalf.workout.totalVolume?.toLocaleString()}kg
              </ThemedText>
              <ThemedText style={styles.workoutExercises}>
                {card.firstHalf.workout.exercises.length}개 운동
              </ThemedText>
            </View>
          )}

          {card.secondHalf?.workout && (
            <View style={[styles.infoCard, {
              backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
            }]}>
              <ThemedText style={styles.infoTitle}>두 번째 운동</ThemedText>
              <ThemedText style={styles.workoutDuration}>
                {Math.floor(card.secondHalf.workout.duration / 60)}분 운동
              </ThemedText>
              <ThemedText style={styles.workoutVolume}>
                총 볼륨: {card.secondHalf.workout.totalVolume?.toLocaleString()}kg
              </ThemedText>
              <ThemedText style={styles.workoutExercises}>
                {card.secondHalf.workout.exercises.length}개 운동
              </ThemedText>
            </View>
          )}
        </View>

        {/* 액션 버튼 */}
        {canComplete && !isExpired && (
          <View style={styles.actionContainer}>
            <Pressable
              style={[styles.completeButton, { backgroundColor: colors.tint }]}
              onPress={handleCompleteCard}
              disabled={isCompleting}
            >
              {isCompleting ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="add-circle" size={24} color="white" />
                  <ThemedText style={styles.completeButtonText}>
                    카드 완성하기
                  </ThemedText>
                </>
              )}
            </Pressable>
          </View>
        )}

        {isExpired && (
          <View style={styles.expiredContainer}>
            <Ionicons name="time-outline" size={24} color="#999" />
            <ThemedText style={styles.expiredMessage}>
              이 카드는 만료되었습니다
            </ThemedText>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardPreviewContainer: {
    padding: 20,
    alignItems: 'center',
  },
  cardPreview: {
    width: SCREEN_WIDTH - 40,
    height: CARD_HEIGHT,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  horizontalHalf: {
    flex: 1,
    width: '100%',
  },
  verticalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  verticalHalf: {
    flex: 1,
    height: '100%',
  },
  halfImage: {
    width: '100%',
    height: '100%',
  },
  placeholderHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
  },
  cardInfo: {
    padding: 20,
    paddingTop: 0,
    gap: 16,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  expiredText: {
    color: '#FF3B30',
  },
  workoutDuration: {
    fontSize: 16,
    marginBottom: 4,
  },
  workoutVolume: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 2,
  },
  workoutExercises: {
    fontSize: 14,
    opacity: 0.6,
  },
  actionContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  completeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  expiredContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  expiredMessage: {
    fontSize: 14,
    opacity: 0.6,
  },
});