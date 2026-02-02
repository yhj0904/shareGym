import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Alert,
  Dimensions,
  Modal,
  Switch,
  Image,
} from 'react-native';
// SafeAreaProvider가 상위 _layout.tsx에서 제공되므로 제거
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import useGroupStore from '@/stores/groupStore';
import useAuthStore from '@/stores/authStore';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import WorkoutCardTemplate from '@/components/card/WorkoutCardTemplate';
import CardCustomizer from '@/components/card/CardCustomizer';
import AdvancedCardCustomizer from '@/components/card/AdvancedCardCustomizer';
import PresetManager from '@/components/card/PresetManager';
import { CardCustomOptions } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 40;
const cardHeight = cardWidth * 1.4; // Instagram story ratio

type CardStyle = 'minimal' | 'gradient' | 'dark' | 'colorful' | 'ocean' | 'sunset' | 'forest' | 'neon';

// 기본 커스텀 옵션 설정 (확장된 옵션 포함)
const defaultCustomOptions: CardCustomOptions = {
  // 배경 설정
  backgroundType: 'gradient',
  backgroundColor: '#FFFFFF',
  gradientColors: ['#FFFFFF', '#F5F5F5'],
  gradientAngle: 45,
  gradientType: 'linear',
  backgroundOpacity: 1,
  backgroundPattern: 'dots',

  // 텍스트 설정
  primaryTextColor: '#1C1C1E',
  secondaryTextColor: '#B5B5B8',
  fontSize: 'medium',
  fontFamily: undefined,

  // 개별 텍스트 스타일
  titleStyle: {
    fontSize: 32,
    fontWeight: 'bold',
    fontStyle: 'normal',
    textTransform: 'none',
    letterSpacing: 0,
  },
  subtitleStyle: {
    fontSize: 16,
    fontWeight: 'normal',
  },
  statsStyle: {
    valueColor: '#1C1C1E',
    labelColor: '#B5B5B8',
    fontSize: 20,
  },

  // 레이아웃 설정
  layout: 'classic',
  padding: 25,
  spacing: 15,
  alignment: 'center',

  // 로고/브랜딩
  showLogo: true,
  logoPosition: 'bottom-left',
  logoSize: 24,
  watermarkOpacity: 0.3,

  // 정보 표시 설정
  showStats: {
    duration: true,
    volume: true,
    sets: true,
    distance: true,
    calories: false,
    heartRate: false,
    intensity: false,
  },

  // 통계 아이콘
  statsIcons: {
    duration: 'time-outline',
    volume: 'barbell-outline',
    sets: 'layers-outline',
    distance: 'navigate-outline',
    calories: 'flame-outline',
  },
  iconSize: 32,
  iconColor: undefined,

  // 운동 목록 설정
  showExerciseList: true,
  maxExercisesToShow: 5,
  exerciseListStyle: {
    showNumbers: false,
    showSets: true,
    showWeight: true,
    highlightPR: false,
    colorByMuscle: false,
  },

  // 추가 요소
  title: '오운완 🔥',
  subtitle: undefined,
  motivationalQuote: undefined,
  hashtags: ['오운완', '헬스타그램', '운동기록'],
  showDate: true,
  dateFormat: 'long',
  showTime: false,
  showWeather: undefined,
  showMood: undefined,

  // 칼로리
  showCalorieBreakdown: false,
  calorieGoal: undefined,

  // 테두리 및 효과
  borderRadius: 12,
  borderStyle: 'solid',
  shadowEnabled: false,
  shadowColor: '#000000',
  shadowIntensity: 5,
  borderColor: '#DDD',
  borderWidth: 0,

  // 애니메이션
  animationStyle: 'none',

  // QR 코드
  showQRCode: false,
  qrCodeData: undefined,
  qrCodePosition: 'bottom-right',
};

