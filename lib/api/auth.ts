import { api, setAuthToken } from './client';
import type { User } from '@/types';

export interface SignInRequest {
  email: string;
  password: string;
}

export interface SignInResponse {
  user: User;
  token: string;
}

export interface SignUpRequest {
  email: string;
  password: string;
  username: string;
}

export interface SignUpResponse {
  user: User;
  token: string;
}

/** 로그인 - 성공 시 토큰 저장은 호출부(authStore)에서 setAuthToken(res.token) 호출 */
export async function signIn(body: SignInRequest): Promise<SignInResponse> {
  return api.post<SignInResponse>('/auth/login', body, { skipAuth: true });
}

/** 회원가입 */
export async function signUp(body: SignUpRequest): Promise<SignUpResponse> {
  return api.post<SignUpResponse>('/auth/signup', body, { skipAuth: true });
}

/** 로그아웃 - 서버에 알리고 토큰 삭제 */
export async function signOut(): Promise<void> {
  try {
    await api.post('/auth/logout');
  } finally {
    await setAuthToken(null);
  }
}

/** 내 프로필 조회 */
export async function getProfile(): Promise<User> {
  return api.get<User>('/auth/me');
}

/** 프로필 수정 */
export async function updateProfile(updates: Partial<User>): Promise<User> {
  return api.patch<User>('/auth/me', updates);
}
