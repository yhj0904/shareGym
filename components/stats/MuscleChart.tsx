/**
 * 부위별 운동 분포 차트 컴포넌트
 * 각 근육 부위별 운동 비율을 시각화
 */

import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { WorkoutSession } from '@/types';
import { exerciseDatabase } from '@/data/exercises';

const { width: screenWidth } = Dimensions.get('window');

interface MuscleChartProps {
  workoutHistory: WorkoutSession[];
  period?: 'week' | 'month' | 'all';
}

// 부위별 색상 정의 - 브랜드 색상과 조화를 이루도록 조정
const muscleColors: Record<string, string> = {
  '가슴': '#FF6F8D',     // Primary Pink
  '등': '#FFA24A',       // Primary Orange
  '어깨': '#FFB871',     // Orange shade
  '하체': '#FF8FA3',     // Pink shade
  '이두': '#FFCB8E',     // Light orange
  '삼두': '#FF95A8',     // Light pink
  '복근': '#FFC5A0',     // Peach
  '전신': '#FF7FA3',     // Pink-orange blend
  '종아리': '#FFB5B0',   // Light pink-orange
  '둔근': '#FFA875',     // Orange shade
};

export default function MuscleChart({ workoutHistory, period = 'month' }: MuscleChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 기간별 필터링
  const filteredWorkouts = useMemo(() => {
    if (period === 'all') return workoutHistory;

    const now = new Date();
    const startDate = new Date();

    if (period === 'week') {
      startDate.setDate(now.getDate() - 7);
    } else if (period === 'month') {
      startDate.setMonth(now.getMonth() - 1);
    }

    return workoutHistory.filter(w => new Date(w.date) >= startDate);
  }, [workoutHistory, period]);

  // 부위별 통계 계산
  const muscleStats = useMemo(() => {
    const stats: Record<string, number> = {};
    let total = 0;

    filteredWorkouts.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const exerciseType = exercise.exerciseType ||
          exerciseDatabase.find(e => e.id === exercise.exerciseTypeId);

        if (exerciseType?.muscleGroups) {
          exerciseType.muscleGroups.forEach(muscle => {
            stats[muscle] = (stats[muscle] || 0) + 1;
            total++;
          });
        }
      });
    });

    // 백분율 계산 및 정렬
    const percentages = Object.entries(stats)
      .map(([muscle, count]) => ({
        muscle,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
        color: muscleColors[muscle] || '#999',
      }))
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 8); // 상위 8개만 표시

    return { data: percentages, total };
  }, [filteredWorkouts]);

  // 가로 막대 차트의 최대 너비
  const maxBarWidth = screenWidth - 140; // 패딩과 레이블 공간 제외

  if (muscleStats.total === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.card }]}>
        <ThemedText style={styles.title}>부위별 운동 분포</ThemedText>
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>운동 기록이 없습니다</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.card }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>부위별 운동 분포</ThemedText>
        <ThemedText style={styles.subtitle}>
          {period === 'week' ? '최근 1주' : period === 'month' ? '최근 1달' : '전체'}
        </ThemedText>
      </View>

      {/* 가로 막대 차트 */}
      <View style={styles.chart}>
        {muscleStats.data.map((item, index) => (
          <View key={item.muscle} style={styles.barContainer}>
            <ThemedText style={styles.muscleLabel}>{item.muscle}</ThemedText>

            <View style={styles.barWrapper}>
              <View
                style={[
                  styles.bar,
                  {
                    width: (item.percentage / 100) * maxBarWidth,
                    backgroundColor: item.color,
                  },
                ]}
              />
              <ThemedText style={styles.percentageText}>
                {item.percentage.toFixed(1)}%
              </ThemedText>
            </View>

            <ThemedText style={styles.countText}>{item.count}회</ThemedText>
          </View>
        ))}
      </View>

      {/* 요약 정보 */}
      <View style={[styles.summary, {
        borderTopColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
      }]}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>가장 많이 한 부위</ThemedText>
          <ThemedText style={styles.summaryValue}>
            {muscleStats.data[0]?.muscle || '-'}
          </ThemedText>
        </View>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryLabel}>총 운동 횟수</ThemedText>
          <ThemedText style={styles.summaryValue}>{muscleStats.total}회</ThemedText>
        </View>
      </View>

      {/* 파이 차트 (선택적) */}
      <View style={styles.pieContainer}>
        <View style={styles.pie}>
          {muscleStats.data.map((item, index) => {
            // 간단한 파이 차트 구현
            const startAngle = muscleStats.data
              .slice(0, index)
              .reduce((sum, d) => sum + d.percentage, 0) * 3.6;
            const endAngle = startAngle + item.percentage * 3.6;

            return (
              <View
                key={item.muscle}
                style={[
                  styles.pieSlice,
                  {
                    backgroundColor: item.color,
                    transform: [
                      { rotate: `${startAngle}deg` },
                      { skewY: `${90 - endAngle + startAngle}deg` },
                    ],
                  },
                ]}
              />
            );
          })}
        </View>

        {/* 범례 */}
        <View style={styles.legend}>
          {muscleStats.data.slice(0, 6).map(item => (
            <View key={item.muscle} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <ThemedText style={styles.legendText}>
                {item.muscle} ({item.percentage.toFixed(0)}%)
              </ThemedText>
            </View>
          ))}
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    opacity: 0.6,
  },
  chart: {
    marginBottom: 20,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  muscleLabel: {
    width: 50,
    fontSize: 13,
    fontWeight: '500',
  },
  barWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    position: 'relative',
  },
  bar: {
    height: 24,
    borderRadius: 12,
    minWidth: 5,
  },
  percentageText: {
    position: 'absolute',
    right: 0,
    fontSize: 11,
    fontWeight: '600',
    paddingLeft: 8,
  },
  countText: {
    width: 40,
    textAlign: 'right',
    fontSize: 11,
    opacity: 0.6,
  },
  summary: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  pieContainer: {
    flexDirection: 'row',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  pie: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    marginRight: 20,
  },
  pieSlice: {
    position: 'absolute',
    width: '50%',
    height: '50%',
    left: '50%',
    top: '50%',
    marginLeft: -60,
    marginTop: -60,
    transformOrigin: 'right bottom',
  },
  legend: {
    flex: 1,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.5,
  },
});