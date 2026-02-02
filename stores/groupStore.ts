import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';
import { SharedWorkoutCard, CardCustomOptions, WorkoutSession } from '@/types';
import {
  isBackendEnabled,
  getMyGroups,
  getGroupPosts as apiGetGroupPosts,
  createGroup as apiCreateGroup,
  joinGroup as apiJoinGroup,
  shareToGroup as apiShareToGroup,
  createSharedCard as apiCreateSharedCard,
  completeSharedCard as apiCompleteSharedCard,
  // 협업 카드 API
  createCollaborativeCard as apiCreateCollaborativeCard,
  joinCollaborativeCard as apiJoinCollaborativeCard,
  getGroupCollaborativeCards as apiGetGroupCollaborativeCards,
  updateCollaborativeCardStatus as apiUpdateCardStatus,
} from '@/lib/api';

// Firebase 기능은 실제 구현 시 활성화
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
//   arrayUnion,
//   arrayRemove,
//   serverTimestamp,
// } from 'firebase/firestore';
// import { db } from '@/config/firebase';

export interface Group {
  id: string;
  name: string;
  description?: string;
  createdBy: string;
  members: string[];
  admins: string[];
  inviteCode: string;
  isPrivate: boolean;
  createdAt: Date;
  lastActivity?: Date;
  memberCount: number;
  coverImage?: string;
}

export interface GroupPost {
  id: string;
  groupId: string;
  userId: string;
  workoutId?: string;
  /** 공유 시 저장한 운동 스냅샷 - 카드 뷰에서 공유자 운동 카드 표시용 */
  workoutSnapshot?: WorkoutSession;
  content: string;
  images?: string[];
  likes: string[];
  comments: GroupComment[];
  createdAt: Date;
}

export interface GroupComment {
  id: string;
  userId: string;
  content: string;
  createdAt: Date;
}

interface GroupStore {
  // 상태
  groups: Group[];
  currentGroup: Group | null;
  groupPosts: GroupPost[];
  sharedCards: SharedWorkoutCard[]; // 공유 카드 목록
  isLoading: boolean;

  // 그룹 관리
  createGroup: (name: string, description: string, isPrivate: boolean, userId: string) => Promise<Group>;
  joinGroupWithCode: (inviteCode: string, userId: string) => Promise<void>;
  leaveGroup: (groupId: string, userId: string) => Promise<void>;
  fetchUserGroups: (userId: string) => Promise<void>;
  selectGroup: (groupId: string) => void;

  // 그룹 포스트
  shareToGroup: (groupId: string, post: Partial<GroupPost>) => Promise<void>;
  fetchGroupPosts: (groupId: string) => Promise<void>;
  togglePostLike: (postId: string, userId: string) => Promise<void>;
  addComment: (postId: string, comment: GroupComment) => Promise<void>;

  // 공유 카드 관리
  createSharedCard: (
    groupId: string,
    userId: string,
    workoutId: string,
    splitType: 'horizontal' | 'vertical',
    splitPosition: 'top' | 'bottom' | 'left' | 'right',
    style?: string,
    customOptions?: CardCustomOptions,
    type?: 'solo' | 'collaborative' // 카드 타입 추가
  ) => Promise<SharedWorkoutCard>;
  completeSharedCard: (
    cardId: string,
    userId: string,
    workoutId: string,
    imageData?: string
  ) => Promise<void>;

  // 협업 카드 전용 액션
  joinCollaborativeCard: (
    cardId: string,
    userId: string,
    workoutId: string,
    workout?: WorkoutSession
  ) => Promise<void>;
  updateCardStatus: (cardId: string, status: 'waiting' | 'in_progress' | 'completed' | 'expired') => Promise<void>;

  fetchSharedCards: (groupId: string) => Promise<SharedWorkoutCard[]>;
  getAvailableSharedCards: (groupId: string, userId: string) => SharedWorkoutCard[];
  getMySharedCards: (groupId: string, userId: string) => SharedWorkoutCard[];
  getSharedCardById: (cardId: string) => SharedWorkoutCard | null;

  // 협업 카드 관련 쿼리
  getPendingCollaborativeCards: (groupId: string, userId: string) => SharedWorkoutCard[];
  getCompletedCollaborativeCards: (groupId: string) => SharedWorkoutCard[];
  getMyCollaborativeCards: (groupId: string, userId: string) => SharedWorkoutCard[];

  getGroupPosts: (groupId: string) => GroupPost[];
  getMyGroupPosts: (userId: string) => GroupPost[];
  getPostById: (postId: string) => GroupPost | undefined;
  cleanExpiredCards: () => void;

