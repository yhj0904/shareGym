import { Stack } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        {/* 인덱스 스크린을 명시적으로 추가 */}
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)/login" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="(auth)/signup" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="workout/active-session" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="workout/exercise-select" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="workout/session-complete" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="routine/list" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="routine/create" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="routine/exercise-select" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="card/create" options={{ headerShown: false, presentation: 'modal' }} />
        <Stack.Screen name="card/gallery" options={{ headerShown: false }} />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
