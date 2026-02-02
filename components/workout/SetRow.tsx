import React, { useState } from 'react';
import {
  StyleSheet,
  Pressable,
  View,
  TextInput,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { Set, ExerciseType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import * as Haptics from 'expo-haptics';

interface SetRowProps {
  set: Set;
  setNumber: number;
  exerciseId: string;
  exerciseType?: ExerciseType; // 운동 타입 정보 추가
  onSetComplete?: (weight?: number, reps?: number) => void;
}

export default function SetRow({ set, setNumber, exerciseId, exerciseType, onSetComplete }: SetRowProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { updateSet, removeSet, toggleSetComplete } = useWorkoutStore();

  // 유산소 운동 여부와 단위 확인
  const isCardio = exerciseType?.category === 'cardio';
  const unit = exerciseType?.unit || 'kg';

  // 첫 번째 값 (무게/거리/레벨/속도/점수) 상태
  const [isEditingFirst, setIsEditingFirst] = useState(false);
  const [tempFirst, setTempFirst] = useState(() => {
    if (unit === 'km') return set.distance?.toString() || '';
    if (unit === 'level') return set.level?.toString() || '';
    if (unit === 'speed' || unit === 'speed-incline') return set.speed?.toString() || '';
    if (unit === 'score') return set.score?.toString() || '';
    if (unit === 'minutes') return set.minutes?.toString() || '';
    return set.weight?.toString() || '';
  });

  // 두 번째 값 (횟수/시간/인클라인/세트) 상태
  const [isEditingSecond, setIsEditingSecond] = useState(false);
  const [tempSecond, setTempSecond] = useState(() => {
    if (unit === 'speed-incline') {
      // 런닝머신의 경우 인클라인 표시
      return set.incline?.toString() || '';
    }
    if (unit === 'score' || unit === 'minutes') {
      // 점수나 시간 기반 운동은 세트 수를 기본값으로
      return '1';
    }
    if (isCardio && unit !== 'reps') {
      // 유산소이고 횟수 기반이 아닌 경우 시간(분) 표시
      return set.duration ? Math.round(set.duration / 60).toString() : '';
    }
    return set.reps.toString();
  });

  // 세 번째 값 (런닝머신의 시간) 상태
  const [isEditingThird, setIsEditingThird] = useState(false);
  const [tempThird, setTempThird] = useState(() => {
    if (unit === 'speed-incline' && set.duration) {
      return Math.round(set.duration / 60).toString();
    }
    return '';
  });

  const handleToggleComplete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    toggleSetComplete(exerciseId, set.id);

    // 세트 완료 시 콜백 호출 (완료 상태가 아니었을 때만)
    if (!set.completed && onSetComplete) {
      const weight = unit === 'kg' ? set.weight : undefined;
      const reps = set.reps;
      onSetComplete(weight, reps);
    }
  };

  const handleFirstSubmit = () => {
    let value = parseFloat(tempFirst) || 0;

    // 입력값 검증 - 음수 방지, 최대값 제한
    if (value < 0) value = 0;

    if (unit === 'km') {
      // 거리는 최대 100km로 제한
      if (value > 100) value = 100;
      updateSet(exerciseId, set.id, { distance: value });
    } else if (unit === 'level') {
      // 레벨은 최대 20으로 제한
      if (value > 20) value = 20;
      updateSet(exerciseId, set.id, { level: Math.round(value) }); // 레벨은 정수로
    } else if (unit === 'speed' || unit === 'speed-incline') {
      // 속도는 최대 25km/h로 제한
      if (value > 25) value = 25;
      updateSet(exerciseId, set.id, { speed: value });
    } else if (unit === 'score') {
      // 점수는 최대 100점으로 제한
      if (value > 100) value = 100;
      updateSet(exerciseId, set.id, { score: Math.round(value) }); // 점수는 정수로
    } else if (unit === 'minutes') {
      // 시간은 최대 180분(3시간)으로 제한
      if (value > 180) value = 180;
      updateSet(exerciseId, set.id, { minutes: value });
    } else {
      // 무게는 최대 500kg로 제한
      if (value > 500) value = 500;
      updateSet(exerciseId, set.id, { weight: value });
    }
    setIsEditingFirst(false);
  };

  const handleSecondSubmit = () => {
    if (unit === 'speed-incline') {
      // 런닝머신의 인클라인 저장 (0-20%)
      let incline = parseFloat(tempSecond) || 0;
      if (incline < 0) incline = 0;
      if (incline > 20) incline = 20;
      updateSet(exerciseId, set.id, { incline });
    } else if (isCardio && unit !== 'reps') {
      // 유산소이고 횟수 기반이 아닌 경우 시간(분->초) 저장
      let minutes = parseFloat(tempSecond) || 0;
      // 시간은 최대 180분(3시간)으로 제한
      if (minutes < 0) minutes = 0;
      if (minutes > 180) minutes = 180;
      updateSet(exerciseId, set.id, { duration: minutes * 60 });
    } else {
      let reps = parseInt(tempSecond) || 0;
      // 횟수는 최대 100회로 제한
      if (reps < 0) reps = 0;
      if (reps > 100) reps = 100;
      updateSet(exerciseId, set.id, { reps });
    }
    setIsEditingSecond(false);
  };

  const handleThirdSubmit = () => {
    // 런닝머신의 시간 저장
    if (unit === 'speed-incline') {
      let minutes = parseFloat(tempThird) || 0;
      if (minutes < 0) minutes = 0;
      if (minutes > 180) minutes = 180;
      updateSet(exerciseId, set.id, { duration: minutes * 60 });
    }
    setIsEditingThird(false);
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

  // 첫 번째 값 표시 (무게/거리/레벨/속도/점수/시간)
  const getFirstValue = () => {
    if (unit === 'km') return set.distance || 0;
    if (unit === 'level') return set.level || 0;
    if (unit === 'speed' || unit === 'speed-incline') return set.speed || 0;
    if (unit === 'score') return set.score || 0;
    if (unit === 'minutes') return set.minutes || 0;
    return set.weight || 0;
  };

  // 두 번째 값 표시 (횟수/시간/인클라인/세트)
  const getSecondValue = () => {
    if (unit === 'speed-incline') return set.incline || 0;
    if (unit === 'score' || unit === 'minutes') {
      // 점수나 시간 기반 운동은 세트 표시 안함
      return '';
    }
    if (isCardio && unit !== 'reps' && set.duration) {
      return Math.round(set.duration / 60); // 초 -> 분 변환
    }
    return set.reps;
  };

  // 세 번째 값 표시 (런닝머신 시간)
  const getThirdValue = () => {
    if (unit === 'speed-incline' && set.duration) {
      return Math.round(set.duration / 60);
    }
    return 0;
  };

  // 런닝머신의 경우 특별한 레이아웃 사용
  if (unit === 'speed-incline') {
    return (
      <Pressable onLongPress={handleRemoveSet}>
        <View style={[styles.container, set.completed && styles.completedContainer]}>
          <ThemedText style={styles.setNumber}>{setNumber}</ThemedText>

          {/* 속도 입력 */}
          {isEditingFirst ? (
            <TextInput
              style={[styles.smallInput, { color: colors.text }]}
              value={tempFirst}
              onChangeText={setTempFirst}
              onBlur={handleFirstSubmit}
              onSubmitEditing={handleFirstSubmit}
              keyboardType="decimal-pad"
              placeholder="속도"
              placeholderTextColor={colors.text + '50'}
              autoFocus
              selectTextOnFocus
              maxLength={4}
            />
          ) : (
            <Pressable
              style={styles.smallValueContainer}
              onPress={() => {
                setTempFirst(getFirstValue().toString());
                setIsEditingFirst(true);
              }}
            >
              <ThemedText style={styles.smallValue}>
                {getFirstValue()}
                <ThemedText style={styles.smallUnit}>km/h</ThemedText>
              </ThemedText>
            </Pressable>
          )}

          {/* 인클라인 입력 */}
          {isEditingSecond ? (
            <TextInput
              style={[styles.smallInput, { color: colors.text }]}
              value={tempSecond}
              onChangeText={setTempSecond}
              onBlur={handleSecondSubmit}
              onSubmitEditing={handleSecondSubmit}
              keyboardType="decimal-pad"
              placeholder="경사"
              placeholderTextColor={colors.text + '50'}
              autoFocus
              selectTextOnFocus
              maxLength={4}
            />
          ) : (
            <Pressable
              style={styles.smallValueContainer}
              onPress={() => {
                setTempSecond(getSecondValue().toString());
                setIsEditingSecond(true);
              }}
            >
              <ThemedText style={styles.smallValue}>
                {getSecondValue()}
                <ThemedText style={styles.smallUnit}>%</ThemedText>
              </ThemedText>
            </Pressable>
          )}

          {/* 시간 입력 */}
          {isEditingThird ? (
            <TextInput
              style={[styles.smallInput, { color: colors.text }]}
              value={tempThird}
              onChangeText={setTempThird}
              onBlur={handleThirdSubmit}
              onSubmitEditing={handleThirdSubmit}
              keyboardType="number-pad"
              placeholder="시간"
              placeholderTextColor={colors.text + '50'}
              autoFocus
              selectTextOnFocus
              maxLength={3}
            />
          ) : (
            <Pressable
              style={styles.smallValueContainer}
              onPress={() => {
                setTempThird(getThirdValue().toString());
                setIsEditingThird(true);
              }}
            >
              <ThemedText style={styles.smallValue}>
                {getThirdValue()}
                <ThemedText style={styles.smallUnit}>분</ThemedText>
              </ThemedText>
            </Pressable>
          )}

          {/* 완료 체크 */}
          <Pressable
            style={styles.smallCheckContainer}
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

  return (
    <Pressable onLongPress={handleRemoveSet}>
      <View style={[styles.container, set.completed && styles.completedContainer]}>
        <ThemedText style={styles.setNumber}>{setNumber}</ThemedText>

        {/* 첫 번째 입력 필드 (무게/거리/레벨/속도/점수/시간) - reps 기반 운동에서는 표시하지 않음 */}
        {unit !== 'reps' ? (
          isEditingFirst ? (
            <TextInput
              style={[styles.input, { color: colors.text }]}
              value={tempFirst}
              onChangeText={setTempFirst}
              onBlur={handleFirstSubmit}
              onSubmitEditing={handleFirstSubmit}
              keyboardType={unit === 'score' ? 'number-pad' : 'decimal-pad'}
              placeholder={
                unit === 'km' ? 'km' :
                unit === 'level' ? 'Lv' :
                unit === 'speed' ? 'km/h' :
                unit === 'score' ? '점' :
                unit === 'minutes' ? '분' :
                'kg'
              }
              placeholderTextColor={colors.text + '50'}
              autoFocus
              selectTextOnFocus
              maxLength={5}
            />
          ) : (
            <Pressable
              style={styles.valueContainer}
              onPress={() => {
                setTempFirst(getFirstValue().toString());
                setIsEditingFirst(true);
              }}
            >
              <ThemedText style={styles.value}>
                {getFirstValue()}
                <ThemedText style={styles.unit}>
                  {unit === 'km' ? 'km' :
                   unit === 'level' ? '' :
                   unit === 'speed' ? 'km/h' :
                   unit === 'score' ? '점' :
                   unit === 'minutes' ? '분' :
                   'kg'}
                </ThemedText>
              </ThemedText>
            </Pressable>
          )
        ) : (
          // reps 기반 운동에서는 빈 공간 유지
          <View style={styles.valueContainer} />
        )}

        {/* 두 번째 입력 필드 (횟수/시간) - score와 minutes 단위에서는 표시하지 않음 */}
        {unit === 'score' || unit === 'minutes' ? (
          // score와 minutes 기반 운동에서는 빈 공간 유지
          <View style={styles.valueContainer} />
        ) : isEditingSecond ? (
          <TextInput
            style={[styles.input, { color: colors.text }]}
            value={tempSecond}
            onChangeText={setTempSecond}
            onBlur={handleSecondSubmit}
            onSubmitEditing={handleSecondSubmit}
            keyboardType="number-pad"
            placeholder={isCardio && unit !== 'reps' ? '분' : '회'}
            placeholderTextColor={colors.text + '50'}
            autoFocus
            selectTextOnFocus
            maxLength={3}
          />
        ) : (
          <Pressable
            style={styles.valueContainer}
            onPress={() => {
              setTempSecond(getSecondValue().toString());
              setIsEditingSecond(true);
            }}
          >
            <ThemedText style={styles.value}>
              {getSecondValue()}
              <ThemedText style={styles.unit}>
                {isCardio && unit !== 'reps' ? '분' : '회'}
              </ThemedText>
            </ThemedText>
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
  unit: {
    fontSize: 12,
    fontWeight: '400',
    opacity: 0.6,
    marginLeft: 2,
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
  // 런닝머신용 작은 스타일
  smallValueContainer: {
    flex: 1.2,
    alignItems: 'center',
    paddingVertical: 4,
  },
  smallValue: {
    fontSize: 14,
    fontWeight: '500',
  },
  smallUnit: {
    fontSize: 10,
    fontWeight: '400',
    opacity: 0.6,
    marginLeft: 1,
  },
  smallInput: {
    flex: 1.2,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    backgroundColor: '#f0f0f0',
    borderRadius: 6,
    padding: 4,
    marginHorizontal: 4,
  },
  smallCheckContainer: {
    flex: 0.8,
    alignItems: 'center',
  },
});