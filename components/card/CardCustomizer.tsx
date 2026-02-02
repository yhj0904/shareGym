import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  Switch,
  TextInput,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { CardCustomOptions, WorkoutSession } from '@/types';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import Slider from '@react-native-community/slider';
import WorkoutCardTemplate from '@/components/card/WorkoutCardTemplate';
import useWorkoutStore from '@/stores/workoutStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface CardCustomizerProps {
  customOptions: CardCustomOptions;
  onOptionsChange: (options: CardCustomOptions) => void;
}

// 프리셋 색상 팔레트
const COLOR_PRESETS = [
  { name: '미니멀', colors: ['#FFFFFF', '#F5F5F5'] },
  { name: '그라데이션', colors: ['#667eea', '#764ba2'] },
  { name: '다크', colors: ['#1a1a1a', '#2d2d2d'] },
  { name: '선셋', colors: ['#f093fb', '#f5576c'] },
  { name: '오션', colors: ['#4facfe', '#00f2fe'] },
  { name: '포레스트', colors: ['#43e97b', '#38f9d7'] },
  { name: '파이어', colors: ['#fa709a', '#fee140'] },
  { name: '스페이스', colors: ['#667eea', '#764ba2'] },
];

// 레이아웃 프리셋
const LAYOUT_PRESETS = [
  { id: 'classic', name: '클래식', icon: 'grid-outline' },
  { id: 'modern', name: '모던', icon: 'square-outline' },
  { id: 'minimal', name: '미니멀', icon: 'remove-outline' },
  { id: 'detailed', name: '디테일', icon: 'list-outline' },
];