  // 유틸리티
  generateInviteCode: () => string;
  updateGroupInfo: (groupId: string, updates: Partial<Group>) => Promise<void>;
}

// Mock 데이터 생성 헬퍼
const generateMockGroups = (): Group[] => [
  {
    id: '1',
    name: '강남 헬스장 모임',
    description: '강남역 주변 헬스장 회원들의 모임',
    createdBy: 'test-user',
    members: ['test-user', 'user2', 'user3'],
    admins: ['test-user'],
    inviteCode: 'GANGNAM123',
    isPrivate: false,
    createdAt: new Date('2024-01-01'),
    lastActivity: new Date(),
    memberCount: 3,
  },
  {
    id: '2',
    name: '아침 운동 그룹',
    description: '매일 아침 6시 운동하는 사람들',
    createdBy: 'user2',
    members: ['user2', 'test-user', 'user4'],
    admins: ['user2'],
    inviteCode: 'MORNING456',
    isPrivate: false,
    createdAt: new Date('2024-02-01'),
    lastActivity: new Date(),
    memberCount: 3,
  },
];

const generateMockPosts = (): GroupPost[] => [
  {
    id: '1',
    groupId: '1',
    userId: 'user2',
    content: '오늘 등 운동 완료! 💪',
    likes: ['test-user'],
    comments: [
      {
        id: '1',
        userId: 'test-user',
        content: '수고하셨습니다!',
        createdAt: new Date(),
      }
    ],
    createdAt: new Date(),
  },
];

