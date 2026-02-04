import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { FeedItem, Comment, FeedFilter, WorkoutSession } from '@/types';
import useAuthStore from './authStore';
import useWorkoutStore from './workoutStore';
import {
  isBackendEnabled,
  getFeed as apiGetFeed,
  createFeedWithWorkout as apiCreateFeedWithWorkout,
  toggleLike as apiToggleLike,
  addComment as apiAddComment,
  deleteFeedPost as apiDeleteFeedPost,
  deleteComment as apiDeleteComment
} from '@/lib/api';

interface FeedStore {
  // 상태
  feedItems: FeedItem[];
  filter: FeedFilter;
  loading: boolean;
  hasMore: boolean;
  lastCursor?: string;
  refreshing: boolean;

  // 액션 - Feed 조회
  fetchFeed: (refresh?: boolean) => Promise<void>;
  setFilter: (filter: FeedFilter) => void;

  // 액션 - Feed 작성
  createWorkoutPost: (
    workoutSession: WorkoutSession,
    content?: string,
    cardStyle?: string,
    cardImageUrl?: string,
    visibility?: 'public' | 'followers' | 'group'
  ) => Promise<void>;

  // 액션 - 상호작용
  toggleLike: (feedId: string) => Promise<void>;
  addComment: (feedId: string, comment: string) => Promise<void>;
  deletePost: (feedId: string) => Promise<void>;
  deleteComment: (feedId: string, commentId: string) => Promise<void>;

  // 헬퍼 함수
  getUserFeedItems: (userId: string) => FeedItem[];
  getGroupFeedItems: (groupId: string) => FeedItem[];

  /** 로그아웃 시 사용자 데이터 초기화 */
  clearUserData: () => void;
}

