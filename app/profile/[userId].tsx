/**
 * 프로필 상세 화면 - 다른 사용자 프로필 보기
 */

import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useAuthStore from '@/stores/authStore';
import useFeedStore from '@/stores/feedStore';
import FeedCard from '@/components/feed/FeedCard';

export default function ProfileDetailScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();

  const { user: currentUser, fetchUserProfile, followUser, unfollowUser } = useAuthStore();
  const { getUserFeedItems } = useFeedStore();

  const [profileUser, setProfileUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const feedItems = userId ? getUserFeedItems(userId) : [];
  const isFollowing = currentUser?.following?.includes(userId ?? '') ?? false;
  const isMyProfile = currentUser?.id === userId;

  useEffect(() => {
    if (userId) {
      setLoading(true);
      fetchUserProfile(userId)
        .then((user) => setProfileUser(user))
        .finally(() => setLoading(false));
    }
  }, [userId, fetchUserProfile]);

  const handleFollowToggle = async () => {
    if (!currentUser || !userId) return;
    try {
      if (isFollowing) {
        await unfollowUser(userId);
      } else {
        await followUser(userId);
      }
    } catch {
      // 에러 처리
    }
  };

  if (loading || !userId) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.tint} />
      </ThemedView>
    );
  }

  if (!profileUser) {
    return (
      <ThemedView style={[styles.container, styles.centered]}>
        <ThemedText>사용자를 찾을 수 없습니다.</ThemedText>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <ThemedText style={{ color: colors.tint }}>돌아가기</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + 10,
            paddingBottom: 15,
            borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee',
          },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle">프로필</ThemedText>
        <View style={styles.backButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' },
            ]}
          >
            {profileUser.profileImage ? (
              <Image
                source={{ uri: profileUser.profileImage }}
                style={styles.avatarImage}
                resizeMode="cover"
              />
            ) : (
              <ThemedText style={styles.avatarPlaceholder}>
                {profileUser.username?.[0]?.toUpperCase() ?? '?'}
              </ThemedText>
            )}
          </View>

          <ThemedText style={styles.username}>{profileUser.username || '사용자'}</ThemedText>
          {profileUser.bio && (
            <ThemedText style={styles.bio}>{profileUser.bio}</ThemedText>
          )}

          {!isMyProfile && (
            <Pressable
              style={[
                styles.followButton,
                {
                  backgroundColor: isFollowing ? colors.border : colors.tint,
                },
              ]}
              onPress={handleFollowToggle}
            >
              <ThemedText
                style={[
                  styles.followButtonText,
                  { color: isFollowing ? colors.text : 'white' },
                ]}
              >
                {isFollowing ? '팔로잉' : '팔로우'}
              </ThemedText>
            </Pressable>
          )}
        </View>

        <View
          style={[
            styles.statsSection,
            { borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' },
          ]}
        >
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {profileUser.stats?.totalWorkouts ?? 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>총 운동</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {profileUser.stats?.currentStreak ?? 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>연속 일수</ThemedText>
          </View>
          <View style={styles.statItem}>
            <ThemedText style={styles.statNumber}>
              {profileUser.followers?.length ?? 0}
            </ThemedText>
            <ThemedText style={styles.statLabel}>팔로워</ThemedText>
          </View>
        </View>

        <View style={styles.feedSection}>
          <ThemedText style={styles.sectionTitle}>게시물</ThemedText>
          {feedItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="newspaper-outline" size={40} color="#999" />
              <ThemedText style={styles.emptyText}>아직 게시물이 없습니다</ThemedText>
            </View>
          ) : (
            feedItems.map((item) => (
              <FeedCard
                key={item.id}
                feedItem={item}
                currentUserId={currentUser?.id}
              />
            ))
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
    width: 44,
  },
  content: { flex: 1 },
  profileSection: {
    alignItems: 'center',
    padding: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    fontSize: 32,
    fontWeight: '600',
    opacity: 0.6,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  bio: {
    fontSize: 14,
    opacity: 0.8,
    textAlign: 'center',
    marginBottom: 16,
  },
  followButton: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
  },
  followButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    opacity: 0.7,
  },
  feedSection: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    opacity: 0.6,
  },
});
