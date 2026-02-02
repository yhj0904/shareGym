import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useAuthStore from '@/stores/authStore';

export default function SettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user } = useAuthStore();

  // 설정 상태
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(colorScheme === 'dark');
  const [privateProfile, setPrivateProfile] = useState(false);

  const handleProfileEdit = () => {
    router.push('/settings/profile-edit');
  };

  const handleBadgeSelection = () => {
    router.push('/settings/badge-select');
  };

  const handleAbout = () => {
    Alert.alert(
      'ShareGym',
      '버전 1.0.0\n\n함께 운동하고 성장하는 피트니스 커뮤니티',
      [{ text: '확인' }]
    );
  };

  const handlePrivacyPolicy = () => {
    // 개인정보 처리방침 페이지로 이동
    router.push('/settings/privacy');
  };

  const handleTerms = () => {
    // 이용약관 페이지로 이동
    router.push('/settings/terms');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>설정</ThemedText>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 섹션 */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>프로필</ThemedText>

          <Pressable style={styles.menuItem} onPress={handleProfileEdit}>
            <View style={styles.menuLeft}>
              <Ionicons name="person-outline" size={24} color={colors.text} />
              <ThemedText style={styles.menuText}>프로필 편집</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleBadgeSelection}>
            <View style={styles.menuLeft}>
              <Ionicons name="medal-outline" size={24} color={colors.text} />
              <ThemedText style={styles.menuText}>대표 뱃지 설정</ThemedText>
            </View>
            <View style={styles.menuRight}>
              {user?.displayBadges?.length > 0 && (
                <ThemedText style={styles.badgePreview}>
                  {user.displayBadges.slice(0, 3).join(' ')}
                </ThemedText>
              )}
              <Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
            </View>
          </Pressable>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="lock-closed-outline" size={24} color={colors.text} />
              <ThemedText style={styles.menuText}>비공개 프로필</ThemedText>
            </View>
            <Switch
              value={privateProfile}
              onValueChange={setPrivateProfile}
              trackColor={{ false: '#767577', true: colors.tint }}
              thumbColor={privateProfile ? '#fff' : '#f4f3f4'}
            />
          </View>
        </ThemedView>

        {/* 알림 섹션 */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>알림</ThemedText>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={24} color={colors.text} />
              <ThemedText style={styles.menuText}>푸시 알림</ThemedText>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: '#767577', true: colors.tint }}
              thumbColor={notifications ? '#fff' : '#f4f3f4'}
            />
          </View>
        </ThemedView>

        {/* 앱 설정 섹션 */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>앱 설정</ThemedText>

          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="moon-outline" size={24} color={colors.text} />
              <ThemedText style={styles.menuText}>다크 모드</ThemedText>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#767577', true: colors.tint }}
              thumbColor={darkMode ? '#fff' : '#f4f3f4'}
            />
          </View>

          <Pressable style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="language-outline" size={24} color={colors.text} />
              <ThemedText style={styles.menuText}>언어</ThemedText>
            </View>
            <View style={styles.menuRight}>
              <ThemedText style={styles.menuValue}>한국어</ThemedText>
              <Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
            </View>
          </Pressable>
        </ThemedView>

        {/* 정보 섹션 */}
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>정보</ThemedText>

          <Pressable style={styles.menuItem} onPress={handleAbout}>
            <View style={styles.menuLeft}>
              <Ionicons name="information-circle-outline" size={24} color={colors.text} />
              <ThemedText style={styles.menuText}>앱 정보</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handlePrivacyPolicy}>
            <View style={styles.menuLeft}>
              <Ionicons name="shield-checkmark-outline" size={24} color={colors.text} />
              <ThemedText style={styles.menuText}>개인정보 처리방침</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
          </Pressable>

          <Pressable style={styles.menuItem} onPress={handleTerms}>
            <View style={styles.menuLeft}>
              <Ionicons name="document-text-outline" size={24} color={colors.text} />
              <ThemedText style={styles.menuText}>이용약관</ThemedText>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.text + '60'} />
          </Pressable>
        </ThemedView>

        {/* 버전 정보 */}
        <View style={styles.versionContainer}>
          <ThemedText style={styles.versionText}>버전 1.0.0</ThemedText>
        </View>
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
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.6,
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  menuText: {
    fontSize: 16,
  },
  menuValue: {
    fontSize: 14,
    opacity: 0.6,
  },
  badgePreview: {
    fontSize: 16,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  versionText: {
    fontSize: 12,
    opacity: 0.4,
  },
});