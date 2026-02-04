import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '@/types';
import uuid from 'react-native-uuid';
import {
  isBackendEnabled,
  signIn as apiSignIn,
  signUp as apiSignUp,
  signOut as apiSignOut,
  setAuthToken,
  setRefreshToken,
  updateProfile as apiUpdateProfile,
  uploadProfileImage as apiUploadProfileImage,
  followUser as apiFollowUser,
  unfollowUser as apiUnfollowUser,
  searchUsers as apiSearchUsers,
  checkUsername as apiCheckUsername,
  getUserProfile as apiGetUserProfile,
} from '@/lib/api';

interface AuthStore {
  user: User | null;
  isLoading: boolean;
  error: string | null;

  // 인증 액션
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOutUser: () => Promise<void>;

  /** 401 토큰 만료 시 인증 상태만 초기화 (API 호출 없음) */
  clearAuthState: () => void;

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
      email: 'test@test.com',
      profileImage: undefined,
      bio: '운동을 사랑하는 헬스 매니아입니다 💪',
      badges: ['early_bird', 'week_warrior'],
      displayBadges: ['💪', '🔥', '🏆'],
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
      email: 'test2@test.com',
      profileImage: undefined,
      bio: '함께 운동해요! 💯',
      badges: ['consistency_king'],
      displayBadges: ['🏋️', '📅'],
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

