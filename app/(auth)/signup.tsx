import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, gradientColors } from '@/constants/Colors';
import useAuthStore from '@/stores/authStore';

export default function SignupScreen() {
  // 테마 및 색상 설정
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  // Safe Area Insets - 상단/하단 안전 영역 패딩 설정
  const insets = useSafeAreaInsets();
  const { signUp, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async () => {
    // 유효성 검사
    if (!email || !password || !username) {
      Alert.alert('알림', '모든 필드를 입력해주세요.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('알림', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('알림', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    if (username.length < 3) {
      Alert.alert('알림', '사용자명은 최소 3자 이상이어야 합니다.');
      return;
    }

    try {
      await signUp(email, password, username);
      Alert.alert('성공', '회원가입이 완료되었습니다!', [
        { text: '확인', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error: any) {
      Alert.alert('회원가입 실패', error.message);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView showsVerticalScrollIndicator={false}>
          <ThemedView style={styles.content}>
            {/* 헤더 */}
            <View style={styles.header}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <Ionicons name="arrow-back" size={28} color={colors.text} />
              </Pressable>
              <ThemedText type="title">회원가입</ThemedText>
              <View style={{ width: 28 }} />
            </View>

            {/* 로고 */}
            <View style={styles.logoContainer}>
              <Image
                source={require('@/assets/images/logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
            </View>

            {/* 입력 필드 */}
            <View style={styles.formContainer}>
              {/* 사용자명 */}
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.label}>사용자명</ThemedText>
                <View style={styles.inputContainer}>
                  <Ionicons name="person-outline" size={20} color="#999" />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="3자 이상 입력"
                    placeholderTextColor="#999"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                </View>
                <ThemedText style={styles.helperText}>
                  프로필에 표시될 이름입니다
                </ThemedText>
              </View>

              {/* 이메일 */}
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.label}>이메일</ThemedText>
                <View style={styles.inputContainer}>
                  <Ionicons name="mail-outline" size={20} color="#999" />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="example@email.com"
                    placeholderTextColor="#999"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                  />
                </View>
              </View>

              {/* 비밀번호 */}
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.label}>비밀번호</ThemedText>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="6자 이상 입력"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                      color="#999"
                    />
                  </Pressable>
                </View>
              </View>

              {/* 비밀번호 확인 */}
              <View style={styles.fieldContainer}>
                <ThemedText style={styles.label}>비밀번호 확인</ThemedText>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={20} color="#999" />
                  <TextInput
                    style={[styles.input, { color: colors.text }]}
                    placeholder="비밀번호 재입력"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              {/* 약관 동의 */}
              <View style={styles.termsContainer}>
                <ThemedText style={styles.termsText}>
                  회원가입 시{' '}
                  <ThemedText style={[styles.termsLink, { color: colors.tint }]}>
                    이용약관
                  </ThemedText>
                  {' '}및{' '}
                  <ThemedText style={[styles.termsLink, { color: colors.tint }]}>
                    개인정보처리방침
                  </ThemedText>
                  에 동의하는 것으로 간주됩니다.
                </ThemedText>
              </View>

              {/* 회원가입 버튼 - 그라데이션 적용 */}
              <Pressable
                style={[styles.signupButtonWrapper, isLoading && styles.disabledButton]}
                onPress={handleSignup}
                disabled={isLoading}
              >
                <LinearGradient
                  colors={isLoading ? ['#B5B5B8', '#B5B5B8'] : gradientColors}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.signupButton}
                >
                  {isLoading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <ThemedText style={styles.signupButtonText}>회원가입</ThemedText>
                  )}
                </LinearGradient>
              </Pressable>
            </View>

            {/* 로그인 링크 */}
            <View style={styles.loginContainer}>
              <ThemedText>이미 계정이 있으신가요? </ThemedText>
              <Pressable onPress={() => router.back()}>
                <ThemedText style={[styles.loginLink, { color: colors.tint }]}>
                  로그인
                </ThemedText>
              </Pressable>
            </View>
          </ThemedView>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    padding: 5,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
  },
  formContainer: {
    marginBottom: 20,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E4', // 브랜드 서브 배경색
    borderRadius: 12,
    paddingHorizontal: 15,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 15,
  },
  helperText: {
    fontSize: 12,
    opacity: 0.6,
    marginTop: 5,
    marginLeft: 5,
  },
  termsContainer: {
    marginVertical: 20,
  },
  termsText: {
    fontSize: 12,
    opacity: 0.7,
    lineHeight: 18,
  },
  termsLink: {
    textDecorationLine: 'underline',
  },
  signupButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  signupButton: {
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  signupButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginLink: {
    fontWeight: '600',
  },
});