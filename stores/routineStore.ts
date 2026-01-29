import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Routine, RoutineExercise } from '@/types';
import uuid from 'react-native-uuid';

interface RoutineStore {
  routines: Routine[];
  favoriteRoutines: Routine[];

  // CRUD 작업
  createRoutine: (name: string, exercises: RoutineExercise[]) => Routine;
  updateRoutine: (id: string, updates: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;

  // 즐겨찾기
  toggleFavorite: (id: string) => void;

  // 유틸리티
  getRoutineById: (id: string) => Routine | undefined;
  duplicateRoutine: (id: string) => Routine | null;
  shareRoutine: (id: string) => void;

  // 정렬 및 필터
  getRoutinesSorted: (sortBy: 'name' | 'lastUsed' | 'created') => Routine[];
}

const useRoutineStore = create<RoutineStore>()(
  persist(
    (set, get) => ({
      routines: [],
      favoriteRoutines: [],

      createRoutine: (name, exercises) => {
        const newRoutine: Routine = {
          id: uuid.v4() as string,
          userId: 'current-user',
          name,
          exercises: exercises.map((ex, index) => ({
            ...ex,
            orderIndex: index,
          })),
          isFavorite: false,
          isPublic: false,
          tags: [],
          createdAt: new Date(),
        };

        set((state) => ({
          routines: [...state.routines, newRoutine],
        }));

        return newRoutine;
      },

      updateRoutine: (id, updates) => {
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === id
              ? {
                  ...routine,
                  ...updates,
                  lastUsed: updates.exercises ? new Date() : routine.lastUsed,
                }
              : routine
          ),
        }));
      },

      deleteRoutine: (id) => {
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== id),
          favoriteRoutines: state.favoriteRoutines.filter((r) => r.id !== id),
        }));
      },

      toggleFavorite: (id) => {
        const routine = get().routines.find((r) => r.id === id);
        if (!routine) return;

        const isFavorite = !routine.isFavorite;

        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === id ? { ...r, isFavorite } : r
          ),
          favoriteRoutines: isFavorite
            ? [...state.favoriteRoutines, { ...routine, isFavorite }]
            : state.favoriteRoutines.filter((r) => r.id !== id),
        }));
      },

      getRoutineById: (id) => {
        return get().routines.find((r) => r.id === id);
      },

      duplicateRoutine: (id) => {
        const routine = get().routines.find((r) => r.id === id);
        if (!routine) return null;

        const duplicatedRoutine: Routine = {
          ...routine,
          id: uuid.v4() as string,
          name: `${routine.name} (복사본)`,
          isFavorite: false,
          createdAt: new Date(),
          lastUsed: undefined,
        };

        set((state) => ({
          routines: [...state.routines, duplicatedRoutine],
        }));

        return duplicatedRoutine;
      },

      shareRoutine: (id) => {
        const routine = get().routines.find((r) => r.id === id);
        if (!routine) return;

        // TODO: 실제 공유 로직 구현
        console.log('Sharing routine:', routine);
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