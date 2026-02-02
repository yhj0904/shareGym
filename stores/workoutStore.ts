import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutSession, Exercise, Set, ExerciseType, Routine } from '@/types';
import uuid from 'react-native-uuid';

interface WorkoutStore {
  // 현재 세션
  currentSession: WorkoutSession | null;
  activeExerciseIndex: number;
  isWorkoutStarted: boolean; // 실제 운동 시작 여부

  // 타이머
  sessionStartTime: Date | null;
  sessionTimer: number;
  restTimer: number;
  restTimerActive: boolean;

  // 최근 운동
  lastWorkout: WorkoutSession | null;
  workoutHistory: WorkoutSession[];

  // 액션 - 세션 관리
  startSession: (fromRoutine?: Routine) => void;
  startWorkout: () => void; // 실제 운동 시작 (타이머 시작)
  endSession: () => Promise<WorkoutSession | null>;
  cancelSession: () => void;

  // 액션 - 운동 관리
  addExercise: (exerciseType: ExerciseType) => void;
  removeExercise: (exerciseId: string) => void;
  setActiveExercise: (index: number) => void;
  updateExerciseRestTime: (exerciseId: string, restTime: number) => void;
  updateExerciseNotes: (exerciseId: string, notes: string) => void;

  // 액션 - 세트 관리
  addSet: (exerciseId: string, set?: Partial<Set>) => void;
  updateSet: (exerciseId: string, setId: string, updates: Partial<Set>) => void;
  removeSet: (exerciseId: string, setId: string) => void;
  toggleSetComplete: (exerciseId: string, setId: string) => void;

  // 빠른 액션
  copyLastSet: (exerciseId: string) => void;
  copyLastWorkout: () => void;
  loadFromRoutine: (routine: Routine) => void;

  // 타이머 관리
  startRestTimer: (duration: number) => void;
  stopRestTimer: () => void;
  updateSessionTimer: () => void;

  // 유틸리티
  getExerciseById: (exerciseId: string) => Exercise | undefined;
  getTotalVolume: () => number;
  getTotalSets: () => number;
  getCompletedSets: () => number;
}

