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
import useNotificationStore from '@/stores/notificationStore';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { signIn, isLoading } = useAuthStore();
  const { initializeFCM, registerFCMTokenToBackend } = useNotificationStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // 테스트 계정으로 자동 입력
  const useTestAccount = () => {
    setEmail('test@test.com');
    setPassword('test1234');
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      await signIn(email, password);

      // 로그인 성공 후 FCM 초기화 및 토큰 등록
      await initializeFCM();
      await registerFCMTokenToBackend();

      router.replace('/(tabs)');
    } catch (error: any) {
      Alert.alert('로그인 실패', error.message);
    }
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ThemedView style={styles.content}>
          {/* 로고 */}
          <View style={styles.logoContainer}>
            <Image
              source={require('@/assets/images/logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
            <ThemedText type="title" style={styles.title}>쉐어핏</ThemedText>
            <ThemedText style={styles.subtitle}>운동을 함께, 성장을 함께</ThemedText>
          </View>

          {/* 테스트 계정 안내 */}
          <Pressable
            style={[styles.testAccountBanner, { backgroundColor: colors.tint + '20' }]}
            onPress={useTestAccount}
          >
            <Ionicons name="information-circle" size={20} color={colors.tint} />
            <View style={styles.testAccountInfo}>
              <ThemedText style={[styles.testAccountTitle, { color: colors.tint }]}>
                테스트 계정으로 시작하기
              </ThemedText>
              <ThemedText style={styles.testAccountSubtitle}>
                탭하여 test@test.com / test1234 입력
              </ThemedText>
            </View>
          </Pressable>

          {/* 입력 필드 */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#999" />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="이메일"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder="비밀번호"
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

            {/* 로그인 버튼 - 그라데이션 적용 */}
            <Pressable
              style={[styles.loginButtonWrapper, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              <LinearGradient
                colors={isLoading ? ['#B5B5B8', '#B5B5B8'] : gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.loginButton}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <ThemedText style={styles.loginButtonText}>로그인</ThemedText>
                )}
              </LinearGradient>
            </Pressable>

            {/* 비밀번호 찾기 */}
            <Pressable style={styles.forgotPassword}>
              <ThemedText style={styles.forgotPasswordText}>
                비밀번호를 잊으셨나요?
              </ThemedText>
            </Pressable>
          </View>

          {/* 구분선 */}
          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <ThemedText style={styles.dividerText}>또는</ThemedText>
            <View style={styles.divider} />
          </View>

          {/* 소셜 로그인 */}
          <View style={styles.socialContainer}>
            <Pressable style={styles.socialButton}>
              <Ionicons name="logo-google" size={24} color="#DB4437" />
              <ThemedText style={styles.socialButtonText}>Google로 계속</ThemedText>
            </Pressable>

            <Pressable style={styles.socialButton}>
              <Ionicons name="logo-apple" size={24} color={colors.text} />
              <ThemedText style={styles.socialButtonText}>Apple로 계속</ThemedText>
            </Pressable>
          </View>

          {/* 회원가입 링크 */}
          <View style={styles.signupContainer}>
            <ThemedText>계정이 없으신가요? </ThemedText>
            <Pressable onPress={() => router.push('/(auth)/signup')}>
              <ThemedText style={[styles.signupLink, { color: colors.tint }]}>
                회원가입
              </ThemedText>
            </Pressable>
          </View>
        </ThemedView>
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
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 10,
  },
  title: {
    fontSize: 32,
    marginTop: 10,
  },
  subtitle: {
    marginTop: 8,
    opacity: 0.7,
  },
  formContainer: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1E4', // 브랜드 서브 배경색
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 15,
  },
  loginButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  loginButton: {
    padding: 16,
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 15,
  },
  forgotPasswordText: {
    fontSize: 14,
    opacity: 0.7,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#F2F2F4', // 브랜드 색상 적용
  },
  dividerText: {
    marginHorizontal: 15,
    opacity: 0.5,
  },
  socialContainer: {
    gap: 12,
    marginBottom: 30,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#F2F2F4', // 브랜드 색상 적용
    gap: 10,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  signupContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupLink: {
    fontWeight: '600',
  },
  testAccountBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    gap: 12,
  },
  testAccountInfo: {
    flex: 1,
  },
  testAccountTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  testAccountSubtitle: {
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
});