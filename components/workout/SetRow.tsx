import React, { useState } from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  TextInput,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Set } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import * as Haptics from 'expo-haptics';

interface SetRowProps {
  set: Set;
  setNumber: number;
  exerciseId: string;
}

export default function SetRow({ set, setNumber, exerciseId }: SetRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { updateSet, removeSet, toggleSetComplete } = useWorkoutStore();

  const [isEditingWeight, setIsEditingWeight] = useState(false);
  const [isEditingReps, setIsEditingReps] = useState(false);
  const [tempWeight, setTempWeight] = useState(set.weight?.toString() || '');
  const [tempReps, setTempReps] = useState(set.reps.toString());

  const handleToggleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSetComplete(exerciseId, set.id);
  };

  const handleWeightSubmit = () => {
    const weight = parseFloat(tempWeight) || 0;
    updateSet(exerciseId, set.id, { weight });
    setIsEditingWeight(false);
  };

  const handleRepsSubmit = () => {
    const reps = parseInt(tempReps) || 0;
    updateSet(exerciseId, set.id, { reps });
    setIsEditingReps(false);
  };

  const handleRemoveSet = () => {
    Alert.alert(
      '세트 삭제',
      '이 세트를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => removeSet(exerciseId, set.id),
        },
      ]
    );
  };

  return (
    <Pressable onLongPress={handleRemoveSet}>
      <View style={[styles.container, set.completed && styles.completedContainer]}>
        <ThemedText style={styles.setNumber}>{setNumber}</ThemedText>

        {/* 무게 입력 */}
        {isEditingWeight ? (
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={tempWeight}
            onChangeText={setTempWeight}
            onBlur={handleWeightSubmit}
            onSubmitEditing={handleWeightSubmit}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <Pressable
            style={styles.valueContainer}
            onPress={() => {
              setTempWeight(set.weight?.toString() || '');
              setIsEditingWeight(true);
            }}
          >
            <ThemedText style={styles.value}>
              {set.weight || 0}
            </ThemedText>
          </Pressable>
        )}

        {/* 횟수 입력 */}
        {isEditingReps ? (
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={tempReps}
            onChangeText={setTempReps}
            onBlur={handleRepsSubmit}
            onSubmitEditing={handleRepsSubmit}
            keyboardType="numeric"
            autoFocus
            selectTextOnFocus
          />
        ) : (
          <Pressable
            style={styles.valueContainer}
            onPress={() => {
              setTempReps(set.reps.toString());
              setIsEditingReps(true);
            }}
          >
            <ThemedText style={styles.value}>{set.reps}</ThemedText>
          </Pressable>
        )}

        {/* 완료 체크 */}
        <Pressable
          style={styles.checkContainer}
          onPress={handleToggleComplete}
        >
          <Ionicons
            name={set.completed ? 'checkmark-circle' : 'checkmark-circle-outline'}
            size={24}
            color={set.completed ? colors.tint : '#ccc'}
          />
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  completedContainer: {
    opacity: 0.7,
  },
  setNumber: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '600',
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: '500',
  },
  input: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '500',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 6,
    marginHorizontal: 10,
  },
  checkContainer: {
    flex: 1,
    alignItems: 'center',
  },
});