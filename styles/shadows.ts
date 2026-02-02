/**
 * 플랫폼별 그림자 스타일
 * iOS와 Android에서 일관된 그림자 효과를 제공
 */

import { Platform, ViewStyle } from 'react-native';

interface ShadowStyle {
  light: ViewStyle;
  dark: ViewStyle;
}

// 그림자 레벨별 스타일
export const shadows = {
  // 작은 그림자 (버튼, 카드 등)
  small: {
    light: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
    dark: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
      },
      android: {
        elevation: 2,
      },
      default: {},
    }),
  } as ShadowStyle,

  // 중간 그림자 (플로팅 버튼, 모달 등)
  medium: {
    light: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
    dark: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.4,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
      default: {},
    }),
  } as ShadowStyle,

  // 큰 그림자 (다이얼로그, 시트 등)
  large: {
    light: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
    dark: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.5,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
      default: {},
    }),
  } as ShadowStyle,

  // 매우 큰 그림자 (풀스크린 모달 등)
  extraLarge: {
    light: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
      default: {},
    }),
    dark: Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.6,
        shadowRadius: 16,
      },
      android: {
        elevation: 16,
      },
      default: {},
    }),
  } as ShadowStyle,
};

// 헬퍼 함수: 현재 테마에 맞는 그림자 스타일 가져오기
export const getShadow = (level: keyof typeof shadows, isDark: boolean): ViewStyle => {
  return isDark ? shadows[level].dark : shadows[level].light;
};

// 커스텀 그림자 생성 함수
export const createShadow = (
  offsetY: number,
  radius: number,
  opacity: number,
  isDark: boolean
): ViewStyle => {
  const adjustedOpacity = isDark ? opacity * 2.5 : opacity;

  return Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: offsetY },
      shadowOpacity: adjustedOpacity,
      shadowRadius: radius,
    },
    android: {
      elevation: offsetY * 2,
    },
    default: {},
  }) as ViewStyle;
};

// 텍스트 그림자 (제목, 강조 텍스트 등)
export const textShadows = {
  small: {
    light: {
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    dark: {
      textShadowColor: 'rgba(0, 0, 0, 0.5)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
  },
  medium: {
    light: {
      textShadowColor: 'rgba(0, 0, 0, 0.15)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
    dark: {
      textShadowColor: 'rgba(0, 0, 0, 0.7)',
      textShadowOffset: { width: 0, height: 2 },
      textShadowRadius: 4,
    },
  },
};