import { SymbolView, SymbolViewProps, SymbolWeight } from 'expo-symbols';
import { StyleProp, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
  weight = 'regular',
}: {
  name: string;
  size?: number;
  color: string;
  style?: StyleProp<ViewStyle>;
  weight?: SymbolWeight;
}) {
  // iOS에서는 SF Symbols 사용, Android에서는 Ionicons 사용
  if (Platform.OS === 'ios') {
    return (
      <SymbolView
        name={name}
        size={size}
        type="monochrome"
        tintColor={color}
        style={style}
        weight={weight}
      />
    );
  }

  // Android용 아이콘 매핑
  const androidIconMap: { [key: string]: keyof typeof Ionicons.glyphMap } = {
    'house.fill': 'home',
    'figure.walk': 'walk',
    'chart.bar.fill': 'stats-chart',
    'person.2.fill': 'people',
    'person.fill': 'person',
    'dumbbell.fill': 'barbell',
    'barbell': 'barbell',
    'trophy.fill': 'trophy',
    'heart.fill': 'heart',
  };

  const androidIcon = androidIconMap[name] || 'help-circle';

  return (
    <Ionicons
      name={androidIcon}
      size={size}
      color={color}
      style={style as any}
    />
  );
}