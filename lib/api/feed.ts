/**
 * Feed API - 피드 관련 백엔드 연동
 * - client.api 사용 (fetchApi 제거, 중복 통일)
 */

import { api } from './client';
import type { FeedItem, Comment, FeedFilter, WorkoutSession } from '@/types';

/** 피드 조회 응답 타입 */
export interface FeedResponse {
  items: FeedItem[];
  nextCursor?: string;
  hasMore: boolean;
}

/** 피드 조회 - 백엔드 API v1 스펙 */
export async function getFeed(
  filter: FeedFilter = 'all',
  cursor?: string,
  limit: number = 20
): Promise<FeedResponse> {
  try {
    // 백엔드는 페이지 기반 페이지네이션 사용
    const page = cursor ? parseInt(cursor, 10) : 0;
    const params = new URLSearchParams({
      page: page.toString(),
      size: limit.toString(),
      sort: 'createdAt,desc'
    });

    const response = await api.get<any>(`/feed?${params.toString()}`);

    if (response.success && response.data) {
      const feeds = response.data.content || response.data || [];
      const hasMore = !response.data.last;

      // 백엔드 응답을 프론트엔드 형식으로 변환
      const items = feeds.map((feed: any) => ({
        id: String(feed.id),
        userId: String(feed.userId),
        userName: feed.userName || feed.user?.username || '',
        userImage: feed.userImage || feed.user?.profileImageUrl,
        content: feed.content || '',
        workoutSession: feed.workoutSession,
        cardStyle: feed.cardStyle,
        cardImageUrl: feed.cardImageUrl,
        imageUrls: feed.imageUrls || [],
        likesCount: feed.likesCount || 0,
        commentsCount: feed.commentsCount || 0,
        isLiked: feed.isLiked || false,
        createdAt: feed.createdAt,
        updatedAt: feed.updatedAt,
      }));

      return {
        items,
        nextCursor: hasMore ? String(page + 1) : undefined,
        hasMore,
      };
    }

    return { items: [], hasMore: false };
  } catch (error) {
    console.error('Failed to load feed:', error);
    return { items: [], hasMore: false };
  }
}

/** 피드 작성 (운동 세션 ID 전달) - 백엔드 API v1 스펙 */
export async function createFeedPost(
  workoutSessionId: string,
  content?: string,
  visibility: 'public' | 'followers' | 'group' = 'public',
  groupId?: string
): Promise<FeedItem> {
  try {
    const response = await api.post<any>('/feed', {
      workoutId: workoutSessionId, // 백엔드는 workoutId 사용
      content: content || '',
      visibility: visibility.toUpperCase(), // 백엔드는 대문자 사용
      groupId: groupId ? parseInt(groupId, 10) : undefined,
    });

    if (response.success && response.data) {
      const feed = response.data;
      return {
        id: String(feed.id),
        userId: String(feed.userId),
        userName: feed.userName || feed.user?.username || '',
        userImage: feed.userImage || feed.user?.profileImageUrl,
        content: feed.content || '',
        workoutSession: feed.workoutSession,
        cardStyle: feed.cardStyle,
        cardImageUrl: feed.cardImageUrl,
        imageUrls: feed.imageUrls || [],
        likesCount: feed.likesCount || 0,
        commentsCount: feed.commentsCount || 0,
        isLiked: false,
        createdAt: feed.createdAt,
        updatedAt: feed.updatedAt,
      };
    }

    throw new Error('피드 작성에 실패했습니다.');
  } catch (error) {
    console.error('Failed to create feed post:', error);
    throw error;
  }
}

