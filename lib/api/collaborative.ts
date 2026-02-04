/**
 * 협업 카드 API - 그룹원과 함께 2분할 운동 카드 생성/관리
 * - client.api 사용 (apiClient 제거, 중복 통일)
 */

import { api } from './client';
import type { SharedWorkoutCard, WorkoutSession } from '@/types';
import { unwrapResponse, unwrapArrayResponse } from './utils';

/** 협업 카드 생성 */
export async function createCollaborativeCard(data: {
  groupId: string;
  userId: string;
  workoutId: string;
  workout?: WorkoutSession;
  splitType: 'horizontal' | 'vertical';
  splitPosition: 'top' | 'bottom' | 'left' | 'right';
  style?: string;
  customOptions?: unknown;
}): Promise<SharedWorkoutCard> {
  const res = await api.post<SharedWorkoutCard | { data: SharedWorkoutCard }>(
    '/collaborative-cards',
    { ...data, type: 'collaborative', status: 'waiting' }
  );
  return unwrapResponse(res) ?? (res as SharedWorkoutCard);
}

/** 협업 카드 참여 */
export async function joinCollaborativeCard(
  cardId: string,
  userId: string,
  workoutId: string,
  workout?: WorkoutSession
): Promise<SharedWorkoutCard> {
  const res = await api.post<SharedWorkoutCard | { data: SharedWorkoutCard }>(
    `/collaborative-cards/${cardId}/join`,
    { userId, workoutId, workout }
  );
  return unwrapResponse(res) ?? (res as SharedWorkoutCard);
}

/** 그룹의 협업 카드 목록 조회 */
export async function getGroupCollaborativeCards(
  groupId: string,
  status?: 'waiting' | 'in_progress' | 'completed' | 'expired'
): Promise<SharedWorkoutCard[]> {
  const query = status ? `?status=${status}` : '';
  const data = await api.get<SharedWorkoutCard[] | { data: SharedWorkoutCard[] }>(
    `/groups/${groupId}/collaborative-cards${query}`
  );
  return unwrapArrayResponse(data);
}

/** 사용자가 참여 가능한 협업 카드 목록 */
export async function getAvailableCollaborativeCards(
  userId: string,
  groupId?: string
): Promise<SharedWorkoutCard[]> {
  const params = new URLSearchParams({ userId });
  if (groupId) params.append('groupId', groupId);
  const data = await api.get<SharedWorkoutCard[] | { data: SharedWorkoutCard[] }>(
    `/collaborative-cards/available?${params}`
  );
  return unwrapArrayResponse(data);
}

/** 내가 참여한 협업 카드 목록 */
export async function getMyCollaborativeCards(
  userId: string,
  groupId?: string
): Promise<SharedWorkoutCard[]> {
  const params = new URLSearchParams({ userId });
  if (groupId) params.append('groupId', groupId);
  const data = await api.get<SharedWorkoutCard[] | { data: SharedWorkoutCard[] }>(
    `/collaborative-cards/my-cards?${params}`
  );
  return unwrapArrayResponse(data);
}

/** 협업 카드 상태 업데이트 */
export async function updateCollaborativeCardStatus(
  cardId: string,
  status: 'waiting' | 'in_progress' | 'completed' | 'expired'
): Promise<SharedWorkoutCard> {
  const res = await api.patch<SharedWorkoutCard | { data: SharedWorkoutCard }>(
    `/collaborative-cards/${cardId}/status`,
    { status }
  );
  return unwrapResponse(res) ?? (res as SharedWorkoutCard);
}

/** 협업 카드 취소/삭제 */
export async function cancelCollaborativeCard(cardId: string): Promise<void> {
  await api.del(`/collaborative-cards/${cardId}`);
}

/** 만료된 카드 정리 (배치 작업) */
export async function cleanupExpiredCards(): Promise<{ cleaned: number }> {
  const res = await api.post<{ cleaned: number } | { data: { cleaned: number } }>(
    '/collaborative-cards/cleanup-expired'
  );
  const unwrapped = unwrapResponse(res);
  return unwrapped ?? (res as { cleaned: number }) ?? { cleaned: 0 };
}

/** 협업 카드 상세 조회 */
export async function getCollaborativeCard(cardId: string): Promise<SharedWorkoutCard> {
  const res = await api.get<SharedWorkoutCard | { data: SharedWorkoutCard }>(
    `/collaborative-cards/${cardId}`
  );
  return unwrapResponse(res) ?? (res as SharedWorkoutCard);
}

/** 협업 카드 통계 반환 타입 */
export interface CollaborativeCardStats {
  totalCreated: number;
  totalCompleted: number;
  totalParticipated: number;
  successRate: number;
  topPartners: Array<{ userId: string; username: string; count: number }>;
}

const emptyStats: CollaborativeCardStats = {
  totalCreated: 0,
  totalCompleted: 0,
  totalParticipated: 0,
  successRate: 0,
  topPartners: [],
};

/** 협업 카드 통계 */
export async function getCollaborativeCardStats(userId: string): Promise<CollaborativeCardStats> {
  try {
    const res = await api.get<CollaborativeCardStats | { data: CollaborativeCardStats }>(
      `/collaborative-cards/stats?userId=${userId}`
    );
    const unwrapped = unwrapResponse(res);
    if (unwrapped && typeof unwrapped === 'object' && Array.isArray(unwrapped.topPartners)) {
      return unwrapped as CollaborativeCardStats;
    }
    return emptyStats;
  } catch {
    return emptyStats;
  }
}
