import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  View,
  FlatList,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import { exerciseDatabase, exerciseCategories, searchExercises, getExercisesByCategory } from '@/data/exercises';
import { ExerciseType } from '@/types';

// 화면 크기 가져오기
const { width: screenWidth } = Dimensions.get('window');

export default function ExerciseSelectScreen() {
  // 테마 및 색상 설정
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets(); // 모달에서도 최소한의 SafeArea 적용
  const { addExercise, currentSession, startSession } = useWorkoutStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'weight' | 'cardio'>('all');

  // currentSession이 없으면 새로 생성 (안전장치)
  useEffect(() => {
    if (!currentSession) {
      startSession();
    }
  }, []);

  const handleSelectExercise = (exercise: ExerciseType) => {
    // currentSession이 없으면 새로 생성
    if (!currentSession) {
      startSession();
      // 세션 생성 후 약간의 지연을 두고 운동 추가
      setTimeout(() => {
        addExercise(exercise);
        router.replace('/workout/active-session'); // replace로 돌아가기
      }, 100);
    } else {
      addExercise(exercise);
      router.replace('/workout/active-session'); // replace로 돌아가기
    }
  };

  const getFilteredExercises = () => {
    let exercises = exerciseDatabase;

    // 검색어 필터
    if (searchQuery) {
      exercises = searchExercises(searchQuery);
    }
    // 카테고리 필터
    else if (selectedCategory) {
      exercises = getExercisesByCategory(selectedCategory);
    }

    // 타입 필터 (웨이트/유산소)
    if (selectedType !== 'all') {
      exercises = exercises.filter(ex => {
        if (selectedType === 'cardio') {
          return ex.category === 'cardio';
        } else {
          return ex.category !== 'cardio';
        }
      });
    }

    return exercises;
  };

  const filteredExercises = getFilteredExercises();

  // 운동 개수 통계
  const exerciseStats = {
    total: filteredExercises.length,
    cardio: filteredExercises.filter(ex => ex.category === 'cardio').length,
    weight: filteredExercises.filter(ex => ex.category !== 'cardio').length,
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 - 모달에서 최소한의 SafeArea 적용 */}
      <ThemedView style={[styles.header, {
        marginTop: Math.min(insets.top, 20),
        borderBottomColor: colorScheme === 'dark' ? '#333' : '#F2F2F4'
      }]}>
        <Pressable onPress={() => router.replace('/workout/active-session')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle">운동 선택</ThemedText>
        <View style={{ width: 28 }} />
      </ThemedView>

      {/* 검색 바 */}
      <ThemedView style={[styles.searchContainer, {
        backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4'
      }]}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="운동 검색... (예: 벤치프레스, 스쿼트)"
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            // 검색 시 카테고리 필터 초기화
            if (text) setSelectedCategory(null);
          }}
          returnKeyType="search"
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </Pressable>
        )}
      </ThemedView>

      {/* 타입 필터 (웨이트/유산소) */}
      <View style={styles.typeFilterContainer}>
        <Pressable
          style={[
            styles.typeFilterButton,
            { backgroundColor: selectedType === 'all' ? colors.tint :
              (colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4') },
          ]}
          onPress={() => setSelectedType('all')}
        >
          <View style={styles.typeFilterContent}>
            <Ionicons
              name="fitness"
              size={16}
              color={selectedType === 'all' ? 'white' : colors.text}
            />
            <ThemedText
              style={[
                styles.typeFilterText,
                { color: selectedType === 'all' ? 'white' : colors.text },
              ]}
            >
              전체
            </ThemedText>
          </View>
          <ThemedText
            style={[
              styles.typeFilterCount,
              { color: selectedType === 'all' ? 'white' : colors.text },
            ]}
          >
            {exerciseDatabase.length}
          </ThemedText>
        </Pressable>

        <Pressable
          style={[
            styles.typeFilterButton,
            { backgroundColor: selectedType === 'weight' ? colors.tint :
              (colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4') },
          ]}
          onPress={() => setSelectedType('weight')}
        >
          <View style={styles.typeFilterContent}>
            <Ionicons
              name="barbell"
              size={16}
              color={selectedType === 'weight' ? 'white' : colors.text}
            />
            <ThemedText
              style={[
                styles.typeFilterText,
                { color: selectedType === 'weight' ? 'white' : colors.text },
              ]}
            >
              웨이트
            </ThemedText>
          </View>
          <ThemedText
            style={[
              styles.typeFilterCount,
              { color: selectedType === 'weight' ? 'white' : colors.text },
            ]}
          >
            {exerciseDatabase.filter(ex => ex.category !== 'cardio').length}
          </ThemedText>
        </Pressable>

        <Pressable
          style={[
            styles.typeFilterButton,
            { backgroundColor: selectedType === 'cardio' ? colors.tint :
              (colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4') },
          ]}
          onPress={() => setSelectedType('cardio')}
        >
          <View style={styles.typeFilterContent}>
            <Ionicons
              name="bicycle"
              size={16}
              color={selectedType === 'cardio' ? 'white' : colors.text}
            />
            <ThemedText
              style={[
                styles.typeFilterText,
                { color: selectedType === 'cardio' ? 'white' : colors.text },
              ]}
            >
              유산소
            </ThemedText>
          </View>
          <ThemedText
            style={[
              styles.typeFilterCount,
              { color: selectedType === 'cardio' ? 'white' : colors.text },
            ]}
          >
            {exerciseDatabase.filter(ex => ex.category === 'cardio').length}
          </ThemedText>
        </Pressable>
      </View>

      {/* 카테고리 필터 */}
      {!searchQuery && (
        <View style={styles.categoryWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            <Pressable
              style={[
                styles.categoryChip,
                { backgroundColor: !selectedCategory ? colors.tint :
                  (colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4') },
              ]}
              onPress={() => setSelectedCategory(null)}
            >
              <ThemedText
                style={[
                  styles.categoryText,
                  { color: !selectedCategory ? 'white' : colors.text },
                ]}
              >
                전체
              </ThemedText>
            </Pressable>

            {exerciseCategories
              .filter(cat => {
                // 타입 필터에 따라 카테고리 필터링
                if (selectedType === 'cardio') return cat.id === 'cardio';
                if (selectedType === 'weight') return cat.id !== 'cardio';
                return true;
              })
              .map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryChip,
                    { backgroundColor: selectedCategory === category.id ? colors.tint :
                      (colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4') },
                  ]}
                  onPress={() => setSelectedCategory(category.id)}
                >
                  <ThemedText
                    style={[
                      styles.categoryText,
                      { color: selectedCategory === category.id ? 'white' : colors.text },
                    ]}
                  >
                    {category.icon} {category.name}
                  </ThemedText>
                </Pressable>
              ))}
          </ScrollView>
        </View>
      )}

      {/* 검색 결과 수 표시 */}
      {(searchQuery || selectedCategory) && (
        <View style={styles.resultCount}>
          <ThemedText style={styles.resultCountText}>
            {filteredExercises.length}개의 운동
          </ThemedText>
        </View>
      )}

      {/* 운동 목록 */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.listContent, { paddingBottom: Math.min(insets.bottom, 20) + 20 }]}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.exerciseItem, {
              borderBottomColor: colorScheme === 'dark' ? '#333' : '#F2F2F4'
            }]}
            onPress={() => handleSelectExercise(item)}
          >
            <View style={styles.exerciseInfo}>
              <View style={styles.exerciseHeader}>
                <ThemedText style={styles.exerciseName}>
                  {item.icon} {item.nameKo}
                </ThemedText>
                {/* 유산소 운동 단위 표시 */}
                {item.category === 'cardio' && item.unit && (
                  <View style={[styles.unitBadge, { backgroundColor: colors.tint + '20' }]}>
                    <ThemedText style={[styles.unitBadgeText, { color: colors.tint }]}>
                      {item.unit === 'km' ? '거리' : item.unit === 'level' ? '레벨' : '횟수'}
                    </ThemedText>
                  </View>
                )}
              </View>
              <ThemedText style={styles.exerciseEnglish}>{item.name}</ThemedText>
              <View style={styles.exerciseMeta}>
                {item.equipment && (
                  <ThemedText style={[styles.equipment, {
                    backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#FFF1E4'
                  }]}>{item.equipment}</ThemedText>
                )}
                <ThemedText style={styles.muscleGroups}>
                  {item.muscleGroups.join(' · ')}
                </ThemedText>
              </View>
            </View>
            <Ionicons name="add-circle-outline" size={24} color={colors.tint} />
          </Pressable>
        )}
        ListEmptyComponent={
          <ThemedView style={styles.emptyContainer}>
            <ThemedText style={styles.emptyText}>
              검색 결과가 없습니다
            </ThemedText>
          </ThemedView>
        }
        contentContainerStyle={styles.listContent}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '4%', // 반응형
    paddingVertical: 15,
    borderBottomWidth: 1,
    // borderBottomColor는 동적으로 적용됨
  },
  backButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: '4%', // 반응형
    marginVertical: 10,
    paddingHorizontal: '3%', // 반응형
    paddingVertical: 12,
    // backgroundColor는 동적으로 적용됨
    borderRadius: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  typeFilterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 15,
    marginBottom: 10,
    gap: 8,
  },
  typeFilterButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    // backgroundColor는 동적으로 적용됨
    borderRadius: 10,
    minHeight: 48,
  },
  typeFilterContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  typeFilterText: {
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  typeFilterCount: {
    fontSize: 10,
    fontWeight: '500',
    marginTop: 3,
    opacity: 0.7,
  },
  categoryWrapper: {
    height: 50,
    marginBottom: 10,
  },
  categoryScrollContent: {
    paddingHorizontal: 15,
    alignItems: 'center',
  },
  categoryChip: {
    height: 36,
    paddingHorizontal: 16,
    // backgroundColor는 동적으로 적용됨
    borderRadius: 18,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  resultCount: {
    paddingHorizontal: '4%', // 반응형
    paddingVertical: 5,
  },
  resultCountText: {
    fontSize: 12,
    opacity: 0.6,
  },
  listContent: {
    paddingBottom: 20,
    flexGrow: 1, // 리스트가 충분히 길지 않을 때도 스크롤 가능하도록
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: '4%', // 반응형
    paddingVertical: 15,
    borderBottomWidth: 1,
    // borderBottomColor는 동적으로 적용됨
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
  },
  unitBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  unitBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  exerciseEnglish: {
    fontSize: 14,
    opacity: 0.6,
    marginBottom: 4,
  },
  exerciseMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  equipment: {
    fontSize: 12,
    opacity: 0.5,
    // backgroundColor는 동적으로 적용됨
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  muscleGroups: {
    fontSize: 12,
    opacity: 0.5,
  },
  emptyContainer: {
    padding: 50,
    alignItems: 'center',
  },
  emptyText: {
    opacity: 0.5,
  },
});