export default function CreateCardScreen() {
  // 테마 및 색상 설정
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { lastWorkout } = useWorkoutStore();
  const { groups, createSharedCard, fetchUserGroups } = useGroupStore();
  const { user } = useAuthStore();
  const viewShotRef = useRef<ViewShot>(null);

  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('minimal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [useCustomMode, setUseCustomMode] = useState(false); // 커스텀 모드 여부
  const [customOptions, setCustomOptions] = useState<CardCustomOptions>(defaultCustomOptions);
  const [showCustomizer, setShowCustomizer] = useState(false); // 커스터마이저 모달 표시 여부
  const [useAdvancedMode, setUseAdvancedMode] = useState(false); // 고급 모드 여부
  const [showPresetManager, setShowPresetManager] = useState(false); // 프리셋 관리자 표시 여부
  const [showGroupShareModal, setShowGroupShareModal] = useState(false); // 그룹 공유 모달
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [splitType, setSplitType] = useState<'horizontal' | 'vertical'>('horizontal');
  const [splitPosition, setSplitPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');

  // 그룹 데이터 로드
  useEffect(() => {
    if (user) {
      fetchUserGroups(user.id);
    }
  }, [user]);

  // 저장된 커스텀 설정 불러오기
  useEffect(() => {
    loadCustomSettings();
  }, []);

  // 커스텀 설정 불러오기 함수
  const loadCustomSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('cardCustomOptions');
      if (saved) {
        setCustomOptions(JSON.parse(saved));
      }
    } catch (error) {
      console.error('커스텀 설정 불러오기 실패:', error);
    }
  };

  // 커스텀 설정 저장 함수
  const saveCustomSettings = async () => {
    try {
      await AsyncStorage.setItem('cardCustomOptions', JSON.stringify(customOptions));
      Alert.alert('저장 완료', '커스텀 설정이 저장되었습니다.');
    } catch (error) {
      console.error('커스텀 설정 저장 실패:', error);
      Alert.alert('오류', '설정 저장에 실패했습니다.');
    }
  };

  // 카메라로 사진 찍기 함수
  const takePhoto = async () => {
    try {
      // 카메라 권한 요청
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '카메라 접근 권한이 필요합니다.');
        return;
      }

      // 카메라 실행
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16], // 세로 비율 (스토리 비율)
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // 배경 이미지로 설정
        setCustomOptions({
          ...customOptions,
          backgroundType: 'image',
          backgroundImage: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error('카메라 오류:', error);
      Alert.alert('오류', '사진 촬영 중 오류가 발생했습니다.');
    }
  };

  // 갤러리에서 사진 선택 함수
  const pickImage = async () => {
    try {
      // 갤러리 권한 요청
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      // 갤러리 열기
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [9, 16], // 세로 비율 (스토리 비율)
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // 배경 이미지로 설정
        setCustomOptions({
          ...customOptions,
          backgroundType: 'image',
          backgroundImage: result.assets[0].uri,
        });
      }
    } catch (error) {
      console.error('갤러리 오류:', error);
      Alert.alert('오류', '사진 선택 중 오류가 발생했습니다.');
    }
  };

  // 배경 이미지 제거 함수
  const removeBackgroundImage = () => {
    setCustomOptions({
      ...customOptions,
      backgroundType: 'gradient',
      backgroundImage: undefined,
    });
  };

  const cardStyles = [
    { id: 'minimal', name: '미니멀', colors: ['#FFFFFF', '#E8E8E8'] },
    { id: 'gradient', name: '그라데이션', colors: ['#667eea', '#764ba2'] },
    { id: 'dark', name: '다크', colors: ['#1a1a1a', '#3a3a3a'] },
    { id: 'colorful', name: '컬러풀', colors: ['#f093fb', '#f5576c'] },
    { id: 'ocean', name: '오션', colors: ['#2E3192', '#1BFFFF'] },
    { id: 'sunset', name: '선셋', colors: ['#FF512F', '#F09819'] },
    { id: 'forest', name: '포레스트', colors: ['#134E5E', '#71B280'] },
    { id: 'neon', name: '네온', colors: ['#B721FF', '#21D4FD'] },
  ];

  const handleSaveCard = async () => {
    if (!viewShotRef.current) return;

    setIsGenerating(true);
    try {
      // 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 저장을 위해 권한이 필요합니다.');
        return;
      }

      // 스크린샷 캡처
      const uri = await viewShotRef.current.capture();

      // 갤러리에 저장
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('쉐어핏', asset, false);

      Alert.alert('저장 완료', '운동 카드가 갤러리에 저장되었습니다.');
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '카드 저장에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareCard = async () => {
    if (!viewShotRef.current) return;

    setIsGenerating(true);
    try {
      const uri = await viewShotRef.current.capture();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('알림', '이 기기에서는 공유 기능을 사용할 수 없습니다.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '카드 공유에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 그룹 공유 모달 열기
  const handleOpenGroupShare = () => {
    // 사용자가 속한 그룹이 있는지 확인
    const userGroups = groups.filter(g => g.members.includes(user?.id || ''));
    if (userGroups.length === 0) {
      Alert.alert('그룹 없음', '먼저 그룹에 가입해주세요.');
      return;
    }
    setShowGroupShareModal(true);
  };

  // 그룹 공유 카드 생성
  const handleCreateGroupCard = async () => {
    if (!selectedGroup || !lastWorkout || !user) {
      Alert.alert('오류', '필요한 정보가 없습니다.');
      return;
    }

    try {
      // 분할 방향에 따른 위치 조정
      const adjustedPosition = splitType === 'horizontal'
        ? (splitPosition === 'top' || splitPosition === 'bottom' ? splitPosition : 'top')
        : (splitPosition === 'left' || splitPosition === 'right' ? splitPosition : 'left');

      // 현재 설정된 스타일 사용
      const currentStyle = useCustomMode ? undefined : selectedStyle;
      const currentOptions = useCustomMode ? customOptions : undefined;

      await createSharedCard(
        selectedGroup,
        user.id,
        lastWorkout.id,
        splitType,
        adjustedPosition,
        currentStyle,
        currentOptions
      );

      setShowGroupShareModal(false);

      Alert.alert(
        '공유 카드 생성 완료',
        '그룹 멤버가 나머지 절반을 완성할 수 있습니다. 24시간 내에 완성되지 않으면 자동으로 삭제됩니다.',
        [
          {
            text: '확인',
            onPress: () => {
              // 모달 먼저 모두 닫아서 루트로 복귀
              router.dismissAll();
              // 루트에서 그룹 탭으로 완전히 이동 (모달이 아닌 홈 탭으로)
              setTimeout(() => {
                router.replace('/(tabs)/groups');
              }, 300);
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('오류', '공유 카드 생성에 실패했습니다.');
      console.error(error);
    }
  };

  if (!lastWorkout) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.emptyContainer}>
          <ThemedText>운동 기록이 없습니다</ThemedText>
        </ThemedView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <ThemedView style={[styles.header, {
        borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee'
      }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle">운동 카드 만들기</ThemedText>
        <View style={{ width: 28 }} />
      </ThemedView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* 카드 미리보기 */}
        <View style={styles.cardContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{
              format: 'png',
              quality: 1,
              width: cardWidth,
              height: cardHeight,
            }}
          >
            <WorkoutCardTemplate
              workout={lastWorkout}
              style={useCustomMode ? undefined : selectedStyle}
              customOptions={useCustomMode ? customOptions : undefined}
              width={cardWidth}
              height={cardHeight}
            />
          </ViewShot>
        </View>

        {/* 스타일 선택 */}
        <ThemedView style={styles.styleSection}>
          {/* 모드 선택 토글 */}
          <View style={[styles.modeSelector, {
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : '#f5f5f5'
          }]}>
            <Pressable
              style={[
                styles.modeButton,
                !useCustomMode && [styles.activeModeButton, {
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : 'white'
                }],
              ]}
              onPress={() => setUseCustomMode(false)}
            >
              <ThemedText style={[
                styles.modeButtonText,
                !useCustomMode && [styles.activeModeButtonText, {
                  color: colors.text
                }],
              ]}>
                프리셋 스타일
              </ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.modeButton,
                useCustomMode && [styles.activeModeButton, {
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : 'white'
                }],
              ]}
              onPress={() => setUseCustomMode(true)}
            >
              <ThemedText style={[
                styles.modeButtonText,
                useCustomMode && [styles.activeModeButtonText, {
                  color: colors.text
                }],
              ]}>
                커스텀 디자인
              </ThemedText>
            </Pressable>
          </View>

          {/* 프리셋 스타일 선택 (커스텀 모드가 아닐 때) */}
          {!useCustomMode ? (
            <>
              <ThemedText style={styles.sectionTitle}>스타일 선택</ThemedText>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.styleList}
              >
                {cardStyles.map((style) => (
              <Pressable
                key={style.id}
                style={[
                  styles.styleOption,
                  selectedStyle === style.id && styles.selectedStyle,
                ]}
                onPress={() => setSelectedStyle(style.id as CardStyle)}
              >
                <LinearGradient
                  colors={style.colors}
                  style={styles.stylePreview}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                />
                <ThemedText style={styles.styleName}>{style.name}</ThemedText>
              </Pressable>
                ))}
              </ScrollView>
            </>
          ) : (
            /* 커스텀 디자인 옵션 (커스텀 모드일 때) */
            <>
              <ThemedText style={styles.sectionTitle}>커스텀 디자인</ThemedText>

              {/* 배경 사진 설정 섹션 */}
              <View style={styles.photoSection}>
                <ThemedText style={styles.photoSectionTitle}>배경 사진</ThemedText>
                {customOptions.backgroundImage ? (
                  <View style={styles.selectedImageContainer}>
                    <Image
                      source={{ uri: customOptions.backgroundImage }}
                      style={styles.selectedImagePreview}
                    />
                    <Pressable
                      style={styles.removeImageButton}
                      onPress={removeBackgroundImage}
                    >
                      <Ionicons name="close-circle" size={24} color="#FF3B30" />
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.photoButtonsRow}>
                    <Pressable
                      style={[styles.photoButton, { backgroundColor: colors.tint }]}
                      onPress={takePhoto}
                    >
                      <Ionicons name="camera" size={24} color="white" />
                      <ThemedText style={styles.photoButtonText}>사진 찍기</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[styles.photoButton, {
                        backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5'
                      }]}
                      onPress={pickImage}
                    >
                      <Ionicons name="images" size={24} color={colors.text} />
                      <ThemedText style={[styles.photoButtonText, { color: colors.text }]}>
                        갤러리
                      </ThemedText>
                    </Pressable>
                  </View>
                )}
              </View>

              {/* 고급 모드 토글 */}
              <View style={styles.advancedModeRow}>
                <ThemedText style={styles.optionLabel}>고급 모드</ThemedText>
                <Switch
                  value={useAdvancedMode}
                  onValueChange={setUseAdvancedMode}
                  trackColor={{ false: '#767577', true: colors.tint }}
                />
              </View>

              <Pressable
                style={[styles.customizeButton, { backgroundColor: colors.tint }]}
                onPress={() => setShowCustomizer(true)}
              >
                <Ionicons
                  name={useAdvancedMode ? "settings-outline" : "color-palette-outline"}
                  size={24}
                  color="white"
                />
                <ThemedText style={[styles.customizeButtonText, { color: 'white' }]}>
                  {useAdvancedMode ? '고급 디자인 설정' : '디자인 커스터마이징'}
                </ThemedText>
              </Pressable>

              <View style={styles.buttonRow}>
                <Pressable
                  style={[styles.halfButton, {
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5'
                  }]}
                  onPress={() => setShowPresetManager(true)}
                >
                  <Ionicons name="bookmark-outline" size={20} color={colors.text} />
                  <ThemedText style={[styles.halfButtonText, { color: colors.text }]}>
                    프리셋
                  </ThemedText>
                </Pressable>

                <Pressable
                  style={[styles.halfButton, {
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5'
                  }]}
                  onPress={saveCustomSettings}
                >
                  <Ionicons name="save-outline" size={20} color={colors.text} />
                  <ThemedText style={[styles.halfButtonText, { color: colors.text }]}>
                    설정 저장
                  </ThemedText>
                </Pressable>
              </View>

              {useAdvancedMode && (
                <View style={styles.advancedInfo}>
                  <Ionicons name="information-circle-outline" size={16} color={colors.text} />
                  <ThemedText style={styles.advancedInfoText}>
                    고급 모드에서는 텍스트, 레이아웃, 통계, 효과 등을 더 세밀하게 조정할 수 있습니다.
                  </ThemedText>
                </View>
              )}
            </>
          )}
        </ThemedView>

        {/* 액션 버튼 */}
        <ThemedView style={styles.actions}>
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: colors.tint },
              isGenerating && styles.disabledButton,
            ]}
            onPress={handleSaveCard}
            disabled={isGenerating}
          >
            <Ionicons name="download-outline" size={24} color="white" />
            <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>
              {isGenerating ? '저장 중...' : '갤러리에 저장'}
            </ThemedText>
          </Pressable>

          {/* 그룹 공유 카드 버튼 - 그룹에 속한 경우에만 표시 */}
          {groups.filter(g => g.members.includes(user?.id || '')).length > 0 && (
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#f0f0f0' },
              ]}
              onPress={handleOpenGroupShare}
            >
              <Ionicons name="people-outline" size={24} color={colors.text} />
              <ThemedText style={[styles.actionButtonText, { color: colors.text }]}>
                그룹 공유 카드
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' },
              isGenerating && styles.disabledButton,
            ]}
            onPress={handleShareCard}
            disabled={isGenerating}
          >
            <Ionicons name="share-outline" size={24} color={colors.text} />
            <ThemedText style={[styles.actionButtonText, { color: colors.text }]}>공유하기</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>

      {/* 커스터마이저 모달 */}
      <Modal
        visible={showCustomizer}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCustomizer(false)}
      >
        <ThemedView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
          {/* 모달 헤더 */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Pressable onPress={() => setShowCustomizer(false)}>
              <ThemedText style={styles.modalCancelText}>취소</ThemedText>
            </Pressable>
            <ThemedText style={styles.modalTitle}>디자인 커스터마이징</ThemedText>
            <Pressable onPress={() => {
              setShowCustomizer(false);
              Alert.alert('적용 완료', '커스텀 디자인이 적용되었습니다.');
            }}>
              <ThemedText style={[styles.modalDoneText, { color: colors.tint }]}>
                완료
              </ThemedText>
            </Pressable>
          </View>

          {/* 커스터마이저 컴포넌트 (모드에 따라 다름) */}
          {useAdvancedMode ? (
            <AdvancedCardCustomizer
              customOptions={customOptions}
              onOptionsChange={setCustomOptions}
            />
          ) : (
            <CardCustomizer
              customOptions={customOptions}
              onOptionsChange={setCustomOptions}
            />
          )}
        </ThemedView>
      </Modal>

      {/* 프리셋 관리자 */}
      <PresetManager
        currentOptions={customOptions}
        onLoadPreset={setCustomOptions}
        visible={showPresetManager}
        onClose={() => setShowPresetManager(false)}
      />

      {/* 그룹 공유 카드 생성 모달 */}
      <Modal
        visible={showGroupShareModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowGroupShareModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.groupShareModalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeaderGroup}>
              <ThemedText style={styles.modalTitle}>그룹 공유 카드 만들기</ThemedText>
              <Pressable onPress={() => setShowGroupShareModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={colors.text} />
              </Pressable>
            </View>

            <ThemedText style={styles.modalSubtitle}>
              그룹 멤버와 함께 2분할 운동 카드를 만들어보세요!
            </ThemedText>

            {/* 그룹 선택 */}
            <View style={styles.selectionSection}>
              <ThemedText style={styles.sectionLabel}>그룹 선택</ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionList}>
                {groups
                  .filter(g => g.members.includes(user?.id || ''))
                  .map(group => (
                    <Pressable
                      key={group.id}
                      style={[
                        styles.optionItem,
                        selectedGroup === group.id && styles.selectedOption,
                        { borderColor: selectedGroup === group.id ? colors.tint : '#ddd' }
                      ]}
                      onPress={() => setSelectedGroup(group.id)}
                    >
                      <Ionicons
                        name="people"
                        size={20}
                        color={selectedGroup === group.id ? colors.tint : colors.text}
                      />
                      <ThemedText style={styles.optionText}>{group.name}</ThemedText>
                    </Pressable>
                  ))}
              </ScrollView>
            </View>

            {/* 분할 방향 선택 */}
            <View style={styles.selectionSection}>
              <ThemedText style={styles.sectionLabel}>분할 방향</ThemedText>
              <View style={styles.splitTypeRow}>
                <Pressable
                  style={[
                    styles.splitTypeOption,
                    splitType === 'horizontal' && styles.selectedSplitType,
                    { borderColor: splitType === 'horizontal' ? colors.tint : '#ddd' }
                  ]}
                  onPress={() => {
                    setSplitType('horizontal');
                    setSplitPosition('top');
                  }}
                >
                  <View style={styles.splitPreview}>
                    <View style={[styles.splitBox, styles.horizontalTop, {
                      backgroundColor: splitType === 'horizontal' ? colors.tint : '#ddd'
                    }]} />
                    <View style={[styles.splitBox, styles.horizontalBottom]} />
                  </View>
                  <ThemedText style={styles.splitTypeText}>상하 분할</ThemedText>
                </Pressable>

                <Pressable
                  style={[
                    styles.splitTypeOption,
                    splitType === 'vertical' && styles.selectedSplitType,
                    { borderColor: splitType === 'vertical' ? colors.tint : '#ddd' }
                  ]}
                  onPress={() => {
                    setSplitType('vertical');
                    setSplitPosition('left');
                  }}
                >
                  <View style={styles.splitPreview}>
                    <View style={[styles.splitBox, styles.verticalLeft, {
                      backgroundColor: splitType === 'vertical' ? colors.tint : '#ddd'
                    }]} />
                    <View style={[styles.splitBox, styles.verticalRight]} />
                  </View>
                  <ThemedText style={styles.splitTypeText}>좌우 분할</ThemedText>
                </Pressable>
              </View>
            </View>

            {/* 위치 선택 */}
            <View style={styles.selectionSection}>
              <ThemedText style={styles.sectionLabel}>내 운동 위치</ThemedText>
              <View style={styles.positionRow}>
                {splitType === 'horizontal' ? (
                  <>
                    <Pressable
                      style={[
                        styles.positionOption,
                        splitPosition === 'top' && styles.selectedPosition,
                        { borderColor: splitPosition === 'top' ? colors.tint : '#ddd' }
                      ]}
                      onPress={() => setSplitPosition('top')}
                    >
                      <Ionicons name="arrow-up" size={20} color={colors.text} />
                      <ThemedText style={styles.positionText}>위쪽</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.positionOption,
                        splitPosition === 'bottom' && styles.selectedPosition,
                        { borderColor: splitPosition === 'bottom' ? colors.tint : '#ddd' }
                      ]}
                      onPress={() => setSplitPosition('bottom')}
                    >
                      <Ionicons name="arrow-down" size={20} color={colors.text} />
                      <ThemedText style={styles.positionText}>아래쪽</ThemedText>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Pressable
                      style={[
                        styles.positionOption,
                        splitPosition === 'left' && styles.selectedPosition,
                        { borderColor: splitPosition === 'left' ? colors.tint : '#ddd' }
                      ]}
                      onPress={() => setSplitPosition('left')}
                    >
                      <Ionicons name="arrow-back" size={20} color={colors.text} />
                      <ThemedText style={styles.positionText}>왼쪽</ThemedText>
                    </Pressable>
                    <Pressable
                      style={[
                        styles.positionOption,
                        splitPosition === 'right' && styles.selectedPosition,
                        { borderColor: splitPosition === 'right' ? colors.tint : '#ddd' }
                      ]}
                      onPress={() => setSplitPosition('right')}
                    >
                      <Ionicons name="arrow-forward" size={20} color={colors.text} />
                      <ThemedText style={styles.positionText}>오른쪽</ThemedText>
                    </Pressable>
                  </>
                )}
              </View>
            </View>

            {/* 액션 버튼 */}
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleCreateGroupCard}
                disabled={!selectedGroup}
              >
                <Ionicons name="checkmark-circle" size={20} color="white" />
                <ThemedText style={styles.modalButtonText}>공유 카드 생성</ThemedText>
              </Pressable>

              <Pressable
                style={[styles.modalButton, styles.skipButton, {
                  borderColor: colorScheme === 'dark' ? '#444' : '#ddd',
                }]}
                onPress={() => setShowGroupShareModal(false)}
              >
                <ThemedText style={[styles.modalButtonText, { color: colors.text }]}>
                  취소
                </ThemedText>
              </Pressable>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={16} color={colors.text} />
              <ThemedText style={styles.infoText}>
                생성된 공유 카드는 24시간 동안 유효하며,{'\n'}
                그룹 멤버가 나머지 절반을 완성할 수 있습니다.
              </ThemedText>
            </View>
          </View>
        </View>
      </Modal>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    // borderBottomColor는 동적으로 적용됨
  },
  backButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  cardContainer: {
    alignItems: 'center',
    padding: 20,
  },
  styleSection: {
    padding: 20,
  },
  // 모드 선택 스타일
  modeSelector: {
    flexDirection: 'row',
    marginBottom: 20,
    // backgroundColor는 동적으로 적용됨
    borderRadius: 10,
    padding: 4,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeModeButton: {
    // backgroundColor는 동적으로 적용됨
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    opacity: 0.6, // color 대신 opacity 사용
  },
  activeModeButtonText: {
    opacity: 1, // color 대신 opacity 사용
    fontWeight: '600',
  },
  // 커스텀 모드 스타일
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  customizeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  saveSettingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    marginTop: 10,
    borderRadius: 8,
    // backgroundColor는 동적으로 적용됨
    gap: 8,
  },
  saveSettingsText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  halfButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  halfButtonText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // 사진 관련 스타일
  photoSection: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderRadius: 12,
  },
  photoSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    opacity: 0.8,
  },
  photoButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  photoButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
  },
  selectedImageContainer: {
    position: 'relative',
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedImagePreview: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  advancedModeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  optionLabel: {
    fontSize: 14,
    opacity: 0.8,
  },
  advancedInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 10,
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: 8,
    gap: 8,
  },
  advancedInfoText: {
    fontSize: 12,
    flex: 1,
    lineHeight: 16,
  },
  // 모달 스타일
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  modalCancelText: {
    fontSize: 16,
    opacity: 0.6, // color 대신 opacity 사용하여 테마에 따라 자동 조절
  },
  modalDoneText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // 기존 스타일
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  styleList: {
    flexDirection: 'row',
  },
  styleOption: {
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedStyle: {
    borderColor: '#007AFF',
  },
  stylePreview: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  styleName: {
    fontSize: 12,
  },
  actions: {
    padding: 20,
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  secondaryButton: {
    // backgroundColor는 동적으로 적용됨
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // 그룹 공유 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  groupShareModalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalHeaderGroup: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  closeButton: {
    padding: 5,
  },
  modalSubtitle: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    marginBottom: 20,
  },
  selectionSection: {
    marginVertical: 15,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    opacity: 0.8,
  },
  optionList: {
    flexDirection: 'row',
    maxHeight: 50,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 10,
    gap: 8,
  },
  selectedOption: {
    borderWidth: 2,
  },
  optionText: {
    fontSize: 14,
  },
  splitTypeRow: {
    flexDirection: 'row',
    gap: 15,
  },
  splitTypeOption: {
    flex: 1,
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  selectedSplitType: {
    borderWidth: 2,
  },
  splitPreview: {
    width: 60,
    height: 80,
    flexDirection: 'row',
    marginBottom: 8,
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  splitBox: {
    flex: 1,
  },
  horizontalTop: {
    height: '50%',
    width: '100%',
  },
  horizontalBottom: {
    height: '50%',
    width: '100%',
    backgroundColor: '#f0f0f0',
    position: 'absolute',
    bottom: 0,
  },
  verticalLeft: {
    width: '50%',
    height: '100%',
  },
  verticalRight: {
    width: '50%',
    height: '100%',
    backgroundColor: '#f0f0f0',
  },
  splitTypeText: {
    fontSize: 12,
  },
  positionRow: {
    flexDirection: 'row',
    gap: 15,
  },
  positionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    gap: 8,
  },
  selectedPosition: {
    borderWidth: 2,
  },
  positionText: {
    fontSize: 14,
  },
  modalActions: {
    gap: 12,
    marginTop: 10,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 15,
    padding: 12,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
    borderRadius: 8,
    gap: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.8,
  },
});