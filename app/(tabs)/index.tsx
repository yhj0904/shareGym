import React, { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Pressable,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, gradientColors } from '@/constants/Colors';
import { router } from 'expo-router';
import useAuthStore from '@/stores/authStore';
import useWorkoutStore from '@/stores/workoutStore';
import useFeedStore from '@/stores/feedStore';
import useNotificationStore from '@/stores/notificationStore';
import FeedCard from '@/components/feed/FeedCard';
import { FeedFilter, FeedItem } from '@/types';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const { lastWorkout } = useWorkoutStore();
  const {
    feedItems,
    filter,
    loading,
    refreshing,
    fetchFeed,
    setFilter
  } = useFeedStore();
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  // 초기 데이터 로드
  useEffect(() => {
    if (user) {
      fetchFeed(true);
    }
  }, [user]);

  // 필터 옵션
  const filterOptions: { key: FeedFilter; label: string; icon: string }[] = [
    { key: 'all', label: '전체', icon: 'globe' },
    { key: 'following', label: '팔로잉', icon: 'people' },
    { key: 'groups', label: '그룹', icon: 'people-circle' },
  ];

  // 새로고침 핸들러
  const handleRefresh = useCallback(() => {
    fetchFeed(true);
  }, [fetchFeed]);

  // 더 불러오기 핸들러
  const handleLoadMore = useCallback(() => {
    if (!loading) {
      fetchFeed(false);
    }
  }, [fetchFeed, loading]);

  // Feed 아이템 렌더링
  const renderFeedItem = ({ item }: { item: FeedItem }) => {
    return <FeedCard feedItem={item} currentUserId={user?.id} />;
  };

  // Feed 헤더 컴포넌트
  const FeedHeader = () => (
    <>
      {/* 헤더 */}
      <ThemedView style={[styles.header, { borderBottomColor: colorScheme === 'dark' ? '#333' : '#F2F2F4' }]}>
        <View>
          <ThemedText type="title">피드</ThemedText>
          <View style={styles.userGreeting}>
            <ThemedText type="subtitle">
              {user ? `${user.username}님의 피드` : '오늘도 화이팅!'}
            </ThemedText>
            {user?.displayBadges && user.displayBadges.length > 0 && (
              <View style={styles.headerBadges}>
                {user.displayBadges.slice(0, 3).map((badge, index) => (
                  <ThemedText key={index} style={styles.headerBadgeIcon}>
                    {badge}
                  </ThemedText>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.headerActions}>
          {user && (
            <Pressable onPress={() => router.push('/notifications')} style={styles.notificationButton}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
              {unreadCount > 0 && (
                <View style={[styles.notificationBadge, { backgroundColor: '#ff4444' }]}>
                  <ThemedText style={styles.notificationBadgeText}>
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </ThemedText>
                </View>
              )}
            </Pressable>
          )}
        </View>
      </ThemedView>

      {/* 빠른 시작 카드 */}
      {user && lastWorkout && (
        <Pressable
          style={styles.quickStartWrapper}
          onPress={() => router.push('/(tabs)/workout')}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.quickStartCard}
          >
            <Ionicons name="flash" size={24} color="white" />
            <View style={styles.quickStartContent}>
              <ThemedText style={styles.quickStartTitle}>운동 시작하기</ThemedText>
              <ThemedText style={styles.quickStartSubtitle}>
                최근: {lastWorkout.exercises.length}개 운동
              </ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={24} color="white" />
          </LinearGradient>
        </Pressable>
      )}

      {/* 필터 탭 */}
      {user && (
        <View style={[styles.filterTabs, { backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5' }]}>
          {filterOptions.map((option) => (
            <Pressable
              key={option.key}
              style={[
                styles.filterTab,
                filter === option.key && { backgroundColor: colors.tint }
              ]}
              onPress={() => setFilter(option.key)}
            >
              <Ionicons
                name={option.icon as any}
                size={16}
                color={filter === option.key ? 'white' : colors.text}
              />
              <ThemedText
                style={[
                  styles.filterTabText,
                  filter === option.key && { color: 'white' }
                ]}
              >
                {option.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );

  // Empty 상태 컴포넌트
  const EmptyFeed = () => (
    <View style={styles.emptyContainer}>
      <Ionicons
        name="document-text-outline"
        size={64}
        color="#ccc"
      />
      <ThemedText style={styles.emptyText}>
        아직 피드가 없습니다
      </ThemedText>
      <ThemedText style={styles.emptySubtext}>
        운동을 시작하고 기록을 공유해보세요!
      </ThemedText>

      {!user && (
        <Pressable
          style={styles.loginButtonWrapper}
          onPress={() => router.push('/(auth)/login')}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.loginButton}
          >
            <ThemedText style={styles.loginButtonText}>로그인</ThemedText>
          </LinearGradient>
        </Pressable>
      )}
    </View>
  );

  // 로그인하지 않은 경우
  if (!user) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ThemedView style={styles.container}>
          <FeedHeader />
          <View style={styles.loginPrompt}>
            <Ionicons name="lock-closed-outline" size={48} color="#ccc" />
            <ThemedText style={styles.loginPromptText}>
              로그인하여 친구들의 운동을 확인하세요
            </ThemedText>
            <Pressable
              style={styles.loginButtonWrapper}
              onPress={() => router.push('/(auth)/login')}
            >
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                <ThemedText style={styles.loginButtonText}>로그인</ThemedText>
              </LinearGradient>
            </Pressable>
          </View>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <FlatList
        data={feedItems}
        renderItem={renderFeedItem}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={FeedHeader}
        ListEmptyComponent={EmptyFeed}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.tint]}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        contentContainerStyle={feedItems.length === 0 ? styles.emptyListContainer : undefined}
        ListFooterComponent={
          loading && feedItems.length > 0 ? (
            <ActivityIndicator size="small" color={colors.tint} style={styles.loadingFooter} />
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  userGreeting: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerBadges: {
    flexDirection: 'row',
    gap: 2,
  },
  headerBadgeIcon: {
    fontSize: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '700',
  },
  quickStartWrapper: {
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden',
  },
  quickStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 12,
  },
  quickStartContent: {
    flex: 1,
  },
  quickStartTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  quickStartSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 14,
    marginTop: 2,
  },
  filterTabs: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    marginBottom: 24,
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
  loginButtonWrapper: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  loginButton: {
    paddingHorizontal: 32,
    paddingVertical: 12,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingFooter: {
    paddingVertical: 20,
  },
});