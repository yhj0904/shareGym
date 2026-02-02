import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  TextInput,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useAuthStore from '@/stores/authStore';
import * as ImagePicker from 'expo-image-picker';

export default function ProfileEditScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { user, updateUserProfile } = useAuthStore();

  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [profileImage, setProfileImage] = useState(user?.profileImage || null);
  const [isLoading, setIsLoading] = useState(false);

  // 프로필 이미지 선택
  const pickImage = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    // 이미지 선택
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'] as any,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // 카메라로 사진 찍기
  const takePhoto = async () => {
    // 권한 요청
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
      return;
    }

    // 카메라 실행
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setProfileImage(result.assets[0].uri);
    }
  };

  // 프로필 이미지 변경 옵션
  const handleImageChange = () => {
    Alert.alert(
      '프로필 사진 변경',
      '어떤 방법을 선택하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { text: '갤러리에서 선택', onPress: pickImage },
        { text: '카메라로 촬영', onPress: takePhoto },
      ]
    );
  };

  // 프로필 저장
  const handleSave = async () => {
    if (!username.trim()) {
      Alert.alert('알림', '닉네임을 입력해주세요.');
      return;
    }

    if (username.length < 2 || username.length > 20) {
      Alert.alert('알림', '닉네임은 2-20자 사이로 입력해주세요.');
      return;
    }

    setIsLoading(true);
    try {
      await updateUserProfile({
        username: username.trim(),
        bio: bio.trim(),
        profileImage,
      });
      Alert.alert('성공', '프로필이 업데이트되었습니다.');
      router.back();
    } catch (error) {
      Alert.alert('오류', '프로필 업데이트에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ThemedView style={styles.container}>
        {/* 헤더 */}
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee' }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>
          <ThemedText style={styles.headerTitle}>프로필 편집</ThemedText>
          <Pressable
            onPress={handleSave}
            disabled={isLoading}
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={colors.tint} />
            ) : (
              <ThemedText style={[styles.saveButtonText, { color: colors.tint }]}>
                저장
              </ThemedText>
            )}
          </Pressable>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 프로필 이미지 */}
        <View style={styles.imageSection}>
          <Pressable onPress={handleImageChange} style={styles.imageContainer}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.card }]}>
                <Ionicons name="person" size={50} color={colors.text + '40'} />
              </View>
            )}
            <View style={[styles.editBadge, { backgroundColor: colors.tint }]}>
              <Ionicons name="camera" size={16} color="white" />
            </View>
          </Pressable>
          <ThemedText style={styles.imageHint}>프로필 사진 변경</ThemedText>
        </View>

        {/* 입력 필드 */}
        <View style={styles.inputSection}>
          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>닉네임</ThemedText>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={username}
              onChangeText={setUsername}
              placeholder="닉네임을 입력하세요"
              placeholderTextColor={colors.text + '60'}
              maxLength={20}
            />
            <ThemedText style={styles.inputHint}>
              {username.length}/20
            </ThemedText>
          </View>

          <View style={styles.inputContainer}>
            <ThemedText style={styles.inputLabel}>소개</ThemedText>
            <TextInput
              style={[
                styles.textArea,
                {
                  backgroundColor: colors.card,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={bio}
              onChangeText={setBio}
              placeholder="자신을 소개해주세요"
              placeholderTextColor={colors.text + '60'}
              maxLength={100}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <ThemedText style={styles.inputHint}>
              {bio.length}/100
            </ThemedText>
          </View>
        </View>

        {/* 계정 정보 */}
        <View style={styles.infoSection}>
          <ThemedText style={styles.infoLabel}>이메일</ThemedText>
          <ThemedText style={styles.infoValue}>
            {user?.email || 'test@test.com'}
          </ThemedText>
          <ThemedText style={styles.infoHint}>
            이메일은 변경할 수 없습니다
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
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  imageSection: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  imageContainer: {
    position: 'relative',
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  imagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageHint: {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.6,
  },
  inputSection: {
    paddingHorizontal: 20,
    gap: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 12,
    opacity: 0.5,
    textAlign: 'right',
  },
  infoSection: {
    marginTop: 40,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.8,
    marginBottom: 8,
  },
  infoValue: {
    fontSize: 16,
    marginBottom: 4,
  },
  infoHint: {
    fontSize: 12,
    opacity: 0.5,
  },
});