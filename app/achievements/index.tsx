/**
 * 업적 전체 보기 화면
 * 모든 업적을 카테고리별로 확인하고 진행 상황을 볼 수 있는 화면
 */

import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  SectionList,
  SafeAreaView,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import useAchievementStore from '@/stores/achievementStore';
import AchievementBadge from '@/components/achievements/AchievementBadge';
import AchievementUnlockModal from '@/components/achievements/AchievementUnlockModal';
import { achievements, achievementCategories, Achievement } from '@/data/achievements';
import { LinearGradient } from 'expo-linear-gradient';

export default function AchievementsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const {
    userAchievements,
    totalPoints,
    getUnlockedAchievements,
    getAchievementProgress,
    markAchievementAsSeen,
  } = useAchievementStore();

  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 업적 달성 여부 확인
  const isAchievementUnlocked = (achievementId: string) => {
    const userAchievement = userAchievements.find(ua => ua.achievementId === achievementId);
    const achievement = achievements.find(a => a.id === achievementId);
    return userAchievement && achievement && userAchievement.progress >= achievement.requiredValue;
  };

  // 카테고리별 업적 그룹화
  const groupedAchievements = useMemo(() => {
    const filtered = selectedCategory === 'all'
      ? achievements
      : achievements.filter(a => a.category === selectedCategory);

    // 카테고리별로 그룹화
    const groups = achievementCategories.map(category => ({
      title: category.name,
      icon: category.icon,
      color: category.color,
      data: filtered.filter(a => a.category === category.id),
    })).filter(group => group.data.length > 0);

    return groups;
  }, [selectedCategory]);

  // 전체 통계
  const stats = useMemo(() => {
    const unlocked = getUnlockedAchievements();
    const total = achievements.length;
    const percentage = Math.round((unlocked.length / total) * 100);

    // 카테고리별 통계
    const categoryStats = achievementCategories.map(cat => {
      const catAchievements = achievements.filter(a => a.category === cat.id);
      const unlockedCount = catAchievements.filter(a =>
        isAchievementUnlocked(a.id)
      ).length;
      return {
        ...cat,
        unlocked: unlockedCount,
        total: catAchievements.length,
      };
    });

    return {
      unlocked: unlocked.length,
      total,
      percentage,
      categoryStats,
    };
  }, [userAchievements]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText style={styles.headerTitle}>업적</ThemedText>
        <View style={styles.headerRight} />
      </View>

      {/* 전체 진행률 */}
      <LinearGradient
        colors={[colors.tint + '20', colors.tint + '10']}
        style={styles.progressSection}
      >
        <View style={styles.progressHeader}>
          <ThemedText style={styles.progressTitle}>전체 진행률</ThemedText>
          <View style={[styles.pointsBadge, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.pointsText}>{totalPoints} 포인트</ThemedText>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${stats.percentage}%`,
                backgroundColor: colors.tint,
              },
            ]}
          />
        </View>

        <View style={styles.progressStats}>
          <ThemedText style={styles.progressText}>
            {stats.unlocked}/{stats.total} 업적 달성
          </ThemedText>
          <ThemedText style={[styles.progressPercentage, { color: colors.tint }]}>
            {stats.percentage}%
          </ThemedText>
        </View>

        {/* 카테고리별 미니 통계 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryStats}
        >
          {stats.categoryStats.map(cat => (
            <View
              key={cat.id}
              style={[styles.categoryStat, { borderColor: cat.color }]}
            >
              <ThemedText style={styles.categoryStatIcon}>{cat.icon}</ThemedText>
              <ThemedText style={styles.categoryStatName}>{cat.name}</ThemedText>
              <ThemedText style={[styles.categoryStatCount, { color: cat.color }]}>
                {cat.unlocked}/{cat.total}
              </ThemedText>
            </View>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* 카테고리 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryFilter}
        contentContainerStyle={styles.categoryFilterContent}
      >
        <Pressable
          style={[
            styles.categoryChip,
            selectedCategory === 'all' && { backgroundColor: colors.tint },
            { borderColor: colors.border },
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <ThemedText
            style={[
              styles.categoryChipText,
              selectedCategory === 'all' && { color: 'white' },
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
              selectedCategory === category.id && { backgroundColor: colors.tint },
              { borderColor: colors.border },
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <ThemedText
              style={[
                styles.categoryChipText,
                selectedCategory === category.id && { color: 'white' },
              ]}
            >
              {category.icon} {category.name}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* 업적 목록 */}
      <SectionList
        sections={groupedAchievements}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
            <ThemedText style={styles.sectionTitle}>
              {section.icon} {section.title}
            </ThemedText>
          </View>
        )}
        renderItem={({ item }) => {
          const isUnlocked = isAchievementUnlocked(item.id);
          const progress = getAchievementProgress(item.id);
          const userAchievement = userAchievements.find(ua => ua.achievementId === item.id);

          return (
            <Pressable
              style={[styles.achievementItem, { backgroundColor: colors.card }]}
              onPress={() => {
                setSelectedAchievement(item);
                setShowDetailModal(true);
              }}
            >
              <AchievementBadge
                achievement={item}
                isUnlocked={isUnlocked}
                progress={progress}
                isNew={userAchievement?.isNew}
                size="medium"
              />
              <View style={styles.achievementInfo}>
                <ThemedText style={styles.achievementName}>{item.name}</ThemedText>
                <ThemedText style={styles.achievementDescription}>
                  {item.description}
                </ThemedText>
                {!isUnlocked && (
                  <View style={styles.progressInfo}>
                    <View style={[styles.miniProgressBar, { backgroundColor: colors.border }]}>
                      <View
                        style={[
                          styles.miniProgressFill,
                          {
                            width: `${Math.min((progress / item.requiredValue) * 100, 100)}%`,
                            backgroundColor: colors.tint,
                          },
                        ]}
                      />
                    </View>
                    <ThemedText style={styles.progressNumbers}>
                      {progress}/{item.requiredValue} {item.unit || ''}
                    </ThemedText>
                  </View>
                )}
                {item.tier && (
                  <View style={styles.tierInfo}>
                    <View
                      style={[
                        styles.tierBadge,
                        { backgroundColor: require('@/data/achievements').tierColors[item.tier] },
                      ]}
                    >
                      <ThemedText style={styles.tierText}>
                        {item.tier.toUpperCase()}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.pointsValue, { color: colors.tint }]}>
                      +{item.points} 포인트
                    </ThemedText>
                  </View>
                )}
              </View>
            </Pressable>
          );
        }}
        contentContainerStyle={styles.listContent}
        stickySectionHeadersEnabled={true}
      />

      {/* 업적 획득 모달 */}
      <AchievementUnlockModal
        visible={showUnlockModal}
        achievement={selectedAchievement}
        onClose={() => {
          setShowUnlockModal(false);
          setSelectedAchievement(null);
        }}
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
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerRight: {
    width: 32,
  },
  progressSection: {
    padding: 20,
    margin: 16,
    borderRadius: 16,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  pointsBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  pointsText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 12,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressText: {
    fontSize: 14,
    opacity: 0.7,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  categoryStats: {
    marginTop: 16,
  },
  categoryStat: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    minWidth: 80,
  },
  categoryStatIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  categoryStatName: {
    fontSize: 12,
    opacity: 0.7,
    marginBottom: 2,
  },
  categoryStatCount: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  categoryFilter: {
    paddingVertical: 8,
  },
  categoryFilterContent: {
    paddingHorizontal: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  achievementItem: {
    flexDirection: 'row',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    alignItems: 'center',
  },
  achievementInfo: {
    flex: 1,
    marginLeft: 16,
  },
  achievementName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  achievementDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 8,
  },
  progressInfo: {
    marginTop: 8,
  },
  miniProgressBar: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 4,
  },
  miniProgressFill: {
    height: '100%',
  },
  progressNumbers: {
    fontSize: 12,
    opacity: 0.6,
  },
  tierInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 8,
  },
  tierBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tierText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  pointsValue: {
    fontSize: 12,
    fontWeight: '600',
  },
});