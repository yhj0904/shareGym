import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import uuid from 'react-native-uuid';

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
  username?: string;
  text: string;
  createdAt: Date;
}

interface GroupStore {
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

  // 그룹 피드
  shareToGroup: (groupId: string, post: Omit<GroupPost, 'id' | 'createdAt'>) => Promise<void>;
  fetchGroupPosts: (groupId: string) => Promise<void>;
  likeGroupPost: (postId: string, userId: string) => Promise<void>;
  commentOnGroupPost: (postId: string, comment: GroupComment) => Promise<void>;

  // 초대 코드 생성
  generateInviteCode: () => string;
  refreshInviteCode: (groupId: string) => Promise<string>;
}

const useGroupStore = create<GroupStore>()(
  persist(
    (set, get) => ({
      groups: [],
      currentGroup: null,
      groupPosts: [],
      isLoading: false,

      createGroup: async (name, description, isPrivate, userId) => {
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
          memberCount: 1,
        };

        try {
          // Firestore에 저장
          await setDoc(doc(db, 'groups', newGroup.id), {
            ...newGroup,
            createdAt: serverTimestamp(),
          });

          // 로컬 상태 업데이트
          set((state) => ({
            groups: [...state.groups, newGroup],
          }));

          return newGroup;
        } catch (error) {
          console.error('Error creating group:', error);
          throw error;
        }
      },

      joinGroupWithCode: async (inviteCode, userId) => {
        try {
          // 초대 코드로 그룹 찾기
          const q = query(
            collection(db, 'groups'),
            where('inviteCode', '==', inviteCode)
          );
          const querySnapshot = await getDocs(q);

          if (querySnapshot.empty) {
            throw new Error('유효하지 않은 초대 코드입니다.');
          }

          const groupDoc = querySnapshot.docs[0];
          const group = groupDoc.data() as Group;

          // 이미 멤버인지 확인
          if (group.members.includes(userId)) {
            throw new Error('이미 그룹에 참여하고 있습니다.');
          }

          // 그룹에 멤버 추가
          await updateDoc(doc(db, 'groups', groupDoc.id), {
            members: arrayUnion(userId),
            memberCount: group.memberCount + 1,
            lastActivity: serverTimestamp(),
          });

          // 로컬 상태 업데이트
          const updatedGroup = {
            ...group,
            members: [...group.members, userId],
            memberCount: group.memberCount + 1,
          };

          set((state) => ({
            groups: [...state.groups, updatedGroup],
          }));
        } catch (error) {
          console.error('Error joining group:', error);
          throw error;
        }
      },

      leaveGroup: async (groupId, userId) => {
        try {
          const groupRef = doc(db, 'groups', groupId);
          const groupDoc = await getDoc(groupRef);

          if (!groupDoc.exists()) {
            throw new Error('그룹을 찾을 수 없습니다.');
          }

          const group = groupDoc.data() as Group;

          // 그룹 생성자는 나갈 수 없음
          if (group.createdBy === userId) {
            throw new Error('그룹 생성자는 그룹을 나갈 수 없습니다.');
          }

          // 멤버 제거
          await updateDoc(groupRef, {
            members: arrayRemove(userId),
            admins: arrayRemove(userId),
            memberCount: group.memberCount - 1,
          });

          // 로컬 상태 업데이트
          set((state) => ({
            groups: state.groups.filter(g => g.id !== groupId),
          }));
        } catch (error) {
          console.error('Error leaving group:', error);
          throw error;
        }
      },

      fetchUserGroups: async (userId) => {
        set({ isLoading: true });
        try {
          const q = query(
            collection(db, 'groups'),
            where('members', 'array-contains', userId)
          );
          const querySnapshot = await getDocs(q);

          const groups: Group[] = [];
          querySnapshot.forEach((doc) => {
            groups.push({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            } as Group);
          });

          set({ groups, isLoading: false });
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
          const newPost: GroupPost = {
            ...post,
            id: uuid.v4() as string,
            groupId,
            createdAt: new Date(),
          };

          // Firestore에 저장
          await setDoc(doc(db, 'groupPosts', newPost.id), {
            ...newPost,
            createdAt: serverTimestamp(),
          });

          // 그룹 최근 활동 업데이트
          await updateDoc(doc(db, 'groups', groupId), {
            lastActivity: serverTimestamp(),
          });

          // 로컬 상태 업데이트
          set((state) => ({
            groupPosts: [newPost, ...state.groupPosts],
          }));
        } catch (error) {
          console.error('Error sharing to group:', error);
          throw error;
        }
      },

      fetchGroupPosts: async (groupId) => {
        try {
          const q = query(
            collection(db, 'groupPosts'),
            where('groupId', '==', groupId)
          );
          const querySnapshot = await getDocs(q);

          const posts: GroupPost[] = [];
          querySnapshot.forEach((doc) => {
            posts.push({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate() || new Date(),
            } as GroupPost);
          });

          // 날짜순 정렬
          posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

          set({ groupPosts: posts });
        } catch (error) {
          console.error('Error fetching group posts:', error);
        }
      },

      likeGroupPost: async (postId, userId) => {
        try {
          const postRef = doc(db, 'groupPosts', postId);
          const postDoc = await getDoc(postRef);

          if (postDoc.exists()) {
            const post = postDoc.data() as GroupPost;
            const likes = post.likes || [];

            if (likes.includes(userId)) {
              // 좋아요 취소
              await updateDoc(postRef, {
                likes: arrayRemove(userId),
              });
            } else {
              // 좋아요 추가
              await updateDoc(postRef, {
                likes: arrayUnion(userId),
              });
            }

            // 로컬 상태 업데이트
            set((state) => ({
              groupPosts: state.groupPosts.map(p => {
                if (p.id === postId) {
                  const isLiked = p.likes.includes(userId);
                  return {
                    ...p,
                    likes: isLiked
                      ? p.likes.filter(id => id !== userId)
                      : [...p.likes, userId],
                  };
                }
                return p;
              }),
            }));
          }
        } catch (error) {
          console.error('Error liking post:', error);
        }
      },

      commentOnGroupPost: async (postId, comment) => {
        try {
          const postRef = doc(db, 'groupPosts', postId);
          const postDoc = await getDoc(postRef);

          if (postDoc.exists()) {
            await updateDoc(postRef, {
              comments: arrayUnion(comment),
            });

            // 로컬 상태 업데이트
            set((state) => ({
              groupPosts: state.groupPosts.map(p => {
                if (p.id === postId) {
                  return {
                    ...p,
                    comments: [...p.comments, comment],
                  };
                }
                return p;
              }),
            }));
          }
        } catch (error) {
          console.error('Error commenting on post:', error);
          throw error;
        }
      },

      generateInviteCode: () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      },

      refreshInviteCode: async (groupId) => {
        const newCode = get().generateInviteCode();
        try {
          await updateDoc(doc(db, 'groups', groupId), {
            inviteCode: newCode,
          });

          // 로컬 상태 업데이트
          set((state) => ({
            groups: state.groups.map(g =>
              g.id === groupId ? { ...g, inviteCode: newCode } : g
            ),
          }));

          return newCode;
        } catch (error) {
          console.error('Error refreshing invite code:', error);
          throw error;
        }
      },
    }),
    {
      name: 'group-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        groups: state.groups,
      }),
    }
  )
);

export default useGroupStore;