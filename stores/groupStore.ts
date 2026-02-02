import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

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
      isLoading: false,

      createGroup: async (name, description, isPrivate, userId) => {
        // Mock 구현: 새 그룹 생성
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

        // 로컬 상태 업데이트
        set((state) => ({
          groups: [...state.groups, newGroup],
        }));

        // 약간의 지연 추가 (실제 API 호출 시뮬레이션)
        await new Promise(resolve => setTimeout(resolve, 500));

        return newGroup;
      },

      joinGroupWithCode: async (inviteCode, userId) => {
        try {
          // Mock 구현: 초대 코드로 그룹 찾기
          const group = get().groups.find(g => g.inviteCode === inviteCode);

          if (!group) {
            throw new Error('유효하지 않은 초대 코드입니다');
          }

          if (group.members.includes(userId)) {
            throw new Error('이미 가입한 그룹입니다');
          }

          // 그룹에 사용자 추가
          set((state) => ({
            groups: state.groups.map(g =>
              g.id === group.id
                ? {
                    ...g,
                    members: [...g.members, userId],
                    memberCount: g.memberCount + 1,
                    lastActivity: new Date(),
                  }
                : g
            ),
          }));

          // 약간의 지연 추가
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
          // Mock 구현: 사용자가 속한 그룹 필터링
          const userGroups = get().groups.filter(g => g.members.includes(userId));

          // 약간의 지연 추가 (실제 API 호출 시뮬레이션)
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
          // Mock 구현: 그룹에 포스트 공유
          const newPost: GroupPost = {
            ...post,
            id: uuid.v4() as string,
            groupId,
            likes: [],
            comments: [],
            createdAt: new Date(),
          } as GroupPost;

          // 로컬 상태 업데이트
          set((state) => ({
            groupPosts: [newPost, ...state.groupPosts],
            groups: state.groups.map(g =>
              g.id === groupId
                ? { ...g, lastActivity: new Date() }
                : g
            ),
          }));

          // 약간의 지연 추가
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.error('Error sharing to group:', error);
          throw error;
        }
      },

      fetchGroupPosts: async (groupId) => {
        try {
          // Mock 구현: 그룹 포스트 필터링
          const posts = get().groupPosts.filter(p => p.groupId === groupId);

          // 약간의 지연 추가
          await new Promise(resolve => setTimeout(resolve, 500));

          set({ groupPosts: posts });
        } catch (error) {
          console.error('Error fetching group posts:', error);
        }
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
    }),
    {
      name: 'group-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        groups: state.groups,
        groupPosts: state.groupPosts,
      }),
    }
  )
);

export default useGroupStore;