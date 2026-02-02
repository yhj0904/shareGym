import React, { useState, memo, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  TextInput,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { FeedItem, WorkoutSession, Comment } from '@/types';
import { formatDuration } from '@/utils/time';
import { exerciseDatabase } from '@/data/exercises';
import useFeedStore from '@/stores/feedStore';
import uuid from 'react-native-uuid';

interface FeedCardProps {
  feedItem: FeedItem;
  currentUserId?: string;
}

// props가 변경될 때만 리렌더링
const FeedCard = ({ feedItem, currentUserId }: FeedCardProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { likePost, unlikePost, addComment } = useFeedStore();

  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const isLiked = currentUserId ? feedItem.likes.includes(currentUserId) : false;

  // 메모이제이션된 이벤트 핸들러들
  const handleLike = useCallback(() => {
    if (!currentUserId) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }

    if (isLiked) {
      unlikePost(feedItem.id, currentUserId);
    } else {
      likePost(feedItem.id, currentUserId);
    }
  }, [currentUserId, isLiked, feedItem.id, likePost, unlikePost]);

  const handleComment = useCallback(async () => {
    if (!currentUserId) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }

    if (!commentText.trim()) {
      return;
    }

    setIsSubmittingComment(true);
    try {
      const newComment: Comment = {
        id: uuid.v4() as string,
        userId: currentUserId,
        text: commentText.trim(),
        createdAt: new Date(),
      };

      await addComment(feedItem.id, newComment);
      setCommentText('');
    } catch (error) {
      Alert.alert('오류', '댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmittingComment(false);
    }
  }, [currentUserId, commentText, feedItem.id, addComment]);

  // 운동 세션인 경우
  if (feedItem.type === 'workout') {
    const workout = feedItem.content as WorkoutSession;

    // 통계 계산
    const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const completedSets = workout.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
      0
    );
    const totalVolume = workout.exercises.reduce((acc, ex) => {
      return acc + ex.sets.reduce((setAcc, set) => {
        if (set.completed && set.weight) {
          return setAcc + (set.weight * set.reps);
        }
        return setAcc;
      }, 0);
    }, 0);

    return (
      <ThemedView style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.userInfo}>
            <View style={styles.avatar}>
              <Ionicons name="person-circle" size={40} color="#ccc" />
            </View>
            <View>
              <ThemedText style={styles.username}>
                {feedItem.user?.username || '사용자'}
              </ThemedText>
              <ThemedText style={styles.time}>
                {new Date(feedItem.createdAt).toLocaleString('ko-KR')}
              </ThemedText>
            </View>
          </View>
          <Pressable>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.text} />
          </Pressable>
        </View>

        {/* 운동 내용 */}
        <View style={styles.content}>
          <View style={styles.workoutStats}>
            <View style={styles.statItem}>
              <Ionicons name="time-outline" size={20} color={colors.tint} />
              <ThemedText style={styles.statValue}>
                {formatDuration(workout.totalDuration)}
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="barbell-outline" size={20} color={colors.tint} />
              <ThemedText style={styles.statValue}>
                {totalVolume.toLocaleString()}kg
              </ThemedText>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.tint} />
              <ThemedText style={styles.statValue}>
                {completedSets}/{totalSets}
              </ThemedText>
            </View>
          </View>

          {/* 운동 목록 */}
          <View style={styles.exerciseList}>
            {workout.exercises.slice(0, 3).map((exercise, index) => {
              const exerciseType = exerciseDatabase.find(e => e.id === exercise.exerciseTypeId);
              return (
                <ThemedText key={index} style={styles.exerciseItem}>
                  • {exerciseType?.nameKo || exercise.exerciseTypeId} ({exercise.sets.length}세트)
                </ThemedText>
              );
            })}
            {workout.exercises.length > 3 && (
              <ThemedText style={styles.moreExercises}>
                +{workout.exercises.length - 3}개 더...
              </ThemedText>
            )}
          </View>

          {workout.notes && (
            <ThemedText style={styles.notes}>{workout.notes}</ThemedText>
          )}
        </View>

        {/* 액션 버튼 */}
        <View style={styles.actions}>
          <Pressable style={styles.actionButton} onPress={handleLike}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={24}
              color={isLiked ? '#ff4444' : colors.text}
            />
            <ThemedText style={styles.actionCount}>{feedItem.likes.length}</ThemedText>
          </Pressable>

          <Pressable
            style={styles.actionButton}
            onPress={() => setShowComments(!showComments)}
          >
            <Ionicons name="chatbubble-outline" size={24} color={colors.text} />
            <ThemedText style={styles.actionCount}>{feedItem.comments.length}</ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </Pressable>
        </View>

        {/* 댓글 섹션 */}
        {showComments && (
          <View style={styles.commentSection}>
            {feedItem.comments.map((comment) => (
              <View key={comment.id} style={styles.comment}>
                <ThemedText style={styles.commentUser}>
                  {comment.user?.username || '사용자'}
                </ThemedText>
                <ThemedText style={styles.commentText}>{comment.text}</ThemedText>
              </View>
            ))}

            {currentUserId && (
              <View style={styles.commentInput}>
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="댓글 작성..."
                  placeholderTextColor="#999"
                  value={commentText}
                  onChangeText={setCommentText}
                  multiline
                />
                <Pressable
                  onPress={handleComment}
                  disabled={isSubmittingComment}
                  style={styles.sendButton}
                >
                  <Ionicons
                    name="send"
                    size={20}
                    color={commentText.trim() ? colors.tint : '#ccc'}
                  />
                </Pressable>
              </View>
            )}
          </View>
        )}
      </ThemedView>
    );
  }

  // 다른 타입의 피드 아이템 처리
  return null;
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  username: {
    fontSize: 16,
    fontWeight: '600',
  },
  time: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 2,
  },
  content: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  workoutStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  exerciseList: {
    marginBottom: 10,
  },
  exerciseItem: {
    fontSize: 14,
    marginVertical: 2,
  },
  moreExercises: {
    fontSize: 14,
    opacity: 0.5,
    fontStyle: 'italic',
    marginTop: 4,
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  actions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 30,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  actionCount: {
    fontSize: 14,
  },
  commentSection: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 15,
  },
  comment: {
    marginBottom: 10,
  },
  commentUser: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 14,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 10,
    gap: 10,
  },
  input: {
    flex: 1,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    maxHeight: 100,
    fontSize: 14,
  },
  sendButton: {
    padding: 5,
  },
});

// props가 같으면 리렌더링하지 않도록 최적화
FeedCard.displayName = 'FeedCard';

export default memo(FeedCard, (prevProps, nextProps) => {
  // feedItem의 주요 속성들만 비교
  return (
    prevProps.feedItem.id === nextProps.feedItem.id &&
    prevProps.feedItem.likes.length === nextProps.feedItem.likes.length &&
    prevProps.feedItem.comments.length === nextProps.feedItem.comments.length &&
    prevProps.currentUserId === nextProps.currentUserId
  );
});