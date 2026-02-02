import { create } from 'zustand';
import { FeedItem, WorkoutSession, Comment } from '@/types';
import uuid from 'react-native-uuid';

// Firebase imports - 실제 구현 시 활성화
// import {
//   collection,
//   doc,
//   setDoc,
//   getDoc,
//   getDocs,
//   updateDoc,
//   deleteDoc,
//   query,
//   where,
//   orderBy,
//   limit,
//   startAfter,
//   serverTimestamp,
// } from 'firebase/firestore';
// import { db } from '@/config/firebase';

interface FeedStore {
  feedItems: FeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  lastVisible: any;

  // 피드 관리
  fetchFeed: (userId?: string) => Promise<void>;
  fetchUserFeed: (userId: string) => Promise<void>;
  fetchFollowingFeed: (followingIds: string[]) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshFeed: () => Promise<void>;

  // 게시물 생성
  shareWorkout: (workout: WorkoutSession, userId: string) => Promise<void>;

  // 상호작용
  likePost: (feedItemId: string, userId: string) => Promise<void>;
  unlikePost: (feedItemId: string, userId: string) => Promise<void>;
  addComment: (feedItemId: string, comment: Comment) => Promise<void>;
  deleteComment: (feedItemId: string, commentId: string) => Promise<void>;
}

// Mock 데이터 생성 헬퍼
const generateMockFeedItems = (): FeedItem[] => [
  {
    id: '1',
    userId: 'user2',
    workoutId: 'workout1',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2시간 전
    likes: ['test-user', 'user3'],
    comments: [
      {
        id: 'comment1',
        userId: 'test-user',
        content: '대단하네요! 💪',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
      }
    ],
    workoutData: {
      id: 'workout1',
      userId: 'user2',
      startTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      exercises: [
        {
          id: '1',
          name: '벤치프레스',
          category: 'chest',
          sets: [
            { id: '1', weight: 60, reps: 10, isCompleted: true },
            { id: '2', weight: 70, reps: 8, isCompleted: true },
            { id: '3', weight: 80, reps: 6, isCompleted: true },
          ]
        }
      ],
      totalVolume: 2920,
      duration: 3600,
      caloriesBurned: 250,
    }
  },
  {
    id: '2',
    userId: 'user3',
    workoutId: 'workout2',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 어제
    likes: ['user2'],
    comments: [],
    workoutData: {
      id: 'workout2',
      userId: 'user3',
      startTime: new Date(Date.now() - 25 * 60 * 60 * 1000),
      endTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      exercises: [
        {
          id: '2',
          name: '스쿼트',
          category: 'legs',
          sets: [
            { id: '1', weight: 80, reps: 10, isCompleted: true },
            { id: '2', weight: 90, reps: 8, isCompleted: true },
            { id: '3', weight: 100, reps: 6, isCompleted: true },
          ]
        }
      ],
      totalVolume: 3520,
      duration: 3600,
      caloriesBurned: 300,
    }
  },
];

