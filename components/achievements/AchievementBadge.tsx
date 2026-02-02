/**
 * 업적 배지 컴포넌트
 * 개별 업적을 표시하는 배지
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Animated,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Achievement, tierColors } from '@/data/achievements';

interface AchievementBadgeProps {
  achievement: Achievement;
  isUnlocked: boolean;
  progress?: number;
  isNew?: boolean;
  onPress?: () => void;
  size?: 'small' | 'medium' | 'large';
}

export default function AchievementBadge({
  achievement,
  isUnlocked,
  progress = 0,
  isNew = false,
  onPress,
  size = 'medium',
}: AchievementBadgeProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 애니메이션 값
  const scaleAnim = useRef(new Animated.Value(isNew ? 1.2 : 1)).current;
  const glowAnim = useRef(new Animated.Value(isNew ? 1 : 0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  // 새로운 업적 애니메이션
  useEffect(() => {
    if (isNew) {
      // 스케일 애니메이션
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // 반짝임 애니메이션
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [isNew]);

  // 크기별 스타일
  const sizeStyles = {
    small: { badge: 50, icon: 22, text: 9, container: 75 },
    medium: { badge: 80, icon: 32, text: 12, container: 90 },
    large: { badge: 100, icon: 40, text: 14, container: 110 },
  }[size];

  // 티어 색상
  const tierColor = achievement.tier ? tierColors[achievement.tier] : colors.tint;

  // 진행률 계산
  const progressPercentage = Math.min((progress / achievement.requiredValue) * 100, 100);

  return (
    <Pressable onPress={onPress} disabled={!onPress}>
      <Animated.View
        style={[
          styles.container,
          {
            width: sizeStyles.container,
            transform: [
              { scale: scaleAnim },
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
        {/* 배지 배경 */}
        <View
          style={[
            styles.badge,
            {
              width: sizeStyles.badge,
              height: sizeStyles.badge,
              backgroundColor: isUnlocked ? tierColor : '#e0e0e0',
              opacity: isUnlocked ? 1 : 0.5,
            },
            achievement.tier && styles.tierBadge,
          ]}
        >
          {/* 아이콘 */}
          <ThemedText style={{ fontSize: sizeStyles.icon }}>
            {achievement.icon}
          </ThemedText>

          {/* 진행률 표시 (미완료시) */}
          {!isUnlocked && progressPercentage > 0 && (
            <View style={styles.progressContainer}>
              <View
                style={[
                  styles.progressBar,
                  {
                    width: `${progressPercentage}%`,
                    backgroundColor: colors.tint,
                  },
                ]}
              />
            </View>
          )}

          {/* 티어 표시 */}
          {achievement.tier && isUnlocked && (
            <View style={[styles.tierIndicator, { backgroundColor: tierColor }]}>
              <ThemedText style={styles.tierText}>
                {achievement.tier.charAt(0).toUpperCase()}
              </ThemedText>
            </View>
          )}
        </View>

        {/* 새로운 배지 반짝임 효과 */}
        {isNew && (
          <Animated.View
            style={[
              styles.glowEffect,
              {
                opacity: glowAnim,
                width: sizeStyles.badge + 20,
                height: sizeStyles.badge + 20,
              },
            ]}
          />
        )}

        {/* NEW 라벨 */}
        {isNew && (
          <View style={[styles.newLabel, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.newLabelText}>NEW</ThemedText>
          </View>
        )}

        {/* 배지 이름 */}
        {size !== 'small' && (
          <ThemedText
            style={[
              styles.name,
              { fontSize: sizeStyles.text },
              !isUnlocked && styles.lockedText,
            ]}
            numberOfLines={2}
          >
            {achievement.name}
          </ThemedText>
        )}

        {/* 진행률 텍스트 */}
        {!isUnlocked && size === 'large' && (
          <ThemedText style={styles.progressText}>
            {progress}/{achievement.requiredValue}
          </ThemedText>
        )}
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginBottom: 10,
    position: 'relative',
  },
  badge: {
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    position: 'relative',
    overflow: 'hidden',
  },
  tierBadge: {
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  name: {
    marginTop: 6,
    textAlign: 'center',
    fontWeight: '600',
    width: 80,
  },
  lockedText: {
    opacity: 0.5,
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  progressBar: {
    height: '100%',
  },
  progressText: {
    fontSize: 10,
    opacity: 0.6,
    marginTop: 2,
  },
  tierIndicator: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  glowEffect: {
    position: 'absolute',
    borderRadius: 50,
    backgroundColor: 'rgba(255, 215, 0, 0.3)',
  },
  newLabel: {
    position: 'absolute',
    top: -5,
    right: -5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    zIndex: 1,
  },
  newLabelText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
  },
});