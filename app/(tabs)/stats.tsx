import React, { useMemo, useEffect } from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useAuthStore from '@/stores/authStore';
import useWorkoutStore from '@/stores/workoutStore';
import useWorkoutAnalyticsStore from '@/stores/workoutAnalyticsStore';
import SimpleChart from '@/components/stats/SimpleChart';
import WorkoutCalendar from '@/components/stats/WorkoutCalendar';
import MuscleChart from '@/components/stats/MuscleChart';
import ProgressChart from '@/components/stats/ProgressChart';
import { formatDuration } from '@/utils/time';

export default function StatsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { workoutHistory } = useWorkoutStore();
  const loadAnalytics = useWorkoutAnalyticsStore((s) => s.loadAnalytics);

  useEffect(() => {
    if (user?.id) loadAnalytics(user.id);
  }, [user?.id, loadAnalytics]);

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

    // 웨이트 트레이닝과 유산소 운동 통계 분리
    const { totalVolume, totalDistance, cardioTime } = workoutHistory.reduce((acc, workout) => {
      workout.exercises.forEach(exercise => {
        // exerciseType이 없으면 exerciseDatabase에서 찾기
        const exerciseType = exercise.exerciseType ||
          require('@/data/exercises').exerciseDatabase.find(e => e.id === exercise.exerciseTypeId);

        if (exerciseType?.category === 'cardio') {
          exercise.sets.forEach(set => {
            if (set.completed) {
              if (set.distance) acc.totalDistance += set.distance;
              if (set.duration) acc.cardioTime += set.duration;
            }
          });
        } else {
          exercise.sets.forEach(set => {
            if (set.completed && set.weight) {
              acc.totalVolume += (set.weight * set.reps);
            }
          });
        }
      });
      return acc;
    }, { totalVolume: 0, totalDistance: 0, cardioTime: 0 });

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
      totalDistance,
      cardioTime,
      totalTime,
      weeklyData,
      topMuscle: Object.entries(muscleStats).sort((a, b) => b[1] - a[1])[0]?.[0] || '없음',
    };
  }, [workoutHistory]);

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, {
        paddingTop: insets.top,
        borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee', // 다크모드 대응
      }]}>
        <ThemedText type="title">통계</ThemedText>
        <ThemedText type="subtitle">운동 기록 분석</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 요약 카드 */}
        <View style={styles.summaryGrid}>
          <View style={[styles.summaryCard, {
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
          }]}>
            <Ionicons name="calendar" size={24} color={colors.tint} />
            <ThemedText style={styles.summaryValue}>
              {stats.weekWorkouts}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>이번 주</ThemedText>
          </View>

          <View style={[styles.summaryCard, {
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
          }]}>
            <Ionicons name="barbell" size={24} color={colors.tint} />
            <ThemedText style={styles.summaryValue}>
              {stats.totalWorkouts}
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>총 운동</ThemedText>
          </View>

          <View style={[styles.summaryCard, {
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
          }]}>
            <Ionicons name="time" size={24} color={colors.tint} />
            <ThemedText style={styles.summaryValue}>
              {Math.floor(stats.totalTime / 3600)}h
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>총 시간</ThemedText>
          </View>

          <View style={[styles.summaryCard, {
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
          }]}>
            <Ionicons name="trending-up" size={24} color={colors.tint} />
            <ThemedText style={styles.summaryValue}>
              {Math.floor(stats.totalVolume / 1000)}t
            </ThemedText>
            <ThemedText style={styles.summaryLabel}>총 볼륨</ThemedText>
          </View>
        </View>

        {/* 월별 운동 캘린더 */}
        <WorkoutCalendar workoutHistory={workoutHistory} />

        {/* 주간 차트 */}
        <SimpleChart
          data={stats.weeklyData}
          title="이번 주 운동 횟수"
          unit="회"
        />

        {/* 부위별 운동 분포 */}
        <MuscleChart workoutHistory={workoutHistory} period="month" />

        {/* 운동 진행도 */}
        <ProgressChart workoutHistory={workoutHistory} />

        {/* 상세 통계 */}
        <ThemedView style={[styles.detailCard, {
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
        }]}>
          <ThemedText type="subtitle" style={styles.detailTitle}>
            운동 분석
          </ThemedText>

          <View style={[styles.detailItem, {
            borderBottomColor: colorScheme === 'dark' ? '#333' : '#f0f0f0', // 다크모드 대응
          }]}>
            <ThemedText style={styles.detailLabel}>이번 달 운동</ThemedText>
            <ThemedText style={styles.detailValue}>
              {stats.monthWorkouts}회
            </ThemedText>
          </View>

          <View style={[styles.detailItem, {
            borderBottomColor: colorScheme === 'dark' ? '#333' : '#f0f0f0', // 다크모드 대응
          }]}>
            <ThemedText style={styles.detailLabel}>평균 운동 시간</ThemedText>
            <ThemedText style={styles.detailValue}>
              {stats.totalWorkouts > 0
                ? formatDuration(Math.floor(stats.totalTime / stats.totalWorkouts))
                : '0:00'}
            </ThemedText>
          </View>

          <View style={[styles.detailItem, {
            borderBottomColor: colorScheme === 'dark' ? '#333' : '#f0f0f0', // 다크모드 대응
          }]}>
            <ThemedText style={styles.detailLabel}>가장 많이 한 부위</ThemedText>
            <ThemedText style={styles.detailValue}>
              {stats.topMuscle}
            </ThemedText>
          </View>

          <View style={[styles.detailItem, {
            borderBottomColor: colorScheme === 'dark' ? '#333' : '#f0f0f0', // 다크모드 대응
          }]}>
            <ThemedText style={styles.detailLabel}>평균 볼륨</ThemedText>
            <ThemedText style={styles.detailValue}>
              {stats.totalWorkouts > 0
                ? `${Math.floor(stats.totalVolume / stats.totalWorkouts).toLocaleString()}kg`
                : '0kg'}
            </ThemedText>
          </View>

          {/* 유산소 운동 통계 (있는 경우만 표시) */}
          {stats.totalDistance > 0 && (
            <View style={[styles.detailItem, {
              borderBottomColor: colorScheme === 'dark' ? '#333' : '#f0f0f0', // 다크모드 대응
            }]}>
              <ThemedText style={styles.detailLabel}>총 유산소 거리</ThemedText>
              <ThemedText style={styles.detailValue}>
                {stats.totalDistance.toFixed(1)}km
              </ThemedText>
            </View>
          )}

          {stats.cardioTime > 0 && (
            <View style={[styles.detailItem, {
              borderBottomColor: colorScheme === 'dark' ? '#333' : '#f0f0f0', // 다크모드 대응
            }]}>
              <ThemedText style={styles.detailLabel}>총 유산소 시간</ThemedText>
              <ThemedText style={styles.detailValue}>
                {Math.floor(stats.cardioTime / 60)}분
              </ThemedText>
            </View>
          )}
        </ThemedView>

        {/* 최근 운동 기록 */}
        <ThemedView style={[styles.recentSection, {
          backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
        }]}>
          <ThemedText type="subtitle" style={styles.recentTitle}>
            최근 운동 기록
          </ThemedText>
          {workoutHistory.slice(0, 5).map((workout, index) => (
            <View key={index} style={[styles.recentItem, {
              borderBottomColor: colorScheme === 'dark' ? '#333' : '#f0f0f0', // 다크모드 대응
            }]}>
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
    // paddingTop은 컴포넌트에서 동적으로 설정
    borderBottomWidth: 1,
    // borderBottomColor는 인라인으로 동적 적용 (다크모드 대응)
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
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
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
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
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
    // borderBottomColor는 인라인으로 동적 적용 (다크모드 대응)
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
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
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
    // borderBottomColor는 인라인으로 동적 적용 (다크모드 대응)
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