const useFeedStore = create<FeedStore>(
  persist(
    (set, get) => ({
      // 초기 상태
      feedItems: [],
      filter: 'all',
      loading: false,
      hasMore: true,
      lastCursor: undefined,
      refreshing: false,

      // Feed 조회
      fetchFeed: async (refresh = false) => {
        const { filter, feedItems, lastCursor } = get();
        const { user } = useAuthStore.getState();

        if (refresh) {
          set({ refreshing: true, lastCursor: undefined });
        } else {
          set({ loading: true });
        }

        try {
          // 백엔드 연동 여부 확인
          if (isBackendEnabled()) {
            try {
              // 백엔드 API 호출
              const response = await apiGetFeed(
                filter,
                refresh ? undefined : lastCursor,
                20
              );

              if (refresh) {
                set({
                  feedItems: response.items,
                  hasMore: response.hasMore,
                  lastCursor: response.nextCursor,
                });
              } else {
                set(state => ({
                  feedItems: [...state.feedItems, ...response.items],
                  hasMore: response.hasMore,
                  lastCursor: response.nextCursor,
                }));
              }

              set({ loading: false, refreshing: false });
              return;
            } catch (apiError) {
              // API 실패 시 로컬 모크 데이터로 fallback
              console.warn('백엔드 연결 실패, 로컬 데이터 사용:', apiError instanceof Error ? apiError.message : apiError);
              // fallback to mock data below
            }
          }

          {
            // Mock 데이터 사용
            await new Promise(resolve => setTimeout(resolve, 500));

            // 필터링 로직
            let filteredItems = [...feedItems];

            if (filter === 'following' && user) {
              const following = user.following || [];
              filteredItems = feedItems.filter(item =>
                following.includes(item.userId)
              );
            } else if (filter === 'groups') {
              filteredItems = feedItems.filter(item =>
                item.type === 'group' && item.groupId
              );
            }

            // Mock 페이지네이션
            if (refresh || feedItems.length === 0) {
              const mockItems = generateMockFeedItems();
              set({
                feedItems: mockItems,
                hasMore: true,
                lastCursor: mockItems[mockItems.length - 1]?.id,
              });
            }
          }
        } catch (error) {
          console.error('Failed to fetch feed:', error);
        } finally {
          set({ loading: false, refreshing: false });
        }
      },

      // 필터 설정
      setFilter: (filter: FeedFilter) => {
        set({ filter });
        get().fetchFeed(true);
      },

      // 운동 포스트 생성
      createWorkoutPost: async (
        workoutSession: WorkoutSession,
        content?: string,
        cardStyle?: string,
        cardImageUrl?: string,
        visibility = 'public'
      ) => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        try {
          if (isBackendEnabled()) {
            try {
              // 백엔드 API 호출
              const newFeedItem = await apiCreateFeedWithWorkout(
                workoutSession,
                content,
                cardStyle,
                cardImageUrl,
                visibility
              );

              set(state => ({
                feedItems: [newFeedItem, ...state.feedItems]
              }));
              return;
            } catch (apiError) {
              console.warn('백엔드 연결 실패, 로컬 데이터 사용:', apiError instanceof Error ? apiError.message : apiError);
              // fallback to mock data below
            }
          }

          {
            // Mock 데이터 생성
            const newFeedItem: FeedItem = {
              id: uuid.v4() as string,
              type: 'workout',
              userId: user.id,
              username: user.username,
              userProfileImage: user.profileImage,
              userBadges: user.displayBadges,
              workoutSessionId: workoutSession.id,
              workoutSnapshot: workoutSession,
              content,
              cardStyle,
              cardImageUrl,
              likes: [],
              comments: [],
              visibility,
              createdAt: new Date(),
            };

            set(state => ({
              feedItems: [newFeedItem, ...state.feedItems]
            }));
          }
        } catch (error) {
          console.error('Failed to create workout post:', error);
          throw error;
        }
      },

      // 좋아요 토글
      toggleLike: async (feedId: string) => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        try {
          if (isBackendEnabled()) {
            try {
              // 백엔드 API 호출
              const response = await apiToggleLike(feedId);

              set(state => ({
                feedItems: state.feedItems.map(item => {
                  if (item.id === feedId) {
                    return {
                      ...item,
                      likes: response.liked
                        ? [...item.likes, user.id]
                        : item.likes.filter(id => id !== user.id),
                      isLiked: response.liked,
                  };
                }
                return item;
              })
            }));
              return;
            } catch (apiError) {
              console.warn('백엔드 연결 실패, 로컬 데이터 사용:', apiError instanceof Error ? apiError.message : apiError);
              // fallback to mock data below
            }
          }

          {
            // Mock 처리
            set(state => ({
              feedItems: state.feedItems.map(item => {
                if (item.id === feedId) {
                  const isLiked = item.likes.includes(user.id);
                  return {
                    ...item,
                    likes: isLiked
                      ? item.likes.filter(id => id !== user.id)
                      : [...item.likes, user.id],
                    isLiked: !isLiked,
                  };
                }
                return item;
              })
            }));
          }
        } catch (error) {
          console.error('Failed to toggle like:', error);
        }
      },

      // 댓글 추가
      addComment: async (feedId: string, content: string) => {
        const { user } = useAuthStore.getState();
        if (!user) return;

        try {
          if (isBackendEnabled()) {
            try {
              // 백엔드 API 호출
              const newComment = await apiAddComment(feedId, content);

              set(state => ({
                feedItems: state.feedItems.map(item => {
                  if (item.id === feedId) {
                    return {
                      ...item,
                      comments: [...item.comments, newComment],
                    };
                  }
                  return item;
                })
              }));
              return;
            } catch (apiError) {
              console.warn('백엔드 연결 실패, 로컬 데이터 사용:', apiError instanceof Error ? apiError.message : apiError);
              // fallback to mock data below
            }
          }

          {
            // Mock 처리
            const newComment: Comment = {
              id: uuid.v4() as string,
              userId: user.id,
              username: user.username,
              userProfileImage: user.profileImage,
              content,
              createdAt: new Date(),
            };

            set(state => ({
              feedItems: state.feedItems.map(item => {
                if (item.id === feedId) {
                  return {
                    ...item,
                    comments: [...item.comments, newComment],
                  };
                }
                return item;
              })
            }));
          }
        } catch (error) {
          console.error('Failed to add comment:', error);
        }
      },

      // 포스트 삭제
      deletePost: async (feedId: string) => {
        try {
          if (isBackendEnabled()) {
            try {
              // 백엔드 API 호출
              await apiDeleteFeedPost(feedId);
            } catch (apiError) {
              console.warn('백엔드 연결 실패, 로컬에서만 삭제:', apiError instanceof Error ? apiError.message : apiError);
            }
          }

          // 로컬 상태 업데이트
          set(state => ({
            feedItems: state.feedItems.filter(item => item.id !== feedId)
          }));
        } catch (error) {
          console.error('Failed to delete post:', error instanceof Error ? error.message : error);
        }
      },

      // 댓글 삭제
      deleteComment: async (feedId: string, commentId: string) => {
        try {
          if (isBackendEnabled()) {
            try {
              // 백엔드 API 호출
              await apiDeleteComment(feedId, commentId);
            } catch (apiError) {
              console.warn('백엔드 연결 실패, 로컬에서만 삭제:', apiError instanceof Error ? apiError.message : apiError);
            }
          }

          // 로컬 상태 업데이트
          set(state => ({
            feedItems: state.feedItems.map(item => {
              if (item.id === feedId) {
                return {
                  ...item,
                  comments: item.comments.filter(c => c.id !== commentId),
                };
              }
              return item;
            })
          }));
        } catch (error) {
          console.error('Failed to delete comment:', error instanceof Error ? error.message : error);
        }
      },

      // 사용자별 Feed 조회
      getUserFeedItems: (userId: string) => {
        return get().feedItems.filter(item => item.userId === userId);
      },

      // 그룹별 Feed 조회
      getGroupFeedItems: (groupId: string) => {
        return get().feedItems.filter(item => item.groupId === groupId);
      },

      clearUserData: () => {
        set({ feedItems: [], lastCursor: undefined, hasMore: true });
      },
    }),
    {
      name: 'feed-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // 피드 항목은 저장하지 않고, 필터만 저장
        filter: state.filter,
      }),
    }
  )
);

// Mock 데이터 생성 함수
function generateMockFeedItems(): FeedItem[] {
  const { user } = useAuthStore.getState();
  const { workoutHistory } = useWorkoutStore.getState();

  if (!user || !workoutHistory || workoutHistory.length === 0) return [];

  // 최근 운동 기록을 기반으로 Mock Feed 생성
  return workoutHistory.slice(0, 5).map((workout, index) => ({
    id: uuid.v4() as string,
    type: 'workout' as const,
    userId: user.id,
    username: user.username,
    userProfileImage: user.profileImage,
    userBadges: user.displayBadges,
    workoutSessionId: workout.id,
    workoutSnapshot: workout,
    content: index === 0 ? '오늘도 열심히 운동했습니다! 💪' : undefined,
    cardStyle: ['minimal', 'gradient', 'dark', 'colorful'][index % 4],
    likes: index === 0 ? ['test2'] : [],
    comments: index === 0 ? [{
      id: '1',
      userId: 'test2',
      username: 'TestUser2',
      content: '대단하네요! 화이팅!',
      createdAt: new Date(),
    }] : [],
    visibility: 'public' as const,
    createdAt: new Date(workout.date),
  }));
}

export default useFeedStore;