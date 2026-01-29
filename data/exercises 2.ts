import { ExerciseType } from '@/types';

export const exerciseDatabase: ExerciseType[] = [
  // 가슴 운동
  {
    id: 'bench-press',
    name: 'Bench Press',
    nameKo: '벤치프레스',
    category: 'chest',
    muscleGroups: ['가슴', '삼두', '어깨'],
    equipment: '바벨',
    icon: '🏋️'
  },
  {
    id: 'incline-bench-press',
    name: 'Incline Bench Press',
    nameKo: '인클라인 벤치프레스',
    category: 'chest',
    muscleGroups: ['가슴', '삼두', '어깨'],
    equipment: '바벨',
    icon: '🏋️'
  },
  {
    id: 'dumbbell-press',
    name: 'Dumbbell Press',
    nameKo: '덤벨프레스',
    category: 'chest',
    muscleGroups: ['가슴', '삼두'],
    equipment: '덤벨',
    icon: '💪'
  },
  {
    id: 'dumbbell-fly',
    name: 'Dumbbell Fly',
    nameKo: '덤벨플라이',
    category: 'chest',
    muscleGroups: ['가슴'],
    equipment: '덤벨',
    icon: '💪'
  },
  {
    id: 'cable-crossover',
    name: 'Cable Crossover',
    nameKo: '케이블 크로스오버',
    category: 'chest',
    muscleGroups: ['가슴'],
    equipment: '케이블',
    icon: '🏋️'
  },
  {
    id: 'push-up',
    name: 'Push Up',
    nameKo: '푸시업',
    category: 'bodyweight',
    muscleGroups: ['가슴', '삼두'],
    icon: '🤸'
  },

  // 등 운동
  {
    id: 'pull-up',
    name: 'Pull Up',
    nameKo: '풀업',
    category: 'back',
    muscleGroups: ['등', '이두'],
    equipment: '철봉',
    icon: '🤸'
  },
  {
    id: 'lat-pulldown',
    name: 'Lat Pulldown',
    nameKo: '렛풀다운',
    category: 'back',
    muscleGroups: ['등', '이두'],
    equipment: '케이블',
    icon: '🏋️'
  },
  {
    id: 'barbell-row',
    name: 'Barbell Row',
    nameKo: '바벨로우',
    category: 'back',
    muscleGroups: ['등', '이두'],
    equipment: '바벨',
    icon: '🏋️'
  },
  {
    id: 'dumbbell-row',
    name: 'Dumbbell Row',
    nameKo: '덤벨로우',
    category: 'back',
    muscleGroups: ['등', '이두'],
    equipment: '덤벨',
    icon: '💪'
  },
  {
    id: 'deadlift',
    name: 'Deadlift',
    nameKo: '데드리프트',
    category: 'back',
    muscleGroups: ['등', '하체'],
    equipment: '바벨',
    icon: '🏋️'
  },
  {
    id: 'cable-row',
    name: 'Cable Row',
    nameKo: '케이블로우',
    category: 'back',
    muscleGroups: ['등', '이두'],
    equipment: '케이블',
    icon: '🏋️'
  },

  // 어깨 운동
  {
    id: 'shoulder-press',
    name: 'Shoulder Press',
    nameKo: '숄더프레스',
    category: 'shoulders',
    muscleGroups: ['어깨', '삼두'],
    equipment: '덤벨',
    icon: '💪'
  },
  {
    id: 'military-press',
    name: 'Military Press',
    nameKo: '밀리터리프레스',
    category: 'shoulders',
    muscleGroups: ['어깨', '삼두'],
    equipment: '바벨',
    icon: '🏋️'
  },
  {
    id: 'lateral-raise',
    name: 'Lateral Raise',
    nameKo: '사이드 레터럴 레이즈',
    category: 'shoulders',
    muscleGroups: ['어깨'],
    equipment: '덤벨',
    icon: '💪'
  },
  {
    id: 'front-raise',
    name: 'Front Raise',
    nameKo: '프론트 레이즈',
    category: 'shoulders',
    muscleGroups: ['어깨'],
    equipment: '덤벨',
    icon: '💪'
  },
  {
    id: 'rear-delt-fly',
    name: 'Rear Delt Fly',
    nameKo: '리어 델트 플라이',
    category: 'shoulders',
    muscleGroups: ['어깨', '등'],
    equipment: '덤벨',
    icon: '💪'
  },

  // 하체 운동
  {
    id: 'squat',
    name: 'Squat',
    nameKo: '스쿼트',
    category: 'legs',
    muscleGroups: ['하체'],
    equipment: '바벨',
    icon: '🏋️'
  },
  {
    id: 'leg-press',
    name: 'Leg Press',
    nameKo: '레그프레스',
    category: 'legs',
    muscleGroups: ['하체'],
    equipment: '머신',
    icon: '🦵'
  },
  {
    id: 'lunge',
    name: 'Lunge',
    nameKo: '런지',
    category: 'legs',
    muscleGroups: ['하체'],
    equipment: '덤벨',
    icon: '🚶'
  },
  {
    id: 'leg-extension',
    name: 'Leg Extension',
    nameKo: '레그 익스텐션',
    category: 'legs',
    muscleGroups: ['하체'],
    equipment: '머신',
    icon: '🦵'
  },
  {
    id: 'leg-curl',
    name: 'Leg Curl',
    nameKo: '레그컬',
    category: 'legs',
    muscleGroups: ['하체'],
    equipment: '머신',
    icon: '🦵'
  },
  {
    id: 'calf-raise',
    name: 'Calf Raise',
    nameKo: '카프레이즈',
    category: 'legs',
    muscleGroups: ['종아리'],
    equipment: '머신',
    icon: '🦵'
  },

  // 팔 운동 (이두)
  {
    id: 'barbell-curl',
    name: 'Barbell Curl',
    nameKo: '바벨컬',
    category: 'arms',
    muscleGroups: ['이두'],
    equipment: '바벨',
    icon: '💪'
  },
  {
    id: 'dumbbell-curl',
    name: 'Dumbbell Curl',
    nameKo: '덤벨컬',
    category: 'arms',
    muscleGroups: ['이두'],
    equipment: '덤벨',
    icon: '💪'
  },
  {
    id: 'hammer-curl',
    name: 'Hammer Curl',
    nameKo: '해머컬',
    category: 'arms',
    muscleGroups: ['이두'],
    equipment: '덤벨',
    icon: '💪'
  },
  {
    id: 'preacher-curl',
    name: 'Preacher Curl',
    nameKo: '프리처컬',
    category: 'arms',
    muscleGroups: ['이두'],
    equipment: '바벨',
    icon: '💪'
  },
  {
    id: 'cable-curl',
    name: 'Cable Curl',
    nameKo: '케이블컬',
    category: 'arms',
    muscleGroups: ['이두'],
    equipment: '케이블',
    icon: '💪'
  },

  // 팔 운동 (삼두)
  {
    id: 'tricep-extension',
    name: 'Tricep Extension',
    nameKo: '트라이셉 익스텐션',
    category: 'arms',
    muscleGroups: ['삼두'],
    equipment: '덤벨',
    icon: '💪'
  },
  {
    id: 'tricep-pushdown',
    name: 'Tricep Pushdown',
    nameKo: '트라이셉 푸시다운',
    category: 'arms',
    muscleGroups: ['삼두'],
    equipment: '케이블',
    icon: '💪'
  },
  {
    id: 'dips',
    name: 'Dips',
    nameKo: '딥스',
    category: 'arms',
    muscleGroups: ['삼두', '가슴'],
    equipment: '평행봉',
    icon: '🤸'
  },
  {
    id: 'close-grip-bench-press',
    name: 'Close Grip Bench Press',
    nameKo: '클로즈그립 벤치프레스',
    category: 'arms',
    muscleGroups: ['삼두', '가슴'],
    equipment: '바벨',
    icon: '🏋️'
  },

  // 복근 운동
  {
    id: 'crunch',
    name: 'Crunch',
    nameKo: '크런치',
    category: 'abs',
    muscleGroups: ['복근'],
    icon: '🤸'
  },
  {
    id: 'plank',
    name: 'Plank',
    nameKo: '플랭크',
    category: 'abs',
    muscleGroups: ['복근'],
    icon: '🤸'
  },
  {
    id: 'leg-raise',
    name: 'Leg Raise',
    nameKo: '레그레이즈',
    category: 'abs',
    muscleGroups: ['복근'],
    icon: '🤸'
  },
  {
    id: 'russian-twist',
    name: 'Russian Twist',
    nameKo: '러시안 트위스트',
    category: 'abs',
    muscleGroups: ['복근'],
    equipment: '덤벨',
    icon: '🤸'
  },
  {
    id: 'ab-wheel',
    name: 'Ab Wheel',
    nameKo: '앱휠',
    category: 'abs',
    muscleGroups: ['복근'],
    equipment: '앱휠',
    icon: '🤸'
  },

  // 유산소 운동
  {
    id: 'treadmill',
    name: 'Treadmill',
    nameKo: '트레드밀',
    category: 'cardio',
    muscleGroups: ['하체'],
    equipment: '트레드밀',
    icon: '🏃'
  },
  {
    id: 'elliptical',
    name: 'Elliptical',
    nameKo: '일립티컬',
    category: 'cardio',
    muscleGroups: ['하체'],
    equipment: '일립티컬',
    icon: '🏃'
  },
  {
    id: 'rowing-machine',
    name: 'Rowing Machine',
    nameKo: '로잉머신',
    category: 'cardio',
    muscleGroups: ['등', '하체'],
    equipment: '로잉머신',
    icon: '🚣'
  },
  {
    id: 'stationary-bike',
    name: 'Stationary Bike',
    nameKo: '싸이클',
    category: 'cardio',
    muscleGroups: ['하체'],
    equipment: '싸이클',
    icon: '🚴'
  },
  {
    id: 'stair-climber',
    name: 'Stair Climber',
    nameKo: '스테어 클라이머',
    category: 'cardio',
    muscleGroups: ['하체'],
    equipment: '스테어 클라이머',
    icon: '🏃'
  }
];

