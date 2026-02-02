import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedText } from '../ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import * as Haptics from 'expo-haptics';

interface SmartCheerProps {
  message: string;
  emoji: string;
  trigger: string;
  context?: any;
  onDismiss?: () => void;
  duration?: number; // 표시 시간 (ms)
  position?: 'top' | 'center' | 'bottom';
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SmartCheerNotification({
  message,
  emoji,
  trigger,
  context,
  onDismiss,
  duration = 4000, // 기본 4초
  position = 'top',
}: SmartCheerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const [visible, setVisible] = useState(true);

  // 애니메이션 값들 (SafeArea를 고려한 초기값)
  const translateY = useRef(new Animated.Value(position === 'top' ? -150 : 100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    // 등장 애니메이션
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
    ]).start();

    // 햅틱 피드백
    if (Platform.OS === 'ios') {
      if (trigger === 'newPR' || trigger === 'consistency') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    }

    // 자동 사라짐
    const timer = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: position === 'top' ? -150 : 100,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setVisible(false);
      onDismiss?.();
    });
  };

  if (!visible) return null;

  // 트리거별 배경색 설정
  const getBackgroundColor = () => {
    switch (trigger) {
      case 'newPR':
        return '#FFD700'; // 골드
      case 'consistency':
        return colors.tint;
      case 'struggling':
        return '#FF6B6B'; // 레드
      case 'comeback':
        return '#4ECDC4'; // 청록
      case 'lastSet':
        return '#FF8C42'; // 오렌지
      default:
        return colors.card;
    }
  };

  // 트리거별 아이콘 설정
  const getTriggerIcon = () => {
    switch (trigger) {
      case 'newPR':
        return 'trophy';
      case 'consistency':
        return 'flame';
      case 'struggling':
        return 'heart';
      case 'comeback':
        return 'refresh';
      case 'lastSet':
        return 'flag';
      case 'firstSet':
        return 'play';
      default:
        return 'fitness';
    }
  };

  // SafeArea를 고려한 위치 계산
  const positionStyle = position === 'top'
    ? { top: insets.top + 20 } // SafeArea + 여백
    : position === 'bottom'
    ? { bottom: insets.bottom + 100 }
    : { top: '45%' };

  return (
    <Animated.View
      style={[
        styles.container,
        positionStyle,
        {
          backgroundColor: getBackgroundColor(),
          opacity,
          transform: [
            { translateY },
            { scale },
          ],
        },
      ]}
    >
      <Pressable onPress={handleDismiss} style={styles.content}>
        {/* 이모지 */}
        <View style={styles.emojiContainer}>
          <ThemedText style={styles.emoji}>{emoji}</ThemedText>
        </View>

        {/* 메시지 */}
        <View style={styles.messageContainer}>
          <View style={styles.messageHeader}>
            <Ionicons
              name={getTriggerIcon() as any}
              size={16}
              color={trigger === 'newPR' ? '#333' : 'white'}
            />
            <ThemedText
              style={[
                styles.triggerLabel,
                { color: trigger === 'newPR' ? '#333' : 'white' }
              ]}
            >
              {getTriggerLabel(trigger)}
            </ThemedText>
          </View>
          <ThemedText
            style={[
              styles.message,
              { color: trigger === 'newPR' ? '#333' : 'white' }
            ]}
          >
            {message}
          </ThemedText>
          {context?.exercise && (
            <ThemedText
              style={[
                styles.contextText,
                { color: trigger === 'newPR' ? '#666' : 'rgba(255,255,255,0.8)' }
              ]}
            >
              {context.exercise}
            </ThemedText>
          )}
        </View>

        {/* 닫기 버튼 */}
        <Pressable onPress={handleDismiss} style={styles.closeButton}>
          <Ionicons
            name="close"
            size={20}
            color={trigger === 'newPR' ? '#666' : 'rgba(255,255,255,0.7)'}
          />
        </Pressable>
      </Pressable>

      {/* 프로그레스 바 (자동 사라짐 표시) */}
      <View style={styles.progressContainer}>
        <Animated.View
          style={[
            styles.progressBar,
            {
              backgroundColor: 'rgba(255,255,255,0.3)',
              width: opacity.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </Animated.View>
  );
}

// 트리거 라벨 가져오기
function getTriggerLabel(trigger: string): string {
  const labels: Record<string, string> = {
    firstSet: '시작',
    lastSet: '마지막',
    hardSet: '힘든 구간',
    newPR: '개인 신기록',
    heavierWeight: '무게 증가',
    longRest: '휴식',
    struggling: '응원',
    comeback: '컴백',
    consistency: '꾸준함',
    volumeIncrease: '볼륨 증가',
  };
  return labels[trigger] || '운동 중';
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 20,
    right: 20,
    maxWidth: 500, // 최대 너비 제한
    alignSelf: 'center', // 중앙 정렬
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
    zIndex: 9999, // 최상단에 표시
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  emojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 28,
  },
  messageContainer: {
    flex: 1,
    gap: 4,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  triggerLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  message: {
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  contextText: {
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    padding: 4,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  progressBar: {
    height: '100%',
  },
});