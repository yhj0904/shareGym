import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  Animated,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import * as Haptics from 'expo-haptics';

export default function RestTimer() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { restTimer, restTimerActive, stopRestTimer } = useWorkoutStore();

  const [currentTime, setCurrentTime] = useState(restTimer);
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.9))[0];

  useEffect(() => {
    if (restTimerActive && restTimer > 0) {
      setCurrentTime(restTimer);

      // 애니메이션 시작
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev <= 1) {
            // 타이머 종료
            clearInterval(interval);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            stopRestTimer();
            return 0;
          }
          // 마지막 3초 알림
          if (prev <= 4 && prev > 1) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    } else {
      // 애니메이션 종료
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [restTimer, restTimerActive]);

  const handleAddTime = (seconds: number) => {
    const newStore = useWorkoutStore.getState();
    newStore.startRestTimer(currentTime + seconds);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!restTimerActive || currentTime === 0) {
    return null;
  }

  const progress = currentTime / restTimer;
  const isEnding = currentTime <= 3;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <ThemedView
        style={[
          styles.timerCard,
          { backgroundColor: colors.card },
          isEnding && styles.endingCard,
        ]}
      >
        <View style={styles.header}>
          <ThemedText style={styles.title}>휴식 시간</ThemedText>
          <Pressable onPress={stopRestTimer} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </Pressable>
        </View>

        <View style={styles.timerDisplay}>
          <ThemedText style={[styles.time, isEnding && styles.endingTime]}>
            {formatTime(currentTime)}
          </ThemedText>
        </View>

        {/* 진행 바 */}
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressBar,
              {
                width: `${progress * 100}%`,
                backgroundColor: isEnding ? '#ff4444' : colors.tint,
              },
            ]}
          />
        </View>

        {/* 시간 추가 버튼 */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.addTimeButton, { borderColor: colors.border }]}
            onPress={() => handleAddTime(30)}
          >
            <ThemedText style={styles.addTimeText}>+30초</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.addTimeButton, { borderColor: colors.border }]}
            onPress={() => handleAddTime(60)}
          >
            <ThemedText style={styles.addTimeText}>+1분</ThemedText>
          </Pressable>
          <Pressable
            style={[styles.skipButton, { backgroundColor: colors.tint }]}
            onPress={stopRestTimer}
          >
            <ThemedText style={styles.skipText}>건너뛰기</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 100,
    left: 20,
    right: 20,
    zIndex: 100,
  },
  timerCard: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  endingCard: {
    borderWidth: 2,
    borderColor: '#ff4444',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  closeButton: {
    padding: 5,
  },
  timerDisplay: {
    alignItems: 'center',
    marginVertical: 20,
  },
  time: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  endingTime: {
    color: '#ff4444',
  },
  progressContainer: {
    height: 6,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
    marginVertical: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 3,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  addTimeButton: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  addTimeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  skipText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});