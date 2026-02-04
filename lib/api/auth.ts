import { api, setAuthToken, setRefreshToken } from './client';
import type { User } from '@/types';

export interface SignInRequest {
  email: string;
  password: string;
}

// 백엔드 응답 형식에 맞게 수정
export interface AuthResponse {
  success: boolean;
  data: {
    user: {
      id: number;
      email: string;
      username: string;
      displayName: string;
      profileImageUrl?: string;
      bio?: string;
      createdAt: string;
    };
    accessToken: string;
    refreshToken: string;
  };
  error?: any;
  timestamp: string;
}

export interface SignInResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}

export interface SignUpResponse {
  user: User;
  token: string;
  refreshToken?: string;
}

/** 로그인 - 백엔드 스펙에 맞게 수정 */
export async function signIn(body: SignInRequest): Promise<SignInResponse> {
  const response = await api.post<AuthResponse>('/auth/login', body, { skipAuth: true });

  // 백엔드 응답을 프론트엔드 형식으로 변환
  if (response.success && response.data) {
    const { user, accessToken, refreshToken } = response.data;
    return {
      user: {
        id: String(user.id),
        email: user.email,
        username: user.username,
        displayName: user.displayName || user.username,
        profileImage: user.profileImageUrl,
        bio: user.bio,
        workoutCount: 0,
        followerCount: 0,
        followingCount: 0,
        totalWorkoutTime: 0,
        joinDate: user.createdAt,
        lastWorkout: null,
        isFollowing: false,
      },
      token: accessToken,
      refreshToken,
    };
  }

  throw new Error('로그인에 실패했습니다.');
}

/** 회원가입 - 백엔드 스펙에 맞게 수정 */
export async function signUp(body: SignUpRequest): Promise<SignUpResponse> {
  const response = await api.post<AuthResponse>('/auth/register', body, { skipAuth: true });

  // 백엔드 응답을 프론트엔드 형식으로 변환
  if (response.success && response.data) {
    const { user, accessToken, refreshToken } = response.data;
    return {
      user: {
        id: String(user.id),
        email: user.email,
        username: user.username,
        displayName: user.displayName || user.username,
        profileImage: user.profileImageUrl,
        bio: user.bio,
        workoutCount: 0,
        followerCount: 0,
        followingCount: 0,
        totalWorkoutTime: 0,
        joinDate: user.createdAt,
        lastWorkout: null,
        isFollowing: false,
      },
      token: accessToken,
      refreshToken,
    };
  }

  throw new Error('회원가입에 실패했습니다.');
}

/** 로그아웃 - 서버에 알리고 토큰 삭제 */
export async function signOut(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    await setAuthToken(null);
    await setRefreshToken(null);
  }
}

/** 내 프로필 조회 - 백엔드 스펙에 맞게 수정 */
export async function getProfile(): Promise<User> {
  const response = await api.get<any>('/users/profile');

  if (response.success && response.data) {
    const user = response.data;
    return {
      id: String(user.id),
      email: user.email,
      username: user.username,
      displayName: user.displayName || user.username,
      profileImage: user.profileImageUrl,
      bio: user.bio,
      workoutCount: user.workoutCount || 0,
      followerCount: user.followerCount || 0,
      followingCount: user.followingCount || 0,
      totalWorkoutTime: user.totalWorkoutTime || 0,
      joinDate: user.createdAt,
      lastWorkout: user.lastWorkout,
      isFollowing: false,
    };
  }

  throw new Error('프로필 조회에 실패했습니다.');
}

/** 프로필 수정 - 백엔드 스펙에 맞게 수정 */
export async function updateProfile(updates: Partial<User>): Promise<User> {
  const requestBody = {
    displayName: updates.displayName,
    bio: updates.bio,
    profileImageUrl: updates.profileImage,
  };

  const response = await api.put<any>('/users/profile', requestBody);

  if (response.success && response.data) {
    const user = response.data;
    return {
      id: String(user.id),
      email: user.email,
      username: user.username,
      displayName: user.displayName || user.username,
      profileImage: user.profileImageUrl,
      bio: user.bio,
      workoutCount: user.workoutCount || 0,
      followerCount: user.followerCount || 0,
      followingCount: user.followingCount || 0,
      totalWorkoutTime: user.totalWorkoutTime || 0,
      joinDate: user.createdAt,
      lastWorkout: user.lastWorkout,
      isFollowing: false,
    };
  }

  throw new Error('프로필 수정에 실패했습니다.');
}

/** 토큰 갱신 응답 */
export interface RefreshResponse {
  token: string;
  refreshToken?: string;
}

/** 토큰 갱신 - refreshToken으로 새 액세스 토큰 발급 */
export async function refreshAuth(refreshToken: string): Promise<RefreshResponse> {
  const response = await api.post<any>(
    '/auth/refresh',
    { refreshToken },
    { skipAuth: true }
  );

  if (response.success && response.data) {
    return {
      token: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    };
  }

  throw new Error('토큰 갱신에 실패했습니다.');
}
