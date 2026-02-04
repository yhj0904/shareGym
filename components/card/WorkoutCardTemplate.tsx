import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ImageBackground,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { WorkoutSession, CardCustomOptions } from '@/types';
import { formatDuration } from '@/utils/time';
import { exerciseDatabase } from '@/data/exercises';
import { Ionicons } from '@expo/vector-icons';
import { spacing, fontSize, typography } from '@/styles/common';
import { gradientColors } from '@/constants/Colors';

interface WorkoutCardTemplateProps {
  workout: WorkoutSession;
  style?: 'minimal' | 'gradient' | 'dark' | 'colorful' | 'ocean' | 'sunset' | 'forest' | 'neon';
  customOptions?: CardCustomOptions; // 커스텀 옵션 추가
  width: number;
  height: number;
}

export default function WorkoutCardTemplate({
  workout,
  style = 'minimal',
  customOptions,
  width,
  height,
}: WorkoutCardTemplateProps) {
  // 통계 계산
  const totalSets = workout.exercises.reduce((acc, ex) => acc + ex.sets.length, 0);
  const completedSets = workout.exercises.reduce(
    (acc, ex) => acc + ex.sets.filter(s => s.completed).length,
    0
  );

  // 웨이트 트레이닝 볼륨 계산 (kg)
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

  // 유산소 운동 통계 계산
  const cardioStats = workout.exercises.reduce((acc, ex) => {
    const exerciseType = exerciseDatabase.find(e => e.id === ex.exerciseTypeId);
    if (exerciseType?.category === 'cardio') {
      ex.sets.forEach(set => {
        if (set.completed) {
          if (set.distance) acc.totalDistance += set.distance;
          if (set.duration) acc.totalDuration += set.duration;
        }
      });
    }
    return acc;
  }, { totalDistance: 0, totalDuration: 0 });

  const getStyleConfig = () => {
    // 커스텀 옵션이 있으면 우선 사용
    if (customOptions) {
      // 배경 이미지가 있을 때는 텍스트를 흰색으로 자동 설정
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

    // 프리셋 스타일 사용
    switch (style) {
      case 'gradient':
        return {
          gradient: gradientColors, // 브랜드 그라데이션 사용
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
          gradient: ['#FF6F8D', '#FFB871'], // 브랜드 핑크에서 밝은 오렌지로
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.9)',
        };
      case 'ocean':
        return {
          gradient: ['#2E3192', '#1BFFFF'], // 깊은 바다색에서 밝은 청록색으로
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.85)',
        };
      case 'sunset':
        return {
          gradient: ['#FF512F', '#F09819'], // 붉은 주황에서 황금색으로
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.9)',
        };
      case 'forest':
        return {
          gradient: ['#134E5E', '#71B280'], // 짙은 청록에서 밝은 초록으로
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.85)',
        };
      case 'neon':
        return {
          gradient: ['#B721FF', '#21D4FD'], // 보라색에서 하늘색으로
          textColor: 'white',
          subTextColor: 'rgba(255, 255, 255, 0.9)',
        };
      case 'minimal':
      default:
        return {
          gradient: ['#FFFFFF', '#FFF1E4'], // 흰색에서 브랜드 서브 배경색으로
          textColor: '#1C1C1E', // 브랜드 텍스트 컬러
          subTextColor: '#B5B5B8', // 브랜드 서브 텍스트 컬러
        };
    }
  };

  const config = getStyleConfig();
  const date = new Date(workout.date);

  // 폰트 크기 계산
  const getFontSizeMultiplier = () => {
    if (!customOptions) return 1;
    switch (customOptions.fontSize) {
      case 'small': return 0.85;
      case 'large': return 1.15;
      default: return 1;
    }
  };

  const fontMultiplier = getFontSizeMultiplier();

  // 카드 컨테이너 스타일 (커스텀 옵션 적용)
  const containerStyle = {
    ...styles.container,
    width,
    height,
    borderRadius: customOptions?.borderRadius || 0,
    ...(customOptions?.shadowEnabled && {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 10,
    }),
    ...(customOptions?.borderWidth && {
      borderWidth: customOptions.borderWidth,
      borderColor: customOptions.borderColor || '#DDD',
    }),
  };

  // 카드 콘텐츠 렌더링 함수
  const renderCardContent = () => (
    <>
      {/* 배경 오버레이 (이미지 배경일 때 텍스트 가독성을 위해) */}
      {config.backgroundType === 'image' && config.backgroundImage && (
        <LinearGradient
          colors={['rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.6)']}
          style={[
            StyleSheet.absoluteFillObject,
            {
              borderRadius: customOptions?.borderRadius || 0,
            }
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      )}

      {/* 헤더 */}
      <View style={styles.header}>
        {/* 날짜 표시 (커스텀 옵션에 따라) */}
        {(!customOptions || customOptions.showDate) && (
          <Text style={[
            styles.dateText,
            {
              color: config.subTextColor,
              fontSize: styles.dateText.fontSize * fontMultiplier
            }
          ]}>
            {date.toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        )}
        {/* 제목 (커스텀 또는 기본값) */}
        <Text style={[
          styles.title,
          {
            color: config.textColor,
            fontSize: styles.title.fontSize * fontMultiplier
          }
        ]}>
          {customOptions?.title || '오운완 🔥'}
        </Text>
        {/* 부제목 (있는 경우) */}
        {customOptions?.subtitle && (
          <Text style={[
            styles.subtitle,
            {
              color: config.subTextColor,
              fontSize: 16 * fontMultiplier
            }
          ]}>
            {customOptions.subtitle}
          </Text>
        )}
      </View>

      {/* 메인 통계 */}
      <View style={styles.mainStats}>
        {/* 운동 시간 (커스텀 옵션에 따라) */}
        {(!customOptions || customOptions.showStats.duration) && (
          <View style={styles.bigStat}>
            <Ionicons name="time-outline" size={32 * fontMultiplier} color={config.textColor} />
            <Text style={[
              styles.bigStatValue,
              {
                color: config.textColor,
                fontSize: styles.bigStatValue.fontSize * fontMultiplier
              }
            ]}>
              {formatDuration(workout.totalDuration)}
            </Text>
            <Text style={[
              styles.bigStatLabel,
              {
                color: config.subTextColor,
                fontSize: styles.bigStatLabel.fontSize * fontMultiplier
              }
            ]}>
              운동 시간
            </Text>
          </View>
        )}

        <View style={styles.statsGrid}>
          {/* 웨이트 트레이닝 볼륨 (커스텀 옵션과 데이터에 따라) */}
          {totalVolume > 0 && (!customOptions || customOptions.showStats.volume) && (
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue,
                {
                  color: config.textColor,
                  fontSize: styles.statValue.fontSize * fontMultiplier
                }
              ]}>
                {totalVolume.toLocaleString()}kg
              </Text>
              <Text style={[
                styles.statLabel,
                {
                  color: config.subTextColor,
                  fontSize: styles.statLabel.fontSize * fontMultiplier
                }
              ]}>
                총 볼륨
              </Text>
            </View>
          )}

          {/* 유산소 운동 거리 (커스텀 옵션과 데이터에 따라) */}
          {cardioStats.totalDistance > 0 && (!customOptions || customOptions.showStats.distance) && (
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue,
                {
                  color: config.textColor,
                  fontSize: styles.statValue.fontSize * fontMultiplier
                }
              ]}>
                {cardioStats.totalDistance.toFixed(1)}km
              </Text>
              <Text style={[
                styles.statLabel,
                {
                  color: config.subTextColor,
                  fontSize: styles.statLabel.fontSize * fontMultiplier
                }
              ]}>
                총 거리
              </Text>
            </View>
          )}

          {/* 완료 세트 (커스텀 옵션에 따라) */}
          {(!customOptions || customOptions.showStats.sets) && (
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue,
                {
                  color: config.textColor,
                  fontSize: styles.statValue.fontSize * fontMultiplier
                }
              ]}>
                {completedSets}/{totalSets}
              </Text>
              <Text style={[
                styles.statLabel,
                {
                  color: config.subTextColor,
                  fontSize: styles.statLabel.fontSize * fontMultiplier
                }
              ]}>
                완료 세트
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* 운동 목록 (커스텀 옵션에 따라) */}
      {(!customOptions || customOptions.showExerciseList) && (
        <View style={styles.exerciseList}>
          <Text style={[
            styles.exerciseTitle,
            {
              color: config.textColor,
              fontSize: styles.exerciseTitle.fontSize * fontMultiplier
            }
          ]}>
            오늘의 운동
          </Text>
          {workout.exercises
            .slice(0, customOptions?.maxExercisesToShow || (workout.exercises.length > 4 ? 3 : 5))
            .map((exercise, index) => {
          const exerciseType = exerciseDatabase.find(e => e.id === exercise.exerciseTypeId);
          const completedSets = exercise.sets.filter(s => s.completed);

          // 운동 타입에 따른 상세 정보 표시
          let detailText = `${completedSets.length}세트`;
          if (exerciseType?.unit === 'score') {
            // 점수 기반 운동 (배드민턴, 테니스 등)
            const totalScore = completedSets.reduce((acc, s) => acc + (s.score || 0), 0);
            detailText += ` • 총 ${totalScore}점`;
          } else if (exerciseType?.unit === 'minutes') {
            // 시간 기반 운동 (요가, 스트레칭 등)
            const totalMinutes = completedSets.reduce((acc, s) => acc + (s.minutes || 0), 0);
            detailText += ` • ${totalMinutes}분`;
          } else if (exerciseType?.category === 'cardio') {
            if (exerciseType.unit === 'km') {
              const totalDistance = completedSets.reduce((acc, s) => acc + (s.distance || 0), 0);
              detailText += ` • ${totalDistance.toFixed(1)}km`;
            } else if (exerciseType.unit === 'level') {
              const maxLevel = Math.max(...completedSets.map(s => s.level || 0));
              detailText += ` • 레벨 ${maxLevel}`;
            }
          } else {
            const maxWeight = Math.max(...completedSets.map(s => s.weight || 0));
            if (maxWeight > 0) {
              detailText += ` • 최고 ${maxWeight}kg`;
            }
          }

            return (
              <View key={index} style={styles.exerciseItem}>
                <Text style={[
                  styles.exerciseName,
                  {
                    color: config.textColor,
                    fontSize: styles.exerciseName.fontSize * fontMultiplier
                  }
                ]}>
                  {exerciseType?.nameKo || exercise.exerciseTypeId}
                </Text>
                <Text style={[
                  styles.exerciseDetail,
                  {
                    color: config.subTextColor,
                    fontSize: styles.exerciseDetail.fontSize * fontMultiplier
                  }
                ]}>
                  {detailText}
                </Text>
              </View>
            );
          })}
          {workout.exercises.length > (customOptions?.maxExercisesToShow || (workout.exercises.length > 4 ? 3 : 5)) && (
            <Text style={[
              styles.moreExercises,
              {
                color: config.subTextColor,
                fontSize: styles.moreExercises.fontSize * fontMultiplier
              }
            ]}>
              +{workout.exercises.length - (customOptions?.maxExercisesToShow || (workout.exercises.length > 4 ? 3 : 5))}개 더...
            </Text>
          )}
        </View>
      )}

      {/* 푸터 */}
      <View style={styles.footer}>
        {/* 로고 (커스텀 옵션에 따라) */}
        {(!customOptions || customOptions.showLogo) && (
          <View style={styles.logo}>
            <Image
              source={require('@/assets/images/nu-icon.png')}
              style={{
                width: 24 * fontMultiplier,
                height: 24 * fontMultiplier,
                tintColor: config.textColor,
              }}
            />
            <Text style={[
              styles.appName,
              {
                color: config.textColor,
                fontSize: styles.appName.fontSize * fontMultiplier
              }
            ]}>
              쉐어핏
            </Text>
          </View>
        )}
        {/* 해시태그 (커스텀 또는 기본값) */}
        <Text style={[
          styles.hashtags,
          {
            color: config.subTextColor,
            fontSize: styles.hashtags.fontSize * fontMultiplier
          }
        ]}>
          {customOptions?.hashtags?.length
            ? customOptions.hashtags.map(tag => `#${tag}`).join(' ')
            : '#오운완 #헬스타그램 #운동기록'}
        </Text>
      </View>
    </>
  );

  // 배경 이미지가 있는 경우와 그라데이션 배경 조건부 렌더링
  if (config.backgroundType === 'image' && config.backgroundImage) {
    return (
      <ImageBackground
        source={{ uri: config.backgroundImage }}
        style={containerStyle}
        imageStyle={{
          borderRadius: customOptions?.borderRadius || 0,
          opacity: config.backgroundOpacity || 1,
        }}
      >
        {renderCardContent()}
      </ImageBackground>
    );
  }

  // 그라데이션 배경 (기본)
  return (
    <LinearGradient
      colors={config.gradient}
      style={containerStyle}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      {renderCardContent()}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20, // 패딩을 더 줄임
    justifyContent: 'space-between',
  },
  header: {
    marginBottom: 10, // 마진을 더 줄임
  },
  dateText: {
    fontSize: 12, // 폰트 크기를 더 줄임
    marginBottom: 4,
  },
  title: {
    fontSize: 28, // 타이틀 폰트 크기를 더 줄임
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
    opacity: 0.8,
  },
  mainStats: {
    marginVertical: 15, // 통계 섹션 마진을 더 줄임
  },
  bigStat: {
    alignItems: 'center',
    marginBottom: 15, // 마진을 더 줄임
  },
  bigStatValue: {
    fontSize: 36, // 큰 통계 값 폰트 크기를 더 줄임
    fontWeight: 'bold',
    marginTop: 6,
  },
  bigStatLabel: {
    fontSize: 13, // 라벨 폰트 크기를 줄임
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18, // 통계 값 폰트 크기를 더 줄임
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11, // 라벨 폰트 크기를 더 줄임
    marginTop: 2,
  },
  exerciseList: {
    flex: 1,
    marginVertical: 10, // 운동 리스트 마진을 더 줄임
    maxHeight: 180, // 최대 높이를 더 제한하여 잘리지 않도록 함
  },
  exerciseTitle: {
    fontSize: 14, // 운동 섹션 타이틀 폰트 크기를 더 줄임
    fontWeight: '600',
    marginBottom: 8,
  },
  exerciseItem: {
    marginBottom: 8, // 운동 아이템 간격을 더 줄임
  },
  exerciseName: {
    fontSize: 13, // 운동 이름 폰트 크기를 더 줄임
    fontWeight: '500',
  },
  exerciseDetail: {
    fontSize: 11, // 운동 상세 폰트 크기를 더 줄임
    marginTop: 1,
  },
  moreExercises: {
    fontSize: 11, // 더보기 텍스트 폰트 크기를 더 줄임
    fontStyle: 'italic',
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 10, // 푸터 패딩을 더 줄임
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  appName: {
    fontSize: 16, // 앱 이름 폰트 크기를 더 줄임
    fontWeight: 'bold',
  },
  hashtags: {
    fontSize: 10, // 해시태그 폰트 크기를 더 줄임
  },
});