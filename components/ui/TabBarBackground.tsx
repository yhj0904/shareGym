import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Platform, ViewStyle, View } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

// TabBarBackground 컴포넌트 - iOS에서 탭 바 배경에 블러 효과를 제공
export default function TabBarBackground({
  style,
}: {
  // style prop을 옵셔널로 변경하여 undefined 케이스 처리
  style?: ViewStyle | ViewStyle[];
}) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // iOS 플랫폼에서만 BlurView 렌더링
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        intensity={80}
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        // 블러 효과가 있는 배경
        style={[
          {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            top: 0,
          },
          ...(style ? (Array.isArray(style) ? style : [style]) : [])
        ]}
      />
    );
  }

  // Android에서는 일반 View 사용
  return (
    <View
      style={[
        {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          top: 0,
          backgroundColor: colors.background,
        },
        ...(style ? (Array.isArray(style) ? style : [style]) : [])
      ]}
    />
  );
}