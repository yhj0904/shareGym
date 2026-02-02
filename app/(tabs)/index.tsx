import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  FlatList,
  RefreshControl,
  View,
  Pressable,
  ActivityIndicator,
  Platform,
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

  // 메모이제이션된 콜백 함수들
  const handleFeedTypeChange = useCallback((type: 'all' | 'following') => {
    setFeedType(type);
    if (type === 'following' && user) {
      // TODO: Implement following feed
      fetchFeed();
    } else {
      fetchFeed();
    }
  }, [user, fetchFeed]);

  // FlatList 최적화를 위한 keyExtractor
  const keyExtractor = useCallback((item) => item.id, []);

  // FlatList 최적화를 위한 getItemLayout (고정 높이인 경우)
  const getItemLayout = useCallback((data, index) => ({
    length: 450, // 예상되는 아이템 높이
    offset: 450 * index,
    index,
  }), []);

  // renderItem 메모이제이션
  const renderItem = useCallback(({ item }) => (
    <FeedCard feedItem={item} currentUserId={user?.id} />
  ), [user?.id]);

  const renderHeader = useMemo(() => () => (
    <>
      {/* 헤더 */}
      <ThemedView style={[styles.header, {
        borderBottomColor: colorScheme === 'dark' ? '#333' : '#F2F2F4'
      }]}>
        <View>
          <ThemedText type="title">쉐어핏</ThemedText>
          <ThemedText type="subtitle">
            {user ? `안녕하세요, ${user.username}님!` : '오늘도 화이팅!'}
          </ThemedText>
        </View>
        <Pressable onPress={() => router.push('/notifications')}>
          <Ionicons name="notifications-outline" size={24} color={colors.text} />
        </Pressable>
      </ThemedView>

      {/* 빠른 시작 카드 - 그라데이션 적용 */}
      {lastWorkout && (
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

      {/* 피드 타입 선택 */}
      <View style={styles.feedTypeContainer}>
        <Pressable
          style={[
            styles.feedTypeButton,
            { backgroundColor: feedType === 'all' ? colors.tint :
              (colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4') },
          ]}
          onPress={() => handleFeedTypeChange('all')}
        >
          <ThemedText
            style={[
              styles.feedTypeText,
              { color: feedType === 'all' ? 'white' : colors.text },
            ]}
          >
            전체
          </ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.feedTypeButton,
            { backgroundColor: feedType === 'following' ? colors.tint :
              (colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4') },
          ]}
          onPress={() => handleFeedTypeChange('following')}
        >
          <ThemedText
            style={[
              styles.feedTypeText,
              { color: feedType === 'following' ? 'white' : colors.text },
            ]}
          >
            팔로잉
          </ThemedText>
        </Pressable>
      </View>
    </>
  ), [user, lastWorkout, colors, feedType, handleFeedTypeChange, colorScheme]);

  if (!user) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: colors.background }]}
        edges={['top']}
      >
        <ThemedView style={styles.container}>
          {renderHeader()}
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
      <ThemedView style={styles.container}>
        <FlatList
          data={feedItems}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          ListHeaderComponent={renderHeader}
          removeClippedSubviews={true} // 화면 밖의 아이템 언마운트
          maxToRenderPerBatch={5} // 한 번에 렌더링할 아이템 수
          updateCellsBatchingPeriod={50} // 배치 업데이트 주기
          windowSize={10} // 화면 크기의 몇 배를 렌더링할지
          initialNumToRender={5} // 초기 렌더링 아이템 수
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
          // 하단 탭바 공간 확보를 위한 padding 추가
          contentInsetAdjustmentBehavior="automatic"
        />
      </ThemedView>
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
    // borderBottomColor는 동적으로 적용됨
  },
  quickStartWrapper: {
    margin: 15,
    borderRadius: 12,
    overflow: 'hidden', // 그라데이션이 border radius 내에 있도록
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
    // backgroundColor는 동적으로 적용됨
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