/**
 * 이용약관 페이지
 */

import React from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function TermsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>이용약관</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* 내용 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.sectionTitle}>제1조 (목적)</ThemedText>
          <ThemedText style={styles.paragraph}>
            이 약관은 ShareGym(이하 "서비스")이 제공하는 모바일 애플리케이션 서비스의 이용조건 및 절차,
            이용자와 서비스 제공자의 권리, 의무, 책임사항과 기타 필요한 사항을 규정함을 목적으로 합니다.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>제2조 (정의)</ThemedText>
          <ThemedText style={styles.paragraph}>
            1. "서비스"란 ShareGym이 제공하는 운동 기록 및 소셜 피트니스 관련 모든 서비스를 의미합니다.{'\n'}
            2. "이용자"란 이 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.{'\n'}
            3. "회원"이란 서비스에 접속하여 이 약관에 따라 서비스 제공자와 이용계약을 체결하고
            서비스 제공자가 제공하는 서비스를 이용하는 고객을 말합니다.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>제3조 (약관의 효력 및 변경)</ThemedText>
          <ThemedText style={styles.paragraph}>
            1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 회원에게 공지함으로써 효력이 발생합니다.{'\n'}
            2. 서비스 제공자는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며,
            약관이 변경된 경우에는 변경된 약관을 공지합니다.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>제4조 (서비스의 제공)</ThemedText>
          <ThemedText style={styles.paragraph}>
            1. 운동 기록 저장 및 관리 서비스{'\n'}
            2. 운동 루틴 생성 및 공유 서비스{'\n'}
            3. 소셜 피드 및 커뮤니티 서비스{'\n'}
            4. 그룹 운동 및 챌린지 서비스{'\n'}
            5. 기타 서비스 제공자가 정하는 서비스
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>제5조 (개인정보보호)</ThemedText>
          <ThemedText style={styles.paragraph}>
            서비스 제공자는 관련 법령이 정하는 바에 따라 회원의 개인정보를 보호하기 위해 노력합니다.
            개인정보의 보호 및 사용에 대해서는 관련 법령 및 서비스의 개인정보처리방침이 적용됩니다.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>제6조 (서비스 이용의 제한 및 중지)</ThemedText>
          <ThemedText style={styles.paragraph}>
            다음 각 호에 해당하는 경우 서비스 이용을 제한하거나 중지할 수 있습니다.{'\n'}
            1. 타인의 서비스 이용을 방해하거나 타인의 정보를 도용한 경우{'\n'}
            2. 서비스를 이용하여 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우{'\n'}
            3. 기타 서비스 제공자가 서비스 운영상 부적절하다고 판단하는 경우
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>제7조 (책임제한)</ThemedText>
          <ThemedText style={styles.paragraph}>
            1. 서비스 제공자는 천재지변 또는 이에 준하는 불가항력으로 인하여
            서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.{'\n'}
            2. 서비스 제공자는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여 책임을 지지 않습니다.
          </ThemedText>

          <View style={styles.bottomSpace} />
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
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
  },
  bottomSpace: {
    height: 40,
  },
});