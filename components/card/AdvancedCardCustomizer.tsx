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
import { CardCustomOptions } from '@/types';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import Slider from '@react-native-community/slider';
import WorkoutCardTemplate from '@/components/card/WorkoutCardTemplate';
import useWorkoutStore from '@/stores/workoutStore';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface AdvancedCardCustomizerProps {
  customOptions: CardCustomOptions;
  onOptionsChange: (options: CardCustomOptions) => void;
}

// 탭 타입
type CustomizerTab = 'basic' | 'text' | 'layout' | 'stats' | 'effects' | 'advanced';

// 아이콘 옵션들
const ICON_OPTIONS = {
  duration: ['time-outline', 'timer-outline', 'stopwatch-outline', 'hourglass-outline'],
  volume: ['barbell-outline', 'fitness-outline', 'trending-up-outline'],
  sets: ['layers-outline', 'list-outline', 'grid-outline'],
  distance: ['navigate-outline', 'map-outline', 'location-outline'],
  calories: ['flame-outline', 'flash-outline', 'bonfire-outline'],
};

// 근육군별 기본 색상
const DEFAULT_MUSCLE_COLORS = {
  chest: '#FF6B6B',
  back: '#4ECDC4',
  shoulders: '#45B7D1',
  legs: '#96E6B3',
  arms: '#F7DC6F',
  abs: '#BB8FCE',
  cardio: '#F8B739',
};

// 색상 프리셋
const COLOR_PRESETS = [
  '#000000', '#FFFFFF', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96E6B3',
  '#F7DC6F', '#BB8FCE', '#F8B739', '#667eea', '#764ba2', '#f093fb',
  '#f5576c', '#2E3192', '#1BFFFF', '#FF512F', '#F09819', '#1a1a1a',
];

