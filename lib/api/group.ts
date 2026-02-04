import { api } from './client';
import type { SharedWorkoutCard } from '@/types';
import type { Group, GroupPost } from '@/stores/groupStore';
import { unwrapResponse, unwrapArrayResponse } from './utils';

/** 백엔드 응답 타입 */
interface BackendGroupResponse {
  success: boolean;
  data: any;
  error?: any;
  timestamp: string;
}

/** 내 그룹 목록 - 백엔드 API v1 스펙 */
export async function getMyGroups(userId: string): Promise<Group[]> {
  try {
    // 백엔드는 /groups 엔드포인트로 현재 사용자의 그룹 목록 조회
    const response = await api.get<BackendGroupResponse>('/groups');

    if (response.success && response.data) {
      const groups = Array.isArray(response.data) ? response.data : response.data.content || [];

      return groups.map((group: any) => ({
        id: String(group.id),
        name: group.name,
        description: group.description || '',
        memberCount: group.memberCount || 0,
        isPrivate: group.isPrivate || false,
        inviteCode: group.inviteCode,
        coverImage: group.profileImageUrl || group.coverImage,
        createdAt: group.createdAt,
        createdBy: String(group.createdBy || group.ownerId || ''),
        members: group.members || [],
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to load groups:', error);
    return [];
  }
}

/** 그룹 포스트 목록 - 백엔드 API v1 스펙 */
export async function getGroupPosts(groupId: string): Promise<GroupPost[]> {
  try {
    const response = await api.get<BackendGroupResponse>(`/groups/${groupId}/posts`);

    if (response.success && response.data) {
      const posts = Array.isArray(response.data) ? response.data : response.data.content || [];

      return posts.map((post: any) => ({
        id: String(post.id),
        groupId: String(post.groupId),
        userId: String(post.userId),
        userName: post.userName || post.user?.username || '',
        userImage: post.userImage || post.user?.profileImageUrl,
        content: post.content || '',
        workoutId: post.workoutId ? String(post.workoutId) : undefined,
        workoutSnapshot: post.workoutSession || post.workout,
        likes: post.likes || [],
        comments: post.comments || [],
        createdAt: post.createdAt,
      }));
    }

    return [];
  } catch (error) {
    console.error('Failed to load group posts:', error);
    return [];
  }
}

/** 그룹 생성 - 백엔드 API v1 스펙 */
export async function createGroup(body: {
  name: string;
  description?: string;
  isPrivate: boolean;
  userId: string;
}): Promise<Group> {
  try {
    const response = await api.post<BackendGroupResponse>('/groups', {
      name: body.name,
      description: body.description || '',
      isPrivate: body.isPrivate,
    });

    if (response.success && response.data) {
      const group = response.data;
      return {
        id: String(group.id),
        name: group.name,
        description: group.description || '',
        memberCount: group.memberCount || 1,
        isPrivate: group.isPrivate || false,
        inviteCode: group.inviteCode,
        coverImage: group.profileImageUrl || group.coverImage,
        createdAt: group.createdAt,
        createdBy: String(group.createdBy || group.ownerId || body.userId),
        members: group.members || [],
      };
    }

    throw new Error('그룹 생성에 실패했습니다.');
  } catch (error) {
    console.error('Failed to create group:', error);
    throw error;
  }
}

/** 초대 코드로 그룹 참여 - 백엔드 API v1 스펙 */
export async function joinGroup(inviteCode: string, userId: string): Promise<void> {
  try {
    await api.post('/groups/join', { inviteCode });
  } catch (error) {
    console.error('Failed to join group:', error);
    throw error;
  }
}

/** 그룹 나가기 - 백엔드 API v1 스펙 */
export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  try {
    await api.post(`/groups/${groupId}/leave`);
  } catch (error) {
    console.error('Failed to leave group:', error);
    throw error;
  }
}

/** 그룹 정보 수정 - 백엔드 API v1 스펙 */
export async function updateGroupInfo(
  groupId: string,
  updates: { name?: string; description?: string; isPrivate?: boolean; coverImage?: string; inviteCode?: string }
): Promise<Group> {
  try {
    const response = await api.put<BackendGroupResponse>(`/groups/${groupId}`, {
      name: updates.name,
      description: updates.description,
      isPrivate: updates.isPrivate,
      profileImageUrl: updates.coverImage,
    });

    if (response.success && response.data) {
      const group = response.data;
      return {
        id: String(group.id),
        name: group.name,
        description: group.description || '',
        memberCount: group.memberCount || 0,
        isPrivate: group.isPrivate || false,
        inviteCode: group.inviteCode,
        coverImage: group.profileImageUrl || group.coverImage,
        createdAt: group.createdAt,
        createdBy: String(group.createdBy || group.ownerId || ''),
        members: group.members || [],
      };
    }

    throw new Error('그룹 수정에 실패했습니다.');
  } catch (error) {
    console.error('Failed to update group:', error);
    throw error;
  }
}

/** 그룹에 포스트(운동 공유) - 백엔드 API v1 스펙 */
export async function shareToGroup(groupId: string, post: Partial<GroupPost>): Promise<GroupPost> {
  try {
    const response = await api.post<BackendGroupResponse>(`/groups/${groupId}/posts`, {
      content: post.content || '',
      workoutId: post.workoutId,
    });

    if (response.success && response.data) {
      const groupPost = response.data;
      return {
        id: String(groupPost.id),
        groupId: String(groupPost.groupId || groupId),
        userId: String(groupPost.userId),
        userName: groupPost.userName || groupPost.user?.username || '',
        userImage: groupPost.userImage || groupPost.user?.profileImageUrl,
        content: groupPost.content || '',
        workoutId: groupPost.workoutId ? String(groupPost.workoutId) : undefined,
        workoutSnapshot: groupPost.workoutSession || groupPost.workout || post.workoutSnapshot,
        likes: groupPost.likes || [],
        comments: groupPost.comments || [],
        createdAt: groupPost.createdAt || new Date().toISOString(),
      };
    }

    throw new Error('그룹 포스트 작성에 실패했습니다.');
  } catch (error) {
    console.error('Failed to share to group:', error);
    throw error;
  }
}

/** 포스트 좋아요 토글 */
export async function togglePostLike(postId: string, userId: string): Promise<void> {
  await api.post(`/groups/posts/${postId}/like`, { userId });
}

/** 포스트 댓글 추가 */
export async function addGroupPostComment(
  postId: string,
  comment: { id: string; userId: string; content: string; createdAt: Date }
): Promise<void> {
  await api.post(`/groups/posts/${postId}/comments`, comment);
}

/** 그룹 공유 카드 목록 */
export async function getSharedCards(groupId: string): Promise<SharedWorkoutCard[]> {
  const data = await api.get<SharedWorkoutCard[] | { data: SharedWorkoutCard[] }>(
    `/groups/${groupId}/shared-cards`
  );
  return unwrapArrayResponse(data);
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
  return unwrapResponse(res) ?? (res as SharedWorkoutCard);
}

/** 공유 카드 완성 */
export async function completeSharedCard(
  cardId: string,
  userId: string,
  workoutId: string,
  imageData?: string
): Promise<void> {
  await api.post(`/shared-cards/${cardId}/complete`, { userId, workoutId, imageData });
}
