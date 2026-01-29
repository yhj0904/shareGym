import React, { useMemo } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import WeeklyChart from '@/components/stats/WeeklyChart';
import { formatDuration } from '@/utils/time';

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { workoutHistory } = useWorkoutStore();

  // 통계 계산
  const stats = useMemo(() => {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay()); // 이번 주 시작
    weekStart.setHours(0, 0, 0, 0);

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const weekWorkouts = workoutHistory.filter(
      w => new Date(w.date) >= weekStart
    );
    const monthWorkouts = workoutHistory.filter(
      w => new Date(w.date) >= monthStart
    );

    const totalVolume = workoutHistory.reduce((acc, workout) => {
      return acc + workout.exercises.reduce((wAcc, exercise) => {
        return wAcc + exercise.sets.reduce((sAcc, set) => {
          if (set.completed && set.weight) {
            return sAcc + (set.weight * set.reps);
          }
          return sAcc;
        }, 0);
      }, 0);
    }, 0);

    const totalTime = workoutHistory.reduce((acc, w) => acc + w.totalDuration, 0);

    // 주간 데이터 생성
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];
    const weeklyData = weekDays.map((day, index) => {
      const dayWorkouts = weekWorkouts.filter(w =>
        new Date(w.date).getDay() === index
      );
      return {
        day,
        value: dayWorkouts.length,
      };
    });

    // 부위별 통계
    const muscleStats: Record<string, number> = {};
    workoutHistory.forEach(workout => {
      workout.exercises.forEach(exercise => {
        if (exercise.exerciseType?.muscleGroups) {
          exercise.exerciseType.muscleGroups.forEach(muscle => {
            muscleStats[muscle] = (muscleStats[muscle] || 0) + 1;
          });
        }
      });
    });

    return {
      weekWorkouts: weekWorkouts.length,
      monthWorkouts: monthWorkouts.length,
      totalWorkouts: workoutHistory.length,
      totalVolume,
      totalTime,
      weeklyData,
      topMuscle: Object.entries(muscleStats).sort((a, b) => b[1] - a[1])[0]?.[0] || '없음',
    };
  }, [workoutHistory]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">통계</ThemedText>
        <ThemedText type="subtitle">운동 기록 분석</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 요약 카드 */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Ionicons name="calendar" size={24} color={colors.tint} />
            <ThemedText style={styles.summaryValue}>
              {stats.weekWorkouts}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>이번 주</ThemedText>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Ionicons name="barbell" size={24} color={colors.tint} />
            <ThemedText style={styles.summaryValue}>
              {stats.totalWorkouts}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>총 운동</ThemedText>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Ionicons name="time" size={24} color={colors.tint} />
            <ThemedText style={styles.summaryValue}>
              {Math.floor(stats.totalTime / 3600)}h
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>총 시간</ThemedText>
          </View>

          <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
            <Ionicons name="trending-up" size={24} color={colors.tint} />
            <ThemedText style={styles.summaryValue}>
              {Math.floor(stats.totalVolume / 1000)}t
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>총 볼륨</ThemedText>
          </View>
        </View>

        {/* 주간 차트 */}
        <WeeklyChart
          data={stats.weeklyData}
          title="이번 주 운동 횟수"
          unit="회"
        />

        {/* 상세 통계 */}
        <ThemedView style={styles.detailCard}>
          <ThemedText type="subtitle" style={styles.detailTitle}>
            운동 분석
          </ThemedText>

          <View style={styles.detailItem}>
            <ThemedText style={styles.detailLabel}>이번 달 운동</ThemedText>
            <ThemedText style={styles.detailValue}>
              {stats.monthWorkouts}회
            </ThemedText>
          </View>

          <View style={styles.detailItem}>
            <ThemedText style={styles.detailLabel}>평균 운동 시간</ThemedText>
            <ThemedText style={styles.detailValue}>
              {stats.totalWorkouts > 0
                ? formatDuration(Math.floor(stats.totalTime / stats.totalWorkouts))
                : '0:00'}
            </ThemedText>
          </View>

          <View style={styles.detailItem}>
            <ThemedText style={styles.detailLabel}>가장 많이 한 부위</ThemedText>
            <ThemedText style={styles.detailValue}>
              {stats.topMuscle}
            </ThemedText>
          </View>

          <View style={styles.detailItem}>
            <ThemedText style={styles.detailLabel}>평균 볼륨</ThemedText>
            <ThemedText style={styles.detailValue}>
              {stats.totalWorkouts > 0
                ? `${Math.floor(stats.totalVolume / stats.totalWorkouts).toLocaleString()}kg`
                : '0kg'}
            </ThemedText>
          </View>
        </ThemedView>

        {/* 최근 운동 기록 */}
        <ThemedView style={styles.recentSection}>
          <ThemedText type="subtitle" style={styles.recentTitle}>
            최근 운동 기록
          </ThemedText>
          {workoutHistory.slice(0, 5).map((workout, index) => (
            <View key={index} style={styles.recentItem}>
              <View>
                <ThemedText style={styles.recentDate}>
                  {new Date(workout.date).toLocaleDateString('ko-KR')}
                </ThemedText>
                <ThemedText style={styles.recentExercises}>
                  {workout.exercises.length}개 운동 • {formatDuration(workout.totalDuration)}
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </View>
          ))}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  content: {
    flex: 1,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
    gap: 10,
  },
  summaryCard: {
    flex: 1,
    minWidth: '45%',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  summaryLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 4,
  },
  detailCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailTitle: {
    marginBottom: 15,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    opacity: 0.7,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '500',
  },
  recentSection: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  recentTitle: {
    marginBottom: 15,
  },
  recentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  recentDate: {
    fontSize: 14,
    fontWeight: '500',
  },
  recentExercises: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
});