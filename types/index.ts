// 사용자 관련 타입
export interface User {
  id: string;
  username: string;
  profileImage?: string;
  gym?: Gym;
  badges: Badge[];
  following: string[];
  followers: string[];
  stats: UserStats;
}

export interface UserStats {
  totalWorkouts: number;
  currentStreak: number;
  totalVolume: number;
  favoriteExercise: string;
  lastWorkout?: Date;
}

// 헬스장 관련 타입
export interface Gym {
  id: string;
  name: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  members: string[];
}

// 운동 세션 관련 타입
export interface WorkoutSession {
  id: string;
  userId: string;
  gymId?: string;
  date: Date;
  startTime: Date;
  endTime?: Date;
  exercises: Exercise[];
  totalDuration: number;
  notes?: string;
  photos?: string[];
  condition?: 'great' | 'good' | 'normal' | 'tired';
  isPublic: boolean;
}

// 운동 종목 관련 타입
export interface Exercise {
  id: string;
  exerciseTypeId: string;
  exerciseType?: ExerciseType;
  sets: Set[];
  restTime: number; // 초 단위
  notes?: string;
  orderIndex: number;
}

export interface Set {
  id: string;
  reps: number;
  weight?: number; // kg
  duration?: number; // 초 단위 (유산소용)
  completed: boolean;
  orderIndex: number;
}

export interface ExerciseType {
  id: string;
  name: string;
  nameKo: string; // 한글명
  category: ExerciseCategory;
  muscleGroups: MuscleGroup[];
  equipment?: string;
  icon?: string;
}

export type ExerciseCategory =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'legs'
  | 'arms'
  | 'abs'
  | 'cardio'
  | 'bodyweight';

export type MuscleGroup =
  | '가슴'
  | '등'
  | '어깨'
  | '이두'
  | '삼두'
  | '복근'
  | '하체'
  | '종아리';

// 루틴 관련 타입
export interface Routine {
  id: string;
  userId: string;
  name: string;
  exercises: RoutineExercise[];
  isFavorite: boolean;
  isPublic: boolean;
  tags: string[];
  lastUsed?: Date;
  createdAt: Date;
}

export interface RoutineExercise {
  exerciseTypeId: string;
  sets: number;
  reps: number;
  weight?: number;
  restTime: number;
  orderIndex: number;
}

// 운동 카드 (공유용)
export interface WorkoutCard {
  id: string;
  sessionId: string;
  imageUrl: string;
  stats: {
    totalSets: number;
    totalReps: number;
    totalWeight: number;
    duration: string;
    exercises: string[];
  };
  style: 'minimal' | 'detailed' | 'colorful';
}

// 뱃지 시스템
export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

// 피드 아이템
export interface FeedItem {
  id: string;
  userId: string;
  user?: User;
  type: 'workout' | 'achievement' | 'routine_share';
  content: WorkoutSession | Achievement | Routine;
  likes: string[];
  comments: Comment[];
  createdAt: Date;
}

export interface Achievement {
  id: string;
  badgeId: string;
  badge?: Badge;
  message: string;
}

export interface Comment {
  id: string;
  userId: string;
  user?: User;
  text: string;
  createdAt: Date;
}