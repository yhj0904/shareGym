import { FeedItem, Comment, FeedFilter, WorkoutSession } from '@/types';
import { fetchApi } from './client';

/**
 * Feed API - 피드 관련 API 함수들
 */

// 피드 조회
export const getFeed = async (
  filter: FeedFilter = 'all',
  cursor?: string,
  limit: number = 20
): Promise<{
  items: FeedItem[];
  nextCursor?: string;
  hasMore: boolean;
}> => {
  const params = new URLSearchParams({
    filter,
    limit: limit.toString(),
  });

  if (cursor) {
    params.append('cursor', cursor);
  }

  const response = await fetchApi(`/feed?${params.toString()}`);
  return response;
};

// 피드 작성 (운동 공유)
export const createFeedPost = async (
  workoutSessionId: string,
  content?: string,
  visibility: 'public' | 'followers' | 'group' = 'public',
  groupId?: string
): Promise<FeedItem> => {
  const response = await fetchApi('/feed', {
    method: 'POST',
    body: JSON.stringify({
      workoutSessionId,
      content,
      visibility,
      groupId,
    }),
  });
  return response;
};

// 운동 세션과 함께 피드 작성
export const createFeedWithWorkout = async (
  workoutSession: WorkoutSession,
  content?: string,
  cardStyle?: string,
  cardImageUrl?: string,
  visibility: 'public' | 'followers' | 'group' = 'public'
): Promise<FeedItem> => {
  const response = await fetchApi('/feed/with-workout', {
    method: 'POST',
    body: JSON.stringify({
      workoutSession,
      content,
      cardStyle,
      cardImageUrl,
      visibility,
    }),
  });
  return response;
};

// 피드 삭제
export const deleteFeedPost = async (feedId: string): Promise<void> => {
  await fetchApi(`/feed/${feedId}`, {
    method: 'DELETE',
  });
};

// 좋아요 토글
export const toggleLike = async (feedId: string): Promise<{
  liked: boolean;
  likesCount: number;
}> => {
  const response = await fetchApi(`/feed/${feedId}/like`, {
    method: 'POST',
  });
  return response;
};

// 댓글 작성
export const addComment = async (
  feedId: string,
  content: string
): Promise<Comment> => {
  const response = await fetchApi(`/feed/${feedId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ content }),
  });
  return response;
};

// 댓글 삭제
export const deleteComment = async (
  feedId: string,
  commentId: string
): Promise<void> => {
  await fetchApi(`/feed/${feedId}/comments/${commentId}`, {
    method: 'DELETE',
  });
};

// 사용자 피드 조회
export const getUserFeed = async (
  userId: string,
  cursor?: string,
  limit: number = 20
): Promise<{
  items: FeedItem[];
  nextCursor?: string;
  hasMore: boolean;
}> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });

  if (cursor) {
    params.append('cursor', cursor);
  }

  const response = await fetchApi(`/users/${userId}/feed?${params.toString()}`);
  return response;
};

// 그룹 피드 조회
export const getGroupFeed = async (
  groupId: string,
  cursor?: string,
  limit: number = 20
): Promise<{
  items: FeedItem[];
  nextCursor?: string;
  hasMore: boolean;
}> => {
  const params = new URLSearchParams({
    limit: limit.toString(),
  });

  if (cursor) {
    params.append('cursor', cursor);
  }

  const response = await fetchApi(`/groups/${groupId}/feed?${params.toString()}`);
  return response;
};