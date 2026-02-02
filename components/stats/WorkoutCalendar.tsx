/**
 * 월별 운동 캘린더 컴포넌트
 * 운동한 날짜를 시각적으로 표시하고 강도를 색상으로 구분
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { WorkoutSession } from '@/types';

interface WorkoutCalendarProps {
  workoutHistory: WorkoutSession[];
}

export default function WorkoutCalendar({ workoutHistory }: WorkoutCalendarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const [currentDate, setCurrentDate] = useState(new Date());

  // 현재 월의 첫날과 마지막날 계산
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const lastDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

  // 캘린더 시작일 (이전 달 일요일부터)
  const startDate = new Date(firstDayOfMonth);
  startDate.setDate(startDate.getDate() - startDate.getDay());

  // 캘린더 데이터 생성 (6주 * 7일 = 42일)
  const calendarDays = useMemo(() => {
    const days = [];
    const date = new Date(startDate);

    // 운동 기록을 날짜별로 매핑
    const workoutMap = new Map<string, WorkoutSession[]>();
    workoutHistory.forEach(workout => {
      const dateKey = new Date(workout.date).toDateString();
      if (!workoutMap.has(dateKey)) {
        workoutMap.set(dateKey, []);
      }
      workoutMap.get(dateKey)?.push(workout);
    });

    for (let i = 0; i < 42; i++) {
      const dayDate = new Date(date);
      const dateKey = dayDate.toDateString();
      const workouts = workoutMap.get(dateKey) || [];

      days.push({
        date: dayDate,
        day: dayDate.getDate(),
        isCurrentMonth: dayDate.getMonth() === currentDate.getMonth(),
        isToday: dateKey === new Date().toDateString(),
        workouts,
        hasWorkout: workouts.length > 0,
        workoutCount: workouts.length,
        totalDuration: workouts.reduce((sum, w) => sum + w.totalDuration, 0),
      });

      date.setDate(date.getDate() + 1);
    }

    return days;
  }, [currentDate, workoutHistory]);

  // 이전/다음 달로 이동
  const goToPreviousMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // 운동 강도에 따른 색상 결정
  const getWorkoutColor = (duration: number) => {
    if (duration >= 3600) return colors.tint; // 1시간 이상: 진한 색
    if (duration >= 1800) return colors.tint + 'AA'; // 30분 이상: 중간
    return colors.tint + '66'; // 30분 미만: 연한 색
  };

  // 월별 통계
  const monthStats = useMemo(() => {
    const monthWorkouts = workoutHistory.filter(w => {
      const workoutDate = new Date(w.date);
      return workoutDate.getMonth() === currentDate.getMonth() &&
             workoutDate.getFullYear() === currentDate.getFullYear();
    });

    return {
      totalWorkouts: monthWorkouts.length,
      totalDuration: monthWorkouts.reduce((sum, w) => sum + w.totalDuration, 0),
      averageDuration: monthWorkouts.length > 0
        ? Math.floor(monthWorkouts.reduce((sum, w) => sum + w.totalDuration, 0) / monthWorkouts.length)
        : 0,
    };
  }, [currentDate, workoutHistory]);

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.card }]}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable onPress={goToPreviousMonth} style={styles.navButton}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </Pressable>

        <ThemedText style={styles.monthTitle}>
          {currentDate.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
        </ThemedText>

        <Pressable onPress={goToNextMonth} style={styles.navButton}>
          <Ionicons name="chevron-forward" size={24} color={colors.text} />
        </Pressable>
      </View>

      {/* 월간 통계 */}
      <View style={[styles.monthStatsContainer, {
        borderColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
      }]}>
        <View style={styles.monthStat}>
          <ThemedText style={styles.monthStatValue}>{monthStats.totalWorkouts}</ThemedText>
          <ThemedText style={styles.monthStatLabel}>운동 일수</ThemedText>
        </View>
        <View style={styles.monthStat}>
          <ThemedText style={styles.monthStatValue}>
            {Math.floor(monthStats.totalDuration / 3600)}h {Math.floor((monthStats.totalDuration % 3600) / 60)}m
          </ThemedText>
          <ThemedText style={styles.monthStatLabel}>총 운동 시간</ThemedText>
        </View>
        <View style={styles.monthStat}>
          <ThemedText style={styles.monthStatValue}>
            {Math.floor(monthStats.averageDuration / 60)}분
          </ThemedText>
          <ThemedText style={styles.monthStatLabel}>평균 시간</ThemedText>
        </View>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekDays}>
        {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
          <ThemedText
            key={day}
            style={[
              styles.weekDay,
              index === 0 && { color: '#ff4444' }, // 일요일 빨간색
              index === 6 && { color: '#4444ff' }, // 토요일 파란색
            ]}
          >
            {day}
          </ThemedText>
        ))}
      </View>

      {/* 캘린더 그리드 */}
      <View style={styles.calendar}>
        {calendarDays.map((day, index) => (
          <Pressable
            key={index}
            style={[
              styles.dayCell,
              !day.isCurrentMonth && styles.otherMonth,
              day.isToday && { borderColor: colors.tint, borderWidth: 2 },
            ]}
          >
            <View style={styles.dayContent}>
              <ThemedText
                style={[
                  styles.dayNumber,
                  !day.isCurrentMonth && styles.otherMonthText,
                  day.isToday && { color: colors.tint, fontWeight: 'bold' },
                ]}
              >
                {day.day}
              </ThemedText>

              {/* 운동 표시 */}
              {day.hasWorkout && (
                <View style={styles.workoutIndicatorContainer}>
                  <View
                    style={[
                      styles.workoutIndicator,
                      { backgroundColor: getWorkoutColor(day.totalDuration) },
                    ]}
                  >
                    {day.workoutCount > 1 && (
                      <ThemedText style={styles.workoutCount}>{day.workoutCount}</ThemedText>
                    )}
                  </View>
                </View>
              )}
            </View>
          </Pressable>
        ))}
      </View>

      {/* 범례 */}
      <View style={[styles.legend, {
        borderTopColor: colorScheme === 'dark' ? '#333' : '#f0f0f0',
      }]}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.tint + '66' }]} />
          <ThemedText style={styles.legendText}>~30분</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.tint + 'AA' }]} />
          <ThemedText style={styles.legendText}>30분~1시간</ThemedText>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.tint }]} />
          <ThemedText style={styles.legendText}>1시간 이상</ThemedText>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  navButton: {
    padding: 5,
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  monthStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    // borderColor는 동적으로 적용됨 (다크모드 대응)
  },
  monthStat: {
    alignItems: 'center',
  },
  monthStatValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  monthStatLabel: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  weekDay: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.8,
  },
  calendar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%', // 7일
    aspectRatio: 1,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  dayContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  otherMonth: {
    opacity: 0.3,
  },
  dayNumber: {
    fontSize: 14,
    lineHeight: 18,
  },
  otherMonthText: {
    opacity: 0.5,
  },
  workoutIndicatorContainer: {
    marginTop: 2,
    height: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutCount: {
    fontSize: 6,
    color: 'white',
    fontWeight: 'bold',
    lineHeight: 8,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    // borderTopColor는 동적으로 적용됨 (다크모드 대응)
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    fontSize: 11,
    opacity: 0.6,
  },
});