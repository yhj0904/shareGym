/**
 * FCM (Firebase Cloud Messaging) 관련 유틸리티
 * PUSH 알림 권한 요청 및 토큰 관리
 */

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 알림 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// FCM 토큰 저장 키
const FCM_TOKEN_KEY = 'sharegym_fcm_token';
const PUSH_PERMISSION_KEY = 'sharegym_push_permission';

/**
 * 디바이스가 실제 기기인지 확인
 */
export function isDevice(): boolean {
  return Device.isDevice;
}

/**
 * PUSH 알림 권한 상태 확인
 */
export async function getNotificationPermissionStatus(): Promise<Notifications.PermissionStatus> {
  const { status } = await Notifications.getPermissionsAsync();
  return status;
}

/**
 * PUSH 알림 권한 요청
 * @returns 권한 허용 여부와 토큰
 */
export async function requestNotificationPermission(): Promise<{
  granted: boolean;
  token: string | null;
  error?: string;
}> {
  try {
    // 실제 디바이스가 아니면 에뮬레이터/시뮬레이터
    if (!Device.isDevice) {
      return {
        granted: false,
        token: null,
        error: '실제 기기에서만 PUSH 알림을 사용할 수 있습니다.',
      };
    }

    // 현재 권한 상태 확인
    let { status } = await Notifications.getPermissionsAsync();

    // 권한이 없으면 요청
    if (status !== 'granted') {
      const response = await Notifications.requestPermissionsAsync();
      status = response.status;
    }

    // 권한이 거부된 경우
    if (status !== 'granted') {
      await AsyncStorage.setItem(PUSH_PERMISSION_KEY, 'denied');
      return {
        granted: false,
        token: null,
        error: '알림 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.',
      };
    }

    // 권한이 허용된 경우 토큰 발급
    await AsyncStorage.setItem(PUSH_PERMISSION_KEY, 'granted');

    // Expo 프로젝트 ID 확인
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) {
      return {
        granted: true,
        token: null,
        error: 'EAS 프로젝트 ID가 설정되지 않았습니다.',
      };
    }

    // FCM 토큰 발급 (Expo Push Token)
    const tokenResponse = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    const token = tokenResponse.data;

    // 토큰 저장
    if (token) {
      await saveFCMToken(token);
    }

    return {
      granted: true,
      token,
    };
  } catch (error) {
    console.error('FCM 권한 요청 실패:', error);
    return {
      granted: false,
      token: null,
      error: error instanceof Error ? error.message : '알림 권한 요청 중 오류가 발생했습니다.',
    };
  }
}

/**
 * FCM 토큰 저장
 */
export async function saveFCMToken(token: string): Promise<void> {
  try {
    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
  } catch (error) {
    console.error('FCM 토큰 저장 실패:', error);
  }
}

/**
 * 저장된 FCM 토큰 가져오기
 */
export async function getSavedFCMToken(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('FCM 토큰 로드 실패:', error);
    return null;
  }
}

/**
 * FCM 토큰 삭제
 */
export async function clearFCMToken(): Promise<void> {
  try {
    await AsyncStorage.removeItem(FCM_TOKEN_KEY);
  } catch (error) {
    console.error('FCM 토큰 삭제 실패:', error);
  }
}

/**
 * 알림 채널 설정 (Android)
 */
export async function setupNotificationChannels(): Promise<void> {
  if (Platform.OS === 'android') {
    // 기본 알림 채널
    await Notifications.setNotificationChannelAsync('default', {
      name: '기본 알림',
      description: '일반 알림 메시지',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4CAF50',
    });

    // 운동 알림 채널
    await Notifications.setNotificationChannelAsync('workout', {
      name: '운동 알림',
      description: '운동 시작, 완료, 응원 알림',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500],
      lightColor: '#2196F3',
    });

    // 그룹 알림 채널
    await Notifications.setNotificationChannelAsync('group', {
      name: '그룹 알림',
      description: '그룹 초대, 활동 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF9800',
    });

    // 소셜 알림 채널
    await Notifications.setNotificationChannelAsync('social', {
      name: '소셜 알림',
      description: '좋아요, 댓글, 팔로우 알림',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250],
      lightColor: '#E91E63',
    });
  }
}

/**
 * 로컬 알림 예약 (테스트용)
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  seconds: number = 5
): Promise<string> {
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
      badge: 1,
    },
    trigger: {
      seconds,
    },
  });
  return id;
}

/**
 * 배지 카운트 설정
 */
export async function setBadgeCount(count: number): Promise<void> {
  try {
    await Notifications.setBadgeCountAsync(count);
  } catch (error) {
    console.error('배지 카운트 설정 실패:', error);
  }
}

/**
 * 배지 카운트 초기화
 */
export async function clearBadgeCount(): Promise<void> {
  await setBadgeCount(0);
}

/**
 * 알림 권한 상태 문자열 변환
 */
export function getPermissionStatusText(status: Notifications.PermissionStatus): string {
  switch (status) {
    case Notifications.PermissionStatus.GRANTED:
      return '허용됨';
    case Notifications.PermissionStatus.DENIED:
      return '거부됨';
    case Notifications.PermissionStatus.UNDETERMINED:
      return '미결정';
    default:
      return '알 수 없음';
  }
}