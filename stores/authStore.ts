import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import uuid from 'react-native-uuid';

// Firebase imports commented out for test mode
// import {
//   signInWithEmailAndPassword,
//   createUserWithEmailAndPassword,
//   signOut,
//   updateProfile,
//   User as FirebaseUser
// } from 'firebase/auth';
// import {
//   doc,
//   setDoc,
//   getDoc,
//   updateDoc,
//   collection,
//   query,
//   where,
//   getDocs,
// } from 'firebase/firestore';
// import { auth, db } from '@/config/firebase';

interface AuthStore {
  user: User | null;
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

// Mock user data for testing
const mockUsers: { [key: string]: { password: string; user: User } } = {
  'test@test.com': {
    password: 'test1234',
    user: {
      id: 'test-user-001',
      username: 'TestUser',
      profileImage: undefined,
      badges: ['early_bird', 'week_warrior'],
      following: [],
      followers: [],
      stats: {
        totalWorkouts: 42,
        currentStreak: 7,
        totalVolume: 125000,
        favoriteExercise: '벤치프레스',
      },
      gym: {
        id: 'gym-001',
        name: '테스트 헬스장',
        location: '서울특별시 강남구',
        members: ['test-user-001'],
      },
    },
  },
  'test2@test.com': {
    password: 'test1234',
    user: {
      id: 'test-user-002',
      username: 'GymBuddy',
      profileImage: undefined,
      badges: ['consistency_king'],
      following: ['test-user-001'],
      followers: ['test-user-001'],
      stats: {
        totalWorkouts: 100,
        currentStreak: 30,
        totalVolume: 500000,
        favoriteExercise: '스쿼트',
      },
      gym: {
        id: 'gym-001',
        name: '테스트 헬스장',
        location: '서울특별시 강남구',
        members: ['test-user-001', 'test-user-002'],
      },
    },
  },
};

const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      signIn: async (email: string, password: string) => {
        set({ isLoading: true, error: null });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          // Check if user exists in mock database
          const mockUser = mockUsers[email];

          if (!mockUser) {
            throw new Error('사용자를 찾을 수 없습니다.');
          }

          if (mockUser.password !== password) {
            throw new Error('비밀번호가 일치하지 않습니다.');
          }

          // Login successful
          set({
            user: mockUser.user,
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

      signUp: async (email: string, password: string, username: string) => {
        set({ isLoading: true, error: null });

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 500));

        try {
          // Check if email already exists
          if (mockUsers[email]) {
            throw new Error('이미 가입된 이메일입니다.');
          }

          // Check if username is available
          const usernameAvailable = await get().checkUsername(username);
          if (!usernameAvailable) {
            throw new Error('이미 사용 중인 사용자명입니다.');
          }

          // Create new user
          const newUser: User = {
            id: uuid.v4() as string,
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

          // Save to mock database
          mockUsers[email] = {
            password,
            user: newUser,
          };

          set({
            user: newUser,
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

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          set({
            user: null,
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

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          // Update local state
          const updatedUser = { ...user, ...updates };

          // Update mock database
          Object.values(mockUsers).forEach(mockUser => {
            if (mockUser.user.id === user.id) {
              mockUser.user = updatedUser;
            }
          });

          set({
            user: updatedUser,
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

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          // Update current user's following
          const updatedFollowing = [...user.following, targetUserId];

          // Update mock database
          Object.values(mockUsers).forEach(mockUser => {
            if (mockUser.user.id === user.id) {
              mockUser.user.following = updatedFollowing;
            }
            if (mockUser.user.id === targetUserId) {
              mockUser.user.followers = [...mockUser.user.followers, user.id];
            }
          });

          // Update local state
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

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          // Update current user's following
          const updatedFollowing = user.following.filter(id => id !== targetUserId);

          // Update mock database
          Object.values(mockUsers).forEach(mockUser => {
            if (mockUser.user.id === user.id) {
              mockUser.user.following = updatedFollowing;
            }
            if (mockUser.user.id === targetUserId) {
              mockUser.user.followers = mockUser.user.followers.filter(id => id !== user.id);
            }
          });

          // Update local state
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

        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 300));

        try {
          // Mock gym data
          const mockGym = {
            id: gymId,
            name: '테스트 헬스장',
            location: '서울특별시 강남구',
            members: [user.id],
          };

          // Update user profile
          const updatedUser = {
            ...user,
            gym: mockGym,
          };

          // Update mock database
          Object.values(mockUsers).forEach(mockUser => {
            if (mockUser.user.id === user.id) {
              mockUser.user = updatedUser;
            }
          });

          set({
            user: updatedUser,
          });
        } catch (error: any) {
          set({ error: error.message });
          throw error;
        }
      },

      fetchUserProfile: async (userId: string) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));

        try {
          // Find user in mock database
          const foundUser = Object.values(mockUsers).find(
            mockUser => mockUser.user.id === userId
          );

          return foundUser ? foundUser.user : null;
        } catch (error) {
          console.error('Error fetching user profile:', error);
          return null;
        }
      },

      searchUsers: async (searchQuery: string) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));

        try {
          // Search users in mock database
          const users = Object.values(mockUsers)
            .map(mockUser => mockUser.user)
            .filter(user =>
              user.username.toLowerCase().includes(searchQuery.toLowerCase())
            );

          return users;
        } catch (error) {
          console.error('Error searching users:', error);
          return [];
        }
      },

      checkUsername: async (username: string) => {
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 100));

        try {
          // Check if username exists in mock database
          const exists = Object.values(mockUsers).some(
            mockUser => mockUser.user.username.toLowerCase() === username.toLowerCase()
          );

          return !exists; // Return true if username is available
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