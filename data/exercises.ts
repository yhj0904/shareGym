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
    id: 'pec-deck-fly',
    name: 'Pec Deck Fly',
    nameKo: '펙 덱 플라이',
    category: 'chest',
    muscleGroups: ['가슴'],
    equipment: '머신',
    icon: '🦅'
  },
  {
    id: 'chest-press',
    name: 'Chest Press',
    nameKo: '체스트 프레스',
    category: 'chest',
    muscleGroups: ['가슴', '삼두'],
    equipment: '머신',
    icon: '🏋️'
  },
  {
    id: 'incline-pushup',
    name: 'Incline Push-up',
    nameKo: '인클라인 푸쉬업',
    category: 'chest',
    muscleGroups: ['가슴', '삼두'],
    icon: '🤸'
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
  {
    id: 'seated-row',
    name: 'Seated Row',
    nameKo: '시티드 로우',
    category: 'back',
    muscleGroups: ['등', '이두'],
    equipment: '머신',
    icon: '🏋️'
  },
  {
    id: 'behind-lat-pulldown',
    name: 'Behind Lat Pulldown',
    nameKo: '비하인드 랫풀다운',
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
  {
    id: 'hip-abduction',
    name: 'Hip Abduction',
    nameKo: '힙 어브덕션',
    category: 'legs',
    muscleGroups: ['둔근', '하체'],
    equipment: '머신',
    icon: '🦵'
  },
  {
    id: 'inner-thigh',
    name: 'Inner Thigh',
    nameKo: '이너타이',
    category: 'legs',
    muscleGroups: ['내전근', '하체'],
    equipment: '머신',
    icon: '🦵'
  },
  {
    id: 'outer-thigh',
    name: 'Outer Thigh',
    nameKo: '아웃타이',
    category: 'legs',
    muscleGroups: ['외전근', '하체'],
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
    id: 'overhead-extension',
    name: 'Overhead Extension',
    nameKo: '오버헤드 익스텐션',
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
    id: 'cable-pushdown',
    name: 'Cable Pushdown',
    nameKo: '케이블 푸쉬다운',
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
  },
  {
    id: 'stairmaster',
    name: 'Stairmaster',
    nameKo: '천국의 계단',
    category: 'cardio',
    muscleGroups: ['하체', '둔근'],
    equipment: '스테어마스터',
    icon: '🪜'
  },
  {
    id: 'assault-bike',
    name: 'Assault Bike',
    nameKo: '어썰트 바이크',
    category: 'cardio',
    muscleGroups: ['전신'],
    equipment: '어썰트 바이크',
    icon: '🚴'
  },
  {
    id: 'jump-rope',
    name: 'Jump Rope',
    nameKo: '줄넘기',
    category: 'cardio',
    muscleGroups: ['하체', '전신'],
    equipment: '줄넘기',
    icon: '🪢'
  },
  {
    id: 'burpees',
    name: 'Burpees',
    nameKo: '버피',
    category: 'cardio',
    muscleGroups: ['전신'],
    icon: '🤸'
  },
  {
    id: 'mountain-climbers',
    name: 'Mountain Climbers',
    nameKo: '마운틴 클라이머',
    category: 'cardio',
    muscleGroups: ['전신', '복근'],
    icon: '🧗'
  },
  {
    id: 'high-knees',
    name: 'High Knees',
    nameKo: '하이 니즈',
    category: 'cardio',
    muscleGroups: ['하체'],
    icon: '🏃'
  },
  {
    id: 'jumping-jacks',
    name: 'Jumping Jacks',
    nameKo: '점핑잭',
    category: 'cardio',
    muscleGroups: ['전신'],
    icon: '🤸'
  },
  {
    id: 'box-jumps',
    name: 'Box Jumps',
    nameKo: '박스 점프',
    category: 'cardio',
    muscleGroups: ['하체'],
    equipment: '박스',
    icon: '📦'
  },
  {
    id: 'treadmill-running',
    name: 'Treadmill Running',
    nameKo: '런닝머신',
    category: 'cardio',
    muscleGroups: ['하체', '전신'],
    equipment: '런닝머신',
    icon: '🏃'
  },

  // 스포츠
  {
    id: 'badminton',
    name: 'Badminton',
    nameKo: '배드민턴',
    category: 'sports',
    muscleGroups: ['전신'],
    icon: '🏸'
  },
  {
    id: 'swimming',
    name: 'Swimming',
    nameKo: '수영',
    category: 'sports',
    muscleGroups: ['전신'],
    icon: '🏊'
  },
  {
    id: 'basketball',
    name: 'Basketball',
    nameKo: '농구',
    category: 'sports',
    muscleGroups: ['전신'],
    icon: '🏀'
  },
  {
    id: 'soccer',
    name: 'Soccer',
    nameKo: '축구',
    category: 'sports',
    muscleGroups: ['하체', '전신'],
    icon: '⚽'
  },
  {
    id: 'tennis',
    name: 'Tennis',
    nameKo: '테니스',
    category: 'sports',
    muscleGroups: ['전신'],
    icon: '🎾'
  },
  {
    id: 'volleyball',
    name: 'Volleyball',
    nameKo: '배구',
    category: 'sports',
    muscleGroups: ['전신'],
    icon: '🏐'
  },

  // 야외 운동
  {
    id: 'outdoor-running',
    name: 'Outdoor Running',
    nameKo: '야외 런닝',
    category: 'outdoor',
    muscleGroups: ['하체', '전신'],
    icon: '🏃'
  },
  {
    id: 'hiking',
    name: 'Hiking',
    nameKo: '등산',
    category: 'outdoor',
    muscleGroups: ['하체', '전신'],
    icon: '🥾'
  },
  {
    id: 'cycling',
    name: 'Cycling',
    nameKo: '사이클링',
    category: 'outdoor',
    muscleGroups: ['하체'],
    icon: '🚴'
  },
  {
    id: 'walking',
    name: 'Walking',
    nameKo: '걷기',
    category: 'outdoor',
    muscleGroups: ['하체'],
    icon: '🚶'
  },

  // 스트레칭
  {
    id: 'stretching',
    name: 'Stretching',
    nameKo: '스트레칭',
    category: 'stretching',
    muscleGroups: ['전신'],
    icon: '🧘'
  },
  {
    id: 'yoga',
    name: 'Yoga',
    nameKo: '요가',
    category: 'stretching',
    muscleGroups: ['전신'],
    icon: '🧘‍♀️'
  },

  // 요가 동작들
  {
    id: 'sun-salutation',
    name: 'Sun Salutation',
    nameKo: '태양 경배 자세',
    category: 'yoga',
    muscleGroups: ['전신'],
    icon: '☀️'
  },
  {
    id: 'downward-dog',
    name: 'Downward Dog',
    nameKo: '다운워드 독',
    category: 'yoga',
    muscleGroups: ['전신', '어깨', '등'],
    icon: '🐕'
  },
  {
    id: 'warrior-pose',
    name: 'Warrior Pose',
    nameKo: '전사 자세',
    category: 'yoga',
    muscleGroups: ['하체', '코어'],
    icon: '🧘‍♀️'
  },
  {
    id: 'tree-pose',
    name: 'Tree Pose',
    nameKo: '나무 자세',
    category: 'yoga',
    muscleGroups: ['하체', '코어'],
    icon: '🌳'
  },
  {
    id: 'child-pose',
    name: 'Child Pose',
    nameKo: '아이 자세',
    category: 'yoga',
    muscleGroups: ['등', '어깨'],
    icon: '👶'
  },
  {
    id: 'cobra-pose',
    name: 'Cobra Pose',
    nameKo: '코브라 자세',
    category: 'yoga',
    muscleGroups: ['등', '복근'],
    icon: '🐍'
  },
  {
    id: 'cat-cow-pose',
    name: 'Cat-Cow Pose',
    nameKo: '고양이-소 자세',
    category: 'yoga',
    muscleGroups: ['등', '복근'],
    icon: '🐱'
  },
  {
    id: 'bridge-pose',
    name: 'Bridge Pose',
    nameKo: '브릿지 자세',
    category: 'yoga',
    muscleGroups: ['둔근', '등', '코어'],
    icon: '🌉'
  },
  {
    id: 'pigeon-pose',
    name: 'Pigeon Pose',
    nameKo: '비둘기 자세',
    category: 'yoga',
    muscleGroups: ['둔근', '하체'],
    icon: '🕊️'
  },
  {
    id: 'mountain-pose',
    name: 'Mountain Pose',
    nameKo: '산 자세',
    category: 'yoga',
    muscleGroups: ['전신'],
    icon: '⛰️'
  },
  {
    id: 'triangle-pose',
    name: 'Triangle Pose',
    nameKo: '삼각 자세',
    category: 'yoga',
    muscleGroups: ['옆구리', '하체'],
    icon: '📐'
  },
  {
    id: 'seated-forward-bend',
    name: 'Seated Forward Bend',
    nameKo: '앉은 전굴 자세',
    category: 'yoga',
    muscleGroups: ['등', '하체'],
    icon: '🧘'
  },
  {
    id: 'shoulder-stand',
    name: 'Shoulder Stand',
    nameKo: '어깨 물구나무',
    category: 'yoga',
    muscleGroups: ['어깨', '코어'],
    icon: '🤸‍♀️'
  },
  {
    id: 'plank-pose',
    name: 'Plank Pose',
    nameKo: '플랭크 자세',
    category: 'yoga',
    muscleGroups: ['코어', '전신'],
    icon: '📏'
  },
  {
    id: 'corpse-pose',
    name: 'Corpse Pose (Savasana)',
    nameKo: '송장 자세 (사바사나)',
    category: 'yoga',
    muscleGroups: ['전신'],
    icon: '😌'
  },
  {
    id: 'camel-pose',
    name: 'Camel Pose',
    nameKo: '낙타 자세',
    category: 'yoga',
    muscleGroups: ['등', '가슴', '복근'],
    icon: '🐪'
  },
  {
    id: 'boat-pose',
    name: 'Boat Pose',
    nameKo: '보트 자세',
    category: 'yoga',
    muscleGroups: ['복근', '코어'],
    icon: '⛵'
  },
  {
    id: 'eagle-pose',
    name: 'Eagle Pose',
    nameKo: '독수리 자세',
    category: 'yoga',
    muscleGroups: ['하체', '어깨'],
    icon: '🦅'
  },
  {
    id: 'chair-pose',
    name: 'Chair Pose',
    nameKo: '의자 자세',
    category: 'yoga',
    muscleGroups: ['하체', '코어'],
    icon: '🪑'
  },
  {
    id: 'fish-pose',
    name: 'Fish Pose',
    nameKo: '물고기 자세',
    category: 'yoga',
    muscleGroups: ['가슴', '목', '등'],
    icon: '🐟'
  },
  {
    id: 'half-moon-pose',
    name: 'Half Moon Pose',
    nameKo: '반달 자세',
    category: 'yoga',
    muscleGroups: ['옆구리', '하체', '코어'],
    icon: '🌙'
  },
  {
    id: 'lotus-pose',
    name: 'Lotus Pose',
    nameKo: '연꽃 자세',
    category: 'yoga',
    muscleGroups: ['둔근', '하체'],
    icon: '🪷'
  },
  {
    id: 'bow-pose',
    name: 'Bow Pose',
    nameKo: '활 자세',
    category: 'yoga',
    muscleGroups: ['등', '가슴', '복근'],
    icon: '🏹'
  },
  {
    id: 'wheel-pose',
    name: 'Wheel Pose',
    nameKo: '휠 자세',
    category: 'yoga',
    muscleGroups: ['등', '어깨', '코어'],
    icon: '☸️'
  },
  {
    id: 'side-plank',
    name: 'Side Plank',
    nameKo: '사이드 플랭크',
    category: 'yoga',
    muscleGroups: ['옆구리', '코어'],
    icon: '📐'
  },
  {
    id: 'happy-baby-pose',
    name: 'Happy Baby Pose',
    nameKo: '해피 베이비 자세',
    category: 'yoga',
    muscleGroups: ['둔근', '등'],
    icon: '👶'
  },
  {
    id: 'extended-side-angle',
    name: 'Extended Side Angle',
    nameKo: '확장 측면 각도 자세',
    category: 'yoga',
    muscleGroups: ['옆구리', '하체'],
    icon: '📏'
  },
  {
    id: 'butterfly-pose',
    name: 'Butterfly Pose',
    nameKo: '나비 자세',
    category: 'yoga',
    muscleGroups: ['둔근', '내전근'],
    icon: '🦋'
  },
  {
    id: 'headstand',
    name: 'Headstand',
    nameKo: '머리 물구나무',
    category: 'yoga',
    muscleGroups: ['코어', '어깨', '전신'],
    icon: '🤸'
  },
  {
    id: 'crow-pose',
    name: 'Crow Pose',
    nameKo: '까마귀 자세',
    category: 'yoga',
    muscleGroups: ['코어', '팔', '어깨'],
    icon: '🐦‍⬛'
  },
  {
    id: 'foam-rolling',
    name: 'Foam Rolling',
    nameKo: '폼롤링',
    category: 'stretching',
    muscleGroups: ['전신'],
    icon: '🎯'
  },
  {
    id: 'dynamic-stretching',
    name: 'Dynamic Stretching',
    nameKo: '동적 스트레칭',
    category: 'stretching',
    muscleGroups: ['전신'],
    icon: '🤸'
  },
  {
    id: 'static-stretching',
    name: 'Static Stretching',
    nameKo: '정적 스트레칭',
    category: 'stretching',
    muscleGroups: ['전신'],
    icon: '🧘'
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
  { id: 'bodyweight', name: '맨몸', icon: '🤸' },
  { id: 'sports', name: '스포츠', icon: '⚽' },
  { id: 'outdoor', name: '야외운동', icon: '🌳' },
  { id: 'yoga', name: '요가', icon: '🧘‍♀️' },
  { id: 'stretching', name: '스트레칭', icon: '🧘' }
];