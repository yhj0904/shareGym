import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession, Exercise, Set } from '@/types';
import { exerciseDatabase } from '@/data/exercises';

// 운동 패턴 분석을 위한 인터페이스
interface ExercisePattern {
  exerciseTypeId: string;
  averageRestTime: number; // 평균 휴식 시간
  averageSetsCount: number; // 평균 세트 수
  typicalWeight: number; // 일반적인 무게
  typicalReps: number; // 일반적인 반복 수
  hardestSetIndex: number; // 가장 힘든 세트 번호 (보통 3세트)
  lastWorkoutWeight: number; // 최근 운동 무게
  personalRecord: number; // 개인 최고 기록
  totalVolume: number; // 총 볼륨 누적
  workoutCount: number; // 해당 운동 수행 횟수
}

// 스마트 응원 트리거 타입
type CheerTrigger =
  | 'firstSet' // 첫 세트 시작
  | 'lastSet' // 마지막 세트
  | 'hardSet' // 힘든 세트 (보통 3세트)
  | 'newPR' // 새로운 개인 기록
  | 'heavierWeight' // 이전보다 무거운 무게
  | 'longRest' // 긴 휴식 감지
  | 'struggling' // 힘들어하는 상황
  | 'comeback' // 오랜만에 운동
  | 'consistency' // 꾸준한 운동
  | 'volumeIncrease'; // 볼륨 증가

// 개인화된 응원 메시지
interface PersonalizedCheer {
  trigger: CheerTrigger;
  message: string;
  emoji: string;
  priority: number; // 우선순위 (높을수록 먼저 표시)
  context?: any; // 추가 컨텍스트 정보
}

interface WorkoutAnalyticsStore {
  // 운동 패턴 데이터
  exercisePatterns: Record<string, ExercisePattern>;

  // 사용자 운동 통계
  userStats: {
    lastWorkoutDate: Date | null;
    workoutStreak: number;
    totalWorkouts: number;
    averageWorkoutDuration: number;
    preferredWorkoutTime: string; // 'morning' | 'afternoon' | 'evening'
    strongestExercises: string[]; // 잘하는 운동들
    weakestExercises: string[]; // 개선이 필요한 운동들
  };

  // 분석 액션
  analyzeWorkoutSession: (session: WorkoutSession) => void;
  updateExercisePattern: (exerciseId: string, exercise: Exercise) => void;

  // 스마트 응원 생성
  generateSmartCheer: (
    currentExercise: Exercise,
    currentSetIndex: number,
    totalSets: number,
    currentWeight?: number,
    currentReps?: number
  ) => PersonalizedCheer | null;

  // 운동 패턴 예측
  predictRestTime: (exerciseId: string, setIndex: number) => number;
  predictNextWeight: (exerciseId: string) => number;
  isStruggling: (restTime: number, exerciseId: string) => boolean;

  // 통계 업데이트
  updateUserStats: (session: WorkoutSession) => void;
  getDaysSinceLastWorkout: () => number;

  // 개인 기록 체크
  checkPersonalRecord: (exerciseId: string, weight: number) => boolean;
  getProgressMessage: (exerciseId: string, weight: number) => string;
}

