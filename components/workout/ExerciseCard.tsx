import React, { useState } from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  Alert,
  TextInput,
  Modal,
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
  onSetComplete?: (setIndex: number, weight?: number, reps?: number) => void;
}

export default function ExerciseCard({ exercise, isActive, onPress, onSetComplete }: ExerciseCardProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const {
    addSet,
    removeExercise,
    copyLastSet,
    updateExerciseRestTime,
    updateExerciseNotes,
  } = useWorkoutStore();

  const [showRestTimeModal, setShowRestTimeModal] = useState(false);
  const [tempRestTime, setTempRestTime] = useState(exercise.restTime.toString());
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [tempNotes, setTempNotes] = useState(exercise.notes || '');

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

  const handleUpdateRestTime = () => {
    const restTime = parseInt(tempRestTime) || 90;
    // 휴식 시간은 10초 ~ 600초(10분) 사이로 제한
    const validRestTime = Math.min(Math.max(restTime, 10), 600);
    updateExerciseRestTime(exercise.id, validRestTime);
    setShowRestTimeModal(false);
  };

  const handleUpdateNotes = () => {
    updateExerciseNotes(exercise.id, tempNotes.trim());
    setShowNotesModal(false);
  };

  return (
    <Pressable onPress={onPress}>
      <ThemedView
        style={[
          styles.container,
          {
            backgroundColor: colorScheme === 'dark' ? '#1a1a1a' : 'white',
            shadowOpacity: colorScheme === 'dark' ? 0 : 0.1,
          },
          isActive && { borderColor: colors.tint, borderWidth: 2 },
        ]}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ThemedText style={styles.exerciseName}>
              {exerciseType?.nameKo || exercise.exerciseTypeId}
            </ThemedText>
            <View style={styles.exerciseSubInfo}>
              {exerciseType?.equipment && (
                <ThemedText style={styles.equipment}>{exerciseType.equipment}</ThemedText>
              )}
              {/* 휴식 시간 표시 및 수정 */}
              <Pressable
                style={[styles.restTimeButton, {
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0',
                }]}
                onPress={() => {
                  setTempRestTime(exercise.restTime.toString());
                  setShowRestTimeModal(true);
                }}
              >
                <Ionicons name="timer-outline" size={14} color={colors.text} />
                <ThemedText style={styles.restTimeText}>
                  휴식 {exercise.restTime}초
                </ThemedText>
              </Pressable>
            </View>
          </View>
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                setTempNotes(exercise.notes || '');
                setShowNotesModal(true);
              }}
              style={styles.noteButton}
            >
              <Ionicons
                name={exercise.notes ? "document-text" : "document-text-outline"}
                size={20}
                color={exercise.notes ? colors.tint : colors.text}
              />
            </Pressable>
            <Pressable onPress={handleRemoveExercise} style={styles.deleteButton}>
              <Ionicons name="trash-outline" size={20} color="#ff4444" />
            </Pressable>
          </View>
        </View>

        {/* 메모 표시 */}
        {exercise.notes && (
          <View style={[styles.notesDisplay, {
            backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f8f8f8',
          }]}>
            <Ionicons name="document-text-outline" size={14} color={colors.text} />
            <ThemedText style={[styles.notesText, {
              color: colors.text,
            }]}>{exercise.notes}</ThemedText>
          </View>
        )}

        {/* 세트 목록 */}
        <View style={styles.setList}>
          {exercise.sets.length === 0 ? (
            <ThemedText style={styles.emptySets}>세트를 추가해주세요</ThemedText>
          ) : (
            <>
              <View style={[styles.setHeader, {
                borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee',
              }]}>
                <ThemedText style={styles.setHeaderText}>세트</ThemedText>
                {/* 런닝머신의 경우 특별한 헤더 */}
                {exerciseType?.unit === 'speed-incline' ? (
                  <>
                    <ThemedText style={styles.setHeaderText}>속도</ThemedText>
                    <ThemedText style={styles.setHeaderText}>경사</ThemedText>
                    <ThemedText style={styles.setHeaderText}>시간</ThemedText>
                  </>
                ) : (
                  <>
                    <ThemedText style={styles.setHeaderText}>
                      {/* 운동 종류에 따라 다른 헤더 표시 */}
                      {exerciseType?.unit === 'km' ? '거리(km)' :
                       exerciseType?.unit === 'level' ? '레벨' :
                       exerciseType?.unit === 'speed' ? '속도(km/h)' :
                       exerciseType?.unit === 'score' ? '점수' :
                       exerciseType?.unit === 'minutes' ? '시간(분)' :
                       exerciseType?.unit === 'reps' && exerciseType?.category === 'cardio' ? '횟수' :
                       '무게(kg)'}
                    </ThemedText>
                    <ThemedText style={styles.setHeaderText}>
                      {/* score와 minutes 단위는 두 번째 열 비움, 그 외는 기존 로직 */}
                      {exerciseType?.unit === 'score' || exerciseType?.unit === 'minutes' ? '' :
                       exerciseType?.category === 'cardio' && exerciseType?.unit !== 'reps' ? '시간(분)' : '횟수'}
                    </ThemedText>
                  </>
                )}
                <ThemedText style={styles.setHeaderText}>완료</ThemedText>
              </View>
              {exercise.sets.map((set, index) => (
                <SetRow
                  key={set.id}
                  set={set}
                  setNumber={index + 1}
                  exerciseId={exercise.id}
                  exerciseType={exerciseType}
                  onSetComplete={(weight, reps) => {
                    onSetComplete?.(index, weight, reps);
                  }}
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
              style={[styles.actionButton, styles.secondaryButton, {
                backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5',
              }]}
              onPress={handleCopyLastSet}
            >
              <Ionicons name="copy-outline" size={20} color={colors.text} />
              <ThemedText style={styles.actionButtonText}>이전 세트 복사</ThemedText>
            </Pressable>
          )}
        </View>
      </ThemedView>

      {/* 휴식 시간 설정 모달 */}
      <Modal
        visible={showRestTimeModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRestTimeModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowRestTimeModal(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.modalTitle}>휴식 시간 설정</ThemedText>

            <View style={styles.restTimeInputContainer}>
              <TextInput
                style={[styles.restTimeInput, {
                  color: colors.text,
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0',
                }]}
                value={tempRestTime}
                onChangeText={setTempRestTime}
                keyboardType="number-pad"
                placeholder="90"
                placeholderTextColor={colors.text + '50'}
                maxLength={3}
                autoFocus
              />
              <ThemedText style={styles.restTimeUnit}>초</ThemedText>
            </View>

            {/* 빠른 선택 버튼 */}
            <View style={styles.quickSelectContainer}>
              <ThemedText style={styles.quickSelectLabel}>빠른 선택:</ThemedText>
              <View style={styles.quickSelectButtons}>
                {[30, 60, 90, 120, 180].map((seconds) => (
                  <Pressable
                    key={seconds}
                    style={[
                      styles.quickSelectButton,
                      {
                        backgroundColor: parseInt(tempRestTime) === seconds
                          ? colors.tint
                          : (colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0'),
                      },
                    ]}
                    onPress={() => setTempRestTime(seconds.toString())}
                  >
                    <ThemedText
                      style={[
                        styles.quickSelectText,
                        parseInt(tempRestTime) === seconds && { color: 'white' },
                      ]}
                    >
                      {seconds < 60 ? `${seconds}초` : `${seconds / 60}분`}
                    </ThemedText>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, {
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0',
                }]}
                onPress={() => setShowRestTimeModal(false)}
              >
                <ThemedText>취소</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleUpdateRestTime}
              >
                <ThemedText style={{ color: 'white' }}>확인</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* 메모 입력 모달 */}
      <Modal
        visible={showNotesModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNotesModal(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setShowNotesModal(false)}
        >
          <Pressable style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <ThemedText style={styles.modalTitle}>운동 메모</ThemedText>

            <TextInput
              style={[styles.notesInput, { color: colors.text, borderColor: colors.border }]}
              value={tempNotes}
              onChangeText={setTempNotes}
              placeholder="메모를 입력하세요... (예: 자세 주의사항, 무게 조절 계획 등)"
              placeholderTextColor={colors.text + '50'}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              autoFocus
            />

            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, styles.cancelButton, {
                  backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f0f0f0',
                }]}
                onPress={() => setShowNotesModal(false)}
              >
                <ThemedText>취소</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={handleUpdateNotes}
              >
                <ThemedText style={{ color: 'white' }}>저장</ThemedText>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    margin: 15,
    padding: 15,
    // backgroundColor는 동적으로 적용됨 (다크모드 대응)
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    // shadowOpacity는 동적으로 적용됨 (다크모드 대응)
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
  exerciseSubInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  equipment: {
    fontSize: 14,
    opacity: 0.6,
  },
  restTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 2,
    paddingHorizontal: 8,
    // backgroundColor는 동적으로 적용됨 (다크모드 대응)
    borderRadius: 6,
  },
  restTimeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  noteButton: {
    padding: 5,
  },
  deleteButton: {
    padding: 5,
  },
  notesDisplay: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 10,
    padding: 10,
    // backgroundColor는 동적으로 적용됨 (다크모드 대응)
    borderRadius: 8,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    // color는 동적으로 적용됨 (다크모드 대응)
  },
  setList: {
    marginBottom: 15,
  },
  setHeader: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    // borderBottomColor는 동적으로 적용됨 (다크모드 대응)
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
    // backgroundColor는 동적으로 적용됨 (다크모드 대응)
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  // 모달 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    padding: 20,
    borderRadius: 12,
    // backgroundColor는 colors.card로 동적으로 적용됨
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  restTimeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  restTimeInput: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    // backgroundColor는 동적으로 적용됨 (다크모드 대응)
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    minWidth: 100,
  },
  restTimeUnit: {
    fontSize: 18,
    fontWeight: '500',
  },
  quickSelectContainer: {
    marginBottom: 20,
  },
  quickSelectLabel: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 10,
  },
  quickSelectButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickSelectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    // backgroundColor는 동적으로 적용됨 (다크모드 대응)
    borderRadius: 8,
  },
  quickSelectText: {
    fontSize: 14,
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  cancelButton: {
    // backgroundColor는 동적으로 적용됨 (다크모드 대응)
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    lineHeight: 20,
    minHeight: 100,
    maxHeight: 200,
    marginBottom: 20,
  },
});