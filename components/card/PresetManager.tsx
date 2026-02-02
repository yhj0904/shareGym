import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { CardCustomOptions, CardPreset } from '@/types';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PresetManagerProps {
  currentOptions: CardCustomOptions;
  onLoadPreset: (options: CardCustomOptions) => void;
  visible: boolean;
  onClose: () => void;
}

const DEFAULT_PRESETS: CardPreset[] = [
  {
    id: 'preset_minimal',
    name: '미니멀',
    description: '깔끔하고 심플한 디자인',
    options: {
      backgroundType: 'solid',
      backgroundColor: '#FFFFFF',
      gradientColors: ['#FFFFFF', '#FFFFFF'],
      primaryTextColor: '#1C1C1E',
      secondaryTextColor: '#B5B5B8',
      fontSize: 'medium',
      layout: 'minimal',
      showLogo: false,
      showStats: {
        duration: true,
        volume: true,
        sets: false,
        distance: false,
        calories: false,
      },
      showExerciseList: true,
      maxExercisesToShow: 3,
      showDate: true,
      borderRadius: 8,
      shadowEnabled: false,
    } as CardCustomOptions,
    createdAt: new Date(),
    isDefault: true,
  },
  {
    id: 'preset_energetic',
    name: '에너지틱',
    description: '활력 넘치는 컬러풀한 디자인',
    options: {
      backgroundType: 'gradient',
      gradientColors: ['#FF6B6B', '#FFE66D'],
      gradientAngle: 135,
      gradientType: 'linear',
      primaryTextColor: '#FFFFFF',
      secondaryTextColor: '#FFF8E1',
      fontSize: 'large',
      layout: 'modern',
      showLogo: true,
      logoPosition: 'top-right',
      showStats: {
        duration: true,
        volume: true,
        sets: true,
        distance: true,
        calories: true,
      },
      showExerciseList: true,
      maxExercisesToShow: 5,
      exerciseListStyle: {
        colorByMuscle: true,
        highlightPR: true,
      },
      title: '오늘도 최고! 💪',
      hashtags: ['운동스타그램', '헬스', '오운완'],
      showDate: true,
      borderRadius: 16,
      shadowEnabled: true,
      animationStyle: 'zoom',
    } as CardCustomOptions,
    createdAt: new Date(),
    isDefault: true,
  },
  {
    id: 'preset_professional',
    name: '프로페셔널',
    description: '전문적이고 세련된 디자인',
    options: {
      backgroundType: 'gradient',
      gradientColors: ['#1a1a1a', '#2d2d2d'],
      gradientType: 'linear',
      primaryTextColor: '#FFFFFF',
      secondaryTextColor: '#CCCCCC',
      fontSize: 'medium',
      titleStyle: {
        fontSize: 28,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 2,
      },
      layout: 'detailed',
      showLogo: true,
      logoPosition: 'bottom-right',
      showStats: {
        duration: true,
        volume: true,
        sets: true,
        distance: true,
        calories: false,
        heartRate: true,
        intensity: true,
      },
      statsIcons: {
        duration: 'timer-outline',
        volume: 'trending-up-outline',
        sets: 'grid-outline',
      },
      showExerciseList: true,
      maxExercisesToShow: 7,
      exerciseListStyle: {
        showNumbers: true,
        showSets: true,
        showWeight: true,
      },
      showDate: true,
      dateFormat: 'long',
      showTime: true,
      borderRadius: 0,
      borderStyle: 'solid',
      borderWidth: 2,
      borderColor: '#FFD700',
      shadowEnabled: false,
    } as CardCustomOptions,
    createdAt: new Date(),
    isDefault: true,
  },
];

