import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutSession } from '@/types';
import { formatDuration } from '@/utils/time';
import { exerciseDatabase } from '@/data/exercises';
import { Ionicons } from '@expo/vector-icons';

interface WorkoutCardTemplateProps {
  workout: WorkoutSession;
  style: 'minimal' | 'gradient' | 'dark' | 'colorful';
  width: number;
  height: number;
}

export default function WorkoutCardTemplate({
  workout,
  style,
  width,
  height,
}: WorkoutCardTemplateProps) {
  // 통계 계산
  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
    0
  );
  const totalVolume = workout.exercises.reduce((acc, ex) => {
    return acc + ex.sets.reduce((setAcc, set) => {
      if (set.completed && set.weight) {
        return setAcc + (set.weight * set.reps);
      }
      return setAcc;
    }, 0);
  }, 0);

  const getStyleConfig = () => {
    switch (style) {
      case 'gradient':
        return {
          gradient: ['#667eea', '#764ba2'],
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.8)',
        };
      case 'dark':
        return {
          gradient: ['#1a1a1a', '#2d2d2d'],
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.7)',
        };
      case 'colorful':
        return {
          gradient: ['#f093fb', '#f5576c'],
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.9)',
        };
      case 'minimal':
      default:
        return {
          gradient: ['#FFFFFF', '#F5F5F5'],
          textColor: '#1a1a1a',
          subTextColor: '#666666',
        };
    }
  };

  const config = getStyleConfig();
  const date = new Date(workout.date);

  return (
    <LinearGradient
      colors={config.gradient}
      style={[styles.container, { width, height }]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={[styles.dateText, { color: config.subTextColor }]}>
          {date.toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </Text>
        <Text style={[styles.title, { color: config.textColor }]}>오운완 🔥</Text>
      </View>

      {/* 메인 통계 */}
      <View style={styles.mainStats}>
        <View style={styles.bigStat}>
          <Ionicons name="time-outline" size={32} color={config.textColor} />
          <Text style={[styles.bigStatValue, { color: config.textColor }]}>
            {formatDuration(workout.totalDuration)}
          </Text>
          <Text style={[styles.bigStatLabel, { color: config.subTextColor }]}>
            운동 시간
          </Text>
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: config.textColor }]}>
              {totalVolume.toLocaleString()}kg
            </Text>
            <Text style={[styles.statLabel, { color: config.subTextColor }]}>
              총 볼륨
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: config.textColor }]}>
              {completedSets}/{totalSets}
            </Text>
            <Text style={[styles.statLabel, { color: config.subTextColor }]}>
              완료 세트
            </Text>
          </View>
        </View>
      </View>

      {/* 운동 목록 */}
      <View style={styles.exerciseList}>
        <Text style={[styles.exerciseTitle, { color: config.textColor }]}>
          오늘의 운동
        </Text>
        {workout.exercises.slice(0, 5).map((exercise, index) => {
          const exerciseType = exerciseDatabase.find(e => e.id === exercise.exerciseTypeId);
          const completedSets = exercise.sets.filter(s => s.completed);
          const maxWeight = Math.max(...completedSets.map(s => s.weight || 0));

          return (
            <View key={index} style={styles.exerciseItem}>
              <Text style={[styles.exerciseName, { color: config.textColor }]}>
                {exerciseType?.nameKo || exercise.exerciseTypeId}
              </Text>
              <Text style={[styles.exerciseDetail, { color: config.subTextColor }]}>
                {completedSets.length}세트 • 최고 {maxWeight}kg
              </Text>
            </View>
          );
        })}
        {workout.exercises.length > 5 && (
          <Text style={[styles.moreExercises, { color: config.subTextColor }]}>
            +{workout.exercises.length - 5}개 더...
          </Text>
        )}
      </View>

      {/* 푸터 */}
      <View style={styles.footer}>
        <View style={styles.logo}>
          <Ionicons name="fitness" size={24} color={config.textColor} />
          <Text style={[styles.appName, { color: config.textColor }]}>ShareGym</Text>
        </View>
        <Text style={[styles.hashtags, { color: config.subTextColor }]}>
          #오운완 #헬스타그램 #운동기록
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 30,
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 20,
  },
  dateText: {
    fontSize: 14,
    marginBottom: 8,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  mainStats: {
    marginVertical: 30,
  },
  bigStat: {
    alignItems: 'center',
    marginBottom: 30,
  },
  bigStatValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginTop: 10,
  },
  bigStatLabel: {
    fontSize: 16,
    marginTop: 5,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 14,
    marginTop: 4,
  },
  exerciseList: {
    flex: 1,
    marginVertical: 20,
  },
  exerciseTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  exerciseItem: {
    marginBottom: 12,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '500',
  },
  exerciseDetail: {
    fontSize: 14,
    marginTop: 2,
  },
  moreExercises: {
    fontSize: 14,
    fontStyle: 'italic',
    marginTop: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  hashtags: {
    fontSize: 12,
  },
});