import { create } from 'zustand';
import uuid from 'react-native-uuid';
import { isBackendEnabled, connectSSE } from '@/lib/api';
import type { SSEConnection } from '@/lib/api/sse';

// 실시간 운동 상태
export interface LiveWorkoutStatus {
  userId: string;
  username: string;
  status: 'idle' | 'working-out' | 'resting';
  currentExercise?: string;
  startTime: Date;
  lastUpdateTime: Date;
  workoutDuration: number; // 분 단위
  completedSets: number;
  groupId?: string; // 특정 그룹에서만 보이도록
  cheerCount: number; // 받은 응원 수
}

// 응원 메시지
export interface Cheer {
  id: string;
  fromUserId: string;
  fromUsername: string;
  toUserId: string;
  type: 'emoji' | 'message' | 'voice';
  content: string; // 이모지 또는 메시지
  timestamp: Date;
}

// 빠른 응원 템플릿
export const CHEER_EMOJIS = [
  { emoji: '💪', label: '화이팅!' },
  { emoji: '🔥', label: '불태워!' },
  { emoji: '👏', label: '잘하고 있어!' },
  { emoji: '🎯', label: '집중!' },
  { emoji: '⚡', label: '파워!' },
  { emoji: '🚀', label: '가즈아!' },
  { emoji: '💯', label: '완벽해!' },
  { emoji: '🏆', label: '챔피언!' },
];

export const CHEER_MESSAGES = [
  '오운완 가즈아! 💪',
  '마지막까지 화이팅!',
  '너라면 할 수 있어!',
  '포기하지 마!',
  '한 세트만 더!',
  '최고야! 👍',
  '운동 천재네!',
  '오늘도 열심히! 🔥',
];

interface LiveWorkoutStore {
  // 상태
  liveWorkouts: Map<string, LiveWorkoutStatus>; // userId -> status
  receivedCheers: Cheer[];
  sentCheers: Cheer[];
  unreadCheersCount: number;
  isListeningToLiveWorkouts: boolean;
  _sseWorkoutConnection: SSEConnection | null; // SSE 연결 참조 (내부용)

  // 내 운동 상태
  myLiveStatus: LiveWorkoutStatus | null;

  // 액션 - 운동 상태
  startLiveWorkout: (userId: string, username: string, currentExercise: string, groupId?: string) => Promise<void>;
  updateLiveWorkout: (updates: Partial<LiveWorkoutStatus>) => Promise<void>;
  endLiveWorkout: (userId: string) => Promise<void>;

  // 액션 - 응원
  sendCheer: (toUserId: string, type: 'emoji' | 'message', content: string) => Promise<void>;
  markCheersAsRead: () => void;

  // 실시간 리스닝
  startListeningToLiveWorkouts: (groupId?: string) => void | Promise<void>;
  stopListeningToLiveWorkouts: () => void;
  startListeningToCheers: (userId: string) => void;
  stopListeningToCheers: () => void;

  // 유틸리티
  getFriendsWorkingOut: () => LiveWorkoutStatus[];
  getCheerHistory: (userId: string) => Cheer[];
}

