/**
 * 운동 진행도 그래프 컴포넌트
 * 특정 운동의 무게/거리 증가 추세를 표시
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { WorkoutSession } from '@/types';
import { exerciseDatabase } from '@/data/exercises';

const { width: screenWidth } = Dimensions.get('window');

interface ProgressChartProps {
  workoutHistory: WorkoutSession[];
}

export default function ProgressChart({ workoutHistory }: ProgressChartProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 자주 수행한 운동 목록 추출
  const popularExercises = useMemo(() => {
    const exerciseCount: Record<string, { name: string; count: number }> = {};

    workoutHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        const exerciseType = exercise.exerciseType ||
          exerciseDatabase.find(e => e.id === exercise.exerciseTypeId);

        if (exerciseType) {
          if (!exerciseCount[exercise.exerciseTypeId]) {
            exerciseCount[exercise.exerciseTypeId] = {
              name: exerciseType.nameKo,
              count: 0,
            };
          }
          exerciseCount[exercise.exerciseTypeId].count++;
        }
      });
    });

    return Object.entries(exerciseCount)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([id, data]) => ({ id, ...data }));
  }, [workoutHistory]);

  const [selectedExerciseId, setSelectedExerciseId] = useState(
    popularExercises[0]?.id || ''
  );

  // 선택된 운동의 진행도 데이터 생성
  const progressData = useMemo(() => {
    if (!selectedExerciseId) return [];

    const data: Array<{
      date: Date;
      maxWeight: number;
      maxDistance?: number;
      maxLevel?: number;
      totalReps: number;
      totalSets: number;
    }> = [];

    // 운동 타입 찾기
    const exerciseType = exerciseDatabase.find(e => e.id === selectedExerciseId);
    const isCardio = exerciseType?.category === 'cardio';
    const unit = exerciseType?.unit || 'kg';

    workoutHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.exerciseTypeId === selectedExerciseId) {
          const completedSets = exercise.sets.filter(s => s.completed);

          if (completedSets.length > 0) {
            let maxValue = 0;

            if (unit === 'km') {
              maxValue = Math.max(...completedSets.map(s => s.distance || 0));
            } else if (unit === 'level') {
              maxValue = Math.max(...completedSets.map(s => s.level || 0));
            } else {
              maxValue = Math.max(...completedSets.map(s => s.weight || 0));
            }

            const totalReps = completedSets.reduce((sum, s) => sum + s.reps, 0);

            data.push({
              date: new Date(workout.date),
              maxWeight: unit === 'kg' ? maxValue : 0,
              maxDistance: unit === 'km' ? maxValue : undefined,
              maxLevel: unit === 'level' ? maxValue : undefined,
              totalReps,
              totalSets: completedSets.length,
            });
          }
        }
      });
    });

    // 날짜순 정렬
    return data.sort((a, b) => a.date.getTime() - b.date.getTime()).slice(-30); // 최근 30개
  }, [selectedExerciseId, workoutHistory]);

  // 차트 그리기를 위한 계산
  const chartData = useMemo(() => {
    if (progressData.length === 0) return null;

    const exerciseType = exerciseDatabase.find(e => e.id === selectedExerciseId);
    const unit = exerciseType?.unit || 'kg';

    let maxValue = 0;
    let minValue = Infinity;

    progressData.forEach(item => {
      const value = unit === 'km' ? item.maxDistance || 0 :
                   unit === 'level' ? item.maxLevel || 0 :
                   item.maxWeight;
      maxValue = Math.max(maxValue, value);
      minValue = Math.min(minValue, value);
    });

    // 차트 높이 및 포인트 계산
    const chartHeight = 200;
    const chartWidth = screenWidth - 60;
    const padding = 20;

    const points = progressData.map((item, index) => {
      const value = unit === 'km' ? item.maxDistance || 0 :
                   unit === 'level' ? item.maxLevel || 0 :
                   item.maxWeight;

      const x = (index / (progressData.length - 1)) * (chartWidth - padding * 2) + padding;
      const y = chartHeight - ((value - minValue) / (maxValue - minValue)) * (chartHeight - padding * 2) - padding;

      return { x, y, value, date: item.date };
    });

    return {
      points,
      maxValue,
      minValue,
      unit,
      chartWidth,
      chartHeight,
    };
  }, [progressData, selectedExerciseId]);

  if (popularExercises.length === 0) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.card }]}>
        <ThemedText style={styles.title}>운동 진행도</ThemedText>
        <ThemedView style={styles.emptyContainer}>
          <ThemedText style={styles.emptyText}>운동 기록이 없습니다</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.card }]}>
      <ThemedText style={styles.title}>운동 진행도</ThemedText>

      {/* 운동 선택 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.exerciseSelector}
      >
        {popularExercises.map(exercise => (
          <Pressable
            key={exercise.id}
            style={[
              styles.exerciseChip,
              {
                backgroundColor: selectedExerciseId === exercise.id ? colors.tint :
                  (colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0'),
              },
            ]}
            onPress={() => setSelectedExerciseId(exercise.id)}
          >
            <ThemedText
              style={[
                styles.exerciseChipText,
                {
                  color: selectedExerciseId === exercise.id ? 'white' : colors.text,
                },
              ]}
            >
              {exercise.name}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* 진행도 차트 */}
      {chartData && progressData.length > 1 ? (
        <View style={styles.chartContainer}>
          {/* Y축 레이블 */}
          <View style={styles.yAxis}>
            <ThemedText style={styles.axisLabel}>
              {Math.round(chartData.maxValue)}
            </ThemedText>
            <ThemedText style={styles.axisLabel}>
              {Math.round((chartData.maxValue + chartData.minValue) / 2)}
            </ThemedText>
            <ThemedText style={styles.axisLabel}>
              {Math.round(chartData.minValue)}
            </ThemedText>
          </View>

          {/* 차트 영역 */}
          <View style={[styles.chart, { width: chartData.chartWidth, height: chartData.chartHeight }]}>
            {/* 그리드 라인 */}
            {[0, 1, 2, 3, 4].map(i => (
              <View
                key={i}
                style={[
                  styles.gridLine,
                  {
                    top: (chartData.chartHeight / 4) * i,
                    backgroundColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
                  },
                ]}
              />
            ))}

            {/* 데이터 라인 */}
            <svg
              width={chartData.chartWidth}
              height={chartData.chartHeight}
              style={StyleSheet.absoluteFillObject}
            >
              {/* 라인 그리기 */}
              <polyline
                points={chartData.points.map(p => `${p.x},${p.y}`).join(' ')}
                fill="none"
                stroke={colors.tint}
                strokeWidth="2"
              />

              {/* 포인트 그리기 */}
              {chartData.points.map((point, index) => (
                <circle
                  key={index}
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill={colors.tint}
                />
              ))}
            </svg>

            {/* 대체 차트 (SVG 미지원 시) */}
            {chartData.points.map((point, index) => (
              <View
                key={index}
                style={[
                  styles.dataPoint,
                  {
                    left: point.x - 4,
                    top: point.y - 4,
                    backgroundColor: colors.tint,
                  },
                ]}
              />
            ))}
          </View>

          {/* 단위 표시 */}
          <ThemedText style={styles.unitLabel}>
            {chartData.unit === 'km' ? '거리 (km)' :
             chartData.unit === 'level' ? '레벨' :
             '무게 (kg)'}
          </ThemedText>
        </View>
      ) : (
        <View style={styles.noDataContainer}>
          <ThemedText style={styles.noDataText}>
            {progressData.length === 0 ? '이 운동의 기록이 없습니다' :
             progressData.length === 1 ? '추세를 보려면 2개 이상의 기록이 필요합니다' :
             '데이터를 불러오는 중...'}
          </ThemedText>
        </View>
      )}

      {/* 통계 요약 */}
      {progressData.length > 0 && (
        <View style={[styles.stats, {
          borderTopColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
        }]}>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>첫 기록</ThemedText>
            <ThemedText style={styles.statValue}>
              {progressData[0]?.maxWeight || progressData[0]?.maxDistance || progressData[0]?.maxLevel || 0}
              {chartData?.unit === 'km' ? 'km' : chartData?.unit === 'level' ? '' : 'kg'}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>최근 기록</ThemedText>
            <ThemedText style={styles.statValue}>
              {progressData[progressData.length - 1]?.maxWeight ||
               progressData[progressData.length - 1]?.maxDistance ||
               progressData[progressData.length - 1]?.maxLevel || 0}
              {chartData?.unit === 'km' ? 'km' : chartData?.unit === 'level' ? '' : 'kg'}
            </ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statLabel}>향상도</ThemedText>
            <ThemedText style={[styles.statValue, { color: colors.tint }]}>
              {(() => {
                const first = progressData[0]?.maxWeight || progressData[0]?.maxDistance || progressData[0]?.maxLevel || 0;
                const last = progressData[progressData.length - 1]?.maxWeight ||
                           progressData[progressData.length - 1]?.maxDistance ||
                           progressData[progressData.length - 1]?.maxLevel || 0;
                const improvement = last - first;
                const percentage = first > 0 ? (improvement / first * 100).toFixed(1) : '0';
                return improvement >= 0 ? `+${improvement} (${percentage}%)` : `${improvement} (${percentage}%)`;
              })()}
            </ThemedText>
          </View>
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 15,
    padding: 15,
    borderRadius: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  exerciseSelector: {
    marginBottom: 20,
  },
  exerciseChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    // backgroundColor는 동적으로 적용됨 (다크모드 대응)
    borderRadius: 20,
    marginRight: 8,
  },
  exerciseChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chartContainer: {
    marginVertical: 20,
  },
  yAxis: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: 20,
  },
  axisLabel: {
    fontSize: 10,
    opacity: 0.6,
  },
  chart: {
    marginLeft: 30,
    position: 'relative',
  },
  gridLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    // backgroundColor는 동적으로 적용됨 (다크모드 대응)
  },
  dataPoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  unitLabel: {
    textAlign: 'center',
    fontSize: 12,
    opacity: 0.6,
    marginTop: 10,
  },
  noDataContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noDataText: {
    opacity: 0.5,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    // borderTopColor는 동적으로 적용됨 (다크모드 대응)
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.5,
  },
});