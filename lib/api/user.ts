/**
 * 사용자 관련 API - 팔로우, 검색, 프로필 조회 등
 */

import { api } from './client';
import type { User } from '@/types';
import { unwrapResponse, unwrapArrayResponse } from './utils';

/** 특정 사용자 팔로우 */
export async function followUser(targetUserId: string): Promise<void> {
  await api.post(`/users/${targetUserId}/follow`);
}

/** 팔로우 취소 */
export async function unfollowUser(targetUserId: string): Promise<void> {
  await api.del(`/users/${targetUserId}/follow`);
}

/** 사용자 검색 */
export async function searchUsers(query: string): Promise<User[]> {
  if (!query.trim()) return [];
  const data = await api.get<User[] | { data: User[] }>(
    `/users/search?q=${encodeURIComponent(query.trim())}`
  );
  return unwrapArrayResponse(data);
}

/** 사용자명 중복 확인 - 사용 가능 시 true */
export async function checkUsername(username: string): Promise<boolean> {
  const res = await api.get<{ available: boolean } | boolean>(
    `/users/check-username?username=${encodeURIComponent(username)}`
  );
  if (typeof res === 'boolean') return res;
  return (res as { available?: boolean }).available ?? true;
}

/** 특정 사용자 프로필 조회 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const data = await api.get<User | { data: User }>(`/users/${userId}`);
    return unwrapResponse(data);
  } catch {
    return null;
  }
}
