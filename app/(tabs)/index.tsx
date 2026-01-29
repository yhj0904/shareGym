import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  View,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { router } from 'expo-router';
import useAuthStore from '@/stores/authStore';
import useFeedStore from '@/stores/feedStore';
import useWorkoutStore from '@/stores/workoutStore';
import FeedCard from '@/components/feed/FeedCard';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();
  const { feedItems, isLoading, isRefreshing, fetchFeed, refreshFeed, loadMore } = useFeedStore();
  const { lastWorkout } = useWorkoutStore();
  const [feedType, setFeedType] = useState<'all' | 'following'>('all');

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleFeedTypeChange = (type: 'all' | 'following') => {
    setFeedType(type);
    if (type === 'following' && user) {
      // TODO: Implement following feed
      fetchFeed();
    } else {
      fetchFeed();
    }
  };

  const renderHeader = () => (
    <>
      {/* 헤더 */}
      <ThemedView style={styles.header}>
        <View>
          <ThemedText type="title">ShareGym</ThemedText>
          <ThemedText type="subtitle">
            {user ? `안녕하세요, ${user.username}님!` : '오늘도 화이팅!'}
          </ThemedText>
        </View>
        <Pressable onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </Pressable>
      </ThemedView>

      {/* 빠른 시작 카드 */}
      {lastWorkout && (
        <Pressable
          style={[styles.quickStartCard, { backgroundColor: colors.tint }]}
          onPress={() => router.push('/(tabs)/workout')}
        >
          <Ionicons name="flash" size={24} color="white" />
          <View style={styles.quickStartContent}>
            <ThemedText style={styles.quickStartTitle}>운동 시작하기</ThemedText>
            <ThemedText style={styles.quickStartSubtitle}>
              최근: {lastWorkout.exercises.length}개 운동
            </ThemedText>
          </View>
          <Ionicons name="chevron-forward" size={24} color="white" />
        </Pressable>
      )}

      {/* 피드 타입 선택 */}
      <View style={styles.feedTypeContainer}>
        <Pressable
          style={[
            styles.feedTypeButton,
            feedType === 'all' && { backgroundColor: colors.tint },
          ]}
          onPress={() => handleFeedTypeChange('all')}
        >
          <ThemedText
            style={[
              styles.feedTypeText,
              feedType === 'all' && { color: 'white' },
            ]}
          >
            전체
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.feedTypeButton,
            feedType === 'following' && { backgroundColor: colors.tint },
          ]}
          onPress={() => handleFeedTypeChange('following')}
        >
          <ThemedText
            style={[
              styles.feedTypeText,
              feedType === 'following' && { color: 'white' },
            ]}
          >
            팔로잉
          </ThemedText>
        </Pressable>
      </View>
    </>
  );

  if (!user) {
    return (
      <ThemedView style={styles.container}>
        {renderHeader()}
        <View style={styles.loginPrompt}>
          <Ionicons name="lock-closed-outline" size={48} color="#ccc" />
          <ThemedText style={styles.loginPromptText}>
            로그인하여 친구들의 운동을 확인하세요
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
      <FlatList
        data={feedItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <FeedCard feedItem={item} currentUserId={user?.id} />}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            {isLoading ? (
              <ActivityIndicator size="large" color={colors.tint} />
            ) : (
              <>
                <Ionicons name="barbell-outline" size={48} color="#ccc" />
                <ThemedText style={styles.emptyText}>
                  아직 운동 기록이 없습니다
                </ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  운동을 시작하고 공유해보세요!
                </ThemedText>
              </>
            )}
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={refreshFeed}
            colors={[colors.tint]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
      />
    </ThemedView>
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
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  quickStartCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    padding: 20,
    borderRadius: 12,
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
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 2,
  },
  feedTypeContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    gap: 10,
    marginBottom: 10,
  },
  feedTypeButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  feedTypeText: {
    fontSize: 14,
    fontWeight: '500',
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
  emptyContainer: {
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
});