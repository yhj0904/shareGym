import { Text, type TextProps } from 'react-native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export type ThemedTextProps = TextProps & {
  lightColor?: string;
  darkColor?: string;
  type?: 'default' | 'title' | 'defaultSemiBold' | 'subtitle' | 'link';
};

export function ThemedText({
  style,
  lightColor,
  darkColor,
  type = 'default',
  ...rest
}: ThemedTextProps) {
  const theme = useColorScheme() ?? 'light';
  const color = theme === 'light' ? lightColor : darkColor;

  const getTextStyle = () => {
    switch (type) {
      case 'title':
        return {
          fontSize: 32,
          fontWeight: 'bold' as const,
          lineHeight: 40,
        };
      case 'subtitle':
        return {
          fontSize: 20,
          fontWeight: '600' as const,
        };
      case 'defaultSemiBold':
        return {
          fontSize: 16,
          fontWeight: '600' as const,
        };
      case 'link':
        return {
          fontSize: 16,
          color: Colors[theme].tint,
        };
      default:
        return {
          fontSize: 16,
        };
    }
  };

  return (
    <Text
      style={[
        {
          color: color || Colors[theme].text,
        },
        getTextStyle(),
        style,
      ]}
      {...rest}
    />
  );
}