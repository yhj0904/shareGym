/**
 * 업적 및 배지 정의
 */

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'workout' | 'strength' | 'consistency' | 'social' | 'special';
  requiredValue: number;
  unit?: string;
  points: number;
  tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
}

export const achievements: Achievement[] = [
  // 운동 횟수 관련
  {
    id: 'first-workout',
    name: '첫 발걸음',
    description: '첫 운동 완료',
    icon: '🎯',
    category: 'workout',
    requiredValue: 1,
    unit: '회',
    points: 10,
  },
  {
    id: 'workout-10',
    name: '운동 입문자',
    description: '운동 10회 완료',
    icon: '🏃',
    category: 'workout',
    requiredValue: 10,
    unit: '회',
    points: 50,
    tier: 'bronze',
  },
  {
    id: 'workout-50',
    name: '운동 매니아',
    description: '운동 50회 완료',
    icon: '💪',
    category: 'workout',
    requiredValue: 50,
    unit: '회',
    points: 100,
    tier: 'silver',
  },
  {
    id: 'workout-100',
    name: '운동 중독자',
    description: '운동 100회 완료',
    icon: '🔥',
    category: 'workout',
    requiredValue: 100,
    unit: '회',
    points: 200,
    tier: 'gold',
  },
  {
    id: 'workout-365',
    name: '운동의 신',
    description: '운동 365회 완료',
    icon: '👑',
    category: 'workout',
    requiredValue: 365,
    unit: '회',
    points: 500,
    tier: 'platinum',
  },

  // 연속 운동 관련
  {
    id: 'streak-7',
    name: '일주일 개근',
    description: '7일 연속 운동',
    icon: '📅',
    category: 'consistency',
    requiredValue: 7,
    unit: '일',
    points: 30,
    tier: 'bronze',
  },
  {
    id: 'streak-30',
    name: '한달 개근',
    description: '30일 연속 운동',
    icon: '🗓️',
    category: 'consistency',
    requiredValue: 30,
    unit: '일',
    points: 100,
    tier: 'silver',
  },
  {
    id: 'streak-100',
    name: '100일 챌린지',
    description: '100일 연속 운동',
    icon: '💯',
    category: 'consistency',
    requiredValue: 100,
    unit: '일',
    points: 300,
    tier: 'gold',
  },

  // 무게 관련
  {
    id: 'volume-1000',
    name: '1톤 달성',
    description: '총 볼륨 1,000kg 달성',
    icon: '⚖️',
    category: 'strength',
    requiredValue: 1000,
    unit: 'kg',
    points: 20,
  },
  {
    id: 'volume-10000',
    name: '10톤 달성',
    description: '총 볼륨 10,000kg 달성',
    icon: '🏋️',
    category: 'strength',
    requiredValue: 10000,
    unit: 'kg',
    points: 50,
    tier: 'bronze',
  },
  {
    id: 'volume-100000',
    name: '100톤 달성',
    description: '총 볼륨 100,000kg 달성',
    icon: '🦾',
    category: 'strength',
    requiredValue: 100000,
    unit: 'kg',
    points: 150,
    tier: 'silver',
  },
  {
    id: 'volume-1000000',
    name: '메가톤',
    description: '총 볼륨 1,000,000kg 달성',
    icon: '🚀',
    category: 'strength',
    requiredValue: 1000000,
    unit: 'kg',
    points: 500,
    tier: 'platinum',
  },

  // 운동 시간 관련
  {
    id: 'time-60',
    name: '1시간 운동',
    description: '한 번에 1시간 이상 운동',
    icon: '⏰',
    category: 'workout',
    requiredValue: 3600,
    unit: '초',
    points: 20,
  },
  {
    id: 'time-120',
    name: '2시간 운동',
    description: '한 번에 2시간 이상 운동',
    icon: '⏱️',
    category: 'workout',
    requiredValue: 7200,
    unit: '초',
    points: 50,
    tier: 'silver',
  },
  {
    id: 'total-time-100',
    name: '100시간 달성',
    description: '총 운동 시간 100시간',
    icon: '🕐',
    category: 'workout',
    requiredValue: 360000,
    unit: '초',
    points: 200,
    tier: 'gold',
  },

  // 유산소 관련
  {
    id: 'cardio-10km',
    name: '10km 달성',
    description: '총 유산소 거리 10km',
    icon: '🏃',
    category: 'workout',
    requiredValue: 10,
    unit: 'km',
    points: 30,
  },
  {
    id: 'cardio-100km',
    name: '100km 달성',
    description: '총 유산소 거리 100km',
    icon: '🏃‍♂️',
    category: 'workout',
    requiredValue: 100,
    unit: 'km',
    points: 100,
    tier: 'silver',
  },
  {
    id: 'cardio-1000km',
    name: '1000km 달성',
    description: '총 유산소 거리 1000km',
    icon: '🏃‍♀️',
    category: 'workout',
    requiredValue: 1000,
    unit: 'km',
    points: 300,
    tier: 'gold',
  },

  // 소셜 관련
  {
    id: 'social-share-1',
    name: '첫 공유',
    description: '운동 기록 첫 공유',
    icon: '📱',
    category: 'social',
    requiredValue: 1,
    points: 10,
  },
  {
    id: 'social-follow-10',
    name: '인기인',
    description: '팔로워 10명 달성',
    icon: '👥',
    category: 'social',
    requiredValue: 10,
    points: 50,
    tier: 'bronze',
  },
  {
    id: 'social-cheer-50',
    name: '응원왕',
    description: '응원 50회 받기',
    icon: '📣',
    category: 'social',
    requiredValue: 50,
    points: 50,
    tier: 'bronze',
  },

  // 특별 업적
  {
    id: 'special-early-bird',
    name: '얼리버드',
    description: '오전 6시 이전 운동',
    icon: '🐦',
    category: 'special',
    requiredValue: 1,
    points: 30,
  },
  {
    id: 'special-night-owl',
    name: '올빼미',
    description: '오후 10시 이후 운동',
    icon: '🦉',
    category: 'special',
    requiredValue: 1,
    points: 30,
  },
  {
    id: 'special-weekend-warrior',
    name: '주말 전사',
    description: '주말에 10회 운동',
    icon: '⚔️',
    category: 'special',
    requiredValue: 10,
    points: 50,
  },
  {
    id: 'special-new-year',
    name: '새해 첫 운동',
    description: '1월 1일 운동',
    icon: '🎊',
    category: 'special',
    requiredValue: 1,
    points: 100,
  },
  {
    id: 'special-birthday',
    name: '생일 운동',
    description: '생일에 운동',
    icon: '🎂',
    category: 'special',
    requiredValue: 1,
    points: 100,
  },

  // 운동 다양성
  {
    id: 'variety-10',
    name: '다재다능',
    description: '10가지 다른 운동 수행',
    icon: '🎨',
    category: 'workout',
    requiredValue: 10,
    points: 50,
    tier: 'bronze',
  },
  {
    id: 'variety-30',
    name: '만능 운동가',
    description: '30가지 다른 운동 수행',
    icon: '🌈',
    category: 'workout',
    requiredValue: 30,
    points: 100,
    tier: 'silver',
  },

  // 그룹 관련
  {
    id: 'group-join',
    name: '팀 플레이어',
    description: '그룹 가입',
    icon: '👫',
    category: 'social',
    requiredValue: 1,
    points: 20,
  },
  {
    id: 'group-leader',
    name: '그룹 리더',
    description: '그룹 생성',
    icon: '👨‍✈️',
    category: 'social',
    requiredValue: 1,
    points: 50,
  },
];

// 업적 카테고리별 정보
export const achievementCategories = [
  { id: 'workout', name: '운동', icon: '💪', color: '#FF6B6B' },
  { id: 'strength', name: '근력', icon: '🏋️', color: '#4ECDC4' },
  { id: 'consistency', name: '꾸준함', icon: '📅', color: '#45B7D1' },
  { id: 'social', name: '소셜', icon: '👥', color: '#96CEB4' },
  { id: 'special', name: '특별', icon: '⭐', color: '#FFEAA7' },
];

// 티어별 색상
export const tierColors = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
};