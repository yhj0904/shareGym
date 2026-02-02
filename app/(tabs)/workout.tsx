import { StyleSheet, Pressable, View, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import useWorkoutStore from '@/stores/workoutStore';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors, gradientColors } from '@/constants/Colors';

export default function WorkoutScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets(); // Safe area insets 추가
  const { currentSession, lastWorkout, startSession, copyLastWorkout, cancelSession } = useWorkoutStore();

  const handleQuickStart = () => {
    // 기존 세션이 있어도 새로운 세션 시작
    if (currentSession) {
      Alert.alert(
        '새로운 운동 시작',
        '진행 중인 운동이 있습니다. 새로운 운동을 시작하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          {
            text: '새로 시작',
            onPress: () => {
              startSession();
              router.push('/workout/active-session');
            },
          },
        ]
      );
    } else {
      startSession();
      router.push('/workout/active-session');
    }
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

  const handleCancelSession = () => {
    Alert.alert(
      '운동 세션 취소',
      '진행 중인 운동 세션을 취소하시겠습니까?\n모든 기록이 삭제됩니다.',
      [
        { text: '아니오', style: 'cancel' },
        {
          text: '예, 취소합니다',
          style: 'destructive',
          onPress: () => {
            cancelSession();
          },
        },
      ]
    );
  };

  if (currentSession) {
    return (
      <ThemedView style={styles.container}>
        <ThemedView style={[styles.header, {
          paddingTop: insets.top,
          borderBottomColor: colorScheme === 'dark' ? '#333' : '#F2F2F4'
        }]}>
          <ThemedText type="title">운동 중</ThemedText>
          <ThemedText type="subtitle">진행 중인 운동이 있습니다</ThemedText>
        </ThemedView>

        <View style={styles.buttonContainer}>
          <Pressable
            style={styles.continueButtonWrapper}
            onPress={handleContinueSession}
          >
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.continueButton}
            >
              <Ionicons name="play-circle" size={32} color="white" />
              <ThemedText style={styles.continueButtonText}>운동 계속하기</ThemedText>
            </LinearGradient>
          </Pressable>

          <Pressable
            style={[styles.cancelButton, {
              backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4'
            }]}
            onPress={handleCancelSession}
          >
            <Ionicons name="close-circle-outline" size={28} color={colors.error || '#FF3B30'} />
            <ThemedText style={[styles.cancelButtonText, { color: colors.error || '#FF3B30' }]}>
              세션 취소
            </ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={[styles.header, {
        paddingTop: insets.top,
        borderBottomColor: colorScheme === 'dark' ? '#333' : '#F2F2F4'
      }]}>
        <ThemedText type="title">운동 시작</ThemedText>
        <ThemedText type="subtitle">오늘의 운동을 시작해보세요</ThemedText>
      </ThemedView>

      <View style={styles.buttonContainer}>
        <Pressable
          style={styles.startButtonWrapper}
          onPress={handleQuickStart}
        >
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.startButton}
          >
            <Ionicons name="flash" size={28} color="white" />
            <ThemedText style={[styles.buttonText, { color: 'white' }]}>빈 세션 시작</ThemedText>
            <ThemedText style={[styles.buttonSubtext, { color: 'rgba(255,255,255,0.9)' }]}>바로 시작하기</ThemedText>
          </LinearGradient>
        </Pressable>

        {lastWorkout && (
          <Pressable
            style={[styles.startButton, styles.secondaryButton, {
              backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4'
            }]}
            onPress={handleCopyLastWorkout}
          >
            <Ionicons name="copy-outline" size={28} color={colors.tint} />
            <ThemedText style={[styles.buttonText, { color: colors.text }]}>최근 운동 복사</ThemedText>
            <ThemedText style={[styles.buttonSubtext, { color: colors.text, opacity: 0.7 }]}>
              {lastWorkout.exercises.length}개 운동
            </ThemedText>
          </Pressable>
        )}

        <Pressable
          style={[styles.startButton, styles.secondaryButton, {
            backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4'
          }]}
          onPress={handleStartFromRoutine}
        >
          <Ionicons name="list-outline" size={28} color={colors.tint} />
          <ThemedText style={[styles.buttonText, { color: colors.text }]}>루틴에서 선택</ThemedText>
          <ThemedText style={[styles.buttonSubtext, { color: colors.text, opacity: 0.7 }]}>저장된 루틴 사용</ThemedText>
        </Pressable>
      </View>

      {lastWorkout && (
        <ThemedView style={[styles.lastWorkoutCard, {
          backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4'
        }]}>
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
    paddingHorizontal: 20,
    paddingBottom: 15,
    paddingTop: 15, // 기본 paddingTop 설정, insets.top이 추가됨
    borderBottomWidth: 1,
    // borderBottomColor는 동적으로 적용됨
  },
  buttonContainer: {
    padding: 20,
    gap: 15,
  },
  startButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden', // 그라데이션이 border radius 내에 있도록
  },
  startButton: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    gap: 8,
  },
  secondaryButton: {
    // backgroundColor는 인라인 스타일로 처리
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSubtext: {
    fontSize: 14,
  },
  continueButtonWrapper: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  continueButton: {
    padding: 20,
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
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  lastWorkoutCard: {
    margin: 20,
    padding: 20,
    // backgroundColor는 동적으로 적용됨
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