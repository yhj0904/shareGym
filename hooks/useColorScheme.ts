import { useColorScheme as _useColorScheme } from 'react-native';

export function useColorScheme(): NonNullable<'light' | 'dark'> {
  return _useColorScheme() ?? 'light';
}