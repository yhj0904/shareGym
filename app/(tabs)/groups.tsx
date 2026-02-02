import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useAuthStore from '@/stores/authStore';
import useGroupStore from '@/stores/groupStore';
import { router } from 'expo-router';

export default function GroupsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets(); // Safe area insets 추가
  const { user } = useAuthStore();
  const {
    groups,
    isLoading,
    fetchUserGroups,
    createGroup,
    joinGroupWithCode,
    selectGroup,
    sharedCards,
    getAvailableSharedCards,
    getMySharedCards,
    fetchSharedCards,
    getPendingCollaborativeCards,
    getCompletedCollaborativeCards
  } = useGroupStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserGroups(user.id);
    }
  }, [user]);

  // 그룹이 로드된 후 공유 카드 가져오기
  useEffect(() => {
    if (groups.length > 0) {
      groups.forEach(group => {
        fetchSharedCards(group.id);
      });
    }
  }, [groups]);

  const handleCreateGroup = async () => {
    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    if (!groupName.trim()) {
      Alert.alert('오류', '그룹 이름을 입력해주세요.');
      return;
    }

    setIsCreating(true);
    try {
      const newGroup = await createGroup(
        groupName.trim(),
        groupDescription.trim(),
        true, // 프라이빗 그룹
        user.id
      );

      Alert.alert(
        '그룹 생성 완료',
        `초대 코드: ${newGroup.inviteCode}\n\n이 코드를 친구들과 공유하세요!`,
        [
          {
            text: '확인',
            onPress: () => {
              setShowCreateModal(false);
              setGroupName('');
              setGroupDescription('');
            },
          },
        ]
      );
    } catch (error) {
      Alert.alert('오류', '그룹 생성에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinGroup = async () => {
    if (!user) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    if (!inviteCode.trim()) {
      Alert.alert('오류', '초대 코드를 입력해주세요.');
      return;
    }

    setIsJoining(true);
    try {
      await joinGroupWithCode(inviteCode.trim().toUpperCase(), user.id);
      Alert.alert('성공', '그룹에 참여했습니다!');
      setShowJoinModal(false);
      setInviteCode('');
      // 그룹 목록 새로고침
      fetchUserGroups(user.id);
    } catch (error: any) {
      Alert.alert('오류', error.message || '그룹 참여에 실패했습니다.');
    } finally {
      setIsJoining(false);
    }
  };

  const handleGroupPress = (groupId: string) => {
    selectGroup(groupId);
    router.push(`/group/${groupId}`);
  };

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={[styles.header, {
          paddingTop: insets.top,
          borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee', // 다크모드 대응
        }]}>
          <ThemedText type="title">그룹</ThemedText>
          <ThemedText type="subtitle">함께 운동하는 사람들</ThemedText>
        </ThemedView>
        <View style={styles.loginPrompt}>
          <Ionicons name="lock-closed-outline" size={48} color="#ccc" />
          <ThemedText style={styles.loginPromptText}>
            로그인하여 그룹에 참여하세요
          </ThemedText>
          <Pressable
            style={[styles.loginButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/(auth)/login')}
          >
            <ThemedText style={styles.loginButtonText}>로그인</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, {
        paddingTop: insets.top,
        borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee', // 다크모드 대응
      }]}>
        <ThemedText type="title">그룹</ThemedText>
        <ThemedText type="subtitle">함께 운동하는 사람들</ThemedText>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 액션 버튼들 */}
        <View style={styles.actionButtons}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={() => setShowCreateModal(true)}
          >
            <Ionicons name="add-circle-outline" size={24} color="white" />
            <ThemedText style={styles.actionButtonText}>새 그룹 만들기</ThemedText>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.secondaryButton, {
              borderColor: colors.tint, // 다크모드 대응 (colors.tint 사용)
            }]}
            onPress={() => setShowJoinModal(true)}
          >
            <Ionicons name="enter-outline" size={24} color={colors.tint} />
            <ThemedText style={[styles.actionButtonText, { color: colors.tint }]}>
              초대 코드로 참여
            </ThemedText>
          </Pressable>
        </View>

        {/* 그룹 목록 */}
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
          </View>
        ) : groups.length > 0 ? (
          <View style={styles.groupList}>
            <ThemedText style={styles.sectionTitle}>내 그룹</ThemedText>
            {groups.map((group) => (
              <Pressable
                key={group.id}
                style={[styles.groupCard, {
                  backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white', // 다크모드 대응
                }]}
                onPress={() => handleGroupPress(group.id)}
              >
                <View style={[styles.groupIcon, {
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0', // 다크모드 대응
                }]}>
                  <Ionicons name="people" size={32} color={colors.tint} />
                </View>
                <View style={styles.groupInfo}>
                  <ThemedText style={styles.groupName}>{group.name}</ThemedText>
                  <ThemedText style={styles.groupMembers}>
                    {group.memberCount}명 참여 중
                  </ThemedText>
                </View>
                <View style={styles.groupMeta}>
                  <View style={[styles.inviteCodeBadge, {
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0', // 다크모드 대응
                  }]}>
                    <ThemedText style={styles.inviteCodeText}>
                      {group.inviteCode}
                    </ThemedText>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#ccc" />
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <ThemedView style={styles.emptyState}>
            <Ionicons name="people-outline" size={48} color="#ccc" />
            <ThemedText style={styles.emptyText}>
              아직 참여한 그룹이 없습니다
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              새 그룹을 만들거나 초대를 받아보세요
            </ThemedText>
          </ThemedView>
        )}

        {/* 공유 카드 섹션 */}
        {groups.length > 0 && user && (
          <View style={styles.sharedCardsSection}>
            {/* 내가 공유한 카드 - 운동 완료 후 해당 그룹에 공유한 카드 표시 */}
            <ThemedText style={styles.sectionTitle}>내가 공유한 카드</ThemedText>
            {groups.map(group => {
              const myCards = getMySharedCards(group.id, user.id);
              if (myCards.length === 0) return null;
              return (
                <View key={`my-${group.id}`}>
                  <ThemedText style={styles.groupNameSmall}>{group.name}</ThemedText>
                  {myCards.map(card => (
                    <Pressable
                      key={card.id}
                      style={[styles.sharedCardItem, {
                        backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
                      }]}
                      onPress={() => router.push(`/card/shared-detail?cardId=${card.id}`)}
                    >
                      <View style={styles.sharedCardIcon}>
                        <Ionicons name="grid-outline" size={24} color={colors.tint} />
                      </View>
                      <View style={styles.sharedCardInfo}>
                        <ThemedText style={styles.sharedCardTitle}>
                          {card.splitType === 'horizontal' ? '상하' : '좌우'} 분할 카드
                        </ThemedText>
                        <ThemedText style={styles.sharedCardMeta}>
                          {card.status === 'pending'
                            ? '그룹원이 나머지 절반을 완성할 수 있어요'
                            : '완성됨'}
                        </ThemedText>
                        <ThemedText style={styles.sharedCardExpiry}>
                          만료: {new Date(card.expiresAt).toLocaleString()}
                        </ThemedText>
                      </View>
                      <Ionicons name="chevron-forward" size={20} color="#ccc" />
                    </Pressable>
                  ))}
                </View>
              );
            })}
            {groups.every(group => getMySharedCards(group.id, user?.id || '').length === 0) && (
              <View style={styles.noCardsContainer}>
                <ThemedText style={styles.noCardsText}>
                  아직 공유한 카드가 없습니다
                </ThemedText>
              </View>
            )}

            {/* 협업 카드 섹션 - 대기중인 협업 카드 */}
            <View style={styles.collaborativeSection}>
              <View style={styles.sectionHeader}>
                <ThemedText style={[styles.sectionTitle, { marginTop: 24 }]}>
                  함께 완성하기 🤝
                </ThemedText>
                {groups.reduce((total, group) =>
                  total + getPendingCollaborativeCards(group.id, user?.id || '').length, 0
                ) > 0 && (
                  <View style={[styles.badge, { backgroundColor: colors.tint }]}>
                    <ThemedText style={styles.badgeText}>
                      {groups.reduce((total, group) =>
                        total + getPendingCollaborativeCards(group.id, user?.id || '').length, 0
                      )}
                    </ThemedText>
                  </View>
                )}
              </View>

              {groups.map(group => {
                const pendingCards = getPendingCollaborativeCards(group.id, user?.id || '');

                if (pendingCards.length === 0) return null;

                return (
                  <View key={`collab-${group.id}`}>
                    <ThemedText style={styles.groupNameSmall}>{group.name}</ThemedText>
                    {pendingCards.map(card => {
                      // 남은 시간 계산
                      const timeLeft = new Date(card.expiresAt).getTime() - new Date().getTime();
                      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
                      const minutesLeft = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));

                      return (
                        <Pressable
                          key={card.id}
                          style={[styles.collaborativeCardItem, {
                            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
                            borderColor: colors.tint,
                          }]}
                          onPress={() => {
                            Alert.alert(
                              '협업 카드 참여',
                              '이 카드를 함께 완성하시겠습니까?\n운동을 시작하여 나머지 절반을 채워보세요!',
                              [
                                { text: '취소', style: 'cancel' },
                                {
                                  text: '함께 완성하기',
                                  onPress: () => router.push(`/card/complete-shared?cardId=${card.id}`),
                                },
                              ]
                            );
                          }}
                        >
                          <View style={styles.collaborativeCardHeader}>
                            <View style={[styles.collaborativeBadge, { backgroundColor: colors.tint }]}>
                              <ThemedText style={styles.collaborativeBadgeText}>TOGETHER</ThemedText>
                            </View>
                            <View style={styles.timeLeftContainer}>
                              <Ionicons name="time-outline" size={16} color={timeLeft < 3600000 ? '#ff6b6b' : colors.text} />
                              <ThemedText style={[styles.timeLeftText, { color: timeLeft < 3600000 ? '#ff6b6b' : colors.text }]}>
                                {hoursLeft}시간 {minutesLeft}분 남음
                              </ThemedText>
                            </View>
                          </View>

                          <View style={styles.collaborativeCardContent}>
                            <View style={styles.cardPreview}>
                              {card.splitType === 'horizontal' ? (
                                <>
                                  <View style={[styles.previewHalf, { backgroundColor: colors.tint, opacity: 0.8 }]} />
                                  <View style={[styles.previewHalf, { backgroundColor: '#f0f0f0' }]}>
                                    <ThemedText style={styles.previewText}>?</ThemedText>
                                  </View>
                                </>
                              ) : (
                                <View style={{ flexDirection: 'row', flex: 1 }}>
                                  <View style={[styles.previewHalfVertical, { backgroundColor: colors.tint, opacity: 0.8 }]} />
                                  <View style={[styles.previewHalfVertical, { backgroundColor: '#f0f0f0' }]}>
                                    <ThemedText style={styles.previewText}>?</ThemedText>
                                  </View>
                                </View>
                              )}
                            </View>

                            <View style={styles.collaborativeCardInfo}>
                              <ThemedText style={styles.collaborativeCardTitle}>
                                {card.firstHalf.username || '그룹원'}님과 함께 완성
                              </ThemedText>
                              <ThemedText style={styles.collaborativeCardDescription}>
                                {card.splitType === 'horizontal' ? '상하' : '좌우'} 분할 • {card.splitPosition === 'top' || card.splitPosition === 'left' ? '아래' : '위'} 부분 대기중
                              </ThemedText>

                              <Pressable
                                style={[styles.joinButton, { backgroundColor: colors.tint }]}
                                onPress={() => router.push(`/card/complete-shared?cardId=${card.id}`)}
                              >
                                <Ionicons name="add-circle-outline" size={20} color="white" />
                                <ThemedText style={styles.joinButtonText}>함께 완성하기</ThemedText>
                              </Pressable>
                            </View>
                          </View>
                        </Pressable>
                  ))}
                </View>
              );
            })}

              {groups.every(group => getPendingCollaborativeCards(group.id, user?.id || '').length === 0) && (
                <View style={styles.noCardsContainer}>
                  <ThemedText style={styles.noCardsText}>
                    대기중인 협업 카드가 없습니다
                  </ThemedText>
                </View>
              )}
            </View>

            {/* 완성된 협업 카드 섹션 */}
            {groups.some(group => getCompletedCollaborativeCards(group.id).length > 0) && (
              <View style={styles.completedSection}>
                <ThemedText style={[styles.sectionTitle, { marginTop: 24 }]}>
                  완성된 협업 카드 ✨
                </ThemedText>
                {groups.map(group => {
                  const completedCards = getCompletedCollaborativeCards(group.id);
                  if (completedCards.length === 0) return null;

                  return (
                    <View key={`completed-${group.id}`}>
                      <ThemedText style={styles.groupNameSmall}>{group.name}</ThemedText>
                      {completedCards.slice(0, 3).map(card => (
                        <Pressable
                          key={card.id}
                          style={[styles.completedCardItem, {
                            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
                          }]}
                          onPress={() => router.push(`/card/view?cardId=${card.id}`)}
                        >
                          <View style={styles.completedCardIcon}>
                            <Ionicons name="checkmark-circle" size={24} color="#4caf50" />
                          </View>
                          <View style={styles.completedCardInfo}>
                            <ThemedText style={styles.completedCardTitle}>
                              {card.firstHalf.username || '그룹원'} & {card.secondHalf?.username || '그룹원'}
                            </ThemedText>
                            <ThemedText style={styles.completedCardMeta}>
                              {new Date(card.completedAt || card.createdAt).toLocaleDateString()} 완성
                            </ThemedText>
                          </View>
                          <Ionicons name="chevron-forward" size={20} color="#ccc" />
                        </Pressable>
                      ))}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* 그룹 생성 모달 */}
      <Modal
        visible={showCreateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, {
            backgroundColor: colors.background, // 다크모드 대응
          }]}
        >
          <View style={[styles.modalHeader, {
            borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee', // 다크모드 대응
          }]}>
            <Pressable onPress={() => setShowCreateModal(false)}>
              <ThemedText style={styles.modalCancel}>취소</ThemedText>
            </Pressable>
            <ThemedText style={styles.modalTitle}>새 그룹 만들기</ThemedText>
            <Pressable onPress={handleCreateGroup} disabled={isCreating}>
              <ThemedText style={[styles.modalDone, { color: colors.tint }]}>
                {isCreating ? '생성 중...' : '완료'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>그룹 이름</ThemedText>
              <TextInput
                style={[styles.input, {
                  color: colors.text,
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5', // 다크모드 대응
                }]}
                placeholder="예: 헬스장 친구들"
                placeholderTextColor="#999"
                value={groupName}
                onChangeText={setGroupName}
                maxLength={30}
              />
            </View>

            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>설명 (선택)</ThemedText>
              <TextInput
                style={[styles.input, styles.textArea, {
                  color: colors.text,
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5', // 다크모드 대응
                }]}
                placeholder="그룹 설명을 입력하세요"
                placeholderTextColor="#999"
                value={groupDescription}
                onChangeText={setGroupDescription}
                multiline
                numberOfLines={3}
                maxLength={100}
              />
            </View>

            <View style={[styles.infoBox, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,122,255,0.15)' : '#f0f8ff', // 다크모드 대응
            }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.tint} />
              <ThemedText style={styles.infoText}>
                그룹을 만들면 6자리 초대 코드가 생성됩니다.{'\n'}
                이 코드를 친구들과 공유하여 그룹에 초대하세요.
              </ThemedText>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* 그룹 참여 모달 */}
      <Modal
        visible={showJoinModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.modalContainer, {
            backgroundColor: colors.background, // 다크모드 대응
          }]}
        >
          <View style={[styles.modalHeader, {
            borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee', // 다크모드 대응
          }]}>
            <Pressable onPress={() => setShowJoinModal(false)}>
              <ThemedText style={styles.modalCancel}>취소</ThemedText>
            </Pressable>
            <ThemedText style={styles.modalTitle}>그룹 참여</ThemedText>
            <Pressable onPress={handleJoinGroup} disabled={isJoining}>
              <ThemedText style={[styles.modalDone, { color: colors.tint }]}>
                {isJoining ? '참여 중...' : '참여'}
              </ThemedText>
            </Pressable>
          </View>

          <View style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <ThemedText style={styles.inputLabel}>초대 코드</ThemedText>
              <TextInput
                style={[styles.input, styles.codeInput, {
                  color: colors.text,
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5', // 다크모드 대응
                }]}
                placeholder="6자리 코드 입력"
                placeholderTextColor="#999"
                value={inviteCode}
                onChangeText={setInviteCode}
                autoCapitalize="characters"
                maxLength={6}
              />
            </View>

            <View style={[styles.infoBox, {
              backgroundColor: colorScheme === 'dark' ? 'rgba(0,122,255,0.15)' : '#f0f8ff', // 다크모드 대응
            }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.tint} />
              <ThemedText style={styles.infoText}>
                친구로부터 받은 6자리 초대 코드를 입력하세요.
              </ThemedText>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    // paddingTop은 컴포넌트에서 동적으로 설정
    borderBottomWidth: 1,
    // borderBottomColor는 인라인으로 동적 적용 (다크모드 대응)
  },
  content: {
    flex: 1,
    padding: 20,
  },
  loginPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loginPromptText: {
    marginTop: 20,
    marginBottom: 30,
    fontSize: 16,
    opacity: 0.6,
    textAlign: 'center',
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    // borderColor는 인라인으로 동적 적용 (다크모드 대응)
  },
  actionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 100,
    alignItems: 'center',
  },
  groupList: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  groupCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  groupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 14,
    opacity: 0.6,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  inviteCodeBadge: {
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  inviteCodeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
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
  modalContainer: {
    flex: 1,
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    // borderBottomColor는 인라인으로 동적 적용 (다크모드 대응)
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
  inputGroup: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  codeInput: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 4,
  },
  infoBox: {
    flexDirection: 'row',
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
    padding: 16,
    borderRadius: 8,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.8,
  },
  // 공유 카드 스타일
  sharedCardsSection: {
    padding: 20,
    paddingTop: 0,
  },
  groupNameSmall: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 10,
    marginBottom: 8,
    opacity: 0.7,
  },
  sharedCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  sharedCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sharedCardInfo: {
    flex: 1,
  },
  sharedCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  sharedCardMeta: {
    fontSize: 13,
    opacity: 0.6,
    marginBottom: 2,
  },
  sharedCardExpiry: {
    fontSize: 12,
    opacity: 0.5,
  },
  noCardsContainer: {
    padding: 30,
    alignItems: 'center',
  },
  noCardsText: {
    fontSize: 14,
    opacity: 0.5,
    textAlign: 'center',
  },
  // 협업 카드 스타일
  collaborativeSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  collaborativeCardItem: {
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
  },
  collaborativeCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    paddingBottom: 8,
  },
  collaborativeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  collaborativeBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  timeLeftContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  timeLeftText: {
    fontSize: 12,
    fontWeight: '600',
  },
  collaborativeCardContent: {
    flexDirection: 'row',
    padding: 12,
    paddingTop: 0,
    gap: 16,
  },
  cardPreview: {
    width: 80,
    height: 100,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  previewHalf: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewHalfVertical: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewText: {
    fontSize: 24,
    fontWeight: '700',
    opacity: 0.3,
  },
  collaborativeCardInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  collaborativeCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  collaborativeCardDescription: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 12,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 6,
  },
  joinButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  // 완성된 카드 스타일
  completedSection: {
    marginTop: 20,
    marginBottom: 20,
  },
  completedCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
  },
  completedCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  completedCardInfo: {
    flex: 1,
  },
  completedCardTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  completedCardMeta: {
    fontSize: 12,
    opacity: 0.6,
  },
});