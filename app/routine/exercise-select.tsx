import React from 'react';
import { router } from 'expo-router';
import ExerciseSelectScreen from '@/app/workout/exercise-select';
import { ExerciseType } from '@/types';

export default function RoutineExerciseSelect() {
  // 운동 선택 화면을 재사용하되, 콜백을 다르게 처리
  const handleSelectExercise = (exercise: ExerciseType) => {
    // @ts-ignore
    if (global.addRoutineExercise) {
      // @ts-ignore
      global.addRoutineExercise(exercise.id);
    }
    router.back();
  };

  // ExerciseSelectScreen 컴포넌트를 상속하여 사용
  return <ExerciseSelectScreen />;
}