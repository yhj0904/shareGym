/**
 * 업적 획득 애니메이션 모달
 * 새로운 업적을 획득했을 때 표시되는 축하 모달
 */

import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Achievement, tierColors } from '@/data/achievements';
import { BlurView } from 'expo-blur';
import LottieView from 'lottie-react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AchievementUnlockModalProps {
  visible: boolean;
  achievement: Achievement | null;
  onClose: () => void;
}

export default function AchievementUnlockModal({
  visible,
  achievement,
  onClose,
}: AchievementUnlockModalProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 애니메이션 값들
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible && achievement) {
      // 모달 나타나기 애니메이션
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        // 배지 회전 애니메이션
        Animated.sequence([
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(rotateAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ]),
        // 폭죽 애니메이션
        Animated.timing(confettiAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ]).start();

      // 자동 닫기 타이머
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, achievement]);

  const handleClose = () => {
    // 사라지기 애니메이션
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // 애니메이션 값 초기화
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
      rotateAnim.setValue(0);
      confettiAnim.setValue(0);
    });
  };

  if (!achievement) return null;

  const tierColor = achievement.tier ? tierColors[achievement.tier] : colors.tint;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <BlurView intensity={80} style={StyleSheet.absoluteFillObject} />

        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* 배경 장식 */}
          <View style={styles.decorationContainer}>
            {[...Array(8)].map((_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.star,
                  {
                    transform: [
                      {
                        rotate: `${(360 / 8) * i}deg`,
                      },
                      {
                        translateY: confettiAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, -100],
                        }),
                      },
                      {
                        scale: confettiAnim.interpolate({
                          inputRange: [0, 0.5, 1],
                          outputRange: [0, 1.5, 0],
                        }),
                      },
                    ],
                    opacity: confettiAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1, 0],
                    }),
                  },
                ]}
              >
                <ThemedText style={styles.starIcon}>✨</ThemedText>
              </Animated.View>
            ))}
          </View>

          {/* 메인 컨텐츠 */}
          <ThemedView style={[styles.content, { backgroundColor: colors.card }]}>
            {/* 헤더 */}
            <ThemedText style={styles.congratsText}>🎉 축하합니다! 🎉</ThemedText>

            {/* 배지 */}
            <Animated.View
              style={[
                styles.badgeContainer,
                {
                  transform: [
                    {
                      rotate: rotateAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.badge,
                  { backgroundColor: tierColor },
                  achievement.tier && styles.tierBadge,
                ]}
              >
                <ThemedText style={styles.badgeIcon}>{achievement.icon}</ThemedText>
              </View>
            </Animated.View>

            {/* 업적 정보 */}
            <ThemedText style={styles.achievementName}>{achievement.name}</ThemedText>
            <ThemedText style={styles.achievementDescription}>
              {achievement.description}
            </ThemedText>

            {/* 포인트 */}
            <View style={[styles.pointsContainer, { backgroundColor: colors.tint + '20' }]}>
              <ThemedText style={[styles.pointsText, { color: colors.tint }]}>
                +{achievement.points} 포인트 획득!
              </ThemedText>
            </View>

            {/* 티어 표시 */}
            {achievement.tier && (
              <View style={styles.tierContainer}>
                <View style={[styles.tierBadge, { backgroundColor: tierColor }]}>
                  <ThemedText style={styles.tierText}>
                    {achievement.tier.toUpperCase()}
                  </ThemedText>
                </View>
              </View>
            )}
          </ThemedView>

          {/* 닫기 힌트 */}
          <ThemedText style={styles.closeHint}>화면을 터치하여 닫기</ThemedText>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    alignItems: 'center',
    position: 'relative',
  },
  decorationContainer: {
    position: 'absolute',
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  star: {
    position: 'absolute',
  },
  starIcon: {
    fontSize: 24,
  },
  content: {
    width: screenWidth * 0.85,
    maxWidth: 350,
    padding: 30,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  congratsText: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  badgeContainer: {
    marginBottom: 20,
  },
  badge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  tierBadge: {
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  badgeIcon: {
    fontSize: 48,
  },
  achievementName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  achievementDescription: {
    fontSize: 16,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 20,
  },
  pointsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 15,
  },
  pointsText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  tierContainer: {
    marginTop: 10,
  },
  tierBadge: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tierText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
    letterSpacing: 1,
  },
  closeHint: {
    marginTop: 20,
    fontSize: 12,
    opacity: 0.6,
  },
});