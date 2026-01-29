import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  Animated,
  Modal,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { LiveWorkoutStatus, CHEER_EMOJIS } from '@/stores/liveWorkoutStore';
import useLiveWorkoutStore from '@/stores/liveWorkoutStore';
import useAuthStore from '@/stores/authStore';
import * as Haptics from 'expo-haptics';

interface LiveWorkoutCardProps {
  workout: LiveWorkoutStatus;
  onPress?: () => void;
}

export default function LiveWorkoutCard({ workout, onPress }: LiveWorkoutCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const { sendCheer } = useLiveWorkoutStore();

  const [showCheerModal, setShowCheerModal] = useState(false);
  const [selectedEmoji, setSelectedEmoji] = useState<string>('');

  // 운동 시간 계산 (분)
  const workoutMinutes = Math.floor(
    (Date.now() - new Date(workout.startTime).getTime()) / 60000
  );

  // 애니메이션 효과
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    // 운동 중일 때 펄스 애니메이션
    if (workout.status === 'working-out') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [workout.status]);

  const handleSendCheer = async (emoji: string) => {
    if (!user) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await sendCheer(workout.userId, 'emoji', emoji);

    setSelectedEmoji(emoji);
    setTimeout(() => setSelectedEmoji(''), 2000);
  };

  const handleQuickCheer = async () => {
    if (!user) return;

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // 랜덤 이모지 선택
    const randomEmoji = CHEER_EMOJIS[Math.floor(Math.random() * CHEER_EMOJIS.length)];
    await sendCheer(workout.userId, 'emoji', randomEmoji.emoji);

    setSelectedEmoji(randomEmoji.emoji);
    setTimeout(() => setSelectedEmoji(''), 2000);
  };

  return (
    <>
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <Pressable onPress={onPress}>
          <ThemedView style={[styles.container, { borderColor: colors.tint }]}>
            {/* 상태 인디케이터 */}
            <View style={styles.statusIndicator}>
              <View style={[styles.statusDot, { backgroundColor: '#4CAF50' }]} />
              <ThemedText style={styles.statusText}>운동중</ThemedText>
              <ThemedText style={styles.timeText}>{workoutMinutes}분</ThemedText>
            </View>

            {/* 사용자 정보 */}
            <View style={styles.userInfo}>
              <View style={styles.avatar}>
                <Ionicons name="person-circle" size={40} color={colors.tint} />
              </View>
              <View style={styles.userDetails}>
                <ThemedText style={styles.username}>{workout.username}</ThemedText>
                <ThemedText style={styles.exercise}>
                  {workout.currentExercise || '운동 중'}
                </ThemedText>
                <View style={styles.stats}>
                  <View style={styles.statItem}>
                    <Ionicons name="checkmark-circle" size={16} color={colors.tint} />
                    <ThemedText style={styles.statText}>
                      {workout.completedSets}세트 완료
                    </ThemedText>
                  </View>
                  {workout.cheerCount > 0 && (
                    <View style={styles.statItem}>
                      <Ionicons name="heart" size={16} color="#ff4444" />
                      <ThemedText style={styles.statText}>
                        응원 {workout.cheerCount}
                      </ThemedText>
                    </View>
                  )}
                </View>
              </View>
            </View>

            {/* 응원 버튼 */}
            <View style={styles.cheerSection}>
              <Pressable
                style={[styles.cheerButton, { backgroundColor: colors.tint }]}
                onPress={handleQuickCheer}
              >
                <Ionicons name="heart" size={20} color="white" />
                <ThemedText style={styles.cheerButtonText}>응원하기</ThemedText>
              </Pressable>

              <Pressable
                style={styles.moreButton}
                onPress={() => setShowCheerModal(true)}
              >
                <Ionicons name="add-circle-outline" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* 응원 이펙트 */}
            {selectedEmoji && (
              <Animated.View style={styles.emojiEffect}>
                <ThemedText style={styles.emojiEffectText}>{selectedEmoji}</ThemedText>
              </Animated.View>
            )}
          </ThemedView>
        </Pressable>
      </Animated.View>

      {/* 응원 선택 모달 */}
      <Modal
        visible={showCheerModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCheerModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowCheerModal(false)}
        >
          <View style={[styles.cheerModal, { backgroundColor: colors.background }]}>
            <ThemedText style={styles.modalTitle}>응원 보내기</ThemedText>

            <View style={styles.emojiGrid}>
              {CHEER_EMOJIS.map((item) => (
                <Pressable
                  key={item.emoji}
                  style={styles.emojiButton}
                  onPress={() => {
                    handleSendCheer(item.emoji);
                    setShowCheerModal(false);
                  }}
                >
                  <ThemedText style={styles.emojiText}>{item.emoji}</ThemedText>
                  <ThemedText style={styles.emojiLabel}>{item.label}</ThemedText>
                </Pressable>
              ))}
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4CAF50',
  },
  timeText: {
    fontSize: 12,
    opacity: 0.6,
    marginLeft: 'auto',
  },
  userInfo: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  avatar: {
    marginRight: 12,
  },
  userDetails: {
    flex: 1,
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  exercise: {
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 8,
  },
  stats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    opacity: 0.6,
  },
  cheerSection: {
    flexDirection: 'row',
    gap: 12,
  },
  cheerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  cheerButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  moreButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emojiEffect: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  emojiEffectText: {
    fontSize: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  cheerModal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  emojiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
  },
  emojiButton: {
    width: '23%',
    alignItems: 'center',
    padding: 12,
    marginVertical: 8,
  },
  emojiText: {
    fontSize: 32,
    marginBottom: 4,
  },
  emojiLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
});