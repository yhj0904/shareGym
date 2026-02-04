import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, RoutineExercise } from '@/types';
import uuid from 'react-native-uuid';
import {
  isBackendEnabled,
  getRoutines as apiGetRoutines,
  createRoutine as apiCreateRoutine,
  updateRoutine as apiUpdateRoutine,
  deleteRoutine as apiDeleteRoutine,
  toggleRoutineFavorite as apiToggleFavorite,
} from '@/lib/api';
import useAuthStore from './authStore';

/** 현재 사용자 ID */
function getCurrentUserId(): string {
  return useAuthStore.getState().user?.id ?? 'current-user';
}

interface RoutineStore {
  routines: Routine[];
  favoriteRoutines: Routine[];

  // CRUD 작업
  createRoutine: (name: string, exercises: RoutineExercise[]) => Promise<Routine>;
  updateRoutine: (id: string, updates: Partial<Routine>) => Promise<void>;
  deleteRoutine: (id: string) => Promise<void>;

  // 즐겨찾기
  toggleFavorite: (id: string) => Promise<void>;

  // 유틸리티
  getRoutineById: (id: string) => Routine | undefined;
  duplicateRoutine: (id: string) => Promise<Routine | null>;
  shareRoutine: (id: string) => Promise<void>;

  // 백엔드: 루틴 목록 로드
  loadRoutines: (userId: string) => Promise<void>;

  // 정렬 및 필터
  getRoutinesSorted: (sortBy: 'name' | 'lastUsed' | 'created') => Routine[];

  /** 로그아웃 시 사용자 데이터 초기화 */
  clearUserData: () => void;
}

const useRoutineStore = create<RoutineStore>()(
  persist(
    (set, get) => ({
      routines: [],
      favoriteRoutines: [],

      createRoutine: async (name, exercises) => {
        const userId = getCurrentUserId();
        const mappedExercises = exercises.map((ex, index) => ({ ...ex, orderIndex: index }));

        if (isBackendEnabled()) {
          const newRoutine = await apiCreateRoutine(userId, name, mappedExercises);
          set((state) => ({ routines: [...state.routines, newRoutine] }));
          return newRoutine;
        }

        const newRoutine: Routine = {
          id: uuid.v4() as string,
          userId,
          name,
          exercises: mappedExercises,
          isFavorite: false,
          isPublic: false,
          tags: [],
          createdAt: new Date(),
        };
        set((state) => ({ routines: [...state.routines, newRoutine] }));
        return newRoutine;
      },

      updateRoutine: async (id, updates) => {
        if (isBackendEnabled()) {
          const updated = await apiUpdateRoutine(id, updates);
          set((state) => ({
            routines: state.routines.map((r) =>
              r.id === id ? { ...updated, lastUsed: updates.exercises ? new Date() : r.lastUsed } : r
            ),
          }));
          return;
        }
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === id
              ? { ...routine, ...updates, lastUsed: updates.exercises ? new Date() : routine.lastUsed }
              : routine
          ),
        }));
      },

      deleteRoutine: async (id) => {
        if (isBackendEnabled()) {
          await apiDeleteRoutine(id);
        }
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== id),
          favoriteRoutines: state.favoriteRoutines.filter((r) => r.id !== id),
        }));
      },

      toggleFavorite: async (id) => {
        const routine = get().routines.find((r) => r.id === id);
        if (!routine) return;

        const isFavorite = !routine.isFavorite;

        if (isBackendEnabled()) {
          await apiToggleFavorite(id, isFavorite);
        }
        set((state) => ({
          routines: state.routines.map((r) => (r.id === id ? { ...r, isFavorite } : r)),
          favoriteRoutines: isFavorite
            ? [...state.favoriteRoutines, { ...routine, isFavorite }]
            : state.favoriteRoutines.filter((r) => r.id !== id),
        }));
      },

      getRoutineById: (id) => {
        return get().routines.find((r) => r.id === id);
      },

      duplicateRoutine: async (id) => {
        const routine = get().routines.find((r) => r.id === id);
        if (!routine) return null;

        const newName = `${routine.name} (복사본)`;

        if (isBackendEnabled()) {
          const duplicated = await apiCreateRoutine(getCurrentUserId(), newName, routine.exercises);
          set((state) => ({ routines: [...state.routines, duplicated] }));
          return duplicated;
        }

        const duplicatedRoutine: Routine = {
          ...routine,
          id: uuid.v4() as string,
          name: newName,
          isFavorite: false,
          createdAt: new Date(),
          lastUsed: undefined,
        };
        set((state) => ({ routines: [...state.routines, duplicatedRoutine] }));
        return duplicatedRoutine;
      },

      loadRoutines: async (userId) => {
        if (!isBackendEnabled()) return;
        try {
          const list = await apiGetRoutines(userId);
          const favorites = list.filter((r) => r.isFavorite);
          set({ routines: list, favoriteRoutines: favorites });
        } catch (e) {
          console.warn('loadRoutines failed', e);
        }
      },

      clearUserData: () => {
        set({ routines: [], favoriteRoutines: [] });
      },

      shareRoutine: async (id) => {
        const routine = get().routines.find((r) => r.id === id);
        if (!routine) return;

        const { exerciseDatabase } = await import('@/data/exercises');
        const lines = [
          `🏋️ ${routine.name}`,
          '',
          ...routine.exercises.map((ex, i) => {
            const exType = exerciseDatabase.find((e) => e.id === ex.exerciseTypeId);
            const name = exType?.nameKo ?? ex.exerciseTypeId;
            const detail = ex.weight
              ? `${ex.sets}세트 x ${ex.reps}회 (${ex.weight}kg)`
              : `${ex.sets}세트 x ${ex.reps}회`;
            return `${i + 1}. ${name}: ${detail}`;
          }),
          '',
          '쉐어핏에서 함께 운동해요 💪',
        ];
        const text = lines.join('\n');

        try {
          const { Share } = await import('react-native');
          await Share.share({
            message: text,
            title: `${routine.name} 루틴 공유`,
          });
        } catch {
          // 사용자가 공유 취소 시 무시
        }
      },

      getRoutinesSorted: (sortBy) => {
        const routines = [...get().routines];

        switch (sortBy) {
          case 'name':
            return routines.sort((a, b) => a.name.localeCompare(b.name));
          case 'lastUsed':
            return routines.sort((a, b) => {
              if (!a.lastUsed && !b.lastUsed) return 0;
              if (!a.lastUsed) return 1;
              if (!b.lastUsed) return -1;
              return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
            });
          case 'created':
          default:
            return routines.sort(
              (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }
      },
    }),
    {
      name: 'routine-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useRoutineStore;