        if (isBackendEnabled()) {
          try {
            const res = await apiSignIn({ email, password });
            await setAuthToken(res.token);
            if (res.refreshToken) await setRefreshToken(res.refreshToken);
            set({ user: res.user, isLoading: false, error: null });
          } catch (error: any) {
            set({ error: error?.message ?? '로그인에 실패했습니다.', isLoading: false });
            throw error;
          }
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        try {
          const mockUser = mockUsers[email];
          if (!mockUser) throw new Error('사용자를 찾을 수 없습니다.');
          if (mockUser.password !== password) throw new Error('비밀번호가 일치하지 않습니다.');
          set({ user: mockUser.user, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      signUp: async (email: string, password: string, username: string) => {
        set({ isLoading: true, error: null });

        if (isBackendEnabled()) {
          try {
            const res = await apiSignUp({ email, password, username });
            await setAuthToken(res.token);
            if (res.refreshToken) await setRefreshToken(res.refreshToken);
            set({ user: res.user, isLoading: false, error: null });
          } catch (error: any) {
            set({ error: error?.message ?? '회원가입에 실패했습니다.', isLoading: false });
            throw error;
          }
          return;
        }

        await new Promise(resolve => setTimeout(resolve, 500));
        try {
          if (mockUsers[email]) throw new Error('이미 가입된 이메일입니다.');
          const usernameAvailable = await get().checkUsername(username);
          if (!usernameAvailable) throw new Error('이미 사용 중인 사용자명입니다.');
          const newUser: User = {
            id: uuid.v4() as string,
            username,
            profileImage: undefined,
            badges: [],
            following: [],
            followers: [],
            stats: { totalWorkouts: 0, currentStreak: 0, totalVolume: 0, favoriteExercise: '' },
          };
          mockUsers[email] = { password, user: newUser };
          set({ user: newUser, isLoading: false });
        } catch (error: any) {
          set({ error: error.message, isLoading: false });
          throw error;
        }
      },

      signOutUser: async () => {
        set({ isLoading: true });
        if (isBackendEnabled()) {
          try {
            await apiSignOut();
          } finally {
            await setAuthToken(null);
            set({ user: null, isLoading: false });
          }
          return;
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        set({ user: null, isLoading: false });
      },

      clearAuthState: () => {
        set({ user: null, error: null });
      },

      updateUserProfile: async (updates: Partial<User>) => {
        const { user } = get();
        if (!user) return;

        set({ isLoading: true });

        try {
          if (isBackendEnabled()) {
            let finalUpdates = { ...updates };
            if (updates.profileImage && (updates.profileImage.startsWith('file://') || updates.profileImage.startsWith('content://'))) {
              const url = await apiUploadProfileImage(updates.profileImage);
              finalUpdates = { ...updates, profileImage: url };
            }
            const updatedUser = await apiUpdateProfile(finalUpdates);
            set({ user: updatedUser, isLoading: false, error: null });
            return;
          }

          await new Promise(resolve => setTimeout(resolve, 300));
          const updatedUser = { ...user, ...updates };
          Object.values(mockUsers).forEach(mockUser => {
            if (mockUser.user.id === user.id) {
              mockUser.user = updatedUser;
            }
          });
          set({ user: updatedUser, isLoading: false });
        } catch (error: any) {
          set({
            error: error?.message ?? '프로필 수정에 실패했습니다.',
            isLoading: false,
          });
          throw error;
        }
      },

      uploadProfileImage: async (imageUri: string) => {
        if (isBackendEnabled()) {
          const url = await apiUploadProfileImage(imageUri);
          const { user } = get();
          if (user) {
            const updated = await apiUpdateProfile({ profileImage: url });
            set({ user: updated });
          }
          return url;
        }
        return imageUri;
      },

      followUser: async (targetUserId: string) => {
        const { user } = get();
        if (!user) return;

        try {
          if (isBackendEnabled()) {
            await apiFollowUser(targetUserId);
          }
          const updatedFollowing = [...user.following, targetUserId];
          if (!isBackendEnabled()) {
            Object.values(mockUsers).forEach(mockUser => {
              if (mockUser.user.id === user.id) mockUser.user.following = updatedFollowing;
              if (mockUser.user.id === targetUserId) mockUser.user.followers = [...mockUser.user.followers, user.id];
            });
          }
          set({ user: { ...user, following: updatedFollowing } });
        } catch (error: any) {
          set({ error: error?.message });
          throw error;
        }
      },

      unfollowUser: async (targetUserId: string) => {
        const { user } = get();
        if (!user) return;

        try {
          if (isBackendEnabled()) {
            await apiUnfollowUser(targetUserId);
          }
          const updatedFollowing = user.following.filter(id => id !== targetUserId);
          if (!isBackendEnabled()) {
            Object.values(mockUsers).forEach(mockUser => {
              if (mockUser.user.id === user.id) mockUser.user.following = updatedFollowing;
              if (mockUser.user.id === targetUserId) mockUser.user.followers = mockUser.user.followers.filter(id => id !== user.id);
            });
          }
          set({ user: { ...user, following: updatedFollowing } });
        } catch (error: any) {
          set({ error: error?.message });
          throw error;
        }
      },

      setUserGym: async (gymId: string) => {
        const { user } = get();
        if (!user) return;

        const mockGym = {
          id: gymId,
          name: '테스트 헬스장',
          location: { latitude: 0, longitude: 0, address: '서울특별시 강남구' },
          members: [user.id],
        };
        const updatedUser = { ...user, gym: mockGym };

        try {
          if (isBackendEnabled()) {
            const result = await apiUpdateProfile({ gym: updatedUser.gym });
            set({ user: result });
            return;
          }
          Object.values(mockUsers).forEach(mockUser => {
            if (mockUser.user.id === user.id) mockUser.user = updatedUser;
          });
          set({ user: updatedUser });
        } catch (error: any) {
          set({ error: error?.message });
          throw error;
        }
      },

      fetchUserProfile: async (userId: string) => {
        try {
          if (isBackendEnabled()) {
            return await apiGetUserProfile(userId);
          }
          await new Promise(resolve => setTimeout(resolve, 200));
          const foundUser = Object.values(mockUsers).find(mockUser => mockUser.user.id === userId);
          return foundUser ? foundUser.user : null;
        } catch (error) {
          console.error('Error fetching user profile:', error);
          return null;
        }
      },

      searchUsers: async (searchQuery: string) => {
        try {
          if (isBackendEnabled()) {
            return await apiSearchUsers(searchQuery);
          }
          await new Promise(resolve => setTimeout(resolve, 200));
          return Object.values(mockUsers)
            .map(mockUser => mockUser.user)
            .filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()));
        } catch (error) {
          console.error('Error searching users:', error);
          return [];
        }
      },

      checkUsername: async (username: string) => {
        try {
          if (isBackendEnabled()) {
            return await apiCheckUsername(username);
          }
          await new Promise(resolve => setTimeout(resolve, 100));
          const exists = Object.values(mockUsers).some(
            mockUser => mockUser.user.username.toLowerCase() === username.toLowerCase()
          );
          return !exists;
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