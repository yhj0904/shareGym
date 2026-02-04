import { useEffect, useRef } from 'react';
import { Stack, router } from 'expo-router';
import { ThemeProvider, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from '@/hooks/useColorScheme';
import { setOnUnauthorized, clearApiCache } from '@/lib/api';
import useAuthStore from '@/stores/authStore';
import useWorkoutStore from '@/stores/workoutStore';
import useRoutineStore from '@/stores/routineStore';
import useFeedStore from '@/stores/feedStore';
import useGroupStore from '@/stores/groupStore';
import useNotificationStore from '@/stores/notificationStore';
import useAchievementStore from '@/stores/achievementStore';
import useWorkoutAnalyticsStore from '@/stores/workoutAnalyticsStore';
import * as Notifications from 'expo-notifications';
import { AppState, AppStateStatus } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appStateRef = useRef(AppState.currentState);
  const appStateSubscription = useRef<any>();

  useEffect(() => {
    // 401 에러 처리
    setOnUnauthorized(() => {
      useAuthStore.getState().clearAuthState();
      useWorkoutStore.getState().clearUserData();
      useRoutineStore.getState().clearUserData();
      useFeedStore.getState().clearUserData();
      useGroupStore.getState().clearUserData();
      useNotificationStore.getState().clearUserData();
      useAchievementStore.getState().clearUserData();
      useWorkoutAnalyticsStore.getState().clearUserData();
      clearApiCache();
      router.replace('/(auth)/login');
    });

    // FCM 초기화 (권한 요청은 사용자 로그인 후에)
    const initializeFCM = async () => {
      const user = useAuthStore.getState().user;
      if (user) {
        await useNotificationStore.getState().initializeFCM();
        await useNotificationStore.getState().registerFCMTokenToBackend();
      }
    };

    initializeFCM();

    // 포그라운드 알림 리스너
    notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
      console.log('포그라운드 알림 수신:', notification);
      // 포그라운드에서는 SSE가 이미 처리하므로 FCM은 무시할 수도 있음
      // 하지만 SSE 연결이 끊어진 경우를 대비해 처리
      const appState = AppState.currentState;
      if (appState === 'active') {
        // 포그라운드에서는 SSE가 우선, FCM은 백업
        // 중복 방지를 위해 notificationStore에서 체크
        useNotificationStore.getState().handlePushNotification(notification);
      }
    });

    // 알림 클릭 리스너 (백그라운드/종료 상태에서 알림 클릭)
    responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('알림 클릭:', response);
      const { notification } = response;
      const data = notification.request.content.data;

      // 알림 타입에 따라 다른 화면으로 이동
      if (data?.targetId) {
        switch (data.type) {
          case 'like':
          case 'comment':
            // 피드 상세로 이동 (필요시 구현)
            router.push('/(tabs)');
            break;
          case 'follow':
            // 프로필로 이동
            if (data.fromUserId) {
              router.push(`/profile/${data.fromUserId}`);
            }
            break;
          case 'group_invite':
            // 그룹 상세로 이동
            if (data.targetId) {
              router.push(`/group/${data.targetId}`);
            }
            break;
          case 'cheer':
          case 'workout_shared':
            // 홈으로 이동
            router.push('/(tabs)');
            break;
          default:
            router.push('/(tabs)');
        }
      } else {
        // 알림 목록으로 이동
        router.push('/notifications');
      }
    });

    // 앱 상태 변경 리스너 (포그라운드/백그라운드 전환)
    appStateSubscription.current = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (appStateRef.current.match(/inactive|background/) && nextAppState === 'active') {
        // 백그라운드에서 포그라운드로 전환
        console.log('앱이 포그라운드로 전환됨');

        // SSE 재연결 (필요시)
        const user = useAuthStore.getState().user;
        if (user?.id) {
          useNotificationStore.getState().startListening(user.id);
        }
      } else if (appStateRef.current === 'active' && nextAppState.match(/inactive|background/)) {
        // 포그라운드에서 백그라운드로 전환
        console.log('앱이 백그라운드로 전환됨');

        // SSE 연결 일시 중지 (배터리 절약)
        // FCM이 백그라운드 알림 처리
        useNotificationStore.getState().stopListening();
      }

      appStateRef.current = nextAppState;
    });

    return () => {
      setOnUnauthorized(null);

      // 리스너 정리
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
      if (appStateSubscription.current) {
        appStateSubscription.current.remove();
      }
    };
  }, []);

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
        <Stack.Screen name="card/view" options={{ headerShown: false }} />
        <Stack.Screen name="card/complete-shared" options={{ headerShown: false }} />
        <Stack.Screen name="group/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="profile/[userId]" options={{ headerShown: false }} />
        <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
        {/* 업적과 설정 화면 헤더 숨기기 */}
        <Stack.Screen name="achievements/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings/index" options={{ headerShown: false }} />
        <Stack.Screen name="settings/profile-edit" options={{ headerShown: false }} />
        <Stack.Screen name="settings/badge-select" options={{ headerShown: false }} />
        <Stack.Screen name="settings/privacy" options={{ headerShown: false }} />
        <Stack.Screen name="settings/terms" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