const useLiveWorkoutStore = create<LiveWorkoutStore>((set, get) => ({
  // 초기 상태
  liveWorkouts: new Map(),
  receivedCheers: [],
  sentCheers: [],
  unreadCheersCount: 0,
  isListeningToLiveWorkouts: false,
  _sseWorkoutConnection: null,
  myLiveStatus: null,

  // 운동 시작
  startLiveWorkout: async (userId, username, currentExercise, groupId) => {
    const liveStatus: LiveWorkoutStatus = {
      userId,
      username,
      status: 'working-out',
      currentExercise,
      startTime: new Date(),
      lastUpdateTime: new Date(),
      workoutDuration: 0,
      completedSets: 0,
      groupId,
      cheerCount: 0,
    };

    // 로컬 상태 업데이트
    set({ myLiveStatus: liveStatus });

    const newMap = new Map(get().liveWorkouts);
    newMap.set(userId, liveStatus);
    set({ liveWorkouts: newMap });
  },

  // 운동 상태 업데이트
  updateLiveWorkout: async (updates) => {
    const myStatus = get().myLiveStatus;
    if (!myStatus) return;

    // 로컬 상태 업데이트
    const updatedStatus = { ...myStatus, ...updates, lastUpdateTime: new Date() };
    set({ myLiveStatus: updatedStatus });

    const newMap = new Map(get().liveWorkouts);
    newMap.set(myStatus.userId, updatedStatus);
    set({ liveWorkouts: newMap });
  },

  // 운동 종료
  endLiveWorkout: async (userId) => {
    // 로컬 상태 업데이트
    set({ myLiveStatus: null });

    const newMap = new Map(get().liveWorkouts);
    newMap.delete(userId);
    set({ liveWorkouts: newMap });
  },

  // 응원 보내기
  sendCheer: async (toUserId, type, content) => {
    const fromUser = get().myLiveStatus;
    if (!fromUser) return;

    const cheer: Cheer = {
      id: uuid.v4() as string,
      fromUserId: fromUser.userId,
      fromUsername: fromUser.username,
      toUserId,
      type,
      content,
      timestamp: new Date(),
    };

    // 받는 사람의 응원 카운트 증가 (로컬)
    const targetWorkout = get().liveWorkouts.get(toUserId);
    if (targetWorkout) {
      const newMap = new Map(get().liveWorkouts);
      newMap.set(toUserId, {
        ...targetWorkout,
        cheerCount: (targetWorkout.cheerCount || 0) + 1,
      });
      set({ liveWorkouts: newMap });
    }

    // 로컬 상태 업데이트
    set((state) => ({
      sentCheers: [...state.sentCheers, cheer],
      receivedCheers: toUserId === fromUser.userId
        ? [...state.receivedCheers, cheer]
        : state.receivedCheers,
    }));
  },

  // 응원 읽음 처리
  markCheersAsRead: () => {
    set({ unreadCheersCount: 0 });
  },

  // 실시간 운동 상태 리스닝 - 백엔드 SSE 연동
  startListeningToLiveWorkouts: async (groupId) => {
    if (get().isListeningToLiveWorkouts) return;

    set({ isListeningToLiveWorkouts: true });

    if (isBackendEnabled()) {
      // 백엔드 SSE 엔드포인트 사용
      const { connectGroupStream, connectFeedStream } = await import('@/lib/api');

      // 그룹이 있으면 그룹 스트림, 없으면 전체 피드 스트림
      const conn = groupId
        ? await connectGroupStream(
            groupId,
            (data: any) => {
              // 백엔드에서 받은 운동 상태 업데이트
              if (data?.type === 'WORKOUT_STATUS' && data?.userId) {
                const status: LiveWorkoutStatus = {
                  userId: String(data.userId),
                  username: data.username || data.userName || String(data.userId),
                  status: data.status || 'working-out',
                  currentExercise: data.currentExercise || data.exercise,
                  startTime: data.startTime ? new Date(data.startTime) : new Date(),
                  lastUpdateTime: data.lastUpdateTime ? new Date(data.lastUpdateTime) : new Date(),
                  workoutDuration: data.workoutDuration || data.duration || 0,
                  completedSets: data.completedSets || data.sets || 0,
                  groupId: groupId,
                  cheerCount: data.cheerCount || 0,
                };
                const newMap = new Map(get().liveWorkouts);
                if (data.status === 'idle' || data.status === 'completed') {
                  newMap.delete(String(data.userId));
                } else {
                  newMap.set(String(data.userId), status);
                }
                set({ liveWorkouts: newMap });
              }
              // 응원 메시지 처리
              else if (data?.type === 'CHEER' && data?.fromUserId) {
                const cheer: Cheer = {
                  id: uuid.v4() as string,
                  fromUserId: String(data.fromUserId),
                  fromUsername: data.fromUsername || '',
                  toUserId: String(data.toUserId),
                  type: data.cheerType || 'emoji',
                  content: data.content || '💪',
                  timestamp: new Date(),
                };
                set(state => ({
                  receivedCheers: [...state.receivedCheers, cheer],
                  unreadCheersCount: state.unreadCheersCount + 1,
                }));
              }
            },
            (error) => {
              console.error('그룹 SSE 연결 실패:', error instanceof Error ? error.message : error);
            }
          )
        : await connectFeedStream(
            (data: any) => {
              // 전체 피드 스트림에서 운동 상태 업데이트 처리
              if (data?.type === 'WORKOUT_STATUS' && data?.userId) {
                const status: LiveWorkoutStatus = {
                  userId: String(data.userId),
                  username: data.username || data.userName || String(data.userId),
                  status: data.status || 'working-out',
                  currentExercise: data.currentExercise || data.exercise,
                  startTime: data.startTime ? new Date(data.startTime) : new Date(),
                  lastUpdateTime: data.lastUpdateTime ? new Date(data.lastUpdateTime) : new Date(),
                  workoutDuration: data.workoutDuration || data.duration || 0,
                  completedSets: data.completedSets || data.sets || 0,
                  cheerCount: data.cheerCount || 0,
                };
                const newMap = new Map(get().liveWorkouts);
                if (data.status === 'idle' || data.status === 'completed') {
                  newMap.delete(String(data.userId));
                } else {
                  newMap.set(String(data.userId), status);
                }
                set({ liveWorkouts: newMap });
              }
            },
            (error) => {
              console.error('피드 SSE 연결 실패:', error instanceof Error ? error.message : error);
            }
          );

      if (conn) set({ _sseWorkoutConnection: conn });
    }
  },

  // 리스닝 중지
  stopListeningToLiveWorkouts: () => {
    const conn = get()._sseWorkoutConnection;
    if (conn) {
      conn.close();
      set({ _sseWorkoutConnection: null });
    }
    set({ isListeningToLiveWorkouts: false });
  },

  // 응원 메시지 리스닝 (로컬 시뮬레이션)
  startListeningToCheers: (userId) => {
    // 실제 구현에서는 SSE (Server-Sent Events) 사용
    // 현재는 로컬 상태만 관리
  },

  // 응원 리스닝 중지
  stopListeningToCheers: () => {
    // unsubscribe 호출
  },

  // 운동 중인 친구들 가져오기
  getFriendsWorkingOut: () => {
    const workouts = Array.from(get().liveWorkouts.values());
    const myStatus = get().myLiveStatus;

    // 내 운동 제외
    return workouts.filter(w =>
      w.userId !== myStatus?.userId && w.status === 'working-out'
    );
  },

  // 특정 사용자와의 응원 히스토리
  getCheerHistory: (userId) => {
    const { receivedCheers, sentCheers } = get();

    return [
      ...receivedCheers.filter(c => c.fromUserId === userId),
      ...sentCheers.filter(c => c.toUserId === userId),
    ].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  },
}));

export default useLiveWorkoutStore;