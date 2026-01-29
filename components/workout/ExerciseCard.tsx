import React from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  Alert,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Exercise } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import SetRow from './SetRow';
import { exerciseDatabase } from '@/data/exercises';

interface ExerciseCardProps {
  exercise: Exercise;
  isActive: boolean;
  onPress: () => void;
}

export default function ExerciseCard({ exercise, isActive, onPress }: ExerciseCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    addSet,
    removeExercise,
    copyLastSet,
  } = useWorkoutStore();

  // 운동 종목 정보 찾기
  const exerciseType = exerciseDatabase.find(e => e.id === exercise.exerciseTypeId);

  const handleAddSet = () => {
    addSet(exercise.id);
  };

  const handleCopyLastSet = () => {
    if (exercise.sets.length === 0) {
      Alert.alert('알림', '복사할 세트가 없습니다.');
      return;
    }
    copyLastSet(exercise.id);
  };

  const handleRemoveExercise = () => {
    Alert.alert(
      '운동 삭제',
      '이 운동을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () => removeExercise(exercise.id),
        },
      ]
    );
  };

  return (
    <Pressable onPress={onPress}>
      <ThemedView
        style={[
          styles.container,
          isActive && { borderColor: colors.tint, borderWidth: 2 },
        ]}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ThemedText style={styles.exerciseName}>
              {exerciseType?.nameKo || exercise.exerciseTypeId}
            </ThemedText>
            {exerciseType?.equipment && (
              <ThemedText style={styles.equipment}>{exerciseType.equipment}</ThemedText>
            )}
          </View>
          <Pressable onPress={handleRemoveExercise} style={styles.deleteButton}>
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </Pressable>
        </View>

        {/* 세트 목록 */}
        <View style={styles.setList}>
          {exercise.sets.length === 0 ? (
            <ThemedText style={styles.emptySets}>세트를 추가해주세요</ThemedText>
          ) : (
            <>
              <View style={styles.setHeader}>
                <ThemedText style={styles.setHeaderText}>세트</ThemedText>
                <ThemedText style={styles.setHeaderText}>무게(kg)</ThemedText>
                <ThemedText style={styles.setHeaderText}>횟수</ThemedText>
                <ThemedText style={styles.setHeaderText}>완료</ThemedText>
              </View>
              {exercise.sets.map((set, index) => (
                <SetRow
                  key={set.id}
                  set={set}
                  setNumber={index + 1}
                  exerciseId={exercise.id}
                />
              ))}
            </>
          )}
        </View>

        {/* 액션 버튼 */}
        <View style={styles.actions}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.tint }]}
            onPress={handleAddSet}
          >
            <Ionicons name="add" size={20} color="white" />
            <ThemedText style={styles.actionButtonText}>세트 추가</ThemedText>
          </Pressable>

          {exercise.sets.length > 0 && (
            <Pressable
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={handleCopyLastSet}
            >
              <Ionicons name="copy-outline" size={20} color={colors.text} />
              <ThemedText style={styles.actionButtonText}>이전 세트 복사</ThemedText>
            </Pressable>
          )}
        </View>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 15,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  headerLeft: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: '600',
  },
  equipment: {
    fontSize: 14,
    opacity: 0.6,
    marginTop: 2,
  },
  deleteButton: {
    padding: 5,
  },
  setList: {
    marginBottom: 15,
  },
  setHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 5,
  },
  setHeaderText: {
    flex: 1,
    fontSize: 12,
    opacity: 0.6,
    textAlign: 'center',
  },
  emptySets: {
    textAlign: 'center',
    padding: 20,
    opacity: 0.5,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 6,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
});