/**
 * 운동 세트 아이템 컴포넌트
 * 메모이제이션을 통한 성능 최적화
 */

import React, { memo, useCallback } from 'react';
import {
  View,
  TextInput,
  Pressable,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import { Set } from '@/types';

interface SetItemProps {
  set: Set;
  index: number;
  unit?: 'kg' | 'km' | 'level' | 'reps';
  onUpdateSet: (index: number, updates: Partial<Set>) => void;
  onDeleteSet: (index: number) => void;
  onToggleComplete: (index: number) => void;
}

// 메모이제이션된 세트 아이템 컴포넌트
const SetItem = memo(({
  set,
  index,
  unit = 'kg',
  onUpdateSet,
  onDeleteSet,
  onToggleComplete,
}: SetItemProps) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 메모이제이션된 핸들러들
  const handleWeightChange = useCallback((text: string) => {
    const weight = parseFloat(text) || 0;
    onUpdateSet(index, { weight });
  }, [index, onUpdateSet]);

  const handleRepsChange = useCallback((text: string) => {
    const reps = parseInt(text) || 0;
    onUpdateSet(index, { reps });
  }, [index, onUpdateSet]);

  const handleDistanceChange = useCallback((text: string) => {
    const distance = parseFloat(text) || 0;
    onUpdateSet(index, { distance });
  }, [index, onUpdateSet]);

  const handleLevelChange = useCallback((text: string) => {
    const level = parseInt(text) || 1;
    onUpdateSet(index, { level });
  }, [index, onUpdateSet]);

  const handleToggle = useCallback(() => {
    onToggleComplete(index);
  }, [index, onToggleComplete]);

  const handleDelete = useCallback(() => {
    onDeleteSet(index);
  }, [index, onDeleteSet]);

  return (
    <View
      style={[
        styles.setRow,
        set.completed && styles.completedSet,
        { backgroundColor: colors.card },
      ]}
    >
      <ThemedText style={styles.setNumber}>{index + 1}</ThemedText>

      {/* 유산소: 거리 입력 */}
      {unit === 'km' && (
        <>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border },
            ]}
            value={set.distance ? set.distance.toString() : ''}
            onChangeText={handleDistanceChange}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.icon}
            editable={!set.completed}
          />
          <ThemedText style={styles.unit}>km</ThemedText>
        </>
      )}

      {/* 머신: 레벨 입력 */}
      {unit === 'level' && (
        <>
          <ThemedText style={styles.levelLabel}>레벨</ThemedText>
          <TextInput
            style={[
              styles.input,
              styles.smallInput,
              { color: colors.text, borderColor: colors.border },
            ]}
            value={set.level ? set.level.toString() : ''}
            onChangeText={handleLevelChange}
            keyboardType="number-pad"
            placeholder="1"
            placeholderTextColor={colors.icon}
            editable={!set.completed}
          />
        </>
      )}

      {/* 웨이트: 무게와 반복 입력 */}
      {unit === 'kg' && (
        <>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border },
            ]}
            value={set.weight ? set.weight.toString() : ''}
            onChangeText={handleWeightChange}
            keyboardType="decimal-pad"
            placeholder="0"
            placeholderTextColor={colors.icon}
            editable={!set.completed}
          />
          <ThemedText style={styles.unit}>kg</ThemedText>
        </>
      )}

      {/* 반복 횟수 (유산소 제외) */}
      {unit !== 'km' && (
        <>
          <TextInput
            style={[
              styles.input,
              { color: colors.text, borderColor: colors.border },
            ]}
            value={set.reps ? set.reps.toString() : ''}
            onChangeText={handleRepsChange}
            keyboardType="number-pad"
            placeholder="0"
            placeholderTextColor={colors.icon}
            editable={!set.completed}
          />
          <ThemedText style={styles.unit}>회</ThemedText>
        </>
      )}

      {/* 완료 체크박스 */}
      <Pressable onPress={handleToggle} style={styles.checkbox}>
        <Ionicons
          name={set.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={24}
          color={set.completed ? colors.success : colors.icon}
        />
      </Pressable>

      {/* 삭제 버튼 */}
      <Pressable onPress={handleDelete} style={styles.deleteButton}>
        <Ionicons name="trash-outline" size={20} color={colors.error} />
      </Pressable>
    </View>
  );
}, (prevProps, nextProps) => {
  // 성능 최적화를 위한 얕은 비교
  return (
    prevProps.set.id === nextProps.set.id &&
    prevProps.set.weight === nextProps.set.weight &&
    prevProps.set.reps === nextProps.set.reps &&
    prevProps.set.distance === nextProps.set.distance &&
    prevProps.set.level === nextProps.set.level &&
    prevProps.set.completed === nextProps.set.completed &&
    prevProps.index === nextProps.index &&
    prevProps.unit === nextProps.unit
  );
});

const styles = StyleSheet.create({
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    gap: 8,
  },
  completedSet: {
    opacity: 0.6,
  },
  setNumber: {
    width: 25,
    fontWeight: '600',
    fontSize: 16,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    textAlign: 'center',
  },
  smallInput: {
    flex: 0,
    width: 60,
  },
  unit: {
    width: 25,
    fontSize: 14,
    opacity: 0.7,
  },
  levelLabel: {
    fontSize: 14,
    opacity: 0.7,
    marginHorizontal: 4,
  },
  checkbox: {
    padding: 4,
  },
  deleteButton: {
    padding: 4,
  },
});

export default SetItem;