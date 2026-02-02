import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useAuthStore from '@/stores/authStore';
import useAchievementStore from '@/stores/achievementStore';
import { achievements } from '@/data/achievements';
import AchievementBadge from '@/components/achievements/AchievementBadge';

export default function BadgeSelectScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, updateUserProfile } = useAuthStore();
  const { getUnlockedAchievements } = useAchievementStore();

  const [selectedBadges, setSelectedBadges] = useState<string[]>(
    user?.displayBadges || []
  );
  const [isLoading, setIsLoading] = useState(false);

  // 획득한 뱃지만 필터링
  const unlockedAchievements = achievements.filter(achievement =>
    getUnlockedAchievements().includes(achievement.id)
  );

  // 뱃지 선택/해제
  const toggleBadge = (achievementId: string) => {
    const achievement = achievements.find(a => a.id === achievementId);
    if (!achievement) return;

    if (selectedBadges.includes(achievement.icon)) {
      // 제거
      setSelectedBadges(prev => prev.filter(b => b !== achievement.icon));
    } else if (selectedBadges.length < 3) {
      // 추가 (최대 3개)
      setSelectedBadges(prev => [...prev, achievement.icon]);
    } else {
      Alert.alert('알림', '최대 3개까지 선택할 수 있습니다.');
    }
  };

  // 저장
  const handleSave = async () => {
    setIsLoading(true);
    try {
      await updateUserProfile({
        displayBadges: selectedBadges,
      });
      Alert.alert('성공', '대표 뱃지가 설정되었습니다.');
      router.back();
    } catch (error) {
      Alert.alert('오류', '뱃지 설정에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 선택 초기화
  const handleClear = () => {
    setSelectedBadges([]);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>대표 뱃지 설정</ThemedText>
          <Pressable
            onPress={handleSave}
            disabled={isLoading}
            style={styles.saveButton}
          >
            <ThemedText style={[styles.saveButtonText, { color: colors.tint }]}>
              저장
            </ThemedText>
          </Pressable>
        </View>

      {/* 선택된 뱃지 미리보기 */}
      <View style={[styles.previewSection, { backgroundColor: colors.card }]}>
        <ThemedText style={styles.previewTitle}>미리보기</ThemedText>
        <View style={styles.previewContent}>
          <ThemedText style={styles.username}>{user?.username || '닉네임'}</ThemedText>
          {selectedBadges.length > 0 && (
            <View style={styles.badgeList}>
              {selectedBadges.map((badge, index) => (
                <ThemedText key={index} style={styles.badgeIcon}>
                  {badge}
                </ThemedText>
              ))}
            </View>
          )}
        </View>
        <ThemedText style={styles.previewHint}>
          최대 3개까지 선택 가능 ({selectedBadges.length}/3)
        </ThemedText>
        {selectedBadges.length > 0 && (
          <Pressable onPress={handleClear} style={styles.clearButton}>
            <ThemedText style={[styles.clearButtonText, { color: colors.tint }]}>
              선택 초기화
            </ThemedText>
          </Pressable>
        )}
      </View>

      {/* 뱃지 목록 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText style={styles.sectionTitle}>획득한 뱃지</ThemedText>

        {unlockedAchievements.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="trophy-outline" size={48} color={colors.text + '40'} />
            <ThemedText style={styles.emptyText}>
              아직 획득한 뱃지가 없습니다
            </ThemedText>
            <ThemedText style={styles.emptySubtext}>
              운동을 시작하고 뱃지를 획득해보세요!
            </ThemedText>
          </View>
        ) : (
          <View style={styles.badgeGrid}>
            {unlockedAchievements.map(achievement => {
              const isSelected = selectedBadges.includes(achievement.icon);
              return (
                <Pressable
                  key={achievement.id}
                  onPress={() => toggleBadge(achievement.id)}
                  style={[
                    styles.badgeItem,
                    isSelected && { borderColor: colors.tint, borderWidth: 2 },
                  ]}
                >
                  <AchievementBadge
                    achievement={achievement}
                    isUnlocked={true}
                    size="medium"
                  />
                  {isSelected && (
                    <View style={[styles.checkmark, { backgroundColor: colors.tint }]}>
                      <Ionicons name="checkmark" size={16} color="white" />
                    </View>
                  )}
                  <ThemedText style={styles.badgeName} numberOfLines={1}>
                    {achievement.name}
                  </ThemedText>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  previewSection: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: 10,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  username: {
    fontSize: 20,
    fontWeight: '600',
  },
  badgeList: {
    flexDirection: 'row',
    gap: 4,
  },
  badgeIcon: {
    fontSize: 20,
  },
  previewHint: {
    fontSize: 12,
    opacity: 0.5,
    marginTop: 10,
  },
  clearButton: {
    marginTop: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  badgeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
    paddingBottom: 30,
  },
  badgeItem: {
    width: '30%',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    position: 'relative',
  },
  badgeName: {
    fontSize: 12,
    marginTop: 5,
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 5,
    right: 5,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    opacity: 0.6,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.4,
  },
});