const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: generateMockGroups(),
      currentGroup: null,
      groupPosts: generateMockPosts(),
      sharedCards: [], // 공유 카드 초기화
      isLoading: false,

      createGroup: async (name, description, isPrivate, userId) => {
        if (isBackendEnabled()) {
          const g = await apiCreateGroup({ name, description, isPrivate, userId });
          const newGroup: Group = {
            ...g,
            createdAt: g.createdAt instanceof Date ? g.createdAt : new Date(g.createdAt),
            lastActivity: g.lastActivity ? (g.lastActivity instanceof Date ? g.lastActivity : new Date(g.lastActivity)) : new Date(),
          };
          set((state) => ({ groups: [newGroup, ...state.groups] }));
          return newGroup;
        }
        const inviteCode = get().generateInviteCode();
        const newGroup: Group = {
          id: uuid.v4() as string,
          name,
          description,
          createdBy: userId,
          members: [userId],
          admins: [userId],
          inviteCode,
          isPrivate,
          createdAt: new Date(),
          lastActivity: new Date(),
          memberCount: 1,
        };
        set((state) => ({ groups: [...state.groups, newGroup] }));
        await new Promise(resolve => setTimeout(resolve, 500));
        return newGroup;
      },

      joinGroupWithCode: async (inviteCode, userId) => {
        try {
          if (isBackendEnabled()) {
            await apiJoinGroup(inviteCode, userId);
            const list = await getMyGroups(userId);
            const revived = (list || []).map((g: any) => ({
              ...g,
              createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
              lastActivity: g.lastActivity ? new Date(g.lastActivity) : undefined,
            }));
            set({ groups: revived });
            return;
          }
          const group = get().groups.find(g => g.inviteCode === inviteCode);
          if (!group) throw new Error('유효하지 않은 초대 코드입니다');
          if (group.members.includes(userId)) throw new Error('이미 가입한 그룹입니다');
          set((state) => ({
            groups: state.groups.map(g =>
              g.id === group.id ? { ...g, members: [...g.members, userId], memberCount: g.memberCount + 1, lastActivity: new Date() } : g
            ),
          }));
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error joining group:', error);
          throw error;
        }
      },

      leaveGroup: async (groupId, userId) => {
        try {
          // Mock 구현: 그룹에서 사용자 제거
          const group = get().groups.find(g => g.id === groupId);

          if (!group) {
            throw new Error('그룹을 찾을 수 없습니다');
          }

          // 그룹 소유자는 떠날 수 없음
          if (group.createdBy === userId) {
            throw new Error('그룹 소유자는 그룹을 떠날 수 없습니다');
          }

          // 로컬 상태 업데이트
          set((state) => ({
            groups: state.groups.map(g =>
              g.id === groupId
                ? {
                    ...g,
                    members: g.members.filter(m => m !== userId),
                    admins: g.admins.filter(a => a !== userId),
                    memberCount: g.memberCount - 1,
                  }
                : g
            ),
          }));

          // 약간의 지연 추가
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error leaving group:', error);
          throw error;
        }
      },

      fetchUserGroups: async (userId) => {
        set({ isLoading: true });
        try {
          if (isBackendEnabled()) {
            const list = await getMyGroups(userId);
            const revived = (list || []).map((g: any) => ({
              ...g,
              createdAt: g.createdAt ? new Date(g.createdAt) : new Date(),
              lastActivity: g.lastActivity ? new Date(g.lastActivity) : undefined,
            }));
            set({ groups: revived, isLoading: false });
            return;
          }
          const userGroups = get().groups.filter(g => g.members.includes(userId));
          await new Promise(resolve => setTimeout(resolve, 500));
          set({ groups: userGroups, isLoading: false });
        } catch (error) {
          console.error('Error fetching groups:', error);
          set({ isLoading: false });
        }
      },

      selectGroup: (groupId) => {
        const group = get().groups.find(g => g.id === groupId);
        set({ currentGroup: group || null });
      },

      shareToGroup: async (groupId, post) => {
        try {
          if (isBackendEnabled()) {
            const created = await apiShareToGroup(groupId, { ...post, groupId, likes: [], comments: [] });
            const newPost: GroupPost = {
              ...created,
              createdAt: typeof created.createdAt === 'string' ? new Date(created.createdAt) : created.createdAt,
              workoutSnapshot: post.workoutSnapshot ?? created.workoutSnapshot,
            };
            set((state) => ({
              groupPosts: [newPost, ...state.groupPosts],
              groups: state.groups.map(g => (g.id === groupId ? { ...g, lastActivity: new Date() } : g)),
            }));
            return;
          }
          const newPost: GroupPost = {
            ...post,
            id: uuid.v4() as string,
            groupId,
            likes: [],
            comments: [],
            createdAt: new Date(),
          } as GroupPost;
          set((state) => ({
            groupPosts: [newPost, ...state.groupPosts],
            groups: state.groups.map(g => (g.id === groupId ? { ...g, lastActivity: new Date() } : g)),
          }));
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error sharing to group:', error);
          throw error;
        }
      },

      fetchGroupPosts: async (groupId) => {
        try {
          if (isBackendEnabled()) {
            const posts = await apiGetGroupPosts(groupId);
            const revived = (posts || []).map((p: any) => ({
              ...p,
              createdAt: p.createdAt ? new Date(p.createdAt) : new Date(),
              workoutSnapshot: p.workoutSnapshot,
            }));
            set((state) => {
              const byGroup = state.groupPosts.filter(p => p.groupId !== groupId);
              return { groupPosts: [...revived, ...byGroup] };
            });
            return;
          }
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error('Error fetching group posts:', error);
        }
      },

      getGroupPosts: (groupId) => {
        return get().groupPosts.filter(p => p.groupId === groupId);
      },

      getMyGroupPosts: (userId) => {
        const state = get();
        const myGroupIds = state.groups.filter(g => g.members.includes(userId)).map(g => g.id);
        return state.groupPosts.filter(p => myGroupIds.includes(p.groupId));
      },

      getPostById: (postId) => {
        return get().groupPosts.find(p => p.id === postId);
      },

      togglePostLike: async (postId, userId) => {
        try {
          // Mock 구현: 좋아요 토글
          set((state) => ({
            groupPosts: state.groupPosts.map(post => {
              if (post.id === postId) {
                const isLiked = post.likes.includes(userId);
                return {
                  ...post,
                  likes: isLiked
                    ? post.likes.filter(id => id !== userId)
                    : [...post.likes, userId],
                };
              }
              return post;
            }),
          }));

          // 약간의 지연 추가
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error('Error toggling like:', error);
          throw error;
        }
      },

      addComment: async (postId, comment) => {
        try {
          // Mock 구현: 댓글 추가
          set((state) => ({
            groupPosts: state.groupPosts.map(post => {
              if (post.id === postId) {
                return {
                  ...post,
                  comments: [...post.comments, comment],
                };
              }
              return post;
            }),
          }));

          // 약간의 지연 추가
          await new Promise(resolve => setTimeout(resolve, 300));
        } catch (error) {
          console.error('Error adding comment:', error);
          throw error;
        }
      },

      generateInviteCode: () => {
        // 랜덤 초대 코드 생성
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      },

      updateGroupInfo: async (groupId, updates) => {
        try {
          // Mock 구현: 그룹 정보 업데이트
          set((state) => ({
            groups: state.groups.map(g =>
              g.id === groupId
                ? { ...g, ...updates }
                : g
            ),
          }));

          // 약간의 지연 추가
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error updating group:', error);
          throw error;
        }
      },

      // 공유 카드 생성
      createSharedCard: async (
        groupId,
        userId,
        workoutId,
        splitType,
        splitPosition,
        style,
        customOptions,
        type = 'solo' // 기본값은 solo
      ) => {
        try {
          // 백엔드 연동 시 협업 카드 API 사용
          if (isBackendEnabled() && type === 'collaborative') {
            const newCard = await apiCreateCollaborativeCard({
              groupId,
              userId,
              workoutId,
              splitType,
              splitPosition,
              style,
              customOptions,
            });

            // 로컬 상태 업데이트
            set((state) => ({
              sharedCards: [...state.sharedCards, newCard],
            }));

            return newCard;
          }

          // 모크 구현 (기존 코드)
          const expirationDate = new Date();
          expirationDate.setHours(expirationDate.getHours() + 24); // 24시간 후 만료

          const newCard: SharedWorkoutCard = {
            id: uuid.v4() as string,
            groupId,
            createdBy: userId,
            type, // 카드 타입 설정
            splitType,
            splitPosition,
            firstHalf: {
              userId,
              workoutId,
              createdAt: new Date(),
            },
            style: style as any,
            customOptions,
            status: type === 'collaborative' ? 'waiting' : 'waiting', // 협업 카드는 waiting으로 시작
            expiresAt: expirationDate,
            createdAt: new Date(),
          };

          // 로컬 상태 업데이트
          set((state) => ({
            sharedCards: [...state.sharedCards, newCard],
          }));

          // 약간의 지연 추가 (실제 API 호출 시뮬레이션)
          await new Promise(resolve => setTimeout(resolve, 500));

          return newCard;
        } catch (error) {
          console.error('Error creating shared card:', error);
          throw error;
        }
      },

      // 공유 카드 완성 (단독 완성용)
      completeSharedCard: async (cardId, userId, workoutId, imageData) => {
        try {
          const card = get().sharedCards.find(c => c.id === cardId);

          if (!card) {
            throw new Error('카드를 찾을 수 없습니다');
          }

          if (card.status === 'completed') {
            throw new Error('이미 완성된 카드입니다');
          }

          if (card.type === 'solo') {
            // 단독 카드는 즉시 완성
            set((state) => ({
              sharedCards: state.sharedCards.map(c =>
                c.id === cardId
                  ? {
                      ...c,
                      status: 'completed' as const,
                      completedAt: new Date(),
                      updatedAt: new Date(),
                    }
                  : c
              ),
            }));
          } else {
            // 협업 카드는 joinCollaborativeCard를 사용해야 함
            throw new Error('협업 카드는 joinCollaborativeCard 함수를 사용하세요');
          }

          // 약간의 지연 추가
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error completing shared card:', error);
          throw error;
        }
      },

      // 협업 카드 참여
      joinCollaborativeCard: async (cardId, userId, workoutId, workout) => {
        try {
          // 백엔드 연동 시 API 사용
          if (isBackendEnabled()) {
            const updatedCard = await apiJoinCollaborativeCard(
              cardId,
              userId,
              workoutId,
              workout
            );

            // 로컬 상태 업데이트
            set((state) => ({
              sharedCards: state.sharedCards.map(c =>
                c.id === cardId ? updatedCard : c
              ),
            }));

            return;
          }

          // 모크 구현 (기존 코드)
          const card = get().sharedCards.find(c => c.id === cardId);

          if (!card) {
            throw new Error('카드를 찾을 수 없습니다');
          }

          if (card.type !== 'collaborative') {
            throw new Error('협업 카드가 아닙니다');
          }

          if (card.status !== 'waiting') {
            throw new Error('대기중인 카드가 아닙니다');
          }

          if (card.createdBy === userId) {
            throw new Error('본인이 만든 카드에는 참여할 수 없습니다');
          }

          // 카드 상태를 진행중으로 변경하고 두 번째 참여자 정보 추가
          set((state) => ({
            sharedCards: state.sharedCards.map(c =>
              c.id === cardId
                ? {
                    ...c,
                    completedBy: userId,
                    secondHalf: {
                      userId,
                      workoutId,
                      workout,
                      joinedAt: new Date(),
                      createdAt: new Date(),
                    },
                    status: 'in_progress' as const,
                    updatedAt: new Date(),
                  }
                : c
            ),
          }));

          // 약간의 지연 추가
          await new Promise(resolve => setTimeout(resolve, 500));

          // 운동 완료 후 카드 완성 처리 (임시로 3초 후 완성)
          setTimeout(() => {
            set((state) => ({
              sharedCards: state.sharedCards.map(c =>
                c.id === cardId
                  ? {
                      ...c,
                      status: 'completed' as const,
                      completedAt: new Date(),
                      updatedAt: new Date(),
                    }
                  : c
              ),
            }));
          }, 3000);
        } catch (error) {
          console.error('Error joining collaborative card:', error);
          throw error;
        }
      },

      // 카드 상태 업데이트
      updateCardStatus: async (cardId, status) => {
        try {
          // 백엔드 연동 시 API 사용
          if (isBackendEnabled()) {
            const updatedCard = await apiUpdateCardStatus(cardId, status);

            // 로컬 상태 업데이트
            set((state) => ({
              sharedCards: state.sharedCards.map(c =>
                c.id === cardId ? updatedCard : c
              ),
            }));

            return;
          }

          // 모크 구현
          set((state) => ({
            sharedCards: state.sharedCards.map(c =>
              c.id === cardId
                ? {
                    ...c,
                    status,
                    updatedAt: new Date(),
                    ...(status === 'completed' ? { completedAt: new Date() } : {}),
                  }
                : c
            ),
          }));
        } catch (error) {
          console.error('Error updating card status:', error);
        }
      },

      // 그룹의 공유 카드 조회
      fetchSharedCards: async (groupId) => {
        try {
          // 백엔드 연동 시 API 사용
          if (isBackendEnabled()) {
            const cards = await apiGetGroupCollaborativeCards(groupId);

            // 로컬 상태 업데이트
            set((state) => {
              const otherCards = state.sharedCards.filter(c => c.groupId !== groupId);
              return {
                sharedCards: [...otherCards, ...cards],
              };
            });

            return cards;
          }

          // 모크 구현
          const cards = get().sharedCards.filter(
            c => c.groupId === groupId && new Date(c.expiresAt) > new Date()
          );

          // 약간의 지연 추가
          await new Promise(resolve => setTimeout(resolve, 500));

          return cards;
        } catch (error) {
          console.error('Error fetching shared cards:', error);
          return [];
        }
      },

      // 사용자가 완성할 수 있는 카드 조회 (다른 사람이 만든 대기중 협업 카드)
      getAvailableSharedCards: (groupId, userId) => {
        const cards = get().sharedCards;

        // 그룹의 대기중 협업 카드 중 본인이 만들지 않은 카드만 반환
        return cards.filter(
          c => c.groupId === groupId &&
               c.type === 'collaborative' &&
               c.status === 'waiting' &&
               c.createdBy !== userId &&
               new Date(c.expiresAt) > new Date()
        );
      },

      // 내가 해당 그룹에 공유한 카드 조회 (그룹 탭에서 내가 공유한 카드 표시용)
      getMySharedCards: (groupId, userId) => {
        const cards = get().sharedCards;
        return cards.filter(
          c => c.groupId === groupId &&
               c.createdBy === userId &&
               new Date(c.expiresAt) > new Date()
        );
      },

      // ID로 공유 카드 조회
      getSharedCardById: (cardId: string) => {
        const cards = get().sharedCards;
        return cards.find(c => c.id === cardId) || null;
      },

      // 대기중인 협업 카드 조회 (참여 가능한 카드)
      getPendingCollaborativeCards: (groupId, userId) => {
        const cards = get().sharedCards;
        return cards.filter(
          c => c.groupId === groupId &&
               c.type === 'collaborative' &&
               c.status === 'waiting' &&
               c.createdBy !== userId &&
               new Date(c.expiresAt) > new Date()
        );
      },

      // 완성된 협업 카드 조회
      getCompletedCollaborativeCards: (groupId) => {
        const cards = get().sharedCards;
        return cards.filter(
          c => c.groupId === groupId &&
               c.type === 'collaborative' &&
               c.status === 'completed'
        );
      },

      // 내가 참여한 협업 카드 조회 (생성 또는 참여)
      getMyCollaborativeCards: (groupId, userId) => {
        const cards = get().sharedCards;
        return cards.filter(
          c => c.groupId === groupId &&
               c.type === 'collaborative' &&
               (c.createdBy === userId || c.completedBy === userId)
        );
      },

      // 만료된 카드 정리
      cleanExpiredCards: () => {
        const now = new Date();

        set((state) => ({
          sharedCards: state.sharedCards.filter(
            c => new Date(c.expiresAt) > now
          ),
        }));
      },
    }),
    {
      name: 'group-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        groups: state.groups,
        groupPosts: state.groupPosts,
        sharedCards: state.sharedCards,
      }),
    }
  )
);

export default useGroupStore;