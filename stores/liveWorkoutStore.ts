import { create } from 'zustand';
import uuid from 'react-native-uuid';

// Firebase 기능은 실제 구현 시 활성화
// import {
//   collection,
//   doc,
//   setDoc,
//   updateDoc,
//   deleteDoc,
//   onSnapshot,
//   query,
//   where,
//   serverTimestamp,
// } from 'firebase/firestore';
// import { db } from '@/config/firebase';

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
  startListeningToLiveWorkouts: (groupId?: string) => void;
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

  // 실시간 운동 상태 리스닝 (로컬 시뮬레이션)
  startListeningToLiveWorkouts: (groupId) => {
    if (get().isListeningToLiveWorkouts) return;

    // 실제 구현에서는 WebSocket이나 Firebase Realtime DB 사용
    // 현재는 로컬 상태만 관리
    set({ isListeningToLiveWorkouts: true });
  },

  // 리스닝 중지
  stopListeningToLiveWorkouts: () => {
    // unsubscribe 호출
    set({ isListeningToLiveWorkouts: false });
  },

  // 응원 메시지 리스닝 (로컬 시뮬레이션)
  startListeningToCheers: (userId) => {
    // 실제 구현에서는 WebSocket이나 Firebase Realtime DB 사용
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