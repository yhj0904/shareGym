/**
 * 알림 스토어
 * - SSE로 실시간 알림 수신 (포그라운드)
 * - FCM으로 PUSH 알림 수신 (백그라운드)
 * - 좋아요, 댓글, 팔로우, 그룹 활동 등
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isBackendEnabled, connectSSE } from '@/lib/api';
import type { SSEConnection } from '@/lib/api/sse';
import * as FCM from '@/lib/notifications/fcm';
import { registerFCMToken, unregisterFCMToken } from '@/lib/api/notification';
import * as Notifications from 'expo-notifications';

/** 알림 타입 */
export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'group_invite'
  | 'cheer'
  | 'workout_shared';

/** 알림 항목 */
export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  fromUserId?: string;
  fromUsername?: string;
  targetId?: string; // 피드/포스트/그룹 ID
  read: boolean;
  createdAt: Date;
}

interface NotificationStore {
  notifications: NotificationItem[];
  unreadCount: number;
  _sseConnection: SSEConnection | null;
  fcmToken: string | null;
  pushPermissionStatus: 'granted' | 'denied' | 'undetermined' | null;

  /** SSE로 알림 구독 시작 */
  startListening: (userId: string) => void | Promise<void>;
  /** 구독 중지 */
  stopListening: () => void;
  /** 알림 추가 (SSE 또는 FCM 수신 시) */
  addNotification: (item: Omit<NotificationItem, 'id' | 'read' | 'createdAt'>) => void;
  /** 읽음 처리 */
  markAsRead: (id: string) => void;
  /** 전체 읽음 처리 */
  markAllAsRead: () => void;
  /** FCM 초기화 및 권한 요청 */
  initializeFCM: () => Promise<void>;
  /** FCM 토큰 백엔드 등록 */
  registerFCMTokenToBackend: () => Promise<void>;
  /** FCM 토큰 백엔드에서 삭제 */
  unregisterFCMTokenFromBackend: () => Promise<void>;
  /** PUSH 알림 처리 (FCM에서 수신) */
  handlePushNotification: (notification: Notifications.Notification) => void;
  /** 로그아웃 시 초기화 */
  clearUserData: () => void;
}

const useNotificationStore = create<NotificationStore>()(
  persist(
    (set, get) => ({
      notifications: [],
      unreadCount: 0,
      _sseConnection: null,
      fcmToken: null,
      pushPermissionStatus: null,

      startListening: async (userId) => {
        if (get()._sseConnection) return;

        if (isBackendEnabled()) {
          // 백엔드 SSE 엔드포인트 사용 (/api/v1/sse/user/{userId})
          const { connectUserNotifications } = await import('@/lib/api');
          const conn = await connectUserNotifications(
            userId,
            (data: any) => {
              // 백엔드에서 받은 알림 데이터 처리
              if (data?.type && data?.title) {
                get().addNotification({
                  type: data.type,
                  title: data.title,
                  body: data.body || data.message,
                  fromUserId: data.fromUserId || data.senderId,
                  fromUsername: data.fromUsername || data.senderName,
                  targetId: data.targetId || data.relatedId,
                });
              }
            },
            (error) => {
              console.error('SSE 알림 연결 실패:', error instanceof Error ? error.message : error);
            }
          );
          if (conn) set({ _sseConnection: conn });
        }
      },

      stopListening: () => {
        const conn = get()._sseConnection;
        if (conn) {
          conn.close();
          set({ _sseConnection: null });
        }
      },

      addNotification: (item) => {
        const notification: NotificationItem = {
          ...item,
          id: `n-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          read: false,
          createdAt: new Date(),
        };
        set((state) => ({
          notifications: [notification, ...state.notifications].slice(0, 100),
          unreadCount: state.unreadCount + 1,
        }));
      },

      markAsRead: (id) => {
        set((state) => {
          const item = state.notifications.find((n) => n.id === id);
          if (!item || item.read) return state;
          return {
            notifications: state.notifications.map((n) =>
              n.id === id ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, state.unreadCount - 1),
          };
        });
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
        // 배지 카운트도 초기화
        FCM.clearBadgeCount();
      },

      initializeFCM: async () => {
        try {
          // Android 알림 채널 설정
          await FCM.setupNotificationChannels();

          // PUSH 권한 요청
          const { granted, token, error } = await FCM.requestNotificationPermission();

          if (granted && token) {
            set({
              fcmToken: token,
              pushPermissionStatus: 'granted'
            });
            console.log('FCM 토큰 발급:', token);
          } else if (granted) {
            set({ pushPermissionStatus: 'granted' });
            console.log('FCM 권한 허용됨 (토큰 없음)');
          } else {
            set({ pushPermissionStatus: 'denied' });
            console.log('FCM 권한 거부:', error);
          }
        } catch (error) {
          console.error('FCM 초기화 실패:', error instanceof Error ? error.message : error);
          set({ pushPermissionStatus: 'denied' });
        }
      },

      registerFCMTokenToBackend: async () => {
        const token = get().fcmToken;
        if (!token || !isBackendEnabled()) return;

        try {
          await registerFCMToken(token);
          console.log('FCM 토큰 백엔드 등록 완료');
        } catch (error) {
          console.warn('FCM 토큰 백엔드 등록 실패:', error instanceof Error ? error.message : error);
        }
      },

      unregisterFCMTokenFromBackend: async () => {
        const token = get().fcmToken;
        if (!token || !isBackendEnabled()) return;

        try {
          await unregisterFCMToken(token);
          console.log('FCM 토큰 백엔드 삭제 완료');
        } catch (error) {
          console.warn('FCM 토큰 백엔드 삭제 실패:', error instanceof Error ? error.message : error);
        }
      },

      handlePushNotification: (notification) => {
        // FCM 알림 데이터를 NotificationItem으로 변환
        const { request } = notification;
        const { content, identifier } = request;

        // 이미 존재하는 알림인지 확인 (중복 방지)
        const exists = get().notifications.some(n => n.id === identifier);
        if (exists) return;

        // 알림 추가
        get().addNotification({
          type: content.data?.type || 'cheer',
          title: content.title || '새 알림',
          body: content.body || '',
          fromUserId: content.data?.fromUserId,
          fromUsername: content.data?.fromUsername,
          targetId: content.data?.targetId,
        });

        // 배지 카운트 업데이트
        FCM.setBadgeCount(get().unreadCount);
      },

      clearUserData: async () => {
        // FCM 토큰 백엔드에서 삭제
        await get().unregisterFCMTokenFromBackend();

        // SSE 연결 종료
        get().stopListening();

        // FCM 토큰 로컬 삭제
        await FCM.clearFCMToken();

        // 배지 카운트 초기화
        await FCM.clearBadgeCount();

        // 상태 초기화
        set({
          notifications: [],
          unreadCount: 0,
          fcmToken: null,
          pushPermissionStatus: null
        });
      },
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        notifications: s.notifications,
        unreadCount: s.unreadCount,
        fcmToken: s.fcmToken,
        pushPermissionStatus: s.pushPermissionStatus,
      }),
    }
  )
);

export default useNotificationStore;