const useFeedStore = create<FeedStore>((set, get) => ({
  feedItems: generateMockFeedItems(),
  isLoading: false,
  isRefreshing: false,
  hasMore: false,
  lastVisible: null,

  fetchFeed: async (userId?: string) => {
    set({ isLoading: true });
    try {
      // Mock 구현: 모든 피드 아이템 반환
      await new Promise(resolve => setTimeout(resolve, 500));

      const mockFeed = generateMockFeedItems();
      set({
        feedItems: mockFeed,
        isLoading: false,
        hasMore: false // Mock에서는 추가 로드 없음
      });
    } catch (error) {
      console.error('Error fetching feed:', error);
      set({ isLoading: false });
    }
  },

  fetchUserFeed: async (userId: string) => {
    set({ isLoading: true });
    try {
      // Mock 구현: 특정 사용자의 피드만 필터링
      await new Promise(resolve => setTimeout(resolve, 500));

      const userFeed = get().feedItems.filter(item => item.userId === userId);
      set({
        feedItems: userFeed,
        isLoading: false,
        hasMore: false
      });
    } catch (error) {
      console.error('Error fetching user feed:', error);
      set({ isLoading: false });
    }
  },

  fetchFollowingFeed: async (followingIds: string[]) => {
    set({ isLoading: true });
    try {
      // Mock 구현: 팔로잉한 사용자들의 피드 필터링
      await new Promise(resolve => setTimeout(resolve, 500));

      const followingFeed = get().feedItems.filter(item =>
        followingIds.includes(item.userId)
      );
      set({
        feedItems: followingFeed,
        isLoading: false,
        hasMore: false
      });
    } catch (error) {
      console.error('Error fetching following feed:', error);
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    // Mock 구현: 추가 로드 없음
    if (!get().hasMore || get().isLoading) return;

    set({ isLoading: true });
    await new Promise(resolve => setTimeout(resolve, 500));
    set({ isLoading: false });
  },

  refreshFeed: async () => {
    set({ isRefreshing: true });
    try {
      // Mock 구현: 피드 새로고침
      await new Promise(resolve => setTimeout(resolve, 1000));

      const refreshedFeed = generateMockFeedItems();
      set({
        feedItems: refreshedFeed,
        isRefreshing: false,
        hasMore: false
      });
    } catch (error) {
      console.error('Error refreshing feed:', error);
      set({ isRefreshing: false });
    }
  },

  shareWorkout: async (workout: WorkoutSession, userId: string) => {
    try {
      // Mock 구현: 새 피드 아이템 생성
      const newFeedItem: FeedItem = {
        id: uuid.v4() as string,
        userId,
        workoutId: workout.id,
        createdAt: new Date(),
        likes: [],
        comments: [],
        workoutData: workout,
      };

      // 피드 최상단에 추가
      set((state) => ({
        feedItems: [newFeedItem, ...state.feedItems],
      }));

      // 약간의 지연 추가
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error('Error sharing workout:', error);
      throw error;
    }
  },

  likePost: async (feedItemId: string, userId: string) => {
    try {
      // Mock 구현: 좋아요 추가
      set((state) => ({
        feedItems: state.feedItems.map(item => {
          if (item.id === feedItemId && !item.likes.includes(userId)) {
            return {
              ...item,
              likes: [...item.likes, userId],
            };
          }
          return item;
        }),
      }));

      // 약간의 지연 추가
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Error liking post:', error);
      throw error;
    }
  },

  unlikePost: async (feedItemId: string, userId: string) => {
    try {
      // Mock 구현: 좋아요 제거
      set((state) => ({
        feedItems: state.feedItems.map(item => {
          if (item.id === feedItemId) {
            return {
              ...item,
              likes: item.likes.filter(id => id !== userId),
            };
          }
          return item;
        }),
      }));

      // 약간의 지연 추가
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error('Error unliking post:', error);
      throw error;
    }
  },

  addComment: async (feedItemId: string, comment: Comment) => {
    try {
      // Mock 구현: 댓글 추가
      const newComment: Comment = {
        ...comment,
        id: uuid.v4() as string,
        createdAt: new Date(),
      };

      set((state) => ({
        feedItems: state.feedItems.map(item => {
          if (item.id === feedItemId) {
            return {
              ...item,
              comments: [...item.comments, newComment],
            };
          }
          return item;
        }),
      }));

      // 약간의 지연 추가
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  deleteComment: async (feedItemId: string, commentId: string) => {
    try {
      // Mock 구현: 댓글 삭제
      set((state) => ({
        feedItems: state.feedItems.map(item => {
          if (item.id === feedItemId) {
            return {
              ...item,
              comments: item.comments.filter(c => c.id !== commentId),
            };
          }
          return item;
        }),
      }));

      // 약간의 지연 추가
      await new Promise(resolve => setTimeout(resolve, 300));
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },
}));

export default useFeedStore;