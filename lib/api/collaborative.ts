/**
 * 협업 카드 관련 API
 * 그룹원과 함께 2분할 운동 카드를 만드는 기능
 */

import { apiClient } from './client';
import { SharedWorkoutCard, WorkoutSession } from '@/types';

/**
 * 협업 카드 생성
 * POST /collaborative-cards
 */
export async function createCollaborativeCard(data: {
  groupId: string;
  userId: string;
  workoutId: string;
  workout?: WorkoutSession;
  splitType: 'horizontal' | 'vertical';
  splitPosition: 'top' | 'bottom' | 'left' | 'right';
  style?: string;
  customOptions?: any;
}): Promise<SharedWorkoutCard> {
  const response = await apiClient('/collaborative-cards', {
    method: 'POST',
    body: JSON.stringify({
      ...data,
      type: 'collaborative',
      status: 'waiting',
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '협업 카드 생성 실패' }));
    throw new Error(error.message || '협업 카드 생성 실패');
  }

  return response.json();
}

/**
 * 협업 카드 참여
 * POST /collaborative-cards/:id/join
 */
export async function joinCollaborativeCard(
  cardId: string,
  userId: string,
  workoutId: string,
  workout?: WorkoutSession
): Promise<SharedWorkoutCard> {
  const response = await apiClient(`/collaborative-cards/${cardId}/join`, {
    method: 'POST',
    body: JSON.stringify({
      userId,
      workoutId,
      workout,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '협업 카드 참여 실패' }));
    throw new Error(error.message || '협업 카드 참여 실패');
  }

  return response.json();
}

/**
 * 그룹의 협업 카드 목록 조회
 * GET /groups/:groupId/collaborative-cards
 */
export async function getGroupCollaborativeCards(
  groupId: string,
  status?: 'waiting' | 'in_progress' | 'completed' | 'expired'
): Promise<SharedWorkoutCard[]> {
  const params = new URLSearchParams();
  if (status) params.append('status', status);

  const response = await apiClient(`/groups/${groupId}/collaborative-cards?${params}`);

  if (!response.ok) {
    console.error('Failed to fetch collaborative cards');
    return [];
  }

  return response.json();
}

/**
 * 사용자가 참여 가능한 협업 카드 목록
 * GET /collaborative-cards/available
 */
export async function getAvailableCollaborativeCards(
  userId: string,
  groupId?: string
): Promise<SharedWorkoutCard[]> {
  const params = new URLSearchParams();
  params.append('userId', userId);
  if (groupId) params.append('groupId', groupId);

  const response = await apiClient(`/collaborative-cards/available?${params}`);

  if (!response.ok) {
    console.error('Failed to fetch available collaborative cards');
    return [];
  }

  return response.json();
}

/**
 * 내가 참여한 협업 카드 목록
 * GET /collaborative-cards/my-cards
 */
export async function getMyCollaborativeCards(
  userId: string,
  groupId?: string
): Promise<SharedWorkoutCard[]> {
  const params = new URLSearchParams();
  params.append('userId', userId);
  if (groupId) params.append('groupId', groupId);

  const response = await apiClient(`/collaborative-cards/my-cards?${params}`);

  if (!response.ok) {
    console.error('Failed to fetch my collaborative cards');
    return [];
  }

  return response.json();
}

/**
 * 협업 카드 상태 업데이트
 * PATCH /collaborative-cards/:id/status
 */
export async function updateCollaborativeCardStatus(
  cardId: string,
  status: 'waiting' | 'in_progress' | 'completed' | 'expired'
): Promise<SharedWorkoutCard> {
  const response = await apiClient(`/collaborative-cards/${cardId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '상태 업데이트 실패' }));
    throw new Error(error.message || '상태 업데이트 실패');
  }

  return response.json();
}

/**
 * 협업 카드 취소/삭제
 * DELETE /collaborative-cards/:id
 */
export async function cancelCollaborativeCard(cardId: string): Promise<void> {
  const response = await apiClient(`/collaborative-cards/${cardId}`, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '카드 취소 실패' }));
    throw new Error(error.message || '카드 취소 실패');
  }
}

/**
 * 만료된 카드 정리 (배치 작업)
 * POST /collaborative-cards/cleanup-expired
 */
export async function cleanupExpiredCards(): Promise<{ cleaned: number }> {
  const response = await apiClient('/collaborative-cards/cleanup-expired', {
    method: 'POST',
  });

  if (!response.ok) {
    console.error('Failed to cleanup expired cards');
    return { cleaned: 0 };
  }

  return response.json();
}

/**
 * 협업 카드 상세 조회
 * GET /collaborative-cards/:id
 */
export async function getCollaborativeCard(cardId: string): Promise<SharedWorkoutCard> {
  const response = await apiClient(`/collaborative-cards/${cardId}`);

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '카드 조회 실패' }));
    throw new Error(error.message || '카드 조회 실패');
  }

  return response.json();
}

/**
 * 협업 카드 통계
 * GET /collaborative-cards/stats
 */
export async function getCollaborativeCardStats(userId: string): Promise<{
  totalCreated: number;
  totalCompleted: number;
  totalParticipated: number;
  successRate: number;
  topPartners: Array<{ userId: string; username: string; count: number }>;
}> {
  const response = await apiClient(`/collaborative-cards/stats?userId=${userId}`);

  if (!response.ok) {
    console.error('Failed to fetch collaborative card stats');
    return {
      totalCreated: 0,
      totalCompleted: 0,
      totalParticipated: 0,
      successRate: 0,
      topPartners: [],
    };
  }

  return response.json();
}