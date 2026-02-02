// 사용자 관련 타입
export interface User {
  id: string;
  username: string;
  email?: string;
  profileImage?: string;
  bio?: string;
  gym?: Gym;
  badges: Badge[];
  displayBadges?: string[]; // 프로필에 표시할 뱃지 이모지 (최대 3개)
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
  weight?: number; // kg (웨이트 트레이닝용)
  distance?: number; // km (유산소 - 런닝, 싸이클 등)
  level?: number; // 레벨 (유산소 - 머신 난이도)
  speed?: number; // km/h (속도 - 런닝머신, 싸이클 등)
  incline?: number; // % (경사도 - 런닝머신)
  duration?: number; // 초 단위 (유산소용)
  score?: number; // 점수 (스포츠 - 배드민턴, 테니스 등)
  minutes?: number; // 분 단위 (스포츠, 스트레칭 등의 운동 시간)
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
  unit?: 'kg' | 'km' | 'level' | 'reps' | 'speed' | 'speed-incline' | 'score' | 'minutes'; // 운동 단위 타입
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
  customOptions?: CardCustomOptions; // 커스텀 옵션 추가
}

// 카드 커스터마이징 옵션 타입
export interface CardCustomOptions {
  // 색상 설정
  backgroundType: 'solid' | 'gradient' | 'image' | 'pattern';
  backgroundColor?: string;
  gradientColors?: string[];
  gradientAngle?: number; // 그라데이션 각도 (0-360)
  gradientType?: 'linear' | 'radial'; // 그라데이션 타입
  backgroundImage?: string;
  backgroundOpacity?: number; // 배경 투명도
  backgroundPattern?: 'dots' | 'lines' | 'grid' | 'waves'; // 배경 패턴

  // 텍스트 설정 (개별 요소별)
  primaryTextColor: string;
  secondaryTextColor: string;
  fontSize: 'small' | 'medium' | 'large' | 'custom';
  customFontSize?: number; // fontSize가 'custom'일 때 사용
  fontFamily?: string;

  // 개별 텍스트 스타일링
  titleStyle?: {
    color?: string;
    fontSize?: number;
    fontWeight?: string;
    fontStyle?: 'normal' | 'italic';
    textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
    letterSpacing?: number;
  };
  subtitleStyle?: {
    color?: string;
    fontSize?: number;
    fontWeight?: string;
  };
  statsStyle?: {
    valueColor?: string;
    labelColor?: string;
    fontSize?: number;
  };

  // 레이아웃 설정
  layout: 'classic' | 'modern' | 'minimal' | 'detailed' | 'compact' | 'expanded';
  padding?: number; // 내부 패딩
  spacing?: number; // 요소 간격
  alignment?: 'left' | 'center' | 'right'; // 정렬

  // 로고/브랜딩
  showLogo: boolean;
  logoPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  logoSize?: number;
  customLogo?: string; // 커스텀 로고 URL
  watermarkText?: string; // 워터마크 텍스트
  watermarkOpacity?: number;

  // 정보 표시 설정
  showStats: {
    duration: boolean;
    volume: boolean;
    sets: boolean;
    distance: boolean;
    calories: boolean;
    heartRate?: boolean; // 심박수
    intensity?: boolean; // 운동 강도
  };

  // 통계 아이콘 커스터마이징
  statsIcons?: {
    duration?: string;
    volume?: string;
    sets?: string;
    distance?: string;
    calories?: string;
  };
  iconSize?: number;
  iconColor?: string;

  // 운동 목록 설정
  showExerciseList: boolean;
  maxExercisesToShow: number;
  exerciseListStyle?: {
    showNumbers?: boolean; // 번호 표시
    showSets?: boolean; // 세트 정보 표시
    showWeight?: boolean; // 무게 정보 표시
    highlightPR?: boolean; // PR 하이라이트
    colorByMuscle?: boolean; // 근육군별 색상 구분
  };
  muscleColors?: { // 근육군별 색상
    chest?: string;
    back?: string;
    shoulders?: string;
    legs?: string;
    arms?: string;
    abs?: string;
    cardio?: string;
  };

  // 추가 요소
  title?: string;
  subtitle?: string;
  motivationalQuote?: string; // 동기부여 문구
  hashtags?: string[];
  showDate: boolean;
  dateFormat?: 'short' | 'long' | 'relative' | 'custom';
  customDateFormat?: string; // dateFormat이 'custom'일 때 사용
  showTime?: boolean; // 운동 시간대 표시
  showWeather?: string; // 날씨 정보 (아이콘)
  showMood?: string; // 기분/컨디션 이모지