const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      // 초기 상태
      currentSession: null,
      activeExerciseIndex: 0,
      isWorkoutStarted: false,
      sessionStartTime: null,
      sessionTimer: 0,
      restTimer: 0,
      restTimerActive: false,
      lastWorkout: null,
      workoutHistory: [],

      // 세션 관리
      startSession: (fromRoutine) => {
        const now = new Date();
        const newSession: WorkoutSession = {
          id: uuid.v4() as string,
          userId: 'current-user', // TODO: 실제 사용자 ID로 변경
          date: now,
          startTime: now,
          exercises: [],
          totalDuration: 0,
          isPublic: true,
        };

        if (fromRoutine) {
          // 루틴에서 운동 추가
          fromRoutine.exercises.forEach((routineExercise) => {
            const exercise: Exercise = {
              id: uuid.v4() as string,
              exerciseTypeId: routineExercise.exerciseTypeId,
              sets: Array.from({ length: routineExercise.sets }, (_, i) => ({
                id: uuid.v4() as string,
                reps: routineExercise.reps,
                weight: routineExercise.weight,
                completed: false,
                orderIndex: i,
              })),
              restTime: routineExercise.restTime,
              orderIndex: newSession.exercises.length,
            };
            newSession.exercises.push(exercise);
          });
        }

        set({
          currentSession: newSession,
          sessionStartTime: null, // 타이머는 startWorkout이 호출될 때 시작
          sessionTimer: 0,
          activeExerciseIndex: 0,
          isWorkoutStarted: false, // 운동이 시작되지 않은 상태
        });
      },

      // 실제 운동 시작 (타이머 시작)
      startWorkout: () => {
        const state = get();
        if (!state.currentSession || state.isWorkoutStarted) return;

        set({
          isWorkoutStarted: true,
          sessionStartTime: new Date(),
          sessionTimer: 0,
        });
      },

      endSession: async () => {
        const state = get();
        if (!state.currentSession) return null;

        const endTime = new Date();
        // 실제 운동 시작 시간을 기준으로 duration 계산
        // sessionStartTime이 없으면 currentSession.startTime 사용 (startWorkout이 호출되지 않은 경우)
        const actualStartTime = state.sessionStartTime || state.currentSession.startTime;
        const completedSession: WorkoutSession = {
          ...state.currentSession,
          endTime,
          totalDuration: Math.floor((endTime.getTime() - new Date(actualStartTime).getTime()) / 1000),
        };

        // 히스토리에 추가
        const newHistory = [completedSession, ...state.workoutHistory.slice(0, 99)]; // 최대 100개 보관

        set({
          lastWorkout: completedSession,
          workoutHistory: newHistory,
          currentSession: null,
          sessionStartTime: null,
          sessionTimer: 0,
          activeExerciseIndex: 0,
          isWorkoutStarted: false,
        });

        return completedSession;
      },

      cancelSession: () => {
        set({
          currentSession: null,
          sessionStartTime: null,
          sessionTimer: 0,
          activeExerciseIndex: 0,
          restTimerActive: false,
          restTimer: 0,
          isWorkoutStarted: false,
        });
      },

      // 운동 관리
      addExercise: (exerciseType) => {
        const state = get();
        if (!state.currentSession) return;

        const newExercise: Exercise = {
          id: uuid.v4() as string,
          exerciseTypeId: exerciseType.id,
          exerciseType,
          sets: [],
          restTime: 90, // 기본 휴식 시간
          orderIndex: state.currentSession.exercises.length,
        };

        set({
          currentSession: {
            ...state.currentSession,
            exercises: [...state.currentSession.exercises, newExercise],
          },
        });
      },

      removeExercise: (exerciseId) => {
        const state = get();
        if (!state.currentSession) return;

        set({
          currentSession: {
            ...state.currentSession,
            exercises: state.currentSession.exercises.filter(e => e.id !== exerciseId),
          },
        });
      },

      setActiveExercise: (index) => {
        set({ activeExerciseIndex: index });
      },

      // 운동별 휴식 시간 업데이트
      updateExerciseRestTime: (exerciseId, restTime) => {
        const state = get();
        if (!state.currentSession) return;

        const updatedExercises = state.currentSession.exercises.map(exercise =>
          exercise.id === exerciseId
            ? { ...exercise, restTime }
            : exercise
        );

        set({
          currentSession: {
            ...state.currentSession,
            exercises: updatedExercises,
          },
        });
      },

      // 운동별 메모 업데이트
      updateExerciseNotes: (exerciseId, notes) => {
        const state = get();
        if (!state.currentSession) return;

        const updatedExercises = state.currentSession.exercises.map(exercise =>
          exercise.id === exerciseId
            ? { ...exercise, notes: notes || undefined }
            : exercise
        );

        set({
          currentSession: {
            ...state.currentSession,
            exercises: updatedExercises,
          },
        });
      },

      // 세트 관리
      addSet: (exerciseId, setData) => {
        const state = get();
        if (!state.currentSession) return;

        const exercise = state.currentSession.exercises.find(e => e.id === exerciseId);
        if (!exercise) return;

        // 이전 세트의 정보를 기본값으로 사용
        const lastSet = exercise.sets[exercise.sets.length - 1];

        // 운동 타입에 따른 기본값 설정
        const exerciseType = exercise.exerciseType;
        const isCardio = exerciseType?.category === 'cardio';
        const unit = exerciseType?.unit || 'kg';

        const newSet: Set = {
          id: uuid.v4() as string,
          reps: setData?.reps ?? lastSet?.reps ?? 10,
          weight: unit === 'kg' ? (setData?.weight ?? lastSet?.weight ?? 0) : undefined,
          distance: unit === 'km' ? (setData?.distance ?? lastSet?.distance ?? 0) : undefined,
          level: unit === 'level' ? (setData?.level ?? lastSet?.level ?? 1) : undefined,
          duration: isCardio && unit !== 'reps' ? (setData?.duration ?? lastSet?.duration ?? 0) : undefined,
          completed: setData?.completed ?? false,
          orderIndex: exercise.sets.length,
        };

        const updatedExercises = state.currentSession.exercises.map(e =>
          e.id === exerciseId
            ? { ...e, sets: [...e.sets, newSet] }
            : e
        );

        set({
          currentSession: {
            ...state.currentSession,
            exercises: updatedExercises,
          },
        });
      },

      updateSet: (exerciseId, setId, updates) => {
        const state = get();
        if (!state.currentSession) return;

        const updatedExercises = state.currentSession.exercises.map(exercise => {
          if (exercise.id === exerciseId) {
            return {
              ...exercise,
              sets: exercise.sets.map(s =>
                s.id === setId ? { ...s, ...updates } : s
              ),
            };
          }
          return exercise;
        });

        set({
          currentSession: {
            ...state.currentSession,
            exercises: updatedExercises,
          },
        });
      },

      removeSet: (exerciseId, setId) => {
        const state = get();
        if (!state.currentSession) return;

        const updatedExercises = state.currentSession.exercises.map(exercise => {
          if (exercise.id === exerciseId) {
            return {
              ...exercise,
              sets: exercise.sets.filter(s => s.id !== setId),
            };
          }
          return exercise;
        });

        set({
          currentSession: {
            ...state.currentSession,
            exercises: updatedExercises,
          },
        });
      },

      toggleSetComplete: (exerciseId, setId) => {
        const state = get();
        if (!state.currentSession) return;

        const exercise = state.currentSession.exercises.find(e => e.id === exerciseId);
        const set = exercise?.sets.find(s => s.id === setId);
        if (set) {
          state.updateSet(exerciseId, setId, { completed: !set.completed });

          // 세트 완료시 휴식 타이머 자동 시작
          if (!set.completed && exercise?.restTime) {
            state.startRestTimer(exercise.restTime);
          }
        }
      },

      // 빠른 액션
      copyLastSet: (exerciseId) => {
        const state = get();
        if (!state.currentSession) return;

        const exercise = state.currentSession.exercises.find(e => e.id === exerciseId);
        if (!exercise || exercise.sets.length === 0) return;

        const lastSet = exercise.sets[exercise.sets.length - 1];
        // 모든 필드를 복사 (weight, distance, level, duration 등)
        state.addSet(exerciseId, {
          reps: lastSet.reps,
          weight: lastSet.weight,
          distance: lastSet.distance,
          level: lastSet.level,
          duration: lastSet.duration,
          completed: false,
        });
      },

      copyLastWorkout: () => {
        const state = get();
        if (!state.lastWorkout) return;

        const now = new Date();
        const newSession: WorkoutSession = {
          id: uuid.v4() as string,
          userId: 'current-user',
          date: now,
          startTime: now,
          exercises: state.lastWorkout.exercises.map(exercise => ({
            ...exercise,
            id: uuid.v4() as string,
            sets: exercise.sets.map(s => ({
              ...s,
              id: uuid.v4() as string,
              completed: false,
            })),
          })),
          totalDuration: 0,
          isPublic: true,
        };

        set({
          currentSession: newSession,
          sessionStartTime: null, // 타이머는 startWorkout이 호출될 때 시작
          sessionTimer: 0,
          activeExerciseIndex: 0,
          isWorkoutStarted: false, // 운동이 시작되지 않은 상태
        });
      },

      loadFromRoutine: (routine) => {
        get().startSession(routine);
      },

      // 타이머 관리
      startRestTimer: (duration) => {
        set({
          restTimer: duration,
          restTimerActive: true,
        });
      },

      stopRestTimer: () => {
        set({
          restTimer: 0,
          restTimerActive: false,
        });
      },

      updateSessionTimer: () => {
        const state = get();
        if (state.sessionStartTime) {
          const elapsed = Math.floor((Date.now() - new Date(state.sessionStartTime).getTime()) / 1000);
          set({ sessionTimer: elapsed });
        }
      },

      // 유틸리티
      getExerciseById: (exerciseId) => {
        const state = get();
        return state.currentSession?.exercises.find(e => e.id === exerciseId);
      },

      getTotalVolume: () => {
        const state = get();
        if (!state.currentSession) return 0;

        return state.currentSession.exercises.reduce((total, exercise) => {
          return total + exercise.sets.reduce((exerciseTotal, set) => {
            if (set.completed && set.weight) {
              return exerciseTotal + (set.weight * set.reps);
            }
            return exerciseTotal;
          }, 0);
        }, 0);
      },

      getTotalSets: () => {
        const state = get();
        if (!state.currentSession) return 0;

        return state.currentSession.exercises.reduce((total, exercise) => {
          return total + exercise.sets.length;
        }, 0);
      },

      getCompletedSets: () => {
        const state = get();
        if (!state.currentSession) return 0;

        return state.currentSession.exercises.reduce((total, exercise) => {
          return total + exercise.sets.filter(s => s.completed).length;
        }, 0);
      },
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        lastWorkout: state.lastWorkout,
        workoutHistory: state.workoutHistory,
      }),
    }
  )
);

export default useWorkoutStore;