// 맞춤형 응원 메시지 템플릿
const PERSONALIZED_CHEER_TEMPLATES = {
  firstSet: [
    { emoji: '🚀', message: '오늘도 시작이 반! 가볍게 시작해봐요!' },
    { emoji: '💪', message: '첫 세트는 워밍업! 천천히 해요' },
    { emoji: '🎯', message: '목표를 향해 첫 발걸음!' },
  ],
  lastSet: [
    { emoji: '🔥', message: '마지막 세트! 끝까지 불태워요!' },
    { emoji: '💯', message: '라스트! 여기서 진짜가 나타나요!' },
    { emoji: '🏆', message: '마지막까지 집중! 거의 다 왔어요!' },
  ],
  hardSet: [
    { emoji: '💪', message: '3세트가 진짜죠! 힘내세요!' },
    { emoji: '⚡', message: '여기가 고비! 넘어서면 성장해요!' },
    { emoji: '🔥', message: '힘든 만큼 근육이 자라요!' },
  ],
  newPR: [
    { emoji: '🎉', message: '새로운 기록 달성! {weight}kg 대단해요!' },
    { emoji: '🏆', message: '개인 최고 기록 경신! 축하해요!' },
    { emoji: '🌟', message: 'PR 갱신! 당신의 한계는 어디까지?' },
  ],
  heavierWeight: [
    { emoji: '📈', message: '지난번보다 {diff}kg 늘었네요! 발전하고 있어요!' },
    { emoji: '💪', message: '무게를 올렸군요! 도전 정신 최고!' },
    { emoji: '🚀', message: '점진적 과부하 실천 중! 완벽해요!' },
  ],
  longRest: [
    { emoji: '😤', message: '힘들었나봐요? 충분히 쉬고 다시 도전!' },
    { emoji: '💭', message: '휴식도 운동의 일부! 호흡 가다듬고 가요' },
    { emoji: '⏱️', message: '준비되면 시작하세요. 서두르지 마세요!' },
  ],
  struggling: [
    { emoji: '💪', message: '힘들 때가 성장할 때! 조금만 더!' },
    { emoji: '🔥', message: '포기하지 마! 할 수 있어요!' },
    { emoji: '👊', message: '한계를 넘어서는 순간이에요!' },
  ],
  comeback: [
    { emoji: '🎉', message: '{days}일 만의 운동! 다시 시작이 중요해요!' },
    { emoji: '💪', message: '돌아오셨네요! 오늘부터 다시 시작!' },
    { emoji: '🌟', message: '컴백! 꾸준함을 되찾아봐요!' },
  ],
  consistency: [
    { emoji: '🔥', message: '{streak}일 연속 운동! 대단한 꾸준함!' },
    { emoji: '💯', message: '규칙적인 운동 습관 최고예요!' },
    { emoji: '👑', message: '운동 루틴의 왕! 계속 이어가요!' },
  ],
  volumeIncrease: [
    { emoji: '📊', message: '오늘 볼륨 {percent}% 증가! 성장 중!' },
    { emoji: '💪', message: '운동량이 늘었어요! 체력이 좋아지고 있어요!' },
    { emoji: '🚀', message: '볼륨 신기록! 확실히 강해지고 있네요!' },
  ],
};

