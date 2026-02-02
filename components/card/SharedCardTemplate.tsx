import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutSession, CardCustomOptions, SharedWorkoutCard } from '@/types';
import { formatDuration } from '@/utils/time';
import { exerciseDatabase } from '@/data/exercises';
import { Ionicons } from '@expo/vector-icons';

interface SharedCardTemplateProps {
  firstWorkout?: WorkoutSession;
  secondWorkout?: WorkoutSession;
  splitType: 'horizontal' | 'vertical';
  splitPosition: 'top' | 'bottom' | 'left' | 'right';
  style?: 'minimal' | 'gradient' | 'dark' | 'colorful' | 'ocean' | 'sunset' | 'forest' | 'neon';
  customOptions?: CardCustomOptions;
  width: number;
  height: number;
  firstUserName?: string;
  secondUserName?: string;
  groupName?: string;
}

export default function SharedCardTemplate({
  firstWorkout,
  secondWorkout,
  splitType,
  splitPosition,
  style = 'minimal',
  customOptions,
  width,
  height,
  firstUserName = '회원1',
  secondUserName = '회원2',
  groupName,
}: SharedCardTemplateProps) {
  // 스타일 설정
  const getStyleConfig = () => {
    if (customOptions) {
      const isImageBg = customOptions.backgroundType === 'image' && customOptions.backgroundImage;
      return {
        gradient: customOptions.gradientColors || [customOptions.backgroundColor || '#FFFFFF', customOptions.backgroundColor || '#FFFFFF'],
        textColor: isImageBg ? 'white' : customOptions.primaryTextColor,
        subTextColor: isImageBg ? 'rgba(255, 255, 255, 0.9)' : customOptions.secondaryTextColor,
        backgroundType: customOptions.backgroundType,
        backgroundColor: customOptions.backgroundColor,
        backgroundImage: customOptions.backgroundImage,
        backgroundOpacity: customOptions.backgroundOpacity || 1,
      };
    }

    // 프리셋 스타일
    switch (style) {
      case 'gradient':
        return {
          gradient: ['#667eea', '#764ba2'],
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.9)',
        };
      case 'dark':
        return {
          gradient: ['#1a1a1a', '#2d2d2d'],
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.7)',
        };
      case 'colorful':
        return {
          gradient: ['#FF6F8D', '#FFB871'],
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.9)',
        };
      case 'ocean':
        return {
          gradient: ['#2E3192', '#1BFFFF'],
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.9)',
        };
      case 'sunset':
        return {
          gradient: ['#FF512F', '#F09819'],
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.9)',
        };
      case 'forest':
        return {
          gradient: ['#134E5E', '#71B280'],
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.9)',
        };
      case 'neon':
        return {
          gradient: ['#B721FF', '#21D4FD'],
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.9)',
        };
      default: // minimal
        return {
          gradient: ['#FFFFFF', '#F5F5F5'],
          textColor: '#1C1C1E',
          subTextColor: '#8E8E93',
        };
    }
  };

  const styleConfig = getStyleConfig();

  // 운동 통계 계산 함수
  const calculateStats = (workout: WorkoutSession | undefined) => {
    if (!workout) return null;

    const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
    const completedSets = workout.exercises.reduce(
      (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
      0
    );

    const totalVolume = workout.exercises.reduce((acc, ex) => {
      const exerciseType = exerciseDatabase.find(e => e.id === ex.exerciseTypeId);
      if (exerciseType?.category !== 'cardio') {
        return acc + ex.sets.reduce((setAcc, set) => {
          if (set.completed && set.weight) {
            return setAcc + (set.weight * set.reps);
          }
          return setAcc;
        }, 0);
      }
      return acc;
    }, 0);

    const exerciseList = workout.exercises.slice(0, 3).map(ex => {
      const exerciseType = exerciseDatabase.find(e => e.id === ex.exerciseTypeId);
      return exerciseType?.nameKo || ex.exerciseTypeId;
    });

    return {
      duration: workout.totalDuration,
      totalSets,
      completedSets,
      totalVolume,
      exerciseList,
      exerciseCount: workout.exercises.length,
    };
  };

  const firstStats = calculateStats(firstWorkout);
  const secondStats = calculateStats(secondWorkout);

  // 운동 카드 렌더링 함수
  const renderWorkoutHalf = (stats: any, userName: string, isPlaceholder: boolean = false) => {
    if (isPlaceholder) {
      return (
        <View style={styles.placeholderHalf}>
          <Ionicons name="add-circle-outline" size={48} color="#B5B5B8" />
          <Text style={[styles.placeholderText, { color: '#B5B5B8' }]}>
            그룹 멤버가{'\n'}함께 완성해주세요
          </Text>
        </View>
      );
    }

    if (!stats) return null;

    return (
      <View style={styles.halfContent}>
        <View style={styles.userHeader}>
          <Ionicons name="person-circle-outline" size={24} color={styleConfig.textColor} />
          <Text style={[styles.userName, { color: styleConfig.textColor }]}>{userName}</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Ionicons name="time-outline" size={20} color={styleConfig.textColor} />
            <Text style={[styles.statValue, { color: styleConfig.textColor }]}>
              {formatDuration(stats.duration)}
            </Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="barbell-outline" size={20} color={styleConfig.textColor} />
            <Text style={[styles.statValue, { color: styleConfig.textColor }]}>
              {stats.totalVolume.toLocaleString()}kg
            </Text>
          </View>

          <View style={styles.statItem}>
            <Ionicons name="fitness-outline" size={20} color={styleConfig.textColor} />
            <Text style={[styles.statValue, { color: styleConfig.textColor }]}>
              {stats.completedSets}/{stats.totalSets} 세트
            </Text>
          </View>
        </View>

        <View style={styles.exerciseSection}>
          <Text style={[styles.exerciseTitle, { color: styleConfig.subTextColor }]}>
            운동 {stats.exerciseCount}개
          </Text>
          {stats.exerciseList.map((exercise: string, index: number) => (
            <Text key={index} style={[styles.exerciseName, { color: styleConfig.subTextColor }]}>
              • {exercise}
            </Text>
          ))}
          {stats.exerciseCount > 3 && (
            <Text style={[styles.moreExercises, { color: styleConfig.subTextColor }]}>
              +{stats.exerciseCount - 3}개 더
            </Text>
          )}
        </View>
      </View>
    );
  };

  // 분할 방향에 따른 레이아웃 결정
  const isHorizontal = splitType === 'horizontal';
  const isFirstOnTop = splitPosition === 'top' || splitPosition === 'left';

  const BackgroundWrapper = styleConfig.backgroundType === 'image' && styleConfig.backgroundImage ? (
    <ImageBackground
      source={{ uri: styleConfig.backgroundImage }}
      style={{ width, height }}
      imageStyle={{ opacity: styleConfig.backgroundOpacity }}
    >
      <View style={[styles.overlay, { backgroundColor: 'rgba(0,0,0,0.3)' }]}>
        {renderContent()}
      </View>
    </ImageBackground>
  ) : (
    <LinearGradient
      colors={styleConfig.gradient}
      style={{ width, height }}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {renderContent()}
    </LinearGradient>
  );

  function renderContent() {
    return (
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: styleConfig.textColor }]}>
            함께 만든 오운완 💪
          </Text>
          {groupName && (
            <Text style={[styles.groupName, { color: styleConfig.subTextColor }]}>
              {groupName}
            </Text>
          )}
        </View>

        {/* 2분할 컨텐츠 */}
        <View
          style={[
            styles.splitContainer,
            isHorizontal ? styles.horizontalSplit : styles.verticalSplit,
          ]}
        >
          {/* 첫 번째 반쪽 */}
          <View
            style={[
              styles.halfContainer,
              isHorizontal ? styles.horizontalHalf : styles.verticalHalf,
              !isFirstOnTop && { order: 2 },
            ]}
          >
            {renderWorkoutHalf(firstStats, firstUserName, false)}
            {/* 구분선 */}
            <View
              style={[
                styles.divider,
                isHorizontal ? styles.horizontalDivider : styles.verticalDivider,
                { backgroundColor: styleConfig.subTextColor },
              ]}
            />
          </View>

          {/* 두 번째 반쪽 */}
          <View
            style={[
              styles.halfContainer,
              isHorizontal ? styles.horizontalHalf : styles.verticalHalf,
              !isFirstOnTop && { order: 1 },
            ]}
          >
            {secondWorkout
              ? renderWorkoutHalf(secondStats, secondUserName, false)
              : renderWorkoutHalf(null, '', true)
            }
          </View>
        </View>

        {/* 푸터 */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: styleConfig.subTextColor }]}>
            ShareGym • 함께하는 운동
          </Text>
        </View>
      </View>
    );
  }

  return BackgroundWrapper;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  overlay: {
    flex: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  groupName: {
    fontSize: 16,
  },
  splitContainer: {
    flex: 1,
    marginBottom: 20,
  },
  horizontalSplit: {
    flexDirection: 'column',
  },
  verticalSplit: {
    flexDirection: 'row',
  },
  halfContainer: {
    flex: 1,
    position: 'relative',
  },
  horizontalHalf: {
    height: '50%',
  },
  verticalHalf: {
    width: '50%',
  },
  halfContent: {
    flex: 1,
    padding: 15,
  },
  placeholderHalf: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
  },
  placeholderText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  statsContainer: {
    marginBottom: 15,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  exerciseSection: {
    marginTop: 10,
  },
  exerciseTitle: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseName: {
    fontSize: 12,
    marginVertical: 2,
  },
  moreExercises: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  divider: {
    position: 'absolute',
    opacity: 0.3,
  },
  horizontalDivider: {
    bottom: 0,
    left: 20,
    right: 20,
    height: 1,
  },
  verticalDivider: {
    right: 0,
    top: 20,
    bottom: 20,
    width: 1,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 10,
  },
  footerText: {
    fontSize: 12,
  },
});