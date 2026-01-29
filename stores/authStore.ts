import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { auth, db } from '@/config/firebase';
import { User } from '@/types';
import uuid from 'react-native-uuid';

interface AuthStore {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  isLoading: boolean;
  error: string | null;

  // 인증 액션
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOutUser: () => Promise<void>;

  // 프로필 관리
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  uploadProfileImage: (imageUri: string) => Promise<string>;

  // 팔로우 관리
  followUser: (userId: string) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;

  // 헬스장 관리
  setUserGym: (gymId: string) => Promise<void>;

  // 유틸리티
  fetchUserProfile: (userId: string) => Promise<User | null>;
  searchUsers: (query: string) => Promise<User[]>;
  checkUsername: (username: string) => Promise<boolean>;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      firebaseUser: null,
      isLoading: false,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          // Firestore에서 사용자 프로필 가져오기
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as User;
            set({
              user: userData,
              firebaseUser,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      signUp: async (email: string, password: string, username: string) => {
        set({ isLoading: true, error: null });
        try {
          // 사용자명 중복 확인
          const usernameAvailable = await get().checkUsername(username);
          if (!usernameAvailable) {
            throw new Error('이미 사용 중인 사용자명입니다.');
          }

          // Firebase Auth 계정 생성
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;

          // Firebase Auth 프로필 업데이트
          await updateProfile(firebaseUser, {
            displayName: username,
          });

          // Firestore에 사용자 프로필 생성
          const newUser: User = {
            id: firebaseUser.uid,
            username,
            profileImage: undefined,
            badges: [],
            following: [],
            followers: [],
            stats: {
              totalWorkouts: 0,
              currentStreak: 0,
              totalVolume: 0,
              favoriteExercise: '',
            },
          };

          await setDoc(doc(db, 'users', firebaseUser.uid), newUser);

          set({
            user: newUser,
            firebaseUser,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      signOutUser: async () => {
        set({ isLoading: true });
        try {
          await signOut(auth);
          set({
            user: null,
            firebaseUser: null,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      updateUserProfile: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });
        try {
          // Firestore 업데이트
          await updateDoc(doc(db, 'users', user.id), updates);

          // 로컬 상태 업데이트
          set({
            user: { ...user, ...updates },
            isLoading: false,
          });
        } catch (error: any) {
          set({
            error: error.message,
            isLoading: false,
          });
          throw error;
        }
      },

      uploadProfileImage: async (imageUri: string) => {
        // TODO: Firebase Storage 업로드 구현
        return imageUri;
      },

      followUser: async (targetUserId: string) => {
        const { user } = get();
        if (!user) return;

        try {
          // 현재 사용자의 following 업데이트
          const updatedFollowing = [...user.following, targetUserId];
          await updateDoc(doc(db, 'users', user.id), {
            following: updatedFollowing,
          });

          // 대상 사용자의 followers 업데이트
          const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
          if (targetUserDoc.exists()) {
            const targetUser = targetUserDoc.data() as User;
            await updateDoc(doc(db, 'users', targetUserId), {
              followers: [...targetUser.followers, user.id],
            });
          }

          // 로컬 상태 업데이트
          set({
            user: { ...user, following: updatedFollowing },
          });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      unfollowUser: async (targetUserId: string) => {
        const { user } = get();
        if (!user) return;

        try {
          // 현재 사용자의 following 업데이트
          const updatedFollowing = user.following.filter(id => id !== targetUserId);
          await updateDoc(doc(db, 'users', user.id), {
            following: updatedFollowing,
          });

          // 대상 사용자의 followers 업데이트
          const targetUserDoc = await getDoc(doc(db, 'users', targetUserId));
          if (targetUserDoc.exists()) {
            const targetUser = targetUserDoc.data() as User;
            await updateDoc(doc(db, 'users', targetUserId), {
              followers: targetUser.followers.filter(id => id !== user.id),
            });
          }

          // 로컬 상태 업데이트
          set({
            user: { ...user, following: updatedFollowing },
          });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      setUserGym: async (gymId: string) => {
        const { user } = get();
        if (!user) return;

        try {
          // 헬스장 정보 가져오기
          const gymDoc = await getDoc(doc(db, 'gyms', gymId));
          if (!gymDoc.exists()) {
            throw new Error('헬스장을 찾을 수 없습니다.');
          }

          const gym = gymDoc.data();

          // 사용자 프로필 업데이트
          await updateDoc(doc(db, 'users', user.id), {
            gym: {
              id: gymId,
              ...gym,
            },
          });

          // 헬스장 멤버 목록 업데이트
          await updateDoc(doc(db, 'gyms', gymId), {
            members: [...(gym.members || []), user.id],
          });

          // 로컬 상태 업데이트
          set({
            user: {
              ...user,
              gym: {
                id: gymId,
                name: gym.name,
                location: gym.location,
                members: gym.members || [],
              },
            },
          });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      fetchUserProfile: async (userId: string) => {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            return userDoc.data() as User;
          }
          return null;
        } catch (error) {
          console.error('Error fetching user profile:', error);
          return null;
        }
      },

      searchUsers: async (searchQuery: string) => {
        try {
          const q = query(
            collection(db, 'users'),
            where('username', '>=', searchQuery),
            where('username', '<=', searchQuery + '\uf8ff')
          );
          const querySnapshot = await getDocs(q);
          const users: User[] = [];
          querySnapshot.forEach((doc) => {
            users.push(doc.data() as User);
          });
          return users;
        } catch (error) {
          console.error('Error searching users:', error);
          return [];
        }
      },

      checkUsername: async (username: string) => {
        try {
          const q = query(
            collection(db, 'users'),
            where('username', '==', username)
          );
          const querySnapshot = await getDocs(q);
          return querySnapshot.empty;
        } catch (error) {
          console.error('Error checking username:', error);
          return false;
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);

export default useAuthStore;