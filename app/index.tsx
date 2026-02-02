import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import useAuthStore from '@/stores/authStore';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function Index() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, isLoading } = useAuthStore();

  // 스토어가 로딩 중일 때 로딩 화면 표시
  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.tint} />
      </View>
    );
  }

  // 항상 대시보드(메인 탭)로 직접 이동
  // 로그인 여부와 관계없이 대시보드에서 시작
  return <Redirect href="/(tabs)" />;
}