  // 칼로리 계산
  showCalorieBreakdown?: boolean; // 칼로리 상세 분석
  calorieGoal?: number; // 목표 칼로리

  // 테두리 및 효과
  borderRadius: number;
  borderStyle?: 'solid' | 'dashed' | 'double'; // 테두리 스타일
  shadowEnabled: boolean;
  shadowColor?: string;
  shadowIntensity?: number; // 그림자 강도
  borderColor?: string;
  borderWidth?: number;

  // 애니메이션 효과 (저장 시 적용)
  animationStyle?: 'none' | 'fade' | 'slide' | 'zoom';

  // QR 코드
  showQRCode?: boolean; // QR 코드 표시
  qrCodeData?: string; // QR 코드 데이터
  qrCodePosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

// 프리셋 저장 타입
export interface CardPreset {
  id: string;
  name: string;
  description?: string;
  options: CardCustomOptions;
  createdAt: Date;
  isDefault?: boolean;
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

// 그룹 공유 운동 카드 (2분할)
export interface SharedWorkoutCard {
  id: string;
  groupId: string;
  createdBy: string; // 첫 번째 카드를 만든 사용자
  completedBy?: string; // 두 번째 카드를 완성한 사용자 (협업 모드일 때)

  // 카드 타입: solo(개인), collaborative(협업)
  type: 'solo' | 'collaborative';

  // 레이아웃 설정
  splitType: 'horizontal' | 'vertical'; // 상하 또는 좌우 분할
  splitPosition: 'top' | 'bottom' | 'left' | 'right'; // 첫 번째 사용자가 선택한 위치

  // 첫 번째 참여자 (카드 생성자)
  firstHalf: {
    userId: string;
    username?: string;
    userProfileImage?: string;
    workoutId: string;
    workout?: WorkoutSession;
    imageData?: string; // base64 또는 URL
    createdAt: Date;
  };

  // 두 번째 참여자 (협업 참여자)
  secondHalf?: {
    userId: string;
    username?: string;
    userProfileImage?: string;
    workoutId: string;
    workout?: WorkoutSession;
    imageData?: string; // base64 또는 URL
    joinedAt?: Date; // 참여 시각
    createdAt: Date;
  };

  // 스타일 설정
  style?: 'minimal' | 'gradient' | 'dark' | 'colorful' | 'ocean' | 'sunset' | 'forest' | 'neon';
  customOptions?: CardCustomOptions;

  // 상태 관리
  status: 'waiting' | 'in_progress' | 'completed' | 'expired'; // waiting: 대기중, in_progress: 진행중, completed: 완성, expired: 만료

  // 시간 관리
  expiresAt: Date; // 24시간 후 만료
  createdAt: Date;
  updatedAt?: Date;
  completedAt?: Date; // 카드 완성 시각

  // 메타데이터
  tags?: string[]; // 해시태그
  isPublic?: boolean; // 피드 공개 여부
  viewCount?: number; // 조회수
  likeCount?: number; // 좋아요 수
}

export interface Achievement {
  id: string;
  badgeId: string;
  badge?: Badge;
  message: string;
}

// 피드 관련 타입
export interface FeedItem {
  id: string;
  type: 'workout' | 'group' | 'achievement' | 'challenge';
  userId: string;
  username?: string;
  userProfileImage?: string;
  userBadges?: string[]; // 유저의 대표 뱃지

  // 운동 관련 데이터
  workoutSessionId?: string;
  workoutSnapshot?: WorkoutSession; // 운동 데이터 스냅샷
  cardStyle?: string; // 운동 카드 스타일
  cardImageUrl?: string; // 생성된 운동 카드 이미지

  // 콘텐츠
  content?: string;
  images?: string[];

  // 상호작용
  likes: string[];
  comments: Comment[];
  isLiked?: boolean; // 현재 사용자가 좋아요 했는지

  // 메타 정보
  groupId?: string; // 그룹 포스트인 경우
  groupName?: string;
  visibility: 'public' | 'followers' | 'group';
  createdAt: Date;
  updatedAt?: Date;
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  userProfileImage?: string;
  content: string;
  createdAt: Date;
}

// Feed 필터 타입
export type FeedFilter = 'all' | 'following' | 'groups' | 'nearby';