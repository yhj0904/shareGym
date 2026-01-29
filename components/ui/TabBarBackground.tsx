import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Platform } from 'react-native';

export default function TabBarBackground({
  style,
}: {
  style: BottomTabBarProps['style'];
}) {
  return Platform.OS === 'ios' ? (
    <BlurView
      intensity={100}
      tint="prominent"
      style={[{ position: 'absolute', bottom: 0, left: 0, right: 0 }, style]}
    />
  ) : null;
}