export default function CardCustomizer({
  customOptions,
  onOptionsChange,
}: CardCustomizerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { lastWorkout } = useWorkoutStore();
  const [showPreview, setShowPreview] = useState(true); // 미리보기 표시 상태

  // 미리보기 카드 크기 계산 (화면 너비에 따라 동적 조정)
  const previewCardWidth = screenWidth > 600 ? 280 : screenWidth * 0.8;
  const previewCardHeight = previewCardWidth * 1.4; // Instagram story ratio

  // 옵션 업데이트 헬퍼 함수
  const updateOption = (key: string, value: any) => {
    onOptionsChange({
      ...customOptions,
      [key]: value,
    });
  };

  // 중첩된 옵션 업데이트 헬퍼 함수
  const updateNestedOption = (parentKey: string, childKey: string, value: any) => {
    onOptionsChange({
      ...customOptions,
      [parentKey]: {
        ...customOptions[parentKey as keyof CardCustomOptions],
        [childKey]: value,
      },
    });
  };

  return (
    <View style={styles.mainContainer}>
      {/* 미리보기 토글 버튼 (작은 화면에서만 표시) */}
      {screenWidth <= 600 && (
        <Pressable
          style={[styles.previewToggle, { backgroundColor: colors.tint }]}
          onPress={() => setShowPreview(!showPreview)}
        >
          <Ionicons
            name={showPreview ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color="white"
          />
          <ThemedText style={styles.previewToggleText}>
            {showPreview ? '미리보기 숨기기' : '미리보기 보기'}
          </ThemedText>
        </Pressable>
      )}

      {/* 실시간 미리보기 카드 */}
      {showPreview && lastWorkout && (
        <View style={[
          styles.previewContainer,
          screenWidth > 600 ? styles.previewContainerTablet : styles.previewContainerMobile
        ]}>
          <ThemedText style={styles.previewTitle}>실시간 미리보기</ThemedText>
          <View style={[styles.previewCard, { width: previewCardWidth, height: previewCardHeight }]}>
            <WorkoutCardTemplate
              workout={lastWorkout}
              style="custom"
              customOptions={customOptions}
            />
          </View>
        </View>
      )}

      {/* 설정 옵션 스크롤뷰 */}
      <ScrollView
        style={[
          styles.container,
          screenWidth > 600 && showPreview && styles.containerTablet
        ]}
        showsVerticalScrollIndicator={false}
      >
      {/* 배경 설정 섹션 */}
      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.sectionTitle}>배경 설정</ThemedText>

        {/* 배경 타입 선택 */}
        <View style={styles.optionRow}>
          <ThemedText style={styles.optionLabel}>배경 타입</ThemedText>
          <View style={styles.buttonGroup}>
            <Pressable
              style={[
                styles.typeButton,
                { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                customOptions.backgroundType === 'solid' && [
                  styles.activeButton,
                  { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                ],
              ]}
              onPress={() => updateOption('backgroundType', 'solid')}
            >
              <ThemedText style={[
                styles.buttonText,
                { color: colors.text }
              ]}>단색</ThemedText>
            </Pressable>
            <Pressable
              style={[
                styles.typeButton,
                { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                customOptions.backgroundType === 'gradient' && [
                  styles.activeButton,
                  { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                ],
              ]}
              onPress={() => updateOption('backgroundType', 'gradient')}
            >
              <ThemedText style={[
                styles.buttonText,
                { color: colors.text }
              ]}>그라데이션</ThemedText>
            </Pressable>
          </View>
        </View>

        {/* 색상 프리셋 */}
        {customOptions.backgroundType === 'gradient' && (
          <View style={styles.colorPresetsContainer}>
            <ThemedText style={styles.optionLabel}>색상 프리셋</ThemedText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.presetList}
            >
              {COLOR_PRESETS.map((preset, index) => (
                <Pressable
                  key={index}
                  style={styles.presetItem}
                  onPress={() => updateOption('gradientColors', preset.colors)}
                >
                  <View
                    style={[
                      styles.presetColor,
                      {
                        backgroundColor: preset.colors[0],
                        borderColor:
                          JSON.stringify(customOptions.gradientColors) ===
                          JSON.stringify(preset.colors)
                            ? colors.tint
                            : 'transparent',
                      },
                    ]}
                  />
                  <ThemedText style={styles.presetName}>{preset.name}</ThemedText>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </ThemedView>

      {/* 텍스트 설정 섹션 */}
      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.sectionTitle}>텍스트 설정</ThemedText>

        {/* 폰트 크기 */}
        <View style={styles.optionRow}>
          <ThemedText style={styles.optionLabel}>폰트 크기</ThemedText>
          <View style={styles.buttonGroup}>
            {['small', 'medium', 'large'].map((size) => (
              <Pressable
                key={size}
                style={[
                  styles.sizeButton,
                  { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                  customOptions.fontSize === size && [
                    styles.activeButton,
                    { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                  ],
                ]}
                onPress={() => updateOption('fontSize', size)}
              >
                <ThemedText style={[
                  styles.buttonText,
                  { color: colors.text }
                ]}>
                  {size === 'small' ? '작게' : size === 'medium' ? '보통' : '크게'}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 텍스트 색상 */}
        <View style={styles.optionRow}>
          <ThemedText style={styles.optionLabel}>텍스트 색상</ThemedText>
          <View style={styles.colorOptions}>
            <Pressable
              style={[
                styles.colorButton,
                {
                  backgroundColor: '#000000',
                  borderColor: colorScheme === 'dark' ? '#555' : '#DDD'
                }
              ]}
              onPress={() => {
                updateOption('primaryTextColor', '#000000');
                updateOption('secondaryTextColor', '#666666');
              }}
            />
            <Pressable
              style={[
                styles.colorButton,
                {
                  backgroundColor: '#FFFFFF',
                  borderColor: colorScheme === 'dark' ? '#555' : '#DDD'
                }
              ]}
              onPress={() => {
                updateOption('primaryTextColor', '#FFFFFF');
                updateOption('secondaryTextColor', '#CCCCCC');
              }}
            />
            <Pressable
              style={[
                styles.colorButton,
                {
                  backgroundColor: '#FF6B6B',
                  borderColor: colorScheme === 'dark' ? '#555' : '#DDD'
                }
              ]}
              onPress={() => {
                updateOption('primaryTextColor', '#FF6B6B');
                updateOption('secondaryTextColor', '#FF8787');
              }}
            />
            <Pressable
              style={[
                styles.colorButton,
                {
                  backgroundColor: '#4ECDC4',
                  borderColor: colorScheme === 'dark' ? '#555' : '#DDD'
                }
              ]}
              onPress={() => {
                updateOption('primaryTextColor', '#4ECDC4');
                updateOption('secondaryTextColor', '#7EDDD6');
              }}
            />
          </View>
        </View>
      </ThemedView>

      {/* 레이아웃 설정 섹션 */}
      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.sectionTitle}>레이아웃</ThemedText>

        {/* 레이아웃 스타일 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.layoutList}
        >
          {LAYOUT_PRESETS.map((layout) => (
            <Pressable
              key={layout.id}
              style={[
                styles.layoutItem,
                { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F5F5F5' },
                customOptions.layout === layout.id && [
                  styles.activeLayout,
                  { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                ],
              ]}
              onPress={() => updateOption('layout', layout.id)}
            >
              <Ionicons
                name={layout.icon as any}
                size={32}
                color={customOptions.layout === layout.id ? colors.tint : colors.text}
              />
              <ThemedText style={[
                styles.layoutName,
                { color: colors.text }
              ]}>{layout.name}</ThemedText>
            </Pressable>
          ))}
        </ScrollView>

        {/* 로고 표시 */}
        <View style={styles.switchRow}>
          <ThemedText style={styles.optionLabel}>로고 표시</ThemedText>
          <Switch
            value={customOptions.showLogo}
            onValueChange={(value) => updateOption('showLogo', value)}
            trackColor={{ false: '#767577', true: colors.tint }}
          />
        </View>
      </ThemedView>

      {/* 정보 표시 설정 섹션 */}
      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.sectionTitle}>표시할 정보</ThemedText>

        {/* 통계 정보 토글 */}
        {Object.entries(customOptions.showStats).map(([key, value]) => (
          <View key={key} style={styles.switchRow}>
            <ThemedText style={styles.optionLabel}>
              {key === 'duration' ? '운동 시간' :
               key === 'volume' ? '총 볼륨' :
               key === 'sets' ? '세트 수' :
               key === 'distance' ? '거리' : '칼로리'}
            </ThemedText>
            <Switch
              value={value}
              onValueChange={(newValue) => updateNestedOption('showStats', key, newValue)}
              trackColor={{ false: '#767577', true: colors.tint }}
            />
          </View>
        ))}

        {/* 운동 목록 표시 */}
        <View style={styles.switchRow}>
          <ThemedText style={styles.optionLabel}>운동 목록</ThemedText>
          <Switch
            value={customOptions.showExerciseList}
            onValueChange={(value) => updateOption('showExerciseList', value)}
            trackColor={{ false: '#767577', true: colors.tint }}
          />
        </View>

        {/* 표시할 운동 개수 */}
        {customOptions.showExerciseList && (
          <View style={styles.sliderRow}>
            <ThemedText style={styles.optionLabel}>
              표시할 운동 개수: {customOptions.maxExercisesToShow}개
            </ThemedText>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={customOptions.maxExercisesToShow}
              onValueChange={(value) => updateOption('maxExercisesToShow', value)}
              minimumTrackTintColor={colors.tint}
              maximumTrackTintColor="#CCC"
            />
          </View>
        )}

        {/* 날짜 표시 */}
        <View style={styles.switchRow}>
          <ThemedText style={styles.optionLabel}>날짜 표시</ThemedText>
          <Switch
            value={customOptions.showDate}
            onValueChange={(value) => updateOption('showDate', value)}
            trackColor={{ false: '#767577', true: colors.tint }}
          />
        </View>
      </ThemedView>

      {/* 추가 요소 섹션 */}
      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.sectionTitle}>추가 요소</ThemedText>

        {/* 제목 입력 */}
        <View style={styles.inputRow}>
          <ThemedText style={styles.optionLabel}>제목</ThemedText>
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF'
              }
            ]}
            value={customOptions.title}
            onChangeText={(text) => updateOption('title', text)}
            placeholder="오운완 🔥"
            placeholderTextColor={colors.text + '50'}
          />
        </View>

        {/* 부제목 입력 */}
        <View style={styles.inputRow}>
          <ThemedText style={styles.optionLabel}>부제목</ThemedText>
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF'
              }
            ]}
            value={customOptions.subtitle}
            onChangeText={(text) => updateOption('subtitle', text)}
            placeholder="오늘도 열심히!"
            placeholderTextColor={colors.text + '50'}
          />
        </View>

        {/* 해시태그 입력 */}
        <View style={styles.inputRow}>
          <ThemedText style={styles.optionLabel}>해시태그</ThemedText>
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF'
              }
            ]}
            value={customOptions.hashtags?.join(' ')}
            onChangeText={(text) =>
              updateOption('hashtags', text.split(' ').filter(tag => tag.length > 0))
            }
            placeholder="#오운완 #헬스타그램"
            placeholderTextColor={colors.text + '50'}
          />
        </View>
      </ThemedView>

      {/* 효과 설정 섹션 */}
      <ThemedView style={[styles.section, { borderBottomColor: colors.border }]}>
        <ThemedText style={styles.sectionTitle}>효과</ThemedText>

        {/* 모서리 둥글기 */}
        <View style={styles.sliderRow}>
          <ThemedText style={styles.optionLabel}>
            모서리 둥글기: {customOptions.borderRadius}px
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={30}
            step={1}
            value={customOptions.borderRadius}
            onValueChange={(value) => updateOption('borderRadius', value)}
            minimumTrackTintColor={colors.tint}
            maximumTrackTintColor="#CCC"
          />
        </View>

        {/* 그림자 효과 */}
        <View style={styles.switchRow}>
          <ThemedText style={styles.optionLabel}>그림자 효과</ThemedText>
          <Switch
            value={customOptions.shadowEnabled}
            onValueChange={(value) => updateOption('shadowEnabled', value)}
            trackColor={{ false: '#767577', true: colors.tint }}
          />
        </View>
      </ThemedView>
    </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    flexDirection: screenWidth > 600 ? 'row' : 'column',
  },
  container: {
    flex: 1,
  },
  containerTablet: {
    flex: 2, // 태블릿에서는 설정 영역이 2/3 차지
  },
  previewContainer: {
    padding: 15,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  previewContainerTablet: {
    flex: 1, // 태블릿에서는 미리보기가 1/3 차지
    borderRightWidth: 1,
    borderRightColor: '#E5E5E5',
    borderBottomWidth: 0,
  },
  previewContainerMobile: {
    maxHeight: screenHeight * 0.4, // 모바일에서는 화면의 40% 높이까지
  },
  previewToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    marginHorizontal: 15,
    marginVertical: 10,
    borderRadius: 8,
    gap: 8,
  },
  previewToggleText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  previewTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    opacity: 0.8,
  },
  previewCard: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    // borderBottomColor는 컴포넌트에서 동적으로 설정
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  optionRow: {
    marginBottom: 20,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sliderRow: {
    marginBottom: 20,
  },
  inputRow: {
    marginBottom: 20,
  },
  optionLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 10,
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    // backgroundColor는 다크모드 대응을 위해 인라인 스타일로 적용
    borderWidth: 2,
    borderColor: 'transparent',
  },
  sizeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    // backgroundColor는 다크모드 대응을 위해 인라인 스타일로 적용
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeButton: {
    borderColor: '#007AFF',
    // backgroundColor는 다크모드 대응을 위해 인라인 스타일로 적용
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  colorPresetsContainer: {
    marginTop: 15,
  },
  presetList: {
    flexDirection: 'row',
    marginTop: 10,
  },
  presetItem: {
    alignItems: 'center',
    marginRight: 15,
  },
  presetColor: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 3,
    marginBottom: 5,
  },
  presetName: {
    fontSize: 11,
  },
  colorOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  colorButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    // borderColor는 다크모드 대응을 위해 인라인 스타일로 적용
  },
  layoutList: {
    flexDirection: 'row',
    marginTop: 10,
  },
  layoutItem: {
    alignItems: 'center',
    padding: 15,
    marginRight: 15,
    borderRadius: 10,
    // backgroundColor는 다크모드 대응을 위해 인라인 스타일로 적용
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeLayout: {
    borderColor: '#007AFF',
    // backgroundColor는 다크모드 대응을 위해 인라인 스타일로 적용
  },
  layoutName: {
    fontSize: 12,
    marginTop: 5,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    // color와 borderColor는 인라인 스타일로 적용
  },
});