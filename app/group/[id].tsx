import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  FlatList,
  RefreshControl,
  Alert,
  Share,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { useLocalSearchParams, router } from 'expo-router';
import useAuthStore from '@/stores/authStore';
import useGroupStore from '@/stores/groupStore';
import useWorkoutStore from '@/stores/workoutStore';
import useLiveWorkoutStore from '@/stores/liveWorkoutStore';
import { formatDuration } from '@/utils/time';
import { exerciseDatabase } from '@/data/exercises';
import LiveWorkoutCard from '@/components/LiveWorkoutCard';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const {
    currentGroup,
    groupPosts,
    getGroupPosts,
    fetchGroupPosts,
    shareToGroup,
    likeGroupPost,
    commentOnGroupPost,
    refreshInviteCode,
    leaveGroup,
  } = useGroupStore();

  const postsForGroup = id ? getGroupPosts(id) : [];
  const { lastWorkout } = useWorkoutStore();
  const {
    liveWorkouts,
    startListeningToLiveWorkouts,
    stopListeningToLiveWorkouts,
    getFriendsWorkingOut,
  } = useLiveWorkoutStore();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGroupPosts(id);
      // 그룹의 실시간 운동 상태 리스닝 시작
      startListeningToLiveWorkouts(id);
    }

    return () => {
      // 리스닝 중지
      stopListeningToLiveWorkouts();
    };
  }, [id]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchGroupPosts(id);
    setIsRefreshing(false);
  };

  const handleShareWorkout = async () => {
    if (!user || !lastWorkout) {
      Alert.alert('알림', '공유할 운동 기록이 없습니다.');
      return;
    }

    try {
      await shareToGroup(id, {
        groupId: id,
        userId: user.id,
        workoutId: lastWorkout.id,
        workoutSnapshot: lastWorkout,
        content: shareContent.trim() || '오늘의 운동 완료! 💪',
        likes: [],
        comments: [],
      });

      Alert.alert('성공', '운동 기록이 공유되었습니다!');
      setShowShareModal(false);
      setShareContent('');
      handleRefresh();
    } catch (error) {
      Alert.alert('오류', '공유에 실패했습니다.');
    }
  };

  const handleLike = async (postId: string) => {
    if (!user) return;
    await likeGroupPost(postId, user.id);
  };

  const handleComment = async (postId: string, text: string) => {
    if (!user || !text.trim()) return;

    await commentOnGroupPost(postId, {
      id: Date.now().toString(),
      userId: user.id,
      username: user.username,
      text: text.trim(),
      createdAt: new Date(),
    });
  };

  const handleShareInviteCode = async () => {
    if (!currentGroup) return;

    await Share.share({
      message: `쉐어핏 그룹 초대\n\n"${currentGroup.name}" 그룹에 초대합니다!\n\n초대 코드: ${currentGroup.inviteCode}\n\n앱에서 초대 코드를 입력하여 참여하세요!`,
    });
  };

  const handleRefreshCode = async () => {
    if (!currentGroup?.id || !user) return;

    // 관리자만 코드 새로고침 가능
    if (!currentGroup.admins.includes(user.id)) {
      Alert.alert('권한 없음', '관리자만 초대 코드를 변경할 수 있습니다.');
      return;
    }

    Alert.alert(
      '초대 코드 새로고침',
      '새로운 초대 코드를 생성하시겠습니까?\n기존 코드는 사용할 수 없게 됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '새로고침',
          onPress: async () => {
            try {
              const newCode = await refreshInviteCode(currentGroup.id);
              Alert.alert('완료', `새 초대 코드: ${newCode}`);
            } catch (error) {
              Alert.alert('오류', '초대 코드 새로고침에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleLeaveGroup = () => {
    if (!currentGroup || !user) return;

    if (currentGroup.createdBy === user.id) {
      Alert.alert('알림', '그룹 생성자는 그룹을 나갈 수 없습니다.');
      return;
    }

    Alert.alert(
      '그룹 나가기',
      '정말로 이 그룹을 나가시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '나가기',
          style: 'destructive',
          onPress: async () => {
            try {
              await leaveGroup(currentGroup.id, user.id);
              router.back();
            } catch (error) {
              Alert.alert('오류', '그룹 나가기에 실패했습니다.');
            }
          },
        },
      ]
    );
  };

  if (!currentGroup) {
    return (
      <ThemedView style={styles.container}>
        <ThemedText>그룹을 찾을 수 없습니다.</ThemedText>
      </ThemedView>
    );
  }

  const renderPost = ({ item }: { item: any }) => {
    const isLiked = user ? item.likes.includes(user.id) : false;

    return (
      <ThemedView style={styles.postCard}>
        <View style={styles.postHeader}>
          <View style={styles.userInfo}>
            <Ionicons name="person-circle" size={36} color="#ccc" />
            <View>
              <ThemedText style={styles.username}>{item.userId}</ThemedText>
              <ThemedText style={styles.postTime}>
                {new Date(item.createdAt).toLocaleString('ko-KR')}
              </ThemedText>
            </View>
          </View>
        </View>

        <ThemedText style={styles.postContent}>{item.content}</ThemedText>

        {item.workoutId && lastWorkout && (
          <View style={styles.workoutInfo}>
            <View style={styles.workoutStat}>
              <Ionicons name="time-outline" size={16} color={colors.tint} />
              <ThemedText style={styles.statText}>
                {formatDuration(lastWorkout.totalDuration)}
              </ThemedText>
            </View>
            <View style={styles.workoutStat}>
              <Ionicons name="barbell-outline" size={16} color={colors.tint} />
              <ThemedText style={styles.statText}>
                {lastWorkout.exercises.length}개 운동
              </ThemedText>
            </View>
          </View>
        )}

        <View style={styles.postActions}>
          <Pressable style={styles.actionButton} onPress={() => handleLike(item.id)}>
            <Ionicons
              name={isLiked ? 'heart' : 'heart-outline'}
              size={20}
              color={isLiked ? '#ff4444' : colors.text}
            />
            <ThemedText style={styles.actionText}>{item.likes.length}</ThemedText>
          </Pressable>

          <Pressable style={styles.actionButton}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.text} />
            <ThemedText style={styles.actionText}>{item.comments.length}</ThemedText>
          </Pressable>
        </View>

        {item.comments.length > 0 && (
          <View style={styles.comments}>
            {item.comments.slice(-2).map((comment: any) => (
              <View key={comment.id} style={styles.comment}>
                <ThemedText style={styles.commentUser}>{comment.username}</ThemedText>
                <ThemedText style={styles.commentText}>{comment.text}</ThemedText>
              </View>
            ))}
          </View>
        )}
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <View style={styles.headerTitle}>
          <ThemedText style={styles.groupName}>{currentGroup.name}</ThemedText>
          <ThemedText style={styles.memberCount}>
            {currentGroup.memberCount}명 참여 중
          </ThemedText>
        </View>
        <Pressable onPress={() => setShowInviteModal(true)}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </Pressable>
      </View>

      <FlatList
        data={postsForGroup}
        keyExtractor={(item) => item.id}
        renderItem={renderPost}
        ListHeaderComponent={
          getFriendsWorkingOut().length > 0 ? (
            <View style={styles.liveWorkoutSection}>
              <View style={styles.sectionHeader}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <ThemedText style={styles.liveTitle}>운동 중인 멤버</ThemedText>
                </View>
                <ThemedText style={styles.liveCount}>
                  {getFriendsWorkingOut().length}명
                </ThemedText>
              </View>
              {getFriendsWorkingOut().map((workout) => (
                <LiveWorkoutCard
                  key={workout.userId}
                  workout={workout}
                  onPress={() => {
                    // 운동 상세 보기 또는 프로필로 이동
                  }}
                />
              ))}
            </View>
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={48} color="#ccc" />
            <ThemedText style={styles.emptyText}>
              아직 공유된 운동이 없습니다
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              첫 번째로 운동을 공유해보세요!
            </ThemedText>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[colors.tint]}
          />
        }
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />

      {/* 운동 공유 버튼 */}
      {lastWorkout && (
        <Pressable
          style={[styles.shareButton, { backgroundColor: colors.tint }]}
          onPress={() => setShowShareModal(true)}
        >
          <Ionicons name="add-circle" size={24} color="white" />
          <ThemedText style={styles.shareButtonText}>오늘의 운동 공유</ThemedText>
        </Pressable>
      )}

      {/* 운동 공유 모달 */}
      <Modal
        visible={showShareModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowShareModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}
        >
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowShareModal(false)}>
              <ThemedText style={styles.modalCancel}>취소</ThemedText>
            </Pressable>
            <ThemedText style={styles.modalTitle}>운동 공유</ThemedText>
            <Pressable onPress={handleShareWorkout}>
              <ThemedText style={[styles.modalDone, { color: colors.tint }]}>
                공유
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <TextInput
              style={[styles.shareInput, { color: colors.text }]}
              placeholder="오늘의 운동 소감을 남겨보세요..."
              placeholderTextColor="#999"
              value={shareContent}
              onChangeText={setShareContent}
              multiline
              numberOfLines={4}
            />

            {lastWorkout && (
              <View style={styles.workoutPreview}>
                <ThemedText style={styles.previewTitle}>운동 요약</ThemedText>
                <View style={styles.previewStats}>
                  <View style={styles.previewStat}>
                    <Ionicons name="time-outline" size={20} color={colors.tint} />
                    <ThemedText>{formatDuration(lastWorkout.totalDuration)}</ThemedText>
                  </View>
                  <View style={styles.previewStat}>
                    <Ionicons name="barbell-outline" size={20} color={colors.tint} />
                    <ThemedText>{lastWorkout.exercises.length}개 운동</ThemedText>
                  </View>
                </View>
                <View style={styles.exerciseList}>
                  {lastWorkout.exercises.map((exercise, index) => {
                    const exerciseType = exerciseDatabase.find(
                      (e) => e.id === exercise.exerciseTypeId
                    );
                    return (
                      <ThemedText key={index} style={styles.exerciseItem}>
                        • {exerciseType?.nameKo || exercise.exerciseTypeId}
                      </ThemedText>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 그룹 설정 모달 */}
      <Modal
        visible={showInviteModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setShowInviteModal(false)}>
              <ThemedText style={styles.modalCancel}>닫기</ThemedText>
            </Pressable>
            <ThemedText style={styles.modalTitle}>그룹 설정</ThemedText>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inviteSection}>
              <ThemedText style={styles.sectionTitle}>초대 코드</ThemedText>
              <View style={styles.inviteCodeBox}>
                <ThemedText style={styles.inviteCode}>
                  {currentGroup.inviteCode}
                </ThemedText>
                <View style={styles.inviteActions}>
                  <Pressable
                    style={[styles.inviteButton, { backgroundColor: colors.tint }]}
                    onPress={handleShareInviteCode}
                  >
                    <Ionicons name="share-outline" size={20} color="white" />
                    <ThemedText style={styles.inviteButtonText}>공유</ThemedText>
                  </Pressable>
                  {user && currentGroup.admins.includes(user.id) && (
                    <Pressable
                      style={[styles.inviteButton, styles.refreshButton]}
                      onPress={handleRefreshCode}
                    >
                      <Ionicons name="refresh" size={20} color={colors.tint} />
                      <ThemedText style={[styles.inviteButtonText, { color: colors.tint }]}>
                        새로고침
                      </ThemedText>
                    </Pressable>
                  )}
                </View>
              </View>
            </View>

            <View style={styles.memberSection}>
              <ThemedText style={styles.sectionTitle}>
                멤버 ({currentGroup.memberCount})
              </ThemedText>
              <View style={styles.memberList}>
                {currentGroup.members.map((memberId, index) => {
                  const isAdmin = currentGroup.admins.includes(memberId);
                  const isCreator = currentGroup.createdBy === memberId;
                  const isCurrentUser = user?.id === memberId;

                  // Mock 유저 이름 매핑
                  const getMemberName = (id: string) => {
                    const nameMap: { [key: string]: string } = {
                      'test-user': '김철수',
                      'user2': '이영희',
                      'user3': '박민수',
                      'user4': '최지원',
                      'test@test.com': '홍길동',
                      'test2@test.com': '김영희',
                    };
                    return nameMap[id] || `사용자${index + 1}`;
                  };

                  return (
                    <View key={memberId} style={styles.memberItem}>
                      <View style={styles.memberInfo}>
                        <Ionicons name="person-circle" size={36} color="#ccc" />
                        <View style={styles.memberDetails}>
                          <View style={styles.memberNameRow}>
                            <ThemedText style={styles.memberName}>
                              {isCurrentUser ? `${getMemberName(memberId)} (나)` : getMemberName(memberId)}
                            </ThemedText>
                            {isCreator && (
                              <View style={styles.badge}>
                                <ThemedText style={styles.badgeText}>그룹장</ThemedText>
                              </View>
                            )}
                            {!isCreator && isAdmin && (
                              <View style={[styles.badge, styles.adminBadge]}>
                                <ThemedText style={styles.badgeText}>관리자</ThemedText>
                              </View>
                            )}
                          </View>
                          <ThemedText style={styles.memberId}>
                            운동 레벨: 중급
                          </ThemedText>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>

            <Pressable
              style={styles.leaveButton}
              onPress={handleLeaveGroup}
            >
              <ThemedText style={styles.leaveButtonText}>그룹 나가기</ThemedText>
            </Pressable>
          </ScrollView>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    flex: 1,
    marginLeft: 16,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
  },
  memberCount: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  postCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  username: {
    fontSize: 15,
    fontWeight: '600',
  },
  postTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  postContent: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  workoutInfo: {
    flexDirection: 'row',
    gap: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 12,
  },
  workoutStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 14,
    fontWeight: '500',
  },
  postActions: {
    flexDirection: 'row',
    gap: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionText: {
    fontSize: 14,
  },
  comments: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  comment: {
    marginBottom: 8,
  },
  commentUser: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  commentText: {
    fontSize: 13,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 100,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    opacity: 0.6,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.4,
  },
  shareButton: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalCancel: {
    fontSize: 16,
    color: '#666',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    padding: 20,
  },
  shareInput: {
    backgroundColor: '#f5f5f5',
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    minHeight: 120,
    textAlignVertical: 'top',
  },
  workoutPreview: {
    marginTop: 20,
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  previewStats: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 12,
  },
  previewStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  exerciseList: {
    marginTop: 8,
  },
  exerciseItem: {
    fontSize: 14,
    marginVertical: 2,
  },
  inviteSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  inviteCodeBox: {
    backgroundColor: '#f5f5f5',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  inviteCode: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
    marginBottom: 16,
  },
  inviteActions: {
    flexDirection: 'row',
    gap: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  refreshButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  memberSection: {
    marginBottom: 32,
  },
  memberList: {
    marginTop: 12,
  },
  memberItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  memberDetails: {
    flex: 1,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '500',
  },
  memberId: {
    fontSize: 13,
    opacity: 0.6,
    marginTop: 2,
  },
  badge: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminBadge: {
    backgroundColor: '#34C759',
  },
  badgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  leaveButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  leaveButtonText: {
    color: '#ff4444',
    fontSize: 16,
    fontWeight: '600',
  },
  liveWorkoutSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  liveTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  liveCount: {
    fontSize: 14,
    opacity: 0.6,
  },
});