/**
 * 업적 및 배지 관리 스토어
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { achievements } from '@/data/achievements';
import { WorkoutSession } from '@/types';

interface UserAchievement {
  achievementId: string;
  unlockedAt: Date;
  progress: number;
  isNew?: boolean; // 새로 획득한 업적 표시
}

interface AchievementStore {
  // 사용자 업적
  userAchievements: UserAchievement[];
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  lastWorkoutDate: Date | null;

  // 통계
  stats: {
    totalWorkouts: number;
    totalVolume: number;
    totalDistance: number;
    totalDuration: number;
    uniqueExercises: Set<string>;
  };

  // 액션
  checkAchievements: (workout: WorkoutSession, allWorkouts: WorkoutSession[]) => string[];
  markAchievementAsSeen: (achievementId: string) => void;
  getUserAchievement: (achievementId: string) => UserAchievement | undefined;
  getAchievementProgress: (achievementId: string) => number;
  getUnlockedAchievements: () => string[];
  getNewAchievements: () => string[];
  resetNewAchievements: () => void;

  // 통계 업데이트
  updateStats: (workouts: WorkoutSession[]) => void;
  updateStreak: (workoutDate: Date) => void;
}

const useAchievementStore = create<AchievementStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      userAchievements: [],
      totalPoints: 0,
      currentStreak: 0,
      longestStreak: 0,
      lastWorkoutDate: null,
      stats: {
        totalWorkouts: 0,
        totalVolume: 0,
        totalDistance: 0,
        totalDuration: 0,
        uniqueExercises: new Set(),
      },

      // 업적 확인 및 업데이트
      checkAchievements: (workout, allWorkouts) => {
        const state = get();
        const newAchievements: string[] = [];

        // 통계 업데이트
        state.updateStats(allWorkouts);
        state.updateStreak(new Date(workout.date));

        // 각 업적 확인
        achievements.forEach(achievement => {
          const existingAchievement = state.userAchievements.find(
            ua => ua.achievementId === achievement.id
          );

          if (!existingAchievement || existingAchievement.progress < achievement.requiredValue) {
            let progress = 0;

            // 업적 타입별 진행도 계산
            switch (achievement.id) {
              // 운동 횟수
              case 'first-workout':
              case 'workout-10':
              case 'workout-50':
              case 'workout-100':
              case 'workout-365':
                progress = allWorkouts.length;
                break;

              // 연속 운동
              case 'streak-7':
              case 'streak-30':
              case 'streak-100':
                progress = state.currentStreak;
                break;

              // 총 볼륨
              case 'volume-1000':
              case 'volume-10000':
              case 'volume-100000':
              case 'volume-1000000':
                progress = state.stats.totalVolume;
                break;

              // 운동 시간 (단일 세션)
              case 'time-60':
              case 'time-120':
                progress = workout.totalDuration;
                break;

              // 총 운동 시간
              case 'total-time-100':
                progress = state.stats.totalDuration;
                break;

              // 유산소 거리
              case 'cardio-10km':
              case 'cardio-100km':
              case 'cardio-1000km':
                progress = state.stats.totalDistance;
                break;

              // 운동 다양성
              case 'variety-10':
              case 'variety-30':
                progress = state.stats.uniqueExercises.size;
                break;

              // 특별 업적
              case 'special-early-bird':
                const workoutHour = new Date(workout.startTime).getHours();
                if (workoutHour < 6) progress = 1;
                break;

              case 'special-night-owl':
                const nightHour = new Date(workout.startTime).getHours();
                if (nightHour >= 22) progress = 1;
                break;

              case 'special-weekend-warrior':
                progress = allWorkouts.filter(w => {
                  const day = new Date(w.date).getDay();
                  return day === 0 || day === 6;
                }).length;
                break;

              case 'special-new-year':
                const date = new Date(workout.date);
                if (date.getMonth() === 0 && date.getDate() === 1) progress = 1;
                break;
            }

            // 업적 달성 확인
            if (progress >= achievement.requiredValue) {
              if (!existingAchievement) {
                // 새로운 업적 달성
                const newAchievement: UserAchievement = {
                  achievementId: achievement.id,
                  unlockedAt: new Date(),
                  progress: achievement.requiredValue,
                  isNew: true,
                };

                set(state => ({
                  userAchievements: [...state.userAchievements, newAchievement],
                  totalPoints: state.totalPoints + achievement.points,
                }));

                newAchievements.push(achievement.id);
              } else {
                // 기존 업적 업데이트
                set(state => ({
                  userAchievements: state.userAchievements.map(ua =>
                    ua.achievementId === achievement.id
                      ? { ...ua, progress: achievement.requiredValue }
                      : ua
                  ),
                }));
              }
            } else if (existingAchievement && progress > existingAchievement.progress) {
              // 진행도 업데이트
              set(state => ({
                userAchievements: state.userAchievements.map(ua =>
                  ua.achievementId === achievement.id
                    ? { ...ua, progress }
                    : ua
                ),
              }));
            }
          }
        });

        return newAchievements;
      },

      // 업적을 본 것으로 표시
      markAchievementAsSeen: (achievementId) => {
        set(state => ({
          userAchievements: state.userAchievements.map(ua =>
            ua.achievementId === achievementId
              ? { ...ua, isNew: false }
              : ua
          ),
        }));
      },

      // 특정 업적 가져오기
      getUserAchievement: (achievementId) => {
        return get().userAchievements.find(ua => ua.achievementId === achievementId);
      },

      // 업적 진행도 가져오기
      getAchievementProgress: (achievementId) => {
        const userAchievement = get().getUserAchievement(achievementId);
        return userAchievement?.progress || 0;
      },

      // 획득한 업적 목록
      getUnlockedAchievements: () => {
        const achievement = achievements.find(a => a.id);
        return get().userAchievements
          .filter(ua => {
            const achievement = achievements.find(a => a.id === ua.achievementId);
            return achievement && ua.progress >= achievement.requiredValue;
          })
          .map(ua => ua.achievementId);
      },

      // 새로운 업적 목록
      getNewAchievements: () => {
        return get().userAchievements
          .filter(ua => ua.isNew)
          .map(ua => ua.achievementId);
      },

      // 새로운 업적 초기화
      resetNewAchievements: () => {
        set(state => ({
          userAchievements: state.userAchievements.map(ua => ({ ...ua, isNew: false })),
        }));
      },

      // 통계 업데이트
      updateStats: (workouts) => {
        const totalVolume = workouts.reduce((sum, w) => {
          return sum + w.exercises.reduce((wSum, e) => {
            return wSum + e.sets.reduce((sSum, s) => {
              return sSum + (s.completed && s.weight ? s.weight * s.reps : 0);
            }, 0);
          }, 0);
        }, 0);

        const totalDistance = workouts.reduce((sum, w) => {
          return sum + w.exercises.reduce((wSum, e) => {
            return wSum + e.sets.reduce((sSum, s) => {
              return sSum + (s.completed && s.distance ? s.distance : 0);
            }, 0);
          }, 0);
        }, 0);

        const totalDuration = workouts.reduce((sum, w) => sum + w.totalDuration, 0);

        const uniqueExercises = new Set<string>();
        workouts.forEach(w => {
          w.exercises.forEach(e => {
            uniqueExercises.add(e.exerciseTypeId);
          });
        });

        set({
          stats: {
            totalWorkouts: workouts.length,
            totalVolume,
            totalDistance,
            totalDuration,
            uniqueExercises,
          },
        });
      },

      // 연속 운동 업데이트
      updateStreak: (workoutDate) => {
        const state = get();
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const workout = new Date(workoutDate);
        workout.setHours(0, 0, 0, 0);

        if (state.lastWorkoutDate) {
          const lastDate = new Date(state.lastWorkoutDate);
          lastDate.setHours(0, 0, 0, 0);

          const dayDiff = Math.floor(
            (workout.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24)
          );

          if (dayDiff === 1) {
            // 연속 운동
            const newStreak = state.currentStreak + 1;
            set({
              currentStreak: newStreak,
              longestStreak: Math.max(newStreak, state.longestStreak),
              lastWorkoutDate: workoutDate,
            });
          } else if (dayDiff === 0) {
            // 같은 날 운동
            set({ lastWorkoutDate: workoutDate });
          } else {
            // 연속 끊김
            set({
              currentStreak: 1,
              lastWorkoutDate: workoutDate,
            });
          }
        } else {
          // 첫 운동
          set({
            currentStreak: 1,
            longestStreak: 1,
            lastWorkoutDate: workoutDate,
          });
        }
      },
    }),
    {
      name: 'achievement-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        userAchievements: state.userAchievements,
        totalPoints: state.totalPoints,
        currentStreak: state.currentStreak,
        longestStreak: state.longestStreak,
        lastWorkoutDate: state.lastWorkoutDate,
      }),
    }
  )
);

export default useAchievementStore;