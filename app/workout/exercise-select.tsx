import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  View,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import { exerciseDatabase, exerciseCategories, searchExercises, getExercisesByCategory } from '@/data/exercises';
import { ExerciseType } from '@/types';

export default function ExerciseSelectScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { addExercise } = useWorkoutStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleSelectExercise = (exercise: ExerciseType) => {
    addExercise(exercise);
    router.back();
  };

  const getFilteredExercises = () => {
    if (searchQuery) {
      return searchExercises(searchQuery);
    }
    if (selectedCategory) {
      return getExercisesByCategory(selectedCategory);
    }
    return exerciseDatabase;
  };

  const filteredExercises = getFilteredExercises();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <ThemedView style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle">운동 선택</ThemedText>
        <View style={{ width: 28 }} />
      </ThemedView>

      {/* 검색 바 */}
      <ThemedView style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="운동 검색..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <Pressable onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#999" />
          </Pressable>
        )}
      </ThemedView>

      {/* 카테고리 필터 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryContainer}
      >
        <Pressable
          style={[
            styles.categoryChip,
            !selectedCategory && { backgroundColor: colors.tint },
          ]}
          onPress={() => setSelectedCategory(null)}
        >
          <ThemedText
            style={[
              styles.categoryText,
              !selectedCategory && { color: 'white' },
            ]}
          >
            전체
          </ThemedText>
        </Pressable>

        {exerciseCategories.map((category) => (
          <Pressable
            key={category.id}
            style={[
              styles.categoryChip,
              selectedCategory === category.id && { backgroundColor: colors.tint },
            ]}
            onPress={() => setSelectedCategory(category.id)}
          >
            <ThemedText
              style={[
                styles.categoryText,
                selectedCategory === category.id && { color: 'white' },
              ]}
            >
              {category.icon} {category.name}
            </ThemedText>
          </Pressable>
        ))}
      </ScrollView>

      {/* 운동 목록 */}
      <FlatList
        data={filteredExercises}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={styles.exerciseItem}
            onPress={() => handleSelectExercise(item)}
          >
            <View style={styles.exerciseInfo}>
              <ThemedText style={styles.exerciseName}>
                {item.icon} {item.nameKo}
              </ThemedText>
              <ThemedText style={styles.exerciseEnglish}>{item.name}</ThemedText>
              <View style={styles.exerciseMeta}>
                {item.equipment && (
                  <ThemedText style={styles.equipment}>{item.equipment}</ThemedText>
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
    </SafeAreaView>
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 15,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoryContainer: {
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    marginRight: 8,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContent: {
    paddingBottom: 100,
  },
  exerciseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
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
    backgroundColor: '#f0f0f0',
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