/** 운동 세션과 함께 피드 작성 - 백엔드에서는 운동을 먼저 저장하고 피드 작성 */
export async function createFeedWithWorkout(
  workoutSession: WorkoutSession,
  content?: string,
  cardStyle?: string,
  cardImageUrl?: string,
  visibility: 'public' | 'followers' | 'group' = 'public'
): Promise<FeedItem> {
  try {
    // 먼저 운동 세션 저장
    const { saveWorkout } = await import('./workout');
    const savedWorkout = await saveWorkout(workoutSession);

    // 피드 작성
    const response = await api.post<any>('/feed', {
      workoutId: savedWorkout.id,
      content: content || '',
      cardStyle: cardStyle,
      cardImageUrl: cardImageUrl,
      visibility: visibility.toUpperCase(),
    });

    if (response.success && response.data) {
      const feed = response.data;
      return {
        id: String(feed.id),
        userId: String(feed.userId),
        userName: feed.userName || feed.user?.username || '',
        userImage: feed.userImage || feed.user?.profileImageUrl,
        content: feed.content || '',
        workoutSession: savedWorkout,
        cardStyle: feed.cardStyle,
        cardImageUrl: feed.cardImageUrl,
        imageUrls: feed.imageUrls || [],
        likesCount: feed.likesCount || 0,
        commentsCount: feed.commentsCount || 0,
        isLiked: false,
        createdAt: feed.createdAt,
        updatedAt: feed.updatedAt,
      };
    }

    throw new Error('피드 작성에 실패했습니다.');
  } catch (error) {
    console.error('Failed to create feed with workout:', error);
    throw error;
  }
}

/** 피드 삭제 */
export async function deleteFeedPost(feedId: string): Promise<void> {
  await api.del(`/feed/${feedId}`);
}

/** 좋아요 토글 - 백엔드 API v1 스펙 */
export async function toggleLike(feedId: string): Promise<{ liked: boolean; likesCount: number }> {
  try {
    // 백엔드는 POST로 좋아요, DELETE로 취소
    // 먼저 좋아요 시도
    const response = await api.post<any>(`/feed/${feedId}/like`);

    if (response.success) {
      // 좋아요 성공
      return { liked: true, likesCount: response.data?.likesCount || 0 };
    }

    // 이미 좋아요한 경우 취소 시도
    await api.del(`/feed/${feedId}/like`);
    return { liked: false, likesCount: Math.max(0, (response.data?.likesCount || 1) - 1) };
  } catch (error: any) {
    // 이미 좋아요한 경우 취소 시도
    if (error.message?.includes('already') || error.message?.includes('duplicate')) {
      await api.del(`/feed/${feedId}/like`);
      return { liked: false, likesCount: 0 };
    }
    throw error;
  }
}

/** 댓글 작성 - 백엔드 API v1 스펙 */
export async function addComment(feedId: string, content: string): Promise<Comment> {
  try {
    const response = await api.post<any>(`/feed/${feedId}/comments`, { content });

    if (response.success && response.data) {
      const comment = response.data;
      return {
        id: String(comment.id),
        userId: String(comment.userId),
        userName: comment.userName || comment.user?.username || '',
        userImage: comment.userImage || comment.user?.profileImageUrl,
        content: comment.content,
        createdAt: comment.createdAt,
      };
    }

    throw new Error('댓글 작성에 실패했습니다.');
  } catch (error) {
    console.error('Failed to add comment:', error);
    throw error;
  }
}

/** 댓글 삭제 - 백엔드 API v1 스펙 */
export async function deleteComment(feedId: string, commentId: string): Promise<void> {
  try {
    await api.del(`/feed/comments/${commentId}`);
  } catch (error) {
    console.error('Failed to delete comment:', error);
    throw error;
  }
}

/** 사용자 피드 조회 */
export async function getUserFeed(
  userId: string,
  cursor?: string,
  limit: number = 20
): Promise<FeedResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.append('cursor', cursor);
  return api.get<FeedResponse>(`/users/${userId}/feed?${params.toString()}`);
}

/** 그룹 피드 조회 */
export async function getGroupFeed(
  groupId: string,
  cursor?: string,
  limit: number = 20
): Promise<FeedResponse> {
  const params = new URLSearchParams({ limit: limit.toString() });
  if (cursor) params.append('cursor', cursor);
  return api.get<FeedResponse>(`/groups/${groupId}/feed?${params.toString()}`);
}