export default function AdvancedCardCustomizer({
  customOptions,
  onOptionsChange,
}: AdvancedCardCustomizerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { lastWorkout } = useWorkoutStore();
  const [activeTab, setActiveTab] = useState<CustomizerTab>('basic');
  const [showPreview, setShowPreview] = useState(true); // 미리보기 표시 상태

  // 미리보기 카드 크기 계산
  const previewCardWidth = screenWidth > 600 ? 240 : screenWidth * 0.7;
  const previewCardHeight = previewCardWidth * 1.4; // Instagram story ratio

  // 옵션 업데이트 헬퍼
  const updateOption = (key: string, value: any) => {
    onOptionsChange({
      ...customOptions,
      [key]: value,
    });
  };

  // 중첩된 옵션 업데이트
  const updateNestedOption = (parentKey: string, childKey: string, value: any) => {
    onOptionsChange({
      ...customOptions,
      [parentKey]: {
        ...customOptions[parentKey as keyof CardCustomOptions],
        [childKey]: value,
      },
    });
  };

  // 색상 선택 헬퍼 함수
  const selectColor = (targetKey: string, color: string) => {
    if (targetKey.includes('.')) {
      const [parent, child] = targetKey.split('.');
      updateNestedOption(parent, child, color);
    } else {
      updateOption(targetKey, color);
    }
  };

  // 탭 렌더링
  const renderTabContent = () => {
    switch (activeTab) {
      case 'basic':
        return renderBasicTab();
      case 'text':
        return renderTextTab();
      case 'layout':
        return renderLayoutTab();
      case 'stats':
        return renderStatsTab();
      case 'effects':
        return renderEffectsTab();
      case 'advanced':
        return renderAdvancedTab();
      default:
        return null;
    }
  };

  // 기본 설정 탭
  const renderBasicTab = () => (
    <View style={styles.tabContent}>
      {/* 배경 타입 */}
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>배경 스타일</ThemedText>

        <ThemedText style={styles.optionLabel}>배경 타입</ThemedText>
        <View style={styles.buttonGrid}>
          {['solid', 'gradient', 'pattern'].map((type) => (
            <Pressable
              key={type}
              style={[
                styles.gridButton,
                { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                customOptions.backgroundType === type && [
                  styles.activeButton,
                  { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                ],
              ]}
              onPress={() => updateOption('backgroundType', type)}
            >
              <ThemedText style={[
                styles.buttonText,
                { color: colors.text }
              ]}>
                {type === 'solid' ? '단색' : type === 'gradient' ? '그라데이션' : '패턴'}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* 그라데이션 설정 */}
        {customOptions.backgroundType === 'gradient' && (
          <>
            <View style={styles.optionRow}>
              <ThemedText style={styles.optionLabel}>그라데이션 타입</ThemedText>
              <View style={styles.buttonGroup}>
                <Pressable
                  style={[
                    styles.typeButton,
                    { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                    customOptions.gradientType === 'linear' && [
                      styles.activeButton,
                      { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                    ],
                  ]}
                  onPress={() => updateOption('gradientType', 'linear')}
                >
                  <ThemedText style={[styles.buttonText, { color: colors.text }]}>선형</ThemedText>
                </Pressable>
                <Pressable
                  style={[
                    styles.typeButton,
                    { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                    customOptions.gradientType === 'radial' && [
                      styles.activeButton,
                      { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                    ],
                  ]}
                  onPress={() => updateOption('gradientType', 'radial')}
                >
                  <ThemedText style={[styles.buttonText, { color: colors.text }]}>방사형</ThemedText>
                </Pressable>
              </View>
            </View>

            <View style={styles.sliderRow}>
              <ThemedText style={styles.optionLabel}>
                그라데이션 각도: {customOptions.gradientAngle || 0}°
              </ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={360}
                step={15}
                value={customOptions.gradientAngle || 0}
                onValueChange={(value) => updateOption('gradientAngle', value)}
                minimumTrackTintColor={colors.tint}
                maximumTrackTintColor="#CCC"
              />
            </View>

            {/* 색상 프리셋 */}
            <ThemedText style={styles.optionLabel}>색상 선택</ThemedText>
            <View style={styles.colorPresetGrid}>
              {COLOR_PRESETS.map((color) => (
                <Pressable
                  key={color}
                  style={[
                    styles.colorPresetButton,
                    { backgroundColor: color },
                    customOptions.gradientColors?.[0] === color && styles.selectedColorPreset
                  ]}
                  onPress={() => updateOption('gradientColors', [color, color + '80'])}
                />
              ))}
            </View>
          </>
        )}

        {/* 패턴 선택 */}
        {customOptions.backgroundType === 'pattern' && (
          <View style={styles.patternGrid}>
            {['dots', 'lines', 'grid', 'waves'].map((pattern) => (
              <Pressable
                key={pattern}
                style={[
                  styles.patternButton,
                  { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                  customOptions.backgroundPattern === pattern && [
                    styles.activeButton,
                    { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                  ],
                ]}
                onPress={() => updateOption('backgroundPattern', pattern)}
              >
                <ThemedText style={[
                  styles.buttonText,
                  { color: colors.text }
                ]}>
                  {pattern === 'dots' ? '도트' :
                   pattern === 'lines' ? '라인' :
                   pattern === 'grid' ? '그리드' : '웨이브'}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        )}

        {/* 배경 투명도 */}
        <View style={styles.sliderRow}>
          <ThemedText style={styles.optionLabel}>
            배경 투명도: {Math.round((customOptions.backgroundOpacity || 1) * 100)}%
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={1}
            step={0.05}
            value={customOptions.backgroundOpacity || 1}
            onValueChange={(value) => updateOption('backgroundOpacity', value)}
            minimumTrackTintColor={colors.tint}
            maximumTrackTintColor="#CCC"
          />
        </View>
      </View>
    </View>
  );

  // 텍스트 설정 탭
  const renderTextTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>텍스트 스타일링</ThemedText>

        {/* 제목 스타일 */}
        <View style={styles.textStyleSection}>
          <ThemedText style={styles.subsectionTitle}>제목 스타일</ThemedText>

          <View style={styles.inputRow}>
            <ThemedText style={styles.optionLabel}>크기</ThemedText>
            <TextInput
              style={[
                styles.numberInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF'
                }
              ]}
              value={String(customOptions.titleStyle?.fontSize || 32)}
              onChangeText={(text) =>
                updateNestedOption('titleStyle', 'fontSize', parseInt(text) || 32)
              }
              keyboardType="numeric"
              placeholder="32"
              placeholderTextColor={colors.text + '50'}
            />
          </View>

          <View style={styles.optionRow}>
            <ThemedText style={styles.optionLabel}>굵기</ThemedText>
            <View style={styles.buttonGroup}>
              {['normal', 'bold', '600', '700', '800'].map((weight) => (
                <Pressable
                  key={weight}
                  style={[
                    styles.weightButton,
                    { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                    customOptions.titleStyle?.fontWeight === weight && [
                      styles.activeButton,
                      { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                    ],
                  ]}
                  onPress={() => updateNestedOption('titleStyle', 'fontWeight', weight)}
                >
                  <ThemedText style={[
                    styles.smallButtonText,
                    { fontWeight: weight as any, color: colors.text }
                  ]}>
                    {weight === 'normal' ? '기본' : weight === 'bold' ? '굵게' : weight}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={styles.optionRow}>
            <ThemedText style={styles.optionLabel}>스타일</ThemedText>
            <View style={styles.buttonGroup}>
              <Pressable
                style={[
                  styles.typeButton,
                  { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                  customOptions.titleStyle?.fontStyle === 'normal' && [
                    styles.activeButton,
                    { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                  ],
                ]}
                onPress={() => updateNestedOption('titleStyle', 'fontStyle', 'normal')}
              >
                <ThemedText style={[styles.buttonText, { color: colors.text }]}>일반</ThemedText>
              </Pressable>
              <Pressable
                style={[
                  styles.typeButton,
                  { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                  customOptions.titleStyle?.fontStyle === 'italic' && [
                    styles.activeButton,
                    { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                  ],
                ]}
                onPress={() => updateNestedOption('titleStyle', 'fontStyle', 'italic')}
              >
                <ThemedText style={[styles.buttonText, { fontStyle: 'italic', color: colors.text }]}>
                  이탤릭
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.optionRow}>
            <ThemedText style={styles.optionLabel}>대소문자 변환</ThemedText>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.buttonGroup}>
                {['none', 'uppercase', 'lowercase', 'capitalize'].map((transform) => (
                  <Pressable
                    key={transform}
                    style={[
                      styles.transformButton,
                      { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                      customOptions.titleStyle?.textTransform === transform && [
                        styles.activeButton,
                        { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                      ],
                    ]}
                    onPress={() => updateNestedOption('titleStyle', 'textTransform', transform)}
                  >
                    <ThemedText style={[styles.smallButtonText, { color: colors.text }]}>
                      {transform === 'none' ? '없음' :
                       transform === 'uppercase' ? '대문자' :
                       transform === 'lowercase' ? '소문자' : '첫글자 대문자'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.sliderRow}>
            <ThemedText style={styles.optionLabel}>
              자간: {customOptions.titleStyle?.letterSpacing || 0}px
            </ThemedText>
            <Slider
              style={styles.slider}
              minimumValue={-2}
              maximumValue={5}
              step={0.5}
              value={customOptions.titleStyle?.letterSpacing || 0}
              onValueChange={(value) => updateNestedOption('titleStyle', 'letterSpacing', value)}
              minimumTrackTintColor={colors.tint}
              maximumTrackTintColor="#CCC"
            />
          </View>
        </View>

        {/* 부제목 스타일 */}
        <View style={styles.textStyleSection}>
          <ThemedText style={styles.subsectionTitle}>부제목 스타일</ThemedText>

          <View style={styles.inputRow}>
            <ThemedText style={styles.optionLabel}>크기</ThemedText>
            <TextInput
              style={[
                styles.numberInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF'
                }
              ]}
              value={String(customOptions.subtitleStyle?.fontSize || 16)}
              onChangeText={(text) =>
                updateNestedOption('subtitleStyle', 'fontSize', parseInt(text) || 16)
              }
              keyboardType="numeric"
              placeholder="16"
              placeholderTextColor={colors.text + '50'}
            />
          </View>
        </View>

        {/* 통계 스타일 */}
        <View style={styles.textStyleSection}>
          <ThemedText style={styles.subsectionTitle}>통계 텍스트</ThemedText>

          <View style={styles.inputRow}>
            <ThemedText style={styles.optionLabel}>크기</ThemedText>
            <TextInput
              style={[
                styles.numberInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF'
                }
              ]}
              value={String(customOptions.statsStyle?.fontSize || 20)}
              onChangeText={(text) =>
                updateNestedOption('statsStyle', 'fontSize', parseInt(text) || 20)
              }
              keyboardType="numeric"
              placeholder="20"
              placeholderTextColor={colors.text + '50'}
            />
          </View>
        </View>
      </View>
    </View>
  );

  // 레이아웃 설정 탭
  const renderLayoutTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>레이아웃 설정</ThemedText>

        {/* 레이아웃 스타일 */}
        <ThemedText style={styles.optionLabel}>레이아웃 스타일</ThemedText>
        <View style={styles.layoutGrid}>
          {['classic', 'modern', 'minimal', 'detailed', 'compact', 'expanded'].map((layout) => (
            <Pressable
              key={layout}
              style={[
                styles.layoutButton,
                { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F5F5F5' },
                customOptions.layout === layout && [
                  styles.activeButton,
                  { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                ],
              ]}
              onPress={() => updateOption('layout', layout)}
            >
              <Ionicons
                name={
                  layout === 'classic' ? 'grid-outline' :
                  layout === 'modern' ? 'square-outline' :
                  layout === 'minimal' ? 'remove-outline' :
                  layout === 'detailed' ? 'list-outline' :
                  layout === 'compact' ? 'contract-outline' :
                  'expand-outline' as any
                }
                size={24}
                color={customOptions.layout === layout ? colors.tint : colors.text}
              />
              <ThemedText style={[styles.layoutButtonText, { color: colors.text }]}>
                {layout === 'classic' ? '클래식' :
                 layout === 'modern' ? '모던' :
                 layout === 'minimal' ? '미니멀' :
                 layout === 'detailed' ? '디테일' :
                 layout === 'compact' ? '컴팩트' : '확장'}
              </ThemedText>
            </Pressable>
          ))}
        </View>

        {/* 정렬 */}
        <ThemedText style={styles.optionLabel}>텍스트 정렬</ThemedText>
        <View style={styles.buttonGroup}>
          {['left', 'center', 'right'].map((align) => (
            <Pressable
              key={align}
              style={[
                styles.alignButton,
                { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                customOptions.alignment === align && [
                  styles.activeButton,
                  { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                ],
              ]}
              onPress={() => updateOption('alignment', align)}
            >
              <Ionicons
                name={`text-${align}` as any}
                size={20}
                color={customOptions.alignment === align ? colors.tint : colors.text}
              />
            </Pressable>
          ))}
        </View>

        {/* 패딩 */}
        <View style={styles.sliderRow}>
          <ThemedText style={styles.optionLabel}>
            내부 여백: {customOptions.padding || 25}px
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={10}
            maximumValue={40}
            step={5}
            value={customOptions.padding || 25}
            onValueChange={(value) => updateOption('padding', value)}
            minimumTrackTintColor={colors.tint}
            maximumTrackTintColor="#CCC"
          />
        </View>

        {/* 요소 간격 */}
        <View style={styles.sliderRow}>
          <ThemedText style={styles.optionLabel}>
            요소 간격: {customOptions.spacing || 15}px
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={5}
            maximumValue={30}
            step={5}
            value={customOptions.spacing || 15}
            onValueChange={(value) => updateOption('spacing', value)}
            minimumTrackTintColor={colors.tint}
            maximumTrackTintColor="#CCC"
          />
        </View>

        {/* 로고 설정 */}
        <View style={styles.logoSection}>
          <ThemedText style={styles.subsectionTitle}>로고/브랜딩</ThemedText>

          <View style={styles.switchRow}>
            <ThemedText style={styles.optionLabel}>로고 표시</ThemedText>
            <Switch
              value={customOptions.showLogo}
              onValueChange={(value) => updateOption('showLogo', value)}
              trackColor={{ false: '#767577', true: colors.tint }}
            />
          </View>

          {customOptions.showLogo && (
            <>
              <ThemedText style={styles.optionLabel}>로고 위치</ThemedText>
              <View style={styles.positionGrid}>
                {['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'].map((pos) => (
                  <Pressable
                    key={pos}
                    style={[
                      styles.positionButton,
                      { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                      customOptions.logoPosition === pos && [
                        styles.activeButton,
                        { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                      ],
                    ]}
                    onPress={() => updateOption('logoPosition', pos)}
                  >
                    <ThemedText style={[styles.smallButtonText, { color: colors.text }]}>
                      {pos === 'top-left' ? '좌상' :
                       pos === 'top-right' ? '우상' :
                       pos === 'bottom-left' ? '좌하' :
                       pos === 'bottom-right' ? '우하' : '중앙'}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>

              <View style={styles.sliderRow}>
                <ThemedText style={styles.optionLabel}>
                  로고 크기: {customOptions.logoSize || 24}px
                </ThemedText>
                <Slider
                  style={styles.slider}
                  minimumValue={16}
                  maximumValue={48}
                  step={4}
                  value={customOptions.logoSize || 24}
                  onValueChange={(value) => updateOption('logoSize', value)}
                  minimumTrackTintColor={colors.tint}
                  maximumTrackTintColor="#CCC"
                />
              </View>
            </>
          )}

          {/* 워터마크 */}
          <View style={styles.inputRow}>
            <ThemedText style={styles.optionLabel}>워터마크 텍스트</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF'
                }
              ]}
              value={customOptions.watermarkText}
              onChangeText={(text) => updateOption('watermarkText', text)}
              placeholder="@username"
              placeholderTextColor={colors.text + '50'}
            />
          </View>

          {customOptions.watermarkText && (
            <View style={styles.sliderRow}>
              <ThemedText style={styles.optionLabel}>
                워터마크 투명도: {Math.round((customOptions.watermarkOpacity || 0.3) * 100)}%
              </ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={0.1}
                maximumValue={1}
                step={0.1}
                value={customOptions.watermarkOpacity || 0.3}
                onValueChange={(value) => updateOption('watermarkOpacity', value)}
                minimumTrackTintColor={colors.tint}
                maximumTrackTintColor="#CCC"
              />
            </View>
          )}
        </View>
      </View>
    </View>
  );

  // 통계 설정 탭
  const renderStatsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>통계 표시 설정</ThemedText>

        {/* 표시할 통계 선택 */}
        <ThemedText style={styles.subsectionTitle}>표시할 정보</ThemedText>
        {Object.entries({
          duration: '운동 시간',
          volume: '총 볼륨',
          sets: '세트 수',
          distance: '거리',
          calories: '칼로리',
          heartRate: '심박수',
          intensity: '운동 강도',
        }).map(([key, label]) => (
          <View key={key} style={styles.switchRow}>
            <ThemedText style={styles.optionLabel}>{label}</ThemedText>
            <Switch
              value={customOptions.showStats[key as keyof typeof customOptions.showStats] || false}
              onValueChange={(value) => updateNestedOption('showStats', key, value)}
              trackColor={{ false: '#767577', true: colors.tint }}
            />
          </View>
        ))}

        {/* 통계 아이콘 커스터마이징 */}
        <ThemedText style={styles.subsectionTitle}>통계 아이콘</ThemedText>
        {Object.entries(ICON_OPTIONS).map(([stat, icons]) => (
          customOptions.showStats[stat as keyof typeof customOptions.showStats] && (
            <View key={stat} style={styles.iconSection}>
              <ThemedText style={styles.optionLabel}>
                {stat === 'duration' ? '시간' :
                 stat === 'volume' ? '볼륨' :
                 stat === 'sets' ? '세트' :
                 stat === 'distance' ? '거리' : '칼로리'} 아이콘
              </ThemedText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.iconGrid}>
                  {icons.map((icon) => (
                    <Pressable
                      key={icon}
                      style={[
                        styles.iconButton,
                        { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                        customOptions.statsIcons?.[stat as keyof typeof customOptions.statsIcons] === icon && [
                          styles.activeButton,
                          { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                        ],
                      ]}
                      onPress={() => updateNestedOption('statsIcons', stat, icon)}
                    >
                      <Ionicons
                        name={icon as any}
                        size={24}
                        color={
                          customOptions.statsIcons?.[stat as keyof typeof customOptions.statsIcons] === icon
                            ? colors.tint
                            : colors.text
                        }
                      />
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
            </View>
          )
        ))}

        {/* 아이콘 크기 */}
        <View style={styles.sliderRow}>
          <ThemedText style={styles.optionLabel}>
            아이콘 크기: {customOptions.iconSize || 32}px
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={20}
            maximumValue={48}
            step={4}
            value={customOptions.iconSize || 32}
            onValueChange={(value) => updateOption('iconSize', value)}
            minimumTrackTintColor={colors.tint}
            maximumTrackTintColor="#CCC"
          />
        </View>

        {/* 운동 목록 스타일 */}
        <ThemedText style={styles.subsectionTitle}>운동 목록 스타일</ThemedText>

        <View style={styles.switchRow}>
          <ThemedText style={styles.optionLabel}>운동 목록 표시</ThemedText>
          <Switch
            value={customOptions.showExerciseList}
            onValueChange={(value) => updateOption('showExerciseList', value)}
            trackColor={{ false: '#767577', true: colors.tint }}
          />
        </View>

        {customOptions.showExerciseList && (
          <>
            <View style={styles.sliderRow}>
              <ThemedText style={styles.optionLabel}>
                표시할 운동 수: {customOptions.maxExercisesToShow}개
              </ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={15}
                step={1}
                value={customOptions.maxExercisesToShow}
                onValueChange={(value) => updateOption('maxExercisesToShow', value)}
                minimumTrackTintColor={colors.tint}
                maximumTrackTintColor="#CCC"
              />
            </View>

            {/* 운동 목록 옵션들 */}
            {Object.entries({
              showNumbers: '번호 표시',
              showSets: '세트 정보',
              showWeight: '무게 정보',
              highlightPR: 'PR 하이라이트',
              colorByMuscle: '근육군별 색상',
            }).map(([key, label]) => (
              <View key={key} style={styles.switchRow}>
                <ThemedText style={styles.optionLabel}>{label}</ThemedText>
                <Switch
                  value={customOptions.exerciseListStyle?.[key as keyof typeof customOptions.exerciseListStyle] || false}
                  onValueChange={(value) => updateNestedOption('exerciseListStyle', key, value)}
                  trackColor={{ false: '#767577', true: colors.tint }}
                />
              </View>
            ))}

            {/* 근육군별 색상 설정 */}
            {customOptions.exerciseListStyle?.colorByMuscle && (
              <View style={styles.muscleColorSection}>
                <ThemedText style={styles.optionLabel}>근육군별 색상</ThemedText>
                {Object.entries(DEFAULT_MUSCLE_COLORS).map(([muscle, color]) => (
                  <Pressable
                    key={muscle}
                    style={[
                      styles.muscleColorRow,
                      { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F5F5F5' }
                    ]}
                    onPress={() => setShowColorPicker(`muscleColors.${muscle}`)}
                  >
                    <ThemedText style={[styles.muscleLabel, { color: colors.text }]}>
                      {muscle === 'chest' ? '가슴' :
                       muscle === 'back' ? '등' :
                       muscle === 'shoulders' ? '어깨' :
                       muscle === 'legs' ? '하체' :
                       muscle === 'arms' ? '팔' :
                       muscle === 'abs' ? '복근' : '유산소'}
                    </ThemedText>
                    <View
                      style={[
                        styles.colorPreview,
                        { backgroundColor: customOptions.muscleColors?.[muscle as keyof typeof customOptions.muscleColors] || color }
                      ]}
                    />
                  </Pressable>
                ))}
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );

  // 효과 설정 탭
  const renderEffectsTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>시각 효과</ThemedText>

        {/* 테두리 설정 */}
        <ThemedText style={styles.subsectionTitle}>테두리</ThemedText>

        <View style={styles.sliderRow}>
          <ThemedText style={styles.optionLabel}>
            모서리 둥글기: {customOptions.borderRadius}px
          </ThemedText>
          <Slider
            style={styles.slider}
            minimumValue={0}
            maximumValue={50}
            step={2}
            value={customOptions.borderRadius}
            onValueChange={(value) => updateOption('borderRadius', value)}
            minimumTrackTintColor={colors.tint}
            maximumTrackTintColor="#CCC"
          />
        </View>

        <View style={styles.optionRow}>
          <ThemedText style={styles.optionLabel}>테두리 스타일</ThemedText>
          <View style={styles.buttonGroup}>
            {['solid', 'dashed', 'double'].map((style) => (
              <Pressable
                key={style}
                style={[
                  styles.borderStyleButton,
                  { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                  customOptions.borderStyle === style && [
                    styles.activeButton,
                    { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                  ],
                ]}
                onPress={() => updateOption('borderStyle', style)}
              >
                <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                  {style === 'solid' ? '실선' :
                   style === 'dashed' ? '점선' : '이중선'}
                </ThemedText>
              </Pressable>
            ))}
          </View>
        </View>

        {customOptions.borderWidth && customOptions.borderWidth > 0 && (
          <>
            <View style={styles.sliderRow}>
              <ThemedText style={styles.optionLabel}>
                테두리 두께: {customOptions.borderWidth}px
              </ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={5}
                step={0.5}
                value={customOptions.borderWidth || 0}
                onValueChange={(value) => updateOption('borderWidth', value)}
                minimumTrackTintColor={colors.tint}
                maximumTrackTintColor="#CCC"
              />
            </View>

            <Pressable
              style={[
                styles.colorPickerButton,
                { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' }
              ]}
              onPress={() => setShowColorPicker('borderColor')}
            >
              <ThemedText style={[
                styles.colorPickerText,
                { color: colors.text }
              ]}>
                테두리 색상 선택
              </ThemedText>
              <View
                style={[
                  styles.colorPreview,
                  { backgroundColor: customOptions.borderColor || '#DDD' }
                ]}
              />
            </Pressable>
          </>
        )}

        {/* 그림자 설정 */}
        <ThemedText style={styles.subsectionTitle}>그림자</ThemedText>

        <View style={styles.switchRow}>
          <ThemedText style={styles.optionLabel}>그림자 효과</ThemedText>
          <Switch
            value={customOptions.shadowEnabled}
            onValueChange={(value) => updateOption('shadowEnabled', value)}
            trackColor={{ false: '#767577', true: colors.tint }}
          />
        </View>

        {customOptions.shadowEnabled && (
          <>
            <View style={styles.sliderRow}>
              <ThemedText style={styles.optionLabel}>
                그림자 강도: {customOptions.shadowIntensity || 5}
              </ThemedText>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={20}
                step={1}
                value={customOptions.shadowIntensity || 5}
                onValueChange={(value) => updateOption('shadowIntensity', value)}
                minimumTrackTintColor={colors.tint}
                maximumTrackTintColor="#CCC"
              />
            </View>

            <Pressable
              style={[
                styles.colorPickerButton,
                { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' }
              ]}
              onPress={() => setShowColorPicker('shadowColor')}
            >
              <ThemedText style={[
                styles.colorPickerText,
                { color: colors.text }
              ]}>
                그림자 색상 선택
              </ThemedText>
              <View
                style={[
                  styles.colorPreview,
                  { backgroundColor: customOptions.shadowColor || '#000' }
                ]}
              />
            </Pressable>
          </>
        )}

        {/* 애니메이션 스타일 */}
        <ThemedText style={styles.subsectionTitle}>애니메이션 (저장 시)</ThemedText>
        <View style={styles.buttonGrid}>
          {['none', 'fade', 'slide', 'zoom'].map((animation) => (
            <Pressable
              key={animation}
              style={[
                styles.animationButton,
                { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                customOptions.animationStyle === animation && [
                  styles.activeButton,
                  { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                ],
              ]}
              onPress={() => updateOption('animationStyle', animation)}
            >
              <ThemedText style={[styles.buttonText, { color: colors.text }]}>
                {animation === 'none' ? '없음' :
                 animation === 'fade' ? '페이드' :
                 animation === 'slide' ? '슬라이드' : '줌'}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </View>
    </View>
  );

  // 고급 설정 탭
  const renderAdvancedTab = () => (
    <View style={styles.tabContent}>
      <View style={styles.section}>
        <ThemedText style={styles.sectionTitle}>고급 설정</ThemedText>

        {/* 추가 정보 */}
        <ThemedText style={styles.subsectionTitle}>추가 정보</ThemedText>

        <View style={styles.inputRow}>
          <ThemedText style={styles.optionLabel}>동기부여 문구</ThemedText>
          <TextInput
            style={[
              styles.textInput,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF'
              }
            ]}
            value={customOptions.motivationalQuote}
            onChangeText={(text) => updateOption('motivationalQuote', text)}
            placeholder="오늘도 한계를 넘어서!"
            placeholderTextColor={colors.text + '50'}
          />
        </View>

        <View style={styles.switchRow}>
          <ThemedText style={styles.optionLabel}>운동 시간대 표시</ThemedText>
          <Switch
            value={customOptions.showTime || false}
            onValueChange={(value) => updateOption('showTime', value)}
            trackColor={{ false: '#767577', true: colors.tint }}
          />
        </View>

        {/* 날씨/기분 아이콘 */}
        <View style={styles.inputRow}>
          <ThemedText style={styles.optionLabel}>날씨 아이콘</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.emojiGrid}>
              {['☀️', '⛅', '☁️', '🌧️', '⛈️', '❄️', ''].map((emoji) => (
                <Pressable
                  key={emoji || 'none'}
                  style={[
                    styles.emojiButton,
                    { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                    customOptions.showWeather === emoji && [
                      styles.activeButton,
                      { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                    ],
                  ]}
                  onPress={() => updateOption('showWeather', emoji)}
                >
                  <ThemedText style={[styles.emojiText, emoji === '' && { color: colors.text }]}>
                    {emoji || '없음'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        <View style={styles.inputRow}>
          <ThemedText style={styles.optionLabel}>기분/컨디션</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.emojiGrid}>
              {['💪', '😊', '😎', '🔥', '😤', '😴', '🤕', ''].map((emoji) => (
                <Pressable
                  key={emoji || 'none'}
                  style={[
                    styles.emojiButton,
                    { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                    customOptions.showMood === emoji && [
                      styles.activeButton,
                      { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                    ],
                  ]}
                  onPress={() => updateOption('showMood', emoji)}
                >
                  <ThemedText style={[styles.emojiText, emoji === '' && { color: colors.text }]}>
                    {emoji || '없음'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 칼로리 설정 */}
        <ThemedText style={styles.subsectionTitle}>칼로리 정보</ThemedText>

        <View style={styles.switchRow}>
          <ThemedText style={styles.optionLabel}>칼로리 상세 분석</ThemedText>
          <Switch
            value={customOptions.showCalorieBreakdown || false}
            onValueChange={(value) => updateOption('showCalorieBreakdown', value)}
            trackColor={{ false: '#767577', true: colors.tint }}
          />
        </View>

        {customOptions.showCalorieBreakdown && (
          <View style={styles.inputRow}>
            <ThemedText style={styles.optionLabel}>목표 칼로리</ThemedText>
            <TextInput
              style={[
                styles.numberInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF'
                }
              ]}
              value={String(customOptions.calorieGoal || '')}
              onChangeText={(text) => updateOption('calorieGoal', parseInt(text) || 0)}
              keyboardType="numeric"
              placeholder="500"
              placeholderTextColor={colors.text + '50'}
            />
          </View>
        )}

        {/* QR 코드 */}
        <ThemedText style={styles.subsectionTitle}>QR 코드</ThemedText>

        <View style={styles.switchRow}>
          <ThemedText style={styles.optionLabel}>QR 코드 표시</ThemedText>
          <Switch
            value={customOptions.showQRCode || false}
            onValueChange={(value) => updateOption('showQRCode', value)}
            trackColor={{ false: '#767577', true: colors.tint }}
          />
        </View>

        {customOptions.showQRCode && (
          <>
            <View style={styles.inputRow}>
              <ThemedText style={styles.optionLabel}>QR 코드 데이터</ThemedText>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    color: colors.text,
                    borderColor: colors.border,
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF'
                  }
                ]}
                value={customOptions.qrCodeData}
                onChangeText={(text) => updateOption('qrCodeData', text)}
                placeholder="https://instagram.com/username"
                placeholderTextColor={colors.text + '50'}
              />
            </View>

            <ThemedText style={styles.optionLabel}>QR 코드 위치</ThemedText>
            <View style={styles.buttonGrid}>
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((pos) => (
                <Pressable
                  key={pos}
                  style={[
                    styles.qrPositionButton,
                    { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                    customOptions.qrCodePosition === pos && [
                      styles.activeButton,
                      { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                    ],
                  ]}
                  onPress={() => updateOption('qrCodePosition', pos)}
                >
                  <ThemedText style={[styles.smallButtonText, { color: colors.text }]}>
                    {pos === 'top-left' ? '좌상' :
                     pos === 'top-right' ? '우상' :
                     pos === 'bottom-left' ? '좌하' : '우하'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </>
        )}

        {/* 날짜 형식 */}
        <ThemedText style={styles.subsectionTitle}>날짜 형식</ThemedText>

        <View style={styles.optionRow}>
          <ThemedText style={styles.optionLabel}>날짜 형식</ThemedText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.buttonGroup}>
              {['short', 'long', 'relative', 'custom'].map((format) => (
                <Pressable
                  key={format}
                  style={[
                    styles.dateFormatButton,
                    { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#F0F0F0' },
                    customOptions.dateFormat === format && [
                      styles.activeButton,
                      { backgroundColor: colorScheme === 'dark' ? '#3a3a3a' : '#E7F3FF' }
                    ],
                  ]}
                  onPress={() => updateOption('dateFormat', format)}
                >
                  <ThemedText style={[styles.smallButtonText, { color: colors.text }]}>
                    {format === 'short' ? '간단' :
                     format === 'long' ? '상세' :
                     format === 'relative' ? '상대적' : '커스텀'}
                  </ThemedText>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {customOptions.dateFormat === 'custom' && (
          <View style={styles.inputRow}>
            <ThemedText style={styles.optionLabel}>커스텀 날짜 형식</ThemedText>
            <TextInput
              style={[
                styles.textInput,
                {
                  color: colors.text,
                  borderColor: colors.border,
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF'
                }
              ]}
              value={customOptions.customDateFormat}
              onChangeText={(text) => updateOption('customDateFormat', text)}
              placeholder="YYYY년 MM월 DD일"
              placeholderTextColor={colors.text + '50'}
            />
          </View>
        )}
      </View>
    </View>
  );

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

      {/* 설정 영역 */}
      <View style={[styles.container, screenWidth > 600 && showPreview && styles.containerTablet]}>
        {/* 탭 네비게이션 */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[styles.tabNavigation, { borderBottomColor: colors.border }]}
        >
        <View style={styles.tabBar}>
          {[
            { id: 'basic', label: '기본', icon: 'color-palette-outline' },
            { id: 'text', label: '텍스트', icon: 'text-outline' },
            { id: 'layout', label: '레이아웃', icon: 'grid-outline' },
            { id: 'stats', label: '통계', icon: 'stats-chart-outline' },
            { id: 'effects', label: '효과', icon: 'sparkles-outline' },
            { id: 'advanced', label: '고급', icon: 'settings-outline' },
          ].map((tab) => (
            <Pressable
              key={tab.id}
              style={[
                styles.tabButton,
                activeTab === tab.id && styles.activeTab,
              ]}
              onPress={() => setActiveTab(tab.id as CustomizerTab)}
            >
              <Ionicons
                name={tab.icon as any}
                size={20}
                color={activeTab === tab.id ? colors.tint : colors.text}
              />
              <ThemedText
                style={[
                  styles.tabText,
                  activeTab === tab.id && { color: colors.tint },
                ]}
              >
                {tab.label}
              </ThemedText>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* 탭 콘텐츠 */}
      <ScrollView style={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {renderTabContent()}
      </ScrollView>
      </View>
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
    maxHeight: screenHeight * 0.35, // 모바일에서는 화면의 35% 높이까지
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
  tabNavigation: {
    maxHeight: 70,
    borderBottomWidth: 1,
    // borderBottomColor는 인라인으로 처리
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 10,
  },
  tabButton: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 12,
    marginTop: 4,
  },
  contentContainer: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  subsectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 20,
    marginBottom: 10,
  },
  optionRow: {
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
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  gridButton: {
    flex: 1,
    minWidth: '30%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  typeButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  weightButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  transformButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
  },
  alignButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  borderStyleButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  animationButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  dateFormatButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
    marginRight: 8,
  },
  qrPositionButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  activeButton: {
    borderColor: '#007AFF',
    backgroundColor: '#E7F3FF',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  smallButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sliderRow: {
    marginBottom: 20,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  inputRow: {
    marginBottom: 20,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  numberInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    width: 100,
  },
  patternGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  patternButton: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  colorPickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginBottom: 15,
  },
  colorPickerText: {
    fontSize: 14,
  },
  colorPreview: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#DDD',
  },
  textStyleSection: {
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  layoutGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  layoutButton: {
    width: '30%',
    aspectRatio: 1,
    padding: 10,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layoutButtonText: {
    fontSize: 10,
    marginTop: 4,
  },
  positionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 15,
  },
  positionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  logoSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  iconSection: {
    marginBottom: 15,
  },
  iconGrid: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 5,
  },
  iconButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  muscleColorSection: {
    marginTop: 15,
  },
  muscleColorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  muscleLabel: {
    fontSize: 14,
  },
  emojiGrid: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 5,
  },
  emojiButton: {
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    borderWidth: 2,
    borderColor: 'transparent',
    minWidth: 50,
    alignItems: 'center',
  },
  emojiText: {
    fontSize: 20,
  },
  colorPickerModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  colorPickerContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 20,
  },
  colorPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  colorPickerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  colorPickerCancel: {
    fontSize: 16,
    opacity: 0.6,
  },
  colorPickerDone: {
    fontSize: 16,
    fontWeight: '600',
  },
  colorPicker: {
    height: 300,
  },
  colorPresetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 10,
  },
  colorPresetRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 5,
  },
  colorPresetButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColorPreset: {
    borderColor: '#007AFF',
    borderWidth: 3,
  },
});