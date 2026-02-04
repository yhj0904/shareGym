import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Image,
  TextInput,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import { FeedItem } from '@/types';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import { formatDistanceToNow } from '@/utils/time';
import { exerciseDatabase } from '@/data/exercises';
import useAuthStore from '@/stores/authStore';
import useFeedStore from '@/stores/feedStore';

interface FeedCardProps {
  feedItem: FeedItem;
  currentUserId?: string;
}

export default function FeedCard({ feedItem, currentUserId }: FeedCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { toggleLike, addComment, deletePost, deleteComment } = useFeedStore();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');

  const isLiked = feedItem.likes.includes(currentUserId ?? '');

  // 운동 요약 정보 생성
  const getWorkoutSummary = () => {
    if (!feedItem.workoutSnapshot) return null;

    const { exercises, totalDuration } = feedItem.workoutSnapshot;
    const totalSets = exercises.reduce((acc, ex) =>
      acc + ex.sets.filter(s => s.completed).length, 0
    );

    // 운동 이름 리스트 (최대 3개)
    const exerciseNames = exercises
      .slice(0, 3)
      .map(ex => exerciseDatabase.find(e => e.id === ex.exerciseTypeId)?.nameKo ?? '')
      .filter(Boolean)
      .join(', ');

    return {
      exerciseNames,
      exerciseCount: exercises.length,
      totalSets,
      duration: totalDuration,
    };
  };

  const handleLike = async () => {
    if (!currentUserId) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }
    await toggleLike(feedItem.id);
  };

  const handleComment = async () => {
    if (!currentUserId) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }
    if (!commentText.trim()) return;

    await addComment(feedItem.id, commentText);
    setCommentText('');
  };

  const handleDeletePost = () => {
    Alert.alert(
      '게시물 삭제',
      '이 게시물을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await deletePost(feedItem.id);
          },
        },
      ]
    );
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      '댓글 삭제',
      '이 댓글을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await deleteComment(feedItem.id, commentId);
          },
        },
      ]
    );
  };

  const workoutSummary = getWorkoutSummary();
  const timeAgo = formatDistanceToNow(feedItem.createdAt);

  return (
    <ThemedView
      style={[
        styles.container,
        { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white' }
      ]}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <Pressable
          style={styles.userInfo}
          onPress={() => {
            if (feedItem.userId) {
              router.push(`/profile/${feedItem.userId}`);
            }
          }}
        >
          <View style={[styles.avatar, { backgroundColor: colors.tint }]}>
            {feedItem.userProfileImage ? (
              <Image source={{ uri: feedItem.userProfileImage }} style={styles.avatarImage} />
            ) : (
              <ThemedText style={styles.avatarText}>
                {feedItem.username?.[0]?.toUpperCase() ?? 'U'}
              </ThemedText>
            )}
          </View>
          <View style={styles.userDetails}>
            <View style={styles.usernameLine}>
              <ThemedText style={styles.username}>
                {feedItem.username ?? '사용자'}
              </ThemedText>
              {feedItem.userBadges && feedItem.userBadges.length > 0 && (
                <View style={styles.badges}>
                  {feedItem.userBadges.slice(0, 3).map((badge, index) => (
                    <ThemedText key={index} style={styles.badgeIcon}>{badge}</ThemedText>
                  ))}
                </View>
              )}
            </View>
            <ThemedText style={styles.timestamp}>{timeAgo}</ThemedText>
          </View>
        </Pressable>

        {currentUserId === feedItem.userId && (
          <Pressable onPress={handleDeletePost}>
            <Ionicons name="trash-outline" size={20} color="#999" />
          </Pressable>
        )}
      </View>

      {/* 콘텐츠 */}
      {feedItem.content && (
        <ThemedText style={styles.content}>{feedItem.content}</ThemedText>
      )}

      {/* 운동 카드 */}
      {workoutSummary && (
        <View
          style={[
            styles.workoutCard,
            { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' }
          ]}
        >
          <View style={styles.workoutHeader}>
            <Ionicons name="barbell" size={24} color={colors.tint} />
            <ThemedText style={styles.workoutTitle}>운동 기록</ThemedText>
          </View>

          <View style={styles.workoutContent}>
            <ThemedText style={styles.exerciseNames} numberOfLines={2}>
              {workoutSummary.exerciseNames}
            </ThemedText>

            <View style={styles.workoutStats}>
              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {workoutSummary.exerciseCount}
                </ThemedText>
                <ThemedText style={styles.statLabel}>운동</ThemedText>
              </View>

              <View style={styles.statItem}>
                <ThemedText style={styles.statValue}>
                  {workoutSummary.totalSets}
                </ThemedText>
                <ThemedText style={styles.statLabel}>세트</ThemedText>
              </View>

              {workoutSummary.duration > 0 && (
                <View style={styles.statItem}>
                  <ThemedText style={styles.statValue}>
                    {Math.round(workoutSummary.duration / 60)}
                  </ThemedText>
                  <ThemedText style={styles.statLabel}>분</ThemedText>
                </View>
              )}
            </View>
          </View>

          {feedItem.cardImageUrl && (
            <Image
              source={{ uri: feedItem.cardImageUrl }}
              style={styles.cardImage}
              resizeMode="cover"
            />
          )}
        </View>
      )}

      {/* 이미지 */}
      {feedItem.images && feedItem.images.length > 0 && (
        <View style={styles.imageContainer}>
          {feedItem.images.map((image, index) => (
            <Image
              key={index}
              source={{ uri: image }}
              style={styles.feedImage}
              resizeMode="cover"
            />
          ))}
        </View>
      )}

      {/* 액션 버튼 */}
      <View style={styles.actions}>
        <View style={styles.leftActions}>
          <Pressable style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={isLiked ? "heart" : "heart-outline"}
              size={24}
              color={isLiked ? "#ff4444" : colors.text}
            />
            {feedItem.likes.length > 0 && (
              <ThemedText style={styles.actionCount}>
                {feedItem.likes.length}
              </ThemedText>
            )}
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => setShowComments(!showComments)}
          >
            <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
            {feedItem.comments.length > 0 && (
              <ThemedText style={styles.actionCount}>
                {feedItem.comments.length}
              </ThemedText>
            )}
          </Pressable>

          <Pressable style={styles.actionButton}>
            <Ionicons name="share-outline" size={22} color={colors.text} />
          </Pressable>
        </View>

        {feedItem.groupName && (
          <View style={styles.groupTag}>
            <Ionicons name="people" size={14} color={colors.tint} />
            <ThemedText style={styles.groupName}>{feedItem.groupName}</ThemedText>
          </View>
        )}
      </View>

      {/* 댓글 섹션 */}
      {showComments && (
        <View style={styles.commentsSection}>
          {/* 댓글 목록 */}
          {feedItem.comments.map((comment) => (
            <View key={comment.id} style={styles.comment}>
              <View style={styles.commentContent}>
                <ThemedText style={styles.commentUsername}>
                  {comment.username}
                </ThemedText>
                <ThemedText style={styles.commentText}>
                  {comment.content}
                </ThemedText>
              </View>
              {currentUserId === comment.userId && (
                <Pressable onPress={() => handleDeleteComment(comment.id)}>
                  <Ionicons name="close-circle" size={18} color="#999" />
                </Pressable>
              )}
            </View>
          ))}

          {/* 댓글 입력 */}
          {currentUserId && (
            <View style={styles.commentInput}>
              <TextInput
                style={[
                  styles.commentTextInput,
                  {
                    color: colors.text,
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
                  }
                ]}
                placeholder="댓글을 입력하세요..."
                placeholderTextColor="#999"
                value={commentText}
                onChangeText={setCommentText}
                onSubmitEditing={handleComment}
                returnKeyType="send"
                multiline
              />
              <Pressable
                style={[styles.sendButton, { opacity: commentText ? 1 : 0.5 }]}
                onPress={handleComment}
                disabled={!commentText}
              >
                <Ionicons name="send" size={20} color={colors.tint} />
              </Pressable>
            </View>
          )}
        </View>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 15,
    marginVertical: 8,
    borderRadius: 12,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  usernameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    gap: 2,
  },
  badgeIcon: {
    fontSize: 14,
  },
  timestamp: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  content: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 12,
  },
  workoutCard: {
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  workoutTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  workoutContent: {
    gap: 8,
  },
  exerciseNames: {
    fontSize: 14,
    opacity: 0.8,
    lineHeight: 18,
  },
  workoutStats: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.6,
    marginTop: 2,
  },
  cardImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginTop: 10,
  },
  imageContainer: {
    marginBottom: 12,
    gap: 10,
  },
  feedImage: {
    width: '100%',
    height: 250,
    borderRadius: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  leftActions: {
    flexDirection: 'row',
    gap: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionCount: {
    fontSize: 13,
    opacity: 0.7,
  },
  groupTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(74, 144, 226, 0.1)',
  },
  groupName: {
    fontSize: 12,
    fontWeight: '500',
  },
  commentsSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  comment: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentContent: {
    flex: 1,
  },
  commentUsername: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 8,
    gap: 8,
  },
  commentTextInput: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    fontSize: 14,
    maxHeight: 80,
  },
  sendButton: {
    padding: 8,
  },
});