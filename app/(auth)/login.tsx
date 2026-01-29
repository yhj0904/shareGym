import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  TextInput,
  Pressable,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useAuthStore from '@/stores/authStore';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { signIn, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('알림', '이메일과 비밀번호를 입력해주세요.');
      return;
    }

    try {
      await signIn(email, password);
      router.replace('/(tabs)/');
    } catch (error: any) {
      Alert.alert('로그인 실패', error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ThemedView style={styles.content}>
          {/* 로고 */}
          <View style={styles.logoContainer}>
            <Ionicons name="fitness" size={64} color={colors.tint} />
            <ThemedText type="title" style={styles.title}>ShareGym</ThemedText>
            <ThemedText style={styles.subtitle}>운동을 함께, 성장을 함께</ThemedText>
          </View>

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

            {/* 로그인 버튼 */}
            <Pressable
              style={[
                styles.loginButton,
                { backgroundColor: colors.tint },
                isLoading && styles.disabledButton,
              ]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <ThemedText style={styles.loginButtonText}>로그인</ThemedText>
              )}
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
    </SafeAreaView>
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
    backgroundColor: '#f5f5f5',
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
  loginButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
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
    backgroundColor: '#e0e0e0',
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
    borderColor: '#e0e0e0',
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
});