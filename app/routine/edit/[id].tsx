/**
 * 루틴 수정 화면
 * - 기존 루틴 로드 후 이름/운동 목록 편집
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useRoutineStore from '@/stores/routineStore';
import { RoutineExercise } from '@/types';
import { exerciseDatabase } from '@/data/exercises';

export default function EditRoutineScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getRoutineById, updateRoutine } = useRoutineStore();

  const [routineName, setRoutineName] = useState('');
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const routine = id ? getRoutineById(id) : undefined;
    if (routine) {
      setRoutineName(routine.name);
      setExercises(
        routine.exercises.map((ex, i) => ({ ...ex, orderIndex: i }))
      );
    } else if (id) {
      Alert.alert('오류', '루틴을 찾을 수 없습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    }
    setIsLoaded(true);
  }, [id, getRoutineById]);

  const handleAddExercise = () => {
    router.push({
      pathname: '/routine/exercise-select',
      params: { mode: 'routine' },
    });
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleUpdateExercise = (index: number, updates: Partial<RoutineExercise>) => {
    setExercises(exercises.map((ex, i) =>
      i === index ? { ...ex, ...updates } : ex
    ));
  };

  const handleSave = async () => {
    if (!id) return;
    if (!routineName.trim()) {
      Alert.alert('알림', '루틴 이름을 입력해주세요.');
      return;
    }
    if (exercises.length === 0) {
      Alert.alert('알림', '최소 하나의 운동을 추가해주세요.');
      return;
    }

    try {
      await updateRoutine(id, { name: routineName, exercises });
      Alert.alert('성공', '루틴이 수정되었습니다.', [
        { text: '확인', onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert('오류', '루틴 수정에 실패했습니다.');
    }
  };

  useEffect(() => {
    // @ts-ignore
    global.addRoutineExercise = (exerciseTypeId: string) => {
      const newExercise: RoutineExercise = {
        exerciseTypeId,
        sets: 3,
        reps: 10,
        weight: 0,
        restTime: 90,
        orderIndex: exercises.length,
      };
      setExercises([...exercises, newExercise]);
    };
    return () => {
      // @ts-ignore
      delete global.addRoutineExercise;
    };
  }, [exercises]);

  if (!isLoaded) {
    return (
      <ThemedView style={[styles.container, { flex: 1, justifyContent: 'center', alignItems: 'center' }]}>
        <ThemedText>로딩 중...</ThemedText>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ThemedView style={[styles.header, { paddingTop: 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle">루틴 수정</ThemedText>
        <Pressable onPress={handleSave} style={styles.saveButton}>
          <ThemedText style={[styles.saveButtonText, { color: colors.tint }]}>
            저장
          </ThemedText>
        </Pressable>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedView style={styles.section}>
          <ThemedText style={styles.sectionTitle}>루틴 이름</ThemedText>
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="예: 상체 운동 루틴"
            placeholderTextColor="#999"
            value={routineName}
            onChangeText={setRoutineName}
          />
        </ThemedView>

        <ThemedView style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText style={styles.sectionTitle}>운동 목록</ThemedText>
            <Pressable onPress={handleAddExercise}>
              <Ionicons name="add-circle-outline" size={24} color={colors.tint} />
            </Pressable>
          </View>

          {exercises.length === 0 ? (
            <Pressable onPress={handleAddExercise} style={styles.emptyState}>
              <Ionicons name="add-circle-outline" size={32} color="#ccc" />
              <ThemedText style={styles.emptyText}>운동 추가하기</ThemedText>
            </Pressable>
          ) : (
            exercises.map((exercise, index) => {
              const exerciseType = exerciseDatabase.find(
                e => e.id === exercise.exerciseTypeId
              );
              return (
                <View key={index} style={styles.exerciseCard}>
                  <View style={styles.exerciseHeader}>
                    <ThemedText style={styles.exerciseName}>
                      {exerciseType?.nameKo || exercise.exerciseTypeId}
                    </ThemedText>
                    <Pressable onPress={() => handleRemoveExercise(index)}>
                      <Ionicons name="trash-outline" size={20} color="#ff4444" />
                    </Pressable>
                  </View>
                  <View style={styles.exerciseDetails}>
                    <View style={styles.detailItem}>
                      <ThemedText style={styles.detailLabel}>세트</ThemedText>
                      <View style={styles.stepperContainer}>
                        <Pressable
                          style={styles.stepperButton}
                          onPress={() => handleUpdateExercise(index, { sets: Math.max(1, exercise.sets - 1) })}
                        >
                          <Ionicons name="remove" size={20} color={colors.text} />
                        </Pressable>
                        <ThemedText style={styles.stepperValue}>{exercise.sets}</ThemedText>
                        <Pressable
                          style={styles.stepperButton}
                          onPress={() => handleUpdateExercise(index, { sets: exercise.sets + 1 })}
                        >
                          <Ionicons name="add" size={20} color={colors.text} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <ThemedText style={styles.detailLabel}>횟수</ThemedText>
                      <View style={styles.stepperContainer}>
                        <Pressable
                          style={styles.stepperButton}
                          onPress={() => handleUpdateExercise(index, { reps: Math.max(1, exercise.reps - 1) })}
                        >
                          <Ionicons name="remove" size={20} color={colors.text} />
                        </Pressable>
                        <ThemedText style={styles.stepperValue}>{exercise.reps}</ThemedText>
                        <Pressable
                          style={styles.stepperButton}
                          onPress={() => handleUpdateExercise(index, { reps: exercise.reps + 1 })}
                        >
                          <Ionicons name="add" size={20} color={colors.text} />
                        </Pressable>
                      </View>
                    </View>
                    <View style={styles.detailItem}>
                      <ThemedText style={styles.detailLabel}>무게(kg)</ThemedText>
                      <TextInput
                        style={[styles.weightInput, { color: colors.text }]}
                        value={exercise.weight?.toString() || ''}
                        onChangeText={(text) => handleUpdateExercise(index, { weight: parseFloat(text) || 0 })}
                        keyboardType="numeric"
                        placeholder="0"
                        placeholderTextColor="#999"
                      />
                    </View>
                    <View style={styles.detailItem}>
                      <ThemedText style={styles.detailLabel}>휴식(초)</ThemedText>
                      <View style={styles.stepperContainer}>
                        <Pressable
                          style={styles.stepperButton}
                          onPress={() => handleUpdateExercise(index, { restTime: Math.max(0, exercise.restTime - 30) })}
                        >
                          <Ionicons name="remove" size={20} color={colors.text} />
                        </Pressable>
                        <ThemedText style={styles.stepperValue}>{exercise.restTime}</ThemedText>
                        <Pressable
                          style={styles.stepperButton}
                          onPress={() => handleUpdateExercise(index, { restTime: exercise.restTime + 30 })}
                        >
                          <Ionicons name="add" size={20} color={colors.text} />
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          {exercises.length > 0 && (
            <Pressable
              style={[styles.addMoreButton, { borderColor: colors.tint }]}
              onPress={handleAddExercise}
            >
              <Ionicons name="add-circle-outline" size={20} color={colors.tint} />
              <ThemedText style={[styles.addMoreText, { color: colors.tint }]}>운동 추가</ThemedText>
            </Pressable>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: { padding: 5 },
  saveButton: { padding: 5 },
  saveButtonText: { fontSize: 17, fontWeight: '600' },
  content: { flex: 1 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#f0f0f0' },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 10 },
  input: { fontSize: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  emptyText: { marginTop: 10, fontSize: 14, opacity: 0.6 },
  exerciseCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  exerciseName: { fontSize: 16, fontWeight: '600' },
  exerciseDetails: { gap: 12 },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: { fontSize: 14, opacity: 0.7 },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  stepperButton: { padding: 8 },
  stepperValue: { paddingHorizontal: 16, fontSize: 16, fontWeight: '500' },
  weightInput: {
    width: 100,
    textAlign: 'center',
    fontSize: 16,
    padding: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    borderStyle: 'dashed',
    marginTop: 10,
    gap: 8,
  },
  addMoreText: { fontSize: 14, fontWeight: '500' },
});
