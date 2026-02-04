/**
 * 알림 설정 화면
 * PUSH 알림 권한 관리 및 알림 종류별 설정
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Switch,
  Pressable,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useNotificationStore from '@/stores/notificationStore';
import * as FCM from '@/lib/notifications/fcm';
import * as Linking from 'expo-linking';

export default function NotificationSettingsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const isDark = colorScheme === 'dark';

  const { pushPermissionStatus, initializeFCM, registerFCMTokenToBackend } = useNotificationStore();

  // 알림 설정 상태
  const [settings, setSettings] = useState({
    pushEnabled: false,
    workout: true,
    social: true,
    group: true,
    marketing: false,
    nightMode: false,
  });

  // 권한 상태 확인
  useEffect(() => {
    checkPermissionStatus();
  }, []);

  const checkPermissionStatus = async () => {
    const status = await FCM.getNotificationPermissionStatus();
    setSettings(prev => ({
      ...prev,
      pushEnabled: status === 'granted'
    }));
  };

  // PUSH 알림 토글
  const togglePushNotifications = async (value: boolean) => {
    if (value) {
      // 권한 요청
      const { granted, error } = await FCM.requestNotificationPermission();

      if (granted) {
        setSettings(prev => ({ ...prev, pushEnabled: true }));
        await initializeFCM();
        await registerFCMTokenToBackend();
        Alert.alert('성공', 'PUSH 알림이 활성화되었습니다.');
      } else {
        Alert.alert(
          '권한 필요',
          error || '설정에서 알림 권한을 허용해주세요.',
          [
            { text: '취소', style: 'cancel' },
            { text: '설정 열기', onPress: () => Linking.openSettings() }
          ]
        );
      }
    } else {
      // 알림 비활성화
      setSettings(prev => ({ ...prev, pushEnabled: false }));
      // 서버에서 토큰 제거는 로그아웃 시에만
      Alert.alert('알림 비활성화', 'PUSH 알림이 비활성화되었습니다.');
    }
  };

  // 개별 설정 토글
  const toggleSetting = (key: keyof typeof settings) => {
    if (key === 'pushEnabled') {
      togglePushNotifications(!settings[key]);
    } else {
      setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    }
  };

  // 테스트 알림 발송
  const sendTestNotification = async () => {
    if (!settings.pushEnabled) {
      Alert.alert('알림 비활성화', 'PUSH 알림을 먼저 활성화해주세요.');
      return;
    }

    await FCM.scheduleLocalNotification(
      '🏋️ 테스트 알림',
      '쉐어핏 알림이 정상적으로 작동합니다!',
      { type: 'test' },
      3
    );

    Alert.alert('테스트 알림', '3초 후 테스트 알림이 발송됩니다.');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ThemedView style={styles.container}>
        {/* 헤더 */}
        <View style={[styles.header, { borderBottomColor: isDark ? '#333' : '#eee' }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>알림 설정</ThemedText>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* PUSH 알림 메인 스위치 */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <View style={styles.mainSetting}>
              <View style={styles.settingInfo}>
                <ThemedText style={styles.settingTitle}>PUSH 알림</ThemedText>
                <ThemedText style={styles.settingDescription}>
                  앱이 백그라운드에 있을 때도 알림을 받습니다
                </ThemedText>
              </View>
              <Switch
                value={settings.pushEnabled}
                onValueChange={() => toggleSetting('pushEnabled')}
                trackColor={{ false: '#767577', true: colors.tint + '80' }}
                thumbColor={settings.pushEnabled ? colors.tint : '#f4f3f4'}
              />
            </View>

            {/* 권한 상태 표시 */}
            {pushPermissionStatus && pushPermissionStatus !== 'granted' && (
              <View style={[styles.warningBox, { backgroundColor: '#FFF3CD' }]}>
                <Ionicons name="warning-outline" size={20} color="#856404" />
                <ThemedText style={[styles.warningText, { color: '#856404' }]}>
                  알림 권한이 거부되었습니다. 설정에서 권한을 허용해주세요.
                </ThemedText>
              </View>
            )}
          </View>

          {/* 알림 종류 설정 */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.sectionTitle}>알림 종류</ThemedText>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingHeader}>
                  <Ionicons name="barbell-outline" size={20} color={colors.text} />
                  <ThemedText style={styles.settingLabel}>운동 알림</ThemedText>
                </View>
                <ThemedText style={styles.settingHint}>
                  운동 시작, 완료, 응원 메시지
                </ThemedText>
              </View>
              <Switch
                value={settings.workout}
                onValueChange={() => toggleSetting('workout')}
                trackColor={{ false: '#767577', true: colors.tint + '80' }}
                thumbColor={settings.workout ? colors.tint : '#f4f3f4'}
                disabled={!settings.pushEnabled}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingHeader}>
                  <Ionicons name="heart-outline" size={20} color={colors.text} />
                  <ThemedText style={styles.settingLabel}>소셜 알림</ThemedText>
                </View>
                <ThemedText style={styles.settingHint}>
                  좋아요, 댓글, 팔로우
                </ThemedText>
              </View>
              <Switch
                value={settings.social}
                onValueChange={() => toggleSetting('social')}
                trackColor={{ false: '#767577', true: colors.tint + '80' }}
                thumbColor={settings.social ? colors.tint : '#f4f3f4'}
                disabled={!settings.pushEnabled}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingHeader}>
                  <Ionicons name="people-outline" size={20} color={colors.text} />
                  <ThemedText style={styles.settingLabel}>그룹 알림</ThemedText>
                </View>
                <ThemedText style={styles.settingHint}>
                  그룹 초대, 그룹 활동
                </ThemedText>
              </View>
              <Switch
                value={settings.group}
                onValueChange={() => toggleSetting('group')}
                trackColor={{ false: '#767577', true: colors.tint + '80' }}
                thumbColor={settings.group ? colors.tint : '#f4f3f4'}
                disabled={!settings.pushEnabled}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingHeader}>
                  <Ionicons name="megaphone-outline" size={20} color={colors.text} />
                  <ThemedText style={styles.settingLabel}>마케팅 알림</ThemedText>
                </View>
                <ThemedText style={styles.settingHint}>
                  이벤트, 프로모션, 업데이트 소식
                </ThemedText>
              </View>
              <Switch
                value={settings.marketing}
                onValueChange={() => toggleSetting('marketing')}
                trackColor={{ false: '#767577', true: colors.tint + '80' }}
                thumbColor={settings.marketing ? colors.tint : '#f4f3f4'}
                disabled={!settings.pushEnabled}
              />
            </View>
          </View>

          {/* 방해 금지 설정 */}
          <View style={[styles.section, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.sectionTitle}>방해 금지 시간</ThemedText>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <View style={styles.settingHeader}>
                  <Ionicons name="moon-outline" size={20} color={colors.text} />
                  <ThemedText style={styles.settingLabel}>야간 모드</ThemedText>
                </View>
                <ThemedText style={styles.settingHint}>
                  오후 10시 ~ 오전 7시 알림 차단
                </ThemedText>
              </View>
              <Switch
                value={settings.nightMode}
                onValueChange={() => toggleSetting('nightMode')}
                trackColor={{ false: '#767577', true: colors.tint + '80' }}
                thumbColor={settings.nightMode ? colors.tint : '#f4f3f4'}
                disabled={!settings.pushEnabled}
              />
            </View>
          </View>

          {/* 테스트 버튼 */}
          <Pressable
            style={[styles.testButton, { backgroundColor: colors.tint }]}
            onPress={sendTestNotification}
          >
            <Ionicons name="notifications-outline" size={20} color="white" />
            <ThemedText style={styles.testButtonText}>테스트 알림 보내기</ThemedText>
          </Pressable>

          {/* 정보 */}
          <View style={styles.infoSection}>
            <ThemedText style={styles.infoText}>
              • PUSH 알림은 실제 기기에서만 작동합니다
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • 알림 설정은 기기 설정과 동기화됩니다
            </ThemedText>
            <ThemedText style={styles.infoText}>
              • SSE는 앱 실행 중 실시간 알림을 제공합니다
            </ThemedText>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
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
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  mainSetting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  settingTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  settingLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 13,
    opacity: 0.7,
  },
  settingHint: {
    fontSize: 12,
    opacity: 0.6,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
  },
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginHorizontal: 16,
    marginTop: 24,
    gap: 8,
  },
  testButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  infoSection: {
    padding: 16,
    marginTop: 16,
    marginBottom: 32,
  },
  infoText: {
    fontSize: 12,
    opacity: 0.6,
    marginBottom: 4,
  },
});