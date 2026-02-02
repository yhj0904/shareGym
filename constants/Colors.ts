/**
 * ShareGym 브랜드 색상 시스템
 * 로고의 핑크-오렌지 그라데이션을 기반으로 한 색상 테마
 */

// 브랜드 핵심 컬러
const primaryPink = '#FF6F8D';
const primaryOrange = '#FFA24A';

export const Colors = {
  light: {
    // 텍스트 컬러
    text: '#1C1C1E',              // 메인 텍스트
    textSecondary: '#B5B5B8',     // 서브 텍스트
    textInverse: '#FFFFFF',       // 반전 텍스트 (컬러 배경 위)

    // 배경 컬러
    background: '#FFFFFF',         // 기본 배경
    backgroundSecondary: '#F2F2F4', // 서브 배경 (구분선, 섹션)

    // 브랜드 컬러
    tint: primaryPink,             // 메인 틴트 컬러
    tintSecondary: primaryOrange,  // 서브 틴트 컬러

    // 탭바 아이콘
    tabIconDefault: '#B5B5B8',    // 비활성 탭
    tabIconSelected: primaryPink,  // 활성 탭

    // UI 요소
    border: '#F2F2F4',            // 테두리
    card: '#FFFFFF',              // 카드 배경

    // 상태 컬러
    success: primaryOrange,        // 성공, 완료
    warning: '#FFB800',           // 경고
    error: '#FF3B30',             // 에러
    info: primaryPink,            // 정보

    // 기능별 컬러
    icon: '#B5B5B8',              // 기본 아이콘
    iconActive: primaryPink,       // 활성 아이콘

    // 버튼 배경
    buttonPrimary: primaryPink,   // 메인 버튼
    buttonSecondary: '#FFF1E4',   // 서브 버튼

    // 특수 용도
    accent: '#FFF1E4',            // 강조 배경 (응원 배지 등)
    notification: primaryOrange,   // 알림
  },
  dark: {
    // 텍스트 컬러
    text: '#FFFFFF',              // 메인 텍스트
    textSecondary: '#B5B5B8',    // 서브 텍스트
    textInverse: '#1C1C1E',      // 반전 텍스트

    // 배경 컬러
    background: '#121212',        // 기본 배경
    backgroundSecondary: '#1E1E1E', // 서브 배경

    // 브랜드 컬러 (다크모드에서도 동일)
    tint: primaryPink,
    tintSecondary: primaryOrange,

    // 탭바 아이콘
    tabIconDefault: '#B5B5B8',
    tabIconSelected: primaryPink,

    // UI 요소
    border: '#2C2C2E',           // 테두리
    card: '#1E1E1E',             // 카드 배경

    // 상태 컬러
    success: primaryOrange,
    warning: '#FFB800',
    error: '#FF453A',
    info: primaryPink,

    // 기능별 컬러
    icon: '#B5B5B8',
    iconActive: primaryPink,

    // 버튼 배경
    buttonPrimary: primaryPink,
    buttonSecondary: '#2C2C2E',

    // 특수 용도
    accent: '#2C2C2E',
    notification: primaryOrange,
  },
};

// 그라데이션 컬러 배열 (Linear Gradient용)
export const gradientColors = [primaryPink, primaryOrange];

// 버튼 스타일 프리셋
export const ButtonStyles = {
  primary: {
    light: {
      background: gradientColors,  // 그라데이션 적용
      text: '#FFFFFF',
    },
    dark: {
      background: gradientColors,
      text: '#FFFFFF',
    },
  },
  secondary: {
    light: {
      background: '#FFF1E4',
      text: primaryPink,
    },
    dark: {
      background: '#2C2C2E',
      text: primaryPink,
    },
  },
};

// 운동 기능 특화 컬러
export const WorkoutColors = {
  exercise: primaryPink,         // 운동 관련 텍스트/아이콘
  stats: primaryOrange,          // 통계 수치 강조
  rest: '#B5B5B8',              // 휴식 상태
  active: primaryPink,           // 활동 상태
  cheer: primaryOrange,          // 응원/리액션
};