/**
 * 공통 스타일 상수 및 유틸리티
 * 반복되는 스타일 코드를 줄이기 위한 공통 스타일 정의
 */

import { StyleSheet, TextStyle, ViewStyle } from 'react-native';

// 공통 spacing 값
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// 공통 font sizes
export const fontSize = {
  xs: 11,
  sm: 12,
  base: 14,
  lg: 16,
  xl: 18,
  '2xl': 20,
  '3xl': 24,
  '4xl': 32,
  '5xl': 42,
} as const;

// 공통 border radius
export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

// 플렉스 레이아웃 헬퍼
export const flex = StyleSheet.create({
  row: {
    flexDirection: 'row',
  } as ViewStyle,
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  } as ViewStyle,
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as ViewStyle,
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
  flex1: {
    flex: 1,
  } as ViewStyle,
});

// 공통 그림자 스타일
export const shadows = StyleSheet.create({
  sm: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  } as ViewStyle,
  md: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  } as ViewStyle,
  lg: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  } as ViewStyle,
});

// 공통 텍스트 스타일
export const typography = StyleSheet.create({
  h1: {
    fontSize: fontSize['4xl'],
    fontWeight: 'bold',
  } as TextStyle,
  h2: {
    fontSize: fontSize['3xl'],
    fontWeight: 'bold',
  } as TextStyle,
  h3: {
    fontSize: fontSize['2xl'],
    fontWeight: '600',
  } as TextStyle,
  h4: {
    fontSize: fontSize.xl,
    fontWeight: '600',
  } as TextStyle,
  body: {
    fontSize: fontSize.base,
  } as TextStyle,
  caption: {
    fontSize: fontSize.sm,
  } as TextStyle,
  bold: {
    fontWeight: 'bold',
  } as TextStyle,
  medium: {
    fontWeight: '600',
  } as TextStyle,
});

// 공통 컨테이너 스타일
export const containers = StyleSheet.create({
  page: {
    flex: 1,
  } as ViewStyle,
  padded: {
    padding: spacing.lg,
  } as ViewStyle,
  card: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  } as ViewStyle,
});

// 공통 버튼 스타일 생성 함수
export const createButtonStyle = (color: string, variant: 'solid' | 'outline' = 'solid'): ViewStyle => ({
  paddingHorizontal: spacing.xl,
  paddingVertical: spacing.md,
  borderRadius: borderRadius.lg,
  alignItems: 'center',
  justifyContent: 'center',
  ...(variant === 'solid' ? {
    backgroundColor: color,
  } : {
    borderWidth: 1,
    borderColor: color,
    backgroundColor: 'transparent',
  }),
});

// 공통 입력 필드 스타일
export const inputs = StyleSheet.create({
  field: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    fontSize: fontSize.base,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  } as TextStyle & ViewStyle,
});

// 유틸리티 함수: 반응형 크기 계산
import { Dimensions } from 'react-native';
const { width: screenWidth } = Dimensions.get('window');

export const responsive = {
  width: (percentage: number) => (screenWidth * percentage) / 100,
  height: (percentage: number) => (screenWidth * percentage) / 100,
  fontSize: (size: number) => Math.round(size * (screenWidth / 375)), // 375는 iPhone X 기준
};

// 카드 스타일 헬퍼 (인스타그램 카드용)
export const cardDimensions = {
  width: screenWidth - (spacing.xl * 2),
  height: (screenWidth - (spacing.xl * 2)) * 1.4, // 9:16 비율
};