const useWorkoutAnalyticsStore = create<WorkoutAnalyticsStore>()(
  persist(
    (set, get) => ({
      exercisePatterns: {},

      userStats: {
        lastWorkoutDate: null,
        workoutStreak: 0,
        totalWorkouts: 0,
        averageWorkoutDuration: 0,
        preferredWorkoutTime: 'evening',
        strongestExercises: [],
        weakestExercises: [],
      },

      // 운동 세션 분석
      analyzeWorkoutSession: (session) => {
        const state = get();

        // 각 운동별 패턴 업데이트
        session.exercises.forEach(exercise => {
          state.updateExercisePattern(exercise.exerciseTypeId, exercise);
        });

        // 사용자 통계 업데이트
        state.updateUserStats(session);
      },

      // 운동 패턴 업데이트
      updateExercisePattern: (exerciseId, exercise) => {
        const patterns = get().exercisePatterns;
        const existing = patterns[exerciseId] || {
          exerciseTypeId: exerciseId,
          averageRestTime: 90,
          averageSetsCount: 3,
          typicalWeight: 0,
          typicalReps: 0,
          hardestSetIndex: 2, // 3세트가 보통 가장 힘듦
          lastWorkoutWeight: 0,
          personalRecord: 0,
          totalVolume: 0,
          workoutCount: 0,
        };

        // 완료된 세트만 분석
        const completedSets = exercise.sets.filter(s => s.completed);
        if (completedSets.length === 0) return;

        // 평균 무게와 반복수 계산
        const weights = completedSets.map(s => s.weight || 0).filter(w => w > 0);
        const reps = completedSets.map(s => s.reps).filter(r => r > 0);

        const avgWeight = weights.length > 0
          ? weights.reduce((a, b) => a + b, 0) / weights.length
          : existing.typicalWeight;

        const avgReps = reps.length > 0
          ? reps.reduce((a, b) => a + b, 0) / reps.length
          : existing.typicalReps;

        // 최대 무게 확인
        const maxWeight = Math.max(...weights, existing.personalRecord);

        // 총 볼륨 계산
        const sessionVolume = completedSets.reduce((total, set) => {
          return total + (set.weight || 0) * set.reps;
        }, 0);

        // 패턴 업데이트
        const updated: ExercisePattern = {
          ...existing,
          averageSetsCount: (existing.averageSetsCount * existing.workoutCount + completedSets.length) / (existing.workoutCount + 1),
          typicalWeight: (existing.typicalWeight * existing.workoutCount + avgWeight) / (existing.workoutCount + 1),
          typicalReps: (existing.typicalReps * existing.workoutCount + avgReps) / (existing.workoutCount + 1),
          lastWorkoutWeight: avgWeight,
          personalRecord: maxWeight,
          totalVolume: existing.totalVolume + sessionVolume,
          workoutCount: existing.workoutCount + 1,
          averageRestTime: exercise.restTime || existing.averageRestTime,
        };

        set({
          exercisePatterns: {
            ...patterns,
            [exerciseId]: updated,
          },
        });
      },

      // 스마트 응원 생성
      generateSmartCheer: (currentExercise, currentSetIndex, totalSets, currentWeight, currentReps) => {
        const state = get();
        const pattern = state.exercisePatterns[currentExercise.exerciseTypeId];
        const exerciseInfo = exerciseDatabase.find(e => e.id === currentExercise.exerciseTypeId);
        const exerciseName = exerciseInfo?.nameKo || '운동';

        const cheers: PersonalizedCheer[] = [];

        // 1. 컴백 체크 (7일 이상 운동 안함)
        const daysSince = state.getDaysSinceLastWorkout();
        if (daysSince > 7 && currentSetIndex === 0) {
          const template = PERSONALIZED_CHEER_TEMPLATES.comeback[Math.floor(Math.random() * 3)];
          cheers.push({
            trigger: 'comeback',
            message: template.message.replace('{days}', daysSince.toString()),
            emoji: template.emoji,
            priority: 10,
          });
        }

        // 2. 개인 기록 체크
        if (currentWeight && pattern && currentWeight > pattern.personalRecord) {
          const template = PERSONALIZED_CHEER_TEMPLATES.newPR[Math.floor(Math.random() * 3)];
          cheers.push({
            trigger: 'newPR',
            message: template.message.replace('{weight}', currentWeight.toString()),
            emoji: template.emoji,
            priority: 9,
            context: { weight: currentWeight, exercise: exerciseName },
          });
        }

        // 3. 무게 증가 체크
        if (currentWeight && pattern && currentWeight > pattern.lastWorkoutWeight) {
          const diff = currentWeight - pattern.lastWorkoutWeight;
          const template = PERSONALIZED_CHEER_TEMPLATES.heavierWeight[Math.floor(Math.random() * 3)];
          cheers.push({
            trigger: 'heavierWeight',
            message: template.message.replace('{diff}', diff.toFixed(1)),
            emoji: template.emoji,
            priority: 8,
            context: { difference: diff },
          });
        }

        // 4. 첫 세트 응원
        if (currentSetIndex === 0) {
          const template = PERSONALIZED_CHEER_TEMPLATES.firstSet[Math.floor(Math.random() * 3)];
          cheers.push({
            trigger: 'firstSet',
            message: template.message,
            emoji: template.emoji,
            priority: 5,
          });
        }

        // 5. 마지막 세트 응원
        if (currentSetIndex === totalSets - 1 && totalSets > 1) {
          const template = PERSONALIZED_CHEER_TEMPLATES.lastSet[Math.floor(Math.random() * 3)];
          cheers.push({
            trigger: 'lastSet',
            message: template.message,
            emoji: template.emoji,
            priority: 7,
          });
        }

        // 6. 힘든 세트 응원 (보통 3세트)
        if (pattern && currentSetIndex === pattern.hardestSetIndex) {
          const template = PERSONALIZED_CHEER_TEMPLATES.hardSet[Math.floor(Math.random() * 3)];
          cheers.push({
            trigger: 'hardSet',
            message: template.message,
            emoji: template.emoji,
            priority: 6,
          });
        }

        // 7. 꾸준함 응원
        if (state.userStats.workoutStreak >= 3 && currentSetIndex === 0) {
          const template = PERSONALIZED_CHEER_TEMPLATES.consistency[Math.floor(Math.random() * 3)];
          cheers.push({
            trigger: 'consistency',
            message: template.message.replace('{streak}', state.userStats.workoutStreak.toString()),
            emoji: template.emoji,
            priority: 4,
          });
        }

        // 우선순위가 가장 높은 응원 반환
        if (cheers.length > 0) {
          cheers.sort((a, b) => b.priority - a.priority);
          return cheers[0];
        }

        return null;
      },

      // 휴식 시간 예측
      predictRestTime: (exerciseId, setIndex) => {
        const pattern = get().exercisePatterns[exerciseId];
        if (!pattern) return 90; // 기본 90초

        // 세트가 진행될수록 휴식 시간 증가
        const baseRest = pattern.averageRestTime;
        const increment = setIndex * 10; // 세트당 10초씩 증가

        return Math.min(baseRest + increment, 180); // 최대 3분
      },

      // 다음 무게 예측
      predictNextWeight: (exerciseId) => {
        const pattern = get().exercisePatterns[exerciseId];
        if (!pattern) return 0;

        // 일반적으로 사용하는 무게 반환
        return pattern.typicalWeight;
      },

      // 힘들어하는지 감지
      isStruggling: (restTime, exerciseId) => {
        const pattern = get().exercisePatterns[exerciseId];
        if (!pattern) return false;

        // 평균 휴식 시간보다 50% 이상 길면 힘들어하는 것으로 판단
        return restTime > pattern.averageRestTime * 1.5;
      },

      // 사용자 통계 업데이트
      updateUserStats: (session) => {
        const state = get();
        const stats = state.userStats;

        // 마지막 운동 날짜 확인
        const lastDate = stats.lastWorkoutDate ? new Date(stats.lastWorkoutDate) : null;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 스트릭 계산
        let newStreak = stats.workoutStreak;
        if (lastDate) {
          const daysDiff = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff === 1) {
            newStreak += 1; // 연속
          } else if (daysDiff > 1) {
            newStreak = 1; // 리셋
          }
        } else {
          newStreak = 1;
        }

        // 운동 시간대 파악
        const hour = session.startTime.getHours();
        let timeOfDay: string;
        if (hour < 12) timeOfDay = 'morning';
        else if (hour < 18) timeOfDay = 'afternoon';
        else timeOfDay = 'evening';

        // 평균 운동 시간 계산
        const avgDuration = (stats.averageWorkoutDuration * stats.totalWorkouts + session.totalDuration)
          / (stats.totalWorkouts + 1);

        set({
          userStats: {
            ...stats,
            lastWorkoutDate: session.date,
            workoutStreak: newStreak,
            totalWorkouts: stats.totalWorkouts + 1,
            averageWorkoutDuration: avgDuration,
            preferredWorkoutTime: timeOfDay,
          },
        });
      },

      // 마지막 운동으로부터 경과일 계산
      getDaysSinceLastWorkout: () => {
        const lastDate = get().userStats.lastWorkoutDate;
        if (!lastDate) return 999;

        const today = new Date();
        const last = new Date(lastDate);
        const diffTime = Math.abs(today.getTime() - last.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        return diffDays;
      },

      // 개인 기록 체크
      checkPersonalRecord: (exerciseId, weight) => {
        const pattern = get().exercisePatterns[exerciseId];
        if (!pattern) return true; // 첫 운동은 항상 PR

        return weight > pattern.personalRecord;
      },

      // 진행 상황 메시지
      getProgressMessage: (exerciseId, weight) => {
        const pattern = get().exercisePatterns[exerciseId];
        if (!pattern || pattern.workoutCount < 2) {
          return '좋은 시작이에요! 💪';
        }

        const diff = weight - pattern.lastWorkoutWeight;
        if (diff > 0) {
          return `지난번보다 ${diff.toFixed(1)}kg ↑ 발전했어요! 🚀`;
        } else if (diff < 0) {
          return `오늘은 가볍게! 폼에 집중해요 🎯`;
        } else {
          return `꾸준함이 최고! 안정적이네요 💯`;
        }
      },
    }),
    {
      name: 'workout-analytics-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        exercisePatterns: state.exercisePatterns,
        userStats: state.userStats,
      }),
    }
  )
);

export default useWorkoutAnalyticsStore;