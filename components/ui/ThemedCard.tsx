/**
 * 테마 지원 카드 컴포넌트
 * 다크 모드와 라이트 모드에서 적절한 배경색과 그림자를 제공
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewProps,
  Pressable,
  PressableProps,
} from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { getShadow } from '@/styles/shadows';

interface ThemedCardProps extends ViewProps {
  variant?: 'elevated' | 'filled' | 'outlined';
  shadowLevel?: 'small' | 'medium' | 'large';
  pressable?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function ThemedCard({
  style,
  variant = 'elevated',
  shadowLevel = 'small',
  pressable = false,
  onPress,
  disabled = false,
  children,
  ...otherProps
}: ThemedCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  // 변형별 스타일
  const variantStyles = {
    elevated: {
      backgroundColor: colors.card,
      ...getShadow(shadowLevel, isDark),
    },
    filled: {
      backgroundColor: isDark ? colors.card : colors.background,
    },
    outlined: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: colors.border,
    },
  };

  const cardStyle = [
    styles.card,
    variantStyles[variant],
    disabled && styles.disabled,
    style,
  ];

  if (pressable && onPress) {
    return (
      <Pressable
        style={({ pressed }) => [
          cardStyle,
          pressed && !disabled && styles.pressed,
        ]}
        onPress={onPress}
        disabled={disabled}
        {...(otherProps as PressableProps)}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View style={cardStyle} {...otherProps}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.5,
  },
});