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
} from 'react-native';
// SafeAreaProvider가 상위 _layout.tsx에서 제공되므로 제거
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
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
  const viewShotRef = useRef<ViewShot>(null);

  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('minimal');
  const [isGenerating, setIsGenerating] = useState(false);
  const [useCustomMode, setUseCustomMode] = useState(false); // 커스텀 모드 여부
  const [customOptions, setCustomOptions] = useState<CardCustomOptions>(defaultCustomOptions);
  const [showCustomizer, setShowCustomizer] = useState(false); // 커스터마이저 모달 표시 여부
  const [useAdvancedMode, setUseAdvancedMode] = useState(false); // 고급 모드 여부
  const [showPresetManager, setShowPresetManager] = useState(false); // 프리셋 관리자 표시 여부

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

  const cardStyles = [
    { id: 'minimal', name: '미니멀', colors: ['#FFFFFF', '#F5F5F5'] },
    { id: 'gradient', name: '그라데이션', colors: ['#667eea', '#764ba2'] },
    { id: 'dark', name: '다크', colors: ['#1a1a1a', '#2d2d2d'] },
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
                <View
                  style={[
                    styles.stylePreview,
                    { backgroundColor: style.colors[0] },
                  ]}
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
});