/**
 * 알림 관련 API 함수들
 */

import { apiClient } from './client';
import type { ApiResponse } from './types';

/**
 * FCM 토큰 등록/업데이트
 */
export async function registerFCMToken(token: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const response = await apiClient.post('/notifications/fcm-token', {
      token,
      platform: Platform.OS,
      deviceInfo: {
        brand: Device.brand,
        model: Device.modelName,
        osVersion: Device.osVersion,
      },
    });
    return response;
  } catch (error) {
    console.error('FCM 토큰 등록 실패:', error);
    throw error;
  }
}

/**
 * FCM 토큰 삭제 (로그아웃 시)
 */
export async function unregisterFCMToken(token: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const response = await apiClient.delete('/notifications/fcm-token', {
      data: { token },
    });
    return response;
  } catch (error) {
    console.error('FCM 토큰 삭제 실패:', error);
    throw error;
  }
}

/**
 * 알림 설정 조회
 */
export async function getNotificationSettings(): Promise<ApiResponse<NotificationSettings>> {
  try {
    const response = await apiClient.get('/notifications/settings');
    return response;
  } catch (error) {
    console.error('알림 설정 조회 실패:', error);
    throw error;
  }
}

/**
 * 알림 설정 업데이트
 */
export async function updateNotificationSettings(
  settings: Partial<NotificationSettings>
): Promise<ApiResponse<NotificationSettings>> {
  try {
    const response = await apiClient.patch('/notifications/settings', settings);
    return response;
  } catch (error) {
    console.error('알림 설정 업데이트 실패:', error);
    throw error;
  }
}

/**
 * 알림 히스토리 조회
 */
export async function getNotificationHistory(
  cursor?: string,
  limit: number = 20
): Promise<ApiResponse<{ notifications: Notification[]; nextCursor?: string }>> {
  try {
    const params = new URLSearchParams();
    if (cursor) params.append('cursor', cursor);
    params.append('limit', limit.toString());

    const response = await apiClient.get(`/notifications/history?${params.toString()}`);
    return response;
  } catch (error) {
    console.error('알림 히스토리 조회 실패:', error);
    throw error;
  }
}

/**
 * 알림 읽음 처리
 */
export async function markNotificationAsRead(notificationId: string): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response;
  } catch (error) {
    console.error('알림 읽음 처리 실패:', error);
    throw error;
  }
}

/**
 * 모든 알림 읽음 처리
 */
export async function markAllNotificationsAsRead(): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const response = await apiClient.patch('/notifications/read-all');
    return response;
  } catch (error) {
    console.error('모든 알림 읽음 처리 실패:', error);
    throw error;
  }
}

// Types
import { Platform } from 'react-native';
import * as Device from 'expo-device';

export interface NotificationSettings {
  id: string;
  userId: string;
  pushEnabled: boolean;
  emailEnabled: boolean;
  workout: boolean;
  social: boolean;
  group: boolean;
  marketing: boolean;
  nightMode: boolean;
  nightModeStart: string; // HH:MM
  nightModeEnd: string;   // HH:MM
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'group_invite' | 'cheer' | 'workout_shared';
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: string;
}