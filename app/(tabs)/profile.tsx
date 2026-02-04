import React, { useMemo, useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Pressable, View, Alert, Animated, FlatList, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { clearApiCache } from '@/lib/api';
import useWorkoutStore from '@/stores/workoutStore';
import useAuthStore from '@/stores/authStore';
import useRoutineStore from '@/stores/routineStore';
import useFeedStore from '@/stores/feedStore';
import useGroupStore from '@/stores/groupStore';
import useNotificationStore from '@/stores/notificationStore';
import useAchievementStore from '@/stores/achievementStore';
import useWorkoutAnalyticsStore from '@/stores/workoutAnalyticsStore';
import { router } from 'expo-router';
import AchievementBadge from '@/components/achievements/AchievementBadge';
import AchievementUnlockModal from '@/components/achievements/AchievementUnlockModal';
import { achievements, achievementCategories } from '@/data/achievements';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets(); // Safe area insets 추가
  const { workoutHistory, lastWorkout } = useWorkoutStore();
  const { user, signOutUser } = useAuthStore();

  // 업적 관련 상태
  const {
    userAchievements,
    totalPoints,
    getUnlockedAchievements,
    getNewAchievements,
    markAchievementAsSeen,
    getAchievementProgress,
    loadAchievements,
  } = useAchievementStore();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [savedCardStyle, setSavedCardStyle] = useState(null); // 저장된 카드 스타일

  // 백엔드 연동 시 업적 로드
  useEffect(() => {
    if (user?.id) {
      loadAchievements(user.id);
    }
  }, [user?.id]);

  // 새로운 업적 확인
  useEffect(() => {
    const newAchievementIds = getNewAchievements();
    if (newAchievementIds.length > 0) {
      const firstNewAchievement = achievements.find(a => a.id === newAchievementIds[0]);
      if (firstNewAchievement) {
        setSelectedAchievement(firstNewAchievement);
        setShowUnlockModal(true);
        markAchievementAsSeen(firstNewAchievement.id);
      }
    }
    // 저장된 카드 스타일 불러오기
    loadSavedCardStyle();
  }, []);

  // 저장된 카드 스타일 불러오기
  const loadSavedCardStyle = async () => {
    try {
      const saved = await AsyncStorage.getItem('cardCustomOptions');
      if (saved) {
        setSavedCardStyle(JSON.parse(saved));
      }
    } catch (error) {
      console.error('카드 스타일 불러오기 실패:', error);
    }
  };

  // 카테고리별 업적 필터링
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === 'all') {
      return achievements;
    }
    return achievements.filter(a => a.category === selectedCategory);
  }, [selectedCategory]);

  // 업적 달성 여부 확인
  const isAchievementUnlocked = (achievementId: string) => {
    const userAchievement = userAchievements.find(ua => ua.achievementId === achievementId);
    const achievement = achievements.find(a => a.id === achievementId);
    return userAchievement && achievement && userAchievement.progress >= achievement.requiredValue;
  };

  const handleLogout = () => {
    Alert.alert(
      '로그아웃',
      '정말 로그아웃하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '로그아웃',
          style: 'destructive',
          onPress: async () => {
            useWorkoutStore.getState().clearUserData();
            useRoutineStore.getState().clearUserData();
            useFeedStore.getState().clearUserData();
            useGroupStore.getState().clearUserData();
            useNotificationStore.getState().clearUserData();
            useAchievementStore.getState().clearUserData();
            useWorkoutAnalyticsStore.getState().clearUserData();
            clearApiCache();
            await signOutUser();
            router.replace('/(auth)/login');
          },
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, {
        paddingTop: insets.top,
        borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee', // 다크모드 대응
      }]}>
        {/* 설정 버튼 */}
        <Pressable
          style={[styles.settingsButton, { top: insets.top + 10 }]}
          onPress={() => router.push('/settings')}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </Pressable>

        <View style={styles.profileSection}>
          <View style={[styles.avatar, {
            backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5', // 다크모드 대응
          }]}>
            {user?.profileImage ? (
              <Image
                source={{ uri: user.profileImage }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.avatarLogo}
                resizeMode="contain"
              />
            )}
          </View>

          {/* 닉네임과 뱃지 */}
          <View style={styles.nameContainer}>
            <ThemedText type="title">{user?.username || '사용자'}</ThemedText>
            {user?.displayBadges && user.displayBadges.length > 0 && (
              <View style={styles.displayBadges}>
                {user.displayBadges.map((badge, index) => (
                  <ThemedText key={index} style={styles.displayBadgeIcon}>
                    {badge}
                  </ThemedText>
                ))}
              </View>
            )}
          </View>

          {/* 소개글 */}
          {user?.bio && (
            <ThemedText style={styles.bio}>{user.bio}</ThemedText>
          )}

          <ThemedText style={styles.username}>@{user?.username || 'user'}</ThemedText>
        </View>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 통계 섹션 */}
        <ThemedView style={[styles.statsSection, {
          borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee', // 다크모드 대응
        }]}>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {user?.stats?.totalWorkouts || workoutHistory.length}
            </ThemedText>
            <ThemedText style={styles.statLabel}>총 운동</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {user?.stats?.currentStreak || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>연속 일수</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {user?.followers?.length || 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>팔로워</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* 운동 카드 섹션 */}
        <ThemedView style={[styles.cardSection, {
          borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee', // 다크모드 대응
        }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>운동 카드</ThemedText>
            <Pressable
              onPress={() => {
                // lastWorkout이 있으면 카드 생성 화면으로, 없으면 안내
                if (lastWorkout) {
                  router.push('/card/create');
                } else {
                  Alert.alert('알림', '먼저 운동을 기록해주세요.');
                }
              }}
            >
              <ThemedText style={[styles.editText, { color: colors.tint }]}>
                카드 디자인
              </ThemedText>
            </Pressable>
          </View>

          {/* 카드 프리뷰 영역 */}
          <View style={styles.cardPreviewContainer}>
            {lastWorkout ? (
              <Pressable
                style={styles.cardPreview}
                onPress={() => router.push('/card/create')}
              >
                <LinearGradient
                  colors={savedCardStyle?.gradientColors || ['#667eea', '#764ba2']}
                  style={styles.cardGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.cardContent}>
                    <Ionicons name="image-outline" size={32} color="white" />
                    <ThemedText style={styles.cardPreviewText}>
                      카드 만들기
                    </ThemedText>
                    <ThemedText style={styles.cardPreviewSubtext}>
                      나만의 스타일로 운동 카드를 만들어보세요
                    </ThemedText>
                  </View>
                </LinearGradient>
              </Pressable>
            ) : (
              <View style={[styles.cardEmptyState, {
                backgroundColor: colors.card,
                borderColor: colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)', // 다크모드 대응
              }]}>
                <Ionicons name="barbell-outline" size={48} color={colors.text + '40'} />
                <ThemedText style={styles.emptyStateText}>
                  아직 운동 기록이 없어요
                </ThemedText>
                <ThemedText style={styles.emptyStateSubtext}>
                  운동을 시작하고 카드를 만들어보세요
                </ThemedText>
              </View>
            )}
          </View>

          {/* 빠른 액션 버튼들 */}
          <View style={styles.cardActions}>
            <Pressable
              style={[styles.cardActionButton, { backgroundColor: colors.tint }]}
              onPress={() => {
                if (lastWorkout) {
                  router.push('/card/create');
                } else {
                  Alert.alert('알림', '먼저 운동을 기록해주세요.');
                }
              }}
            >
              <Ionicons name="brush-outline" size={20} color="white" />
              <ThemedText style={styles.cardActionText}>
                카드 커스터마이징
              </ThemedText>
            </Pressable>

            <Pressable
              style={[styles.cardActionButton, { backgroundColor: colors.card }]}
              onPress={() => {
                // 카드 갤러리 화면으로 이동 (미래 구현)
                router.push('/card/gallery');
              }}
            >
              <Ionicons name="images-outline" size={20} color={colors.text} />
              <ThemedText style={[styles.cardActionText, { color: colors.text }]}>
                카드 갤러리
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>

        {/* 업적 섹션 */}
        <ThemedView style={[styles.achievementSection, {
          borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee', // 다크모드 대응
        }]}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>업적</ThemedText>
            <View style={styles.pointsContainer}>
              <ThemedText style={[styles.pointsText, { color: colors.tint }]}>
                {totalPoints} 포인트
              </ThemedText>
            </View>
          </View>

          {/* 카테고리 필터 */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryFilter}
          >
            <Pressable
              style={[
                styles.categoryChip,
                {
                  backgroundColor: selectedCategory === 'all'
                    ? colors.tint
                    : (colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0') // 다크모드 대응
                }
              ]}
              onPress={() => setSelectedCategory('all')}
            >
              <ThemedText
                style={[
                  styles.categoryText,
                  selectedCategory === 'all' && { color: 'white' }
                ]}
              >
                전체
              </ThemedText>
            </Pressable>
            {achievementCategories.map(category => (
              <Pressable
                key={category.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor: selectedCategory === category.id
                      ? colors.tint
                      : (colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0') // 다크모드 대응
                  }
                ]}
                onPress={() => setSelectedCategory(category.id)}
              >
                <ThemedText
                  style={[
                    styles.categoryText,
                    selectedCategory === category.id && { color: 'white' }
                  ]}
                >
                  {category.icon} {category.name}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>

          {/* 업적 그리드 */}
          <View style={styles.achievementGrid}>
            {filteredAchievements.slice(0, 12).map(achievement => (
              <AchievementBadge
                key={achievement.id}
                achievement={achievement}
                isUnlocked={isAchievementUnlocked(achievement.id)}
                progress={getAchievementProgress(achievement.id)}
                isNew={userAchievements.find(ua => ua.achievementId === achievement.id)?.isNew}
                size="small"
                onPress={() => {
                  setSelectedAchievement(achievement);
                  // 업적 상세 모달 표시 가능
                }}
              />
            ))}
          </View>

          {filteredAchievements.length > 12 && (
            <Pressable
              style={styles.viewAllButton}
              onPress={() => router.push('/achievements')}
            >
              <ThemedText style={[styles.viewAllText, { color: colors.tint }]}>
                모든 업적 보기 ({filteredAchievements.length}개)
              </ThemedText>
            </Pressable>
          )}
        </ThemedView>

        {/* 메뉴 섹션 */}
        <ThemedView style={styles.menuSection}>
          <Pressable
            style={styles.menuItem}
            onPress={() => {
              if (lastWorkout) {
                router.push('/card/create');
              } else {
                Alert.alert('알림', '먼저 운동을 기록해주세요.');
              }
            }}
          >
            <Ionicons name="color-palette-outline" size={24} color={colors.text} />
            <ThemedText style={styles.menuText}>운동 카드 디자인</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>


          <Pressable style={styles.menuItem}>
            <Ionicons name="bookmark-outline" size={24} color={colors.text} />
            <ThemedText style={styles.menuText}>저장된 루틴</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            <ThemedText style={styles.menuText}>도움말</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>
        </ThemedView>

        <Pressable
          style={[styles.logoutButton, { borderColor: colors.border }]}
          onPress={handleLogout}
        >
          <ThemedText style={[styles.logoutText, { color: '#ff4444' }]}>
            로그아웃
          </ThemedText>
        </Pressable>
      </ScrollView>

      {/* 업적 획득 모달 */}
      <AchievementUnlockModal
        visible={showUnlockModal}
        achievement={selectedAchievement}
        onClose={() => {
          setShowUnlockModal(false);
          setSelectedAchievement(null);
        }}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    // paddingTop은 컴포넌트에서 동적으로 설정
    paddingBottom: 30,
    borderBottomWidth: 1,
    // borderBottomColor는 인라인으로 동적 적용 (다크모드 대응)
    position: 'relative',
  },
  settingsButton: {
    position: 'absolute',
    right: 20,
    padding: 10,
    zIndex: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 20,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  avatarLogo: {
    width: 70,
    height: 70,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  displayBadges: {
    flexDirection: 'row',
    gap: 4,
  },
  displayBadgeIcon: {
    fontSize: 22,
  },
  bio: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  username: {
    marginTop: 5,
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    // borderBottomColor는 인라인으로 동적 적용 (다크모드 대응)
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 5,
    fontSize: 14,
    opacity: 0.6,
  },
  menuSection: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
  achievementSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    // borderBottomColor는 인라인으로 동적 적용 (다크모드 대응)
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  pointsContainer: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  pointsText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoryFilter: {
    marginBottom: 15,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    // backgroundColor는 인라인으로 동적 적용 (다크모드 대응)
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  achievementGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    marginTop: 10,
  },
  viewAllButton: {
    marginTop: 15,
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // 운동 카드 섹션 스타일
  cardSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    // borderBottomColor는 인라인으로 동적 적용 (다크모드 대응)
  },
  editText: {
    fontSize: 14,
    fontWeight: '600',
  },
  cardPreviewContainer: {
    marginTop: 15,
  },
  cardPreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    alignItems: 'center',
    padding: 20,
  },
  cardPreviewText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
  },
  cardPreviewSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 13,
    marginTop: 6,
    textAlign: 'center',
  },
  cardEmptyState: {
    height: 200,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
    // borderColor는 인라인으로 동적 적용 (다크모드 대응)
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 12,
    opacity: 0.6,
  },
  emptyStateSubtext: {
    fontSize: 13,
    marginTop: 6,
    opacity: 0.4,
  },
  cardActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 15,
  },
  cardActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  cardActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
});