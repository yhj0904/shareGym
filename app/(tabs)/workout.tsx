import { StyleSheet, Pressable, View, Alert } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import useWorkoutStore from '@/stores/workoutStore';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';

export default function WorkoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { currentSession, lastWorkout, startSession, copyLastWorkout } = useWorkoutStore();

  const handleQuickStart = () => {
    startSession();
    router.push('/workout/active-session');
  };

  const handleCopyLastWorkout = () => {
    if (!lastWorkout) {
      Alert.alert('알림', '이전 운동 기록이 없습니다.');
      return;
    }
    copyLastWorkout();
    router.push('/workout/active-session');
  };

  const handleStartFromRoutine = () => {
    router.push('/routine/list');
  };

  const handleContinueSession = () => {
    router.push('/workout/active-session');
  };

  if (currentSession) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={styles.header}>
          <ThemedText type="title">운동 중</ThemedText>
          <ThemedText type="subtitle">진행 중인 운동이 있습니다</ThemedText>
        </ThemedView>

        <Pressable
          style={[styles.continueButton, { backgroundColor: colors.tint }]}
          onPress={handleContinueSession}
        >
          <Ionicons name="play-circle" size={32} color="white" />
          <ThemedText style={styles.continueButtonText}>운동 계속하기</ThemedText>
        </Pressable>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <ThemedText type="title">운동 시작</ThemedText>
        <ThemedText type="subtitle">오늘의 운동을 시작해보세요</ThemedText>
      </ThemedView>

      <View style={styles.buttonContainer}>
        <Pressable
          style={[styles.startButton, { backgroundColor: colors.tint }]}
          onPress={handleQuickStart}
        >
          <Ionicons name="flash" size={28} color="white" />
          <ThemedText style={styles.buttonText}>빈 세션 시작</ThemedText>
          <ThemedText style={styles.buttonSubtext}>바로 시작하기</ThemedText>
        </Pressable>

        {lastWorkout && (
          <Pressable
            style={[styles.startButton, styles.secondaryButton]}
            onPress={handleCopyLastWorkout}
          >
            <Ionicons name="copy-outline" size={28} color={colors.text} />
            <ThemedText style={styles.buttonText}>최근 운동 복사</ThemedText>
            <ThemedText style={styles.buttonSubtext}>
              {lastWorkout.exercises.length}개 운동
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          style={[styles.startButton, styles.secondaryButton]}
          onPress={handleStartFromRoutine}
        >
          <Ionicons name="list-outline" size={28} color={colors.text} />
          <ThemedText style={styles.buttonText}>루틴에서 선택</ThemedText>
          <ThemedText style={styles.buttonSubtext}>저장된 루틴 사용</ThemedText>
        </Pressable>
      </View>

      {lastWorkout && (
        <ThemedView style={styles.lastWorkoutCard}>
          <ThemedText type="subtitle">최근 운동</ThemedText>
          <ThemedText style={styles.lastWorkoutDate}>
            {new Date(lastWorkout.date).toLocaleDateString('ko-KR')}
          </ThemedText>
          {lastWorkout.exercises.map((exercise, index) => (
            <ThemedText key={index} style={styles.exerciseItem}>
              • {exercise.exerciseType?.nameKo || exercise.exerciseTypeId} ({exercise.sets.length}세트)
            </ThemedText>
          ))}
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  buttonContainer: {
    padding: 20,
    gap: 15,
  },
  startButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSubtext: {
    fontSize: 14,
    opacity: 0.7,
  },
  continueButton: {
    margin: 20,
    padding: 20,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  lastWorkoutCard: {
    margin: 20,
    padding: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
  },
  lastWorkoutDate: {
    marginTop: 5,
    marginBottom: 10,
    opacity: 0.6,
  },
  exerciseItem: {
    marginVertical: 2,
  },
});