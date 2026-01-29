import { create } from 'zustand';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import uuid from 'react-native-uuid';

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
    try {
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

      // Firestore에 저장
      await setDoc(doc(db, 'liveWorkouts', userId), {
        ...liveStatus,
        startTime: serverTimestamp(),
        lastUpdateTime: serverTimestamp(),
      });

      // 로컬 상태 업데이트
      set({ myLiveStatus: liveStatus });

      const newMap = new Map(get().liveWorkouts);
      newMap.set(userId, liveStatus);
      set({ liveWorkouts: newMap });
    } catch (error) {
      console.error('Error starting live workout:', error);
    }
  },

  // 운동 상태 업데이트
  updateLiveWorkout: async (updates) => {
    try {
      const myStatus = get().myLiveStatus;
      if (!myStatus) return;

      await updateDoc(doc(db, 'liveWorkouts', myStatus.userId), {
        ...updates,
        lastUpdateTime: serverTimestamp(),
      });

      // 로컬 상태 업데이트
      const updatedStatus = { ...myStatus, ...updates, lastUpdateTime: new Date() };
      set({ myLiveStatus: updatedStatus });

      const newMap = new Map(get().liveWorkouts);
      newMap.set(myStatus.userId, updatedStatus);
      set({ liveWorkouts: newMap });
    } catch (error) {
      console.error('Error updating live workout:', error);
    }
  },

  // 운동 종료
  endLiveWorkout: async (userId) => {
    try {
      await deleteDoc(doc(db, 'liveWorkouts', userId));

      // 로컬 상태 업데이트
      set({ myLiveStatus: null });

      const newMap = new Map(get().liveWorkouts);
      newMap.delete(userId);
      set({ liveWorkouts: newMap });
    } catch (error) {
      console.error('Error ending live workout:', error);
    }
  },

  // 응원 보내기
  sendCheer: async (toUserId, type, content) => {
    try {
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

      // Firestore에 저장
      await setDoc(doc(db, 'cheers', cheer.id), {
        ...cheer,
        timestamp: serverTimestamp(),
      });

      // 받는 사람의 응원 카운트 증가
      const targetWorkout = get().liveWorkouts.get(toUserId);
      if (targetWorkout) {
        await updateDoc(doc(db, 'liveWorkouts', toUserId), {
          cheerCount: (targetWorkout.cheerCount || 0) + 1,
        });
      }

      // 로컬 상태 업데이트
      set((state) => ({
        sentCheers: [...state.sentCheers, cheer],
      }));
    } catch (error) {
      console.error('Error sending cheer:', error);
    }
  },

  // 응원 읽음 처리
  markCheersAsRead: () => {
    set({ unreadCheersCount: 0 });
  },

  // 실시간 운동 상태 리스닝
  startListeningToLiveWorkouts: (groupId) => {
    if (get().isListeningToLiveWorkouts) return;

    let q;
    if (groupId) {
      q = query(
        collection(db, 'liveWorkouts'),
        where('groupId', '==', groupId)
      );
    } else {
      q = query(collection(db, 'liveWorkouts'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newMap = new Map<string, LiveWorkoutStatus>();

      snapshot.forEach((doc) => {
        const data = doc.data();
        newMap.set(doc.id, {
          ...data,
          startTime: data.startTime?.toDate() || new Date(),
          lastUpdateTime: data.lastUpdateTime?.toDate() || new Date(),
        } as LiveWorkoutStatus);
      });

      set({
        liveWorkouts: newMap,
        isListeningToLiveWorkouts: true,
      });
    });

    // unsubscribe 함수를 저장해야 함 (실제 구현 시)
  },

  // 리스닝 중지
  stopListeningToLiveWorkouts: () => {
    // unsubscribe 호출
    set({ isListeningToLiveWorkouts: false });
  },

  // 응원 메시지 리스닝
  startListeningToCheers: (userId) => {
    const q = query(
      collection(db, 'cheers'),
      where('toUserId', '==', userId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const cheers: Cheer[] = [];
      let unreadCount = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const cheer = {
          ...data,
          timestamp: data.timestamp?.toDate() || new Date(),
        } as Cheer;

        cheers.push(cheer);

        // 최근 5분 이내 응원은 unread로 카운트
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
        if (cheer.timestamp > fiveMinutesAgo) {
          unreadCount++;
        }
      });

      // 시간순 정렬
      cheers.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      set({
        receivedCheers: cheers,
        unreadCheersCount: unreadCount,
      });
    });

    // unsubscribe 함수를 저장해야 함
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