import { api } from './client';
import type { SharedWorkoutCard } from '@/types';
import type { Group, GroupPost } from '@/stores/groupStore';

/** 내 그룹 목록 */
export async function getMyGroups(userId: string): Promise<Group[]> {
  const data = await api.get<Group[] | { data: Group[] }>(`/users/${userId}/groups`);
  return Array.isArray(data) ? data : (data as { data: Group[] }).data ?? [];
}

/** 그룹 포스트 목록 */
export async function getGroupPosts(groupId: string): Promise<GroupPost[]> {
  const data = await api.get<GroupPost[] | { data: GroupPost[] }>(`/groups/${groupId}/posts`);
  return Array.isArray(data) ? data : (data as { data: GroupPost[] }).data ?? [];
}

/** 그룹 생성 */
export async function createGroup(body: {
  name: string;
  description?: string;
  isPrivate: boolean;
  userId: string;
}): Promise<Group> {
  const res = await api.post<Group | { data: Group }>('/groups', body);
  return (res as { data?: Group }).data ?? (res as Group);
}

/** 초대 코드로 그룹 참여 */
export async function joinGroup(inviteCode: string, userId: string): Promise<void> {
  await api.post(`/groups/join`, { inviteCode, userId });
}

/** 그룹 나가기 */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  await api.post(`/groups/${groupId}/leave`, { userId });
}

/** 그룹에 포스트(운동 공유) */
export async function shareToGroup(groupId: string, post: Partial<GroupPost>): Promise<GroupPost> {
  const payload = {
    ...post,
    createdAt: post.createdAt instanceof Date ? post.createdAt.toISOString() : post.createdAt,
    workoutSnapshot: post.workoutSnapshot
      ? {
          ...post.workoutSnapshot,
          date: post.workoutSnapshot.date instanceof Date ? post.workoutSnapshot.date.toISOString() : post.workoutSnapshot.date,
          startTime:
            post.workoutSnapshot.startTime instanceof Date
              ? post.workoutSnapshot.startTime.toISOString()
              : post.workoutSnapshot.startTime,
          endTime:
            post.workoutSnapshot.endTime instanceof Date
              ? post.workoutSnapshot.endTime.toISOString()
              : post.workoutSnapshot.endTime,
        }
      : undefined,
  };
  const res = await api.post<GroupPost | { data: GroupPost }>(`/groups/${groupId}/posts`, payload);
  return (res as { data?: GroupPost }).data ?? (res as GroupPost);
}

/** 포스트 좋아요 토글 */
export async function togglePostLike(postId: string, userId: string): Promise<void> {
  await api.post(`/groups/posts/${postId}/like`, { userId });
}

/** 포스트 댓글 추가 */
export async function addComment(postId: string, comment: { id: string; userId: string; content: string; createdAt: Date }): Promise<void> {
  await api.post(`/groups/posts/${postId}/comments`, {
    ...comment,
    createdAt: comment.createdAt instanceof Date ? comment.createdAt.toISOString() : comment.createdAt,
  });
}

/** 그룹 공유 카드 목록 */
export async function getSharedCards(groupId: string): Promise<SharedWorkoutCard[]> {
  const data = await api.get<SharedWorkoutCard[] | { data: SharedWorkoutCard[] }>(`/groups/${groupId}/shared-cards`);
  return Array.isArray(data) ? data : (data as { data: SharedWorkoutCard[] }).data ?? [];
}

/** 공유 카드 생성 */
export async function createSharedCard(body: {
  groupId: string;
  userId: string;
  workoutId: string;
  splitType: 'horizontal' | 'vertical';
  splitPosition: string;
  style?: string;
  customOptions?: unknown;
}): Promise<SharedWorkoutCard> {
  const res = await api.post<SharedWorkoutCard | { data: SharedWorkoutCard }>('/shared-cards', body);
  return (res as { data?: SharedWorkoutCard }).data ?? (res as SharedWorkoutCard);
}

/** 공유 카드 완성 */
export async function completeSharedCard(cardId: string, userId: string, workoutId: string, imageData?: string): Promise<void> {
  await api.post(`/shared-cards/${cardId}/complete`, { userId, workoutId, imageData });
}