// 카테고리별 운동 가져오기
export const getExercisesByCategory = (category: string) => {
  return exerciseDatabase.filter(exercise => exercise.category === category);
};

// 근육 그룹별 운동 가져오기
export const getExercisesByMuscleGroup = (muscleGroup: string) => {
  return exerciseDatabase.filter(exercise =>
    exercise.muscleGroups.includes(muscleGroup as any)
  );
};

// 운동 검색
export const searchExercises = (query: string) => {
  const lowerQuery = query.toLowerCase();
  return exerciseDatabase.filter(exercise =>
    exercise.name.toLowerCase().includes(lowerQuery) ||
    exercise.nameKo.includes(query) ||
    exercise.muscleGroups.some(mg => mg.includes(query))
  );
};

// 카테고리 정보
export const exerciseCategories = [
  { id: 'chest', name: '가슴', icon: '🫁' },
  { id: 'back', name: '등', icon: '🔙' },
  { id: 'shoulders', name: '어깨', icon: '🤷' },
  { id: 'legs', name: '하체', icon: '🦵' },
  { id: 'arms', name: '팔', icon: '💪' },
  { id: 'abs', name: '복근', icon: '🎯' },
  { id: 'cardio', name: '유산소', icon: '🏃' },
  { id: 'bodyweight', name: '맨몸', icon: '🤸' }
];