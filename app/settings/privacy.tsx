/**
 * 개인정보 처리방침 페이지
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

export default function PrivacyScreen() {
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
          <ThemedText style={styles.headerTitle}>개인정보 처리방침</ThemedText>
          <View style={styles.placeholder} />
        </View>

        {/* 내용 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <ThemedText style={styles.updateDate}>시행일: 2024년 1월 1일</ThemedText>

          <ThemedText style={styles.sectionTitle}>1. 개인정보의 수집 및 이용 목적</ThemedText>
          <ThemedText style={styles.paragraph}>
            ShareGym(이하 "서비스")은 다음의 목적을 위해 개인정보를 수집 및 이용합니다.
            {'\n'}• 서비스 제공 및 운영
            {'\n'}• 회원 관리 및 본인 확인
            {'\n'}• 운동 기록 저장 및 분석
            {'\n'}• 소셜 기능 제공
            {'\n'}• 맞춤형 서비스 제공
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>2. 수집하는 개인정보의 항목</ThemedText>
          <ThemedText style={styles.paragraph}>
            <ThemedText style={styles.bold}>필수 항목:</ThemedText>
            {'\n'}• 이메일 주소
            {'\n'}• 비밀번호 (암호화 저장)
            {'\n'}• 닉네임
            {'\n'}
            {'\n'}<ThemedText style={styles.bold}>선택 항목:</ThemedText>
            {'\n'}• 프로필 사진
            {'\n'}• 운동 기록 데이터
            {'\n'}• 신체 정보 (키, 몸무게)
            {'\n'}• 운동 목표 및 선호도
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>3. 개인정보의 보유 및 이용 기간</ThemedText>
          <ThemedText style={styles.paragraph}>
            • 회원 탈퇴 시까지
            {'\n'}• 단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관
            {'\n'}  - 전자상거래법: 5년
            {'\n'}  - 통신비밀보호법: 3개월
            {'\n'}  - 소비자 불만 또는 분쟁 처리 기록: 3년
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>4. 개인정보의 제3자 제공</ThemedText>
          <ThemedText style={styles.paragraph}>
            서비스는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다.
            {'\n'}다만, 다음의 경우는 예외로 합니다.
            {'\n'}• 이용자가 사전에 동의한 경우
            {'\n'}• 법령의 규정에 의한 경우
            {'\n'}• 수사기관의 요청이 있는 경우
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>5. 개인정보의 안전성 확보 조치</ThemedText>
          <ThemedText style={styles.paragraph}>
            • 비밀번호 암호화
            {'\n'}• SSL 보안 프로토콜 사용
            {'\n'}• 접근 권한 관리
            {'\n'}• 개인정보 접근 기록 보관
            {'\n'}• 정기적인 보안 점검
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>6. 이용자의 권리와 행사 방법</ThemedText>
          <ThemedText style={styles.paragraph}>
            이용자는 언제든지 다음과 같은 권리를 행사할 수 있습니다.
            {'\n'}• 개인정보 열람 요구
            {'\n'}• 오류 등이 있을 경우 정정 요구
            {'\n'}• 삭제 요구
            {'\n'}• 처리정지 요구
            {'\n'}
            {'\n'}권리 행사는 설정 메뉴 또는 고객센터를 통해 가능합니다.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>7. 쿠키의 운영</ThemedText>
          <ThemedText style={styles.paragraph}>
            서비스는 이용자 맞춤형 서비스 제공을 위해 쿠키를 사용합니다.
            {'\n'}• 쿠키 사용 목적: 로그인 유지, 이용 패턴 분석
            {'\n'}• 쿠키 거부 방법: 앱 설정에서 변경 가능
            {'\n'}• 쿠키 거부 시 일부 서비스 이용에 제한이 있을 수 있습니다
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>8. 개인정보 보호책임자</ThemedText>
          <ThemedText style={styles.paragraph}>
            <ThemedText style={styles.bold}>개인정보 보호책임자</ThemedText>
            {'\n'}• 성명: 홍길동
            {'\n'}• 직책: CPO (Chief Privacy Officer)
            {'\n'}• 이메일: privacy@sharegym.com
            {'\n'}• 전화: 02-1234-5678
            {'\n'}
            {'\n'}개인정보 침해 신고 또는 상담이 필요하신 경우 위 연락처로 문의해 주시기 바랍니다.
          </ThemedText>

          <ThemedText style={styles.sectionTitle}>9. 개인정보 처리방침 변경</ThemedText>
          <ThemedText style={styles.paragraph}>
            이 개인정보 처리방침은 2024년 1월 1일부터 적용됩니다.
            {'\n'}변경 사항이 있을 경우 서비스 내 공지사항을 통해 안내드리겠습니다.
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
  updateDate: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 20,
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
  bold: {
    fontWeight: '600',
    opacity: 1,
  },
  bottomSpace: {
    height: 40,
  },
});