export default function PresetManager({
  currentOptions,
  onLoadPreset,
  visible,
  onClose,
}: PresetManagerProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [presets, setPresets] = useState<CardPreset[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [presetDescription, setPresetDescription] = useState('');

  // 프리셋 불러오기
  useEffect(() => {
    loadPresets();
  }, []);

  const loadPresets = async () => {
    try {
      const savedPresets = await AsyncStorage.getItem('cardPresets');
      if (savedPresets) {
        const parsed = JSON.parse(savedPresets);
        setPresets([...DEFAULT_PRESETS, ...parsed]);
      } else {
        setPresets(DEFAULT_PRESETS);
      }
    } catch (error) {
      console.error('프리셋 불러오기 실패:', error);
      setPresets(DEFAULT_PRESETS);
    }
  };

  // 프리셋 저장
  const savePreset = async () => {
    if (!presetName) {
      Alert.alert('오류', '프리셋 이름을 입력해주세요.');
      return;
    }

    const newPreset: CardPreset = {
      id: `preset_${Date.now()}`,
      name: presetName,
      description: presetDescription,
      options: currentOptions,
      createdAt: new Date(),
      isDefault: false,
    };

    try {
      const customPresets = presets.filter(p => !p.isDefault);
      const updatedPresets = [...customPresets, newPreset];
      await AsyncStorage.setItem('cardPresets', JSON.stringify(updatedPresets));
      setPresets([...DEFAULT_PRESETS, ...updatedPresets]);
      setShowSaveModal(false);
      setPresetName('');
      setPresetDescription('');
      Alert.alert('성공', '프리셋이 저장되었습니다.');
    } catch (error) {
      console.error('프리셋 저장 실패:', error);
      Alert.alert('오류', '프리셋 저장에 실패했습니다.');
    }
  };

  // 프리셋 삭제
  const deletePreset = async (presetId: string) => {
    Alert.alert(
      '프리셋 삭제',
      '이 프리셋을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              const customPresets = presets.filter(p => !p.isDefault && p.id !== presetId);
              await AsyncStorage.setItem('cardPresets', JSON.stringify(customPresets));
              setPresets([...DEFAULT_PRESETS, ...customPresets]);
              Alert.alert('성공', '프리셋이 삭제되었습니다.');
            } catch (error) {
              console.error('프리셋 삭제 실패:', error);
              Alert.alert('오류', '프리셋 삭제에 실패했습니다.');
            }
          },
        },
      ],
    );
  };

  // 프리셋 적용
  const applyPreset = (preset: CardPreset) => {
    onLoadPreset(preset.options);
    Alert.alert('적용 완료', `"${preset.name}" 프리셋이 적용되었습니다.`);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 헤더 */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose}>
            <ThemedText style={styles.cancelText}>닫기</ThemedText>
          </Pressable>
          <ThemedText style={styles.title}>프리셋 관리</ThemedText>
          <Pressable onPress={() => setShowSaveModal(true)}>
            <ThemedText style={[styles.saveText, { color: colors.tint }]}>
              현재 설정 저장
            </ThemedText>
          </Pressable>
        </View>

        {/* 프리셋 목록 */}
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* 기본 프리셋 섹션 */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>기본 프리셋</ThemedText>
            {presets.filter(p => p.isDefault).map((preset) => (
              <Pressable
                key={preset.id}
                style={[styles.presetCard, { backgroundColor: colors.card }]}
                onPress={() => applyPreset(preset)}
              >
                <View style={styles.presetHeader}>
                  <View style={styles.presetInfo}>
                    <ThemedText style={styles.presetName}>{preset.name}</ThemedText>
                    {preset.description && (
                      <ThemedText style={styles.presetDescription}>
                        {preset.description}
                      </ThemedText>
                    )}
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={colors.text}
                  />
                </View>
                <View style={styles.presetPreview}>
                  {/* 미리보기 색상 */}
                  <View style={styles.previewColors}>
                    {preset.options.backgroundType === 'gradient' ? (
                      preset.options.gradientColors?.map((color, index) => (
                        <View
                          key={index}
                          style={[styles.previewColor, { backgroundColor: color }]}
                        />
                      ))
                    ) : (
                      <View
                        style={[
                          styles.previewColor,
                          { backgroundColor: preset.options.backgroundColor || '#FFF' }
                        ]}
                      />
                    )}
                  </View>
                  {/* 미리보기 정보 */}
                  <View style={styles.previewInfo}>
                    <ThemedText style={styles.previewText}>
                      {preset.options.layout} | {preset.options.fontSize}
                    </ThemedText>
                  </View>
                </View>
              </Pressable>
            ))}
          </View>

          {/* 사용자 프리셋 섹션 */}
          <View style={styles.section}>
            <ThemedText style={styles.sectionTitle}>내 프리셋</ThemedText>
            {presets.filter(p => !p.isDefault).length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="bookmark-outline" size={48} color={colors.text + '40'} />
                <ThemedText style={styles.emptyText}>
                  저장된 프리셋이 없습니다
                </ThemedText>
                <ThemedText style={styles.emptySubtext}>
                  현재 설정을 저장하여 나만의 프리셋을 만들어보세요
                </ThemedText>
              </View>
            ) : (
              presets.filter(p => !p.isDefault).map((preset) => (
                <Pressable
                  key={preset.id}
                  style={[styles.presetCard, { backgroundColor: colors.card }]}
                  onPress={() => applyPreset(preset)}
                  onLongPress={() => deletePreset(preset.id)}
                >
                  <View style={styles.presetHeader}>
                    <View style={styles.presetInfo}>
                      <ThemedText style={styles.presetName}>{preset.name}</ThemedText>
                      {preset.description && (
                        <ThemedText style={styles.presetDescription}>
                          {preset.description}
                        </ThemedText>
                      )}
                      <ThemedText style={styles.presetDate}>
                        {new Date(preset.createdAt).toLocaleDateString('ko-KR')}
                      </ThemedText>
                    </View>
                    <View style={styles.presetActions}>
                      <Pressable
                        style={styles.deleteButton}
                        onPress={() => deletePreset(preset.id)}
                      >
                        <Ionicons name="trash-outline" size={18} color={colors.text + '80'} />
                      </Pressable>
                    </View>
                  </View>
                  <View style={styles.presetPreview}>
                    {/* 미리보기 색상 */}
                    <View style={styles.previewColors}>
                      {preset.options.backgroundType === 'gradient' ? (
                        preset.options.gradientColors?.map((color, index) => (
                          <View
                            key={index}
                            style={[styles.previewColor, { backgroundColor: color }]}
                          />
                        ))
                      ) : (
                        <View
                          style={[
                            styles.previewColor,
                            { backgroundColor: preset.options.backgroundColor || '#FFF' }
                          ]}
                        />
                      )}
                    </View>
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </ScrollView>

        {/* 프리셋 저장 모달 */}
        <Modal
          visible={showSaveModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowSaveModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
              <ThemedText style={styles.modalTitle}>프리셋 저장</ThemedText>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>프리셋 이름</ThemedText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={presetName}
                  onChangeText={setPresetName}
                  placeholder="예: 나만의 스타일"
                  placeholderTextColor={colors.text + '50'}
                  autoFocus
                />
              </View>

              <View style={styles.inputGroup}>
                <ThemedText style={styles.inputLabel}>설명 (선택)</ThemedText>
                <TextInput
                  style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                  value={presetDescription}
                  onChangeText={setPresetDescription}
                  placeholder="예: 심플하고 깔끔한 디자인"
                  placeholderTextColor={colors.text + '50'}
                />
              </View>

              <View style={styles.modalActions}>
                <Pressable
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setShowSaveModal(false);
                    setPresetName('');
                    setPresetDescription('');
                  }}
                >
                  <ThemedText style={styles.cancelButtonText}>취소</ThemedText>
                </Pressable>
                <Pressable
                  style={[styles.modalButton, { backgroundColor: colors.tint }]}
                  onPress={savePreset}
                >
                  <ThemedText style={[styles.saveButtonText, { color: 'white' }]}>
                    저장
                  </ThemedText>
                </Pressable>
              </View>
            </View>
          </View>
        </Modal>
      </ThemedView>
    </Modal>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
  },
  cancelText: {
    fontSize: 16,
    opacity: 0.6,
  },
  saveText: {
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  presetCard: {
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  presetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  presetDescription: {
    fontSize: 13,
    opacity: 0.7,
    marginBottom: 4,
  },
  presetDate: {
    fontSize: 11,
    opacity: 0.5,
  },
  presetActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  deleteButton: {
    padding: 5,
  },
  presetPreview: {
    marginTop: 12,
  },
  previewColors: {
    flexDirection: 'row',
    gap: 8,
  },
  previewColor: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  previewInfo: {
    marginTop: 8,
  },
  previewText: {
    fontSize: 11,
    opacity: 0.6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    opacity: 0.6,
  },
  emptySubtext: {
    fontSize: 13,
    marginTop: 8,
    opacity: 0.4,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    opacity: 0.8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});