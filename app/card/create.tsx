import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import WorkoutCardTemplate from '@/components/card/WorkoutCardTemplate';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 40;
const cardHeight = cardWidth * 1.4; // Instagram story ratio

type CardStyle = 'minimal' | 'gradient' | 'dark' | 'colorful';

export default function CreateCardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { lastWorkout } = useWorkoutStore();
  const viewShotRef = useRef<ViewShot>(null);

  const [selectedStyle, setSelectedStyle] = useState<CardStyle>('minimal');
  const [isGenerating, setIsGenerating] = useState(false);

  const cardStyles = [
    { id: 'minimal', name: '미니멀', colors: ['#FFFFFF', '#F5F5F5'] },
    { id: 'gradient', name: '그라데이션', colors: ['#667eea', '#764ba2'] },
    { id: 'dark', name: '다크', colors: ['#1a1a1a', '#2d2d2d'] },
    { id: 'colorful', name: '컬러풀', colors: ['#f093fb', '#f5576c'] },
  ];

  const handleSaveCard = async () => {
    if (!viewShotRef.current) return;

    setIsGenerating(true);
    try {
      // 권한 요청
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('권한 필요', '사진 저장을 위해 권한이 필요합니다.');
        return;
      }

      // 스크린샷 캡처
      const uri = await viewShotRef.current.capture();

      // 갤러리에 저장
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('ShareGym', asset, false);

      Alert.alert('저장 완료', '운동 카드가 갤러리에 저장되었습니다.');
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '카드 저장에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShareCard = async () => {
    if (!viewShotRef.current) return;

    setIsGenerating(true);
    try {
      const uri = await viewShotRef.current.capture();

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
      } else {
        Alert.alert('알림', '이 기기에서는 공유 기능을 사용할 수 없습니다.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '카드 공유에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!lastWorkout) {
    return (
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.emptyContainer}>
          <ThemedText>운동 기록이 없습니다</ThemedText>
        </ThemedView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <ThemedView style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle">운동 카드 만들기</ThemedText>
        <View style={{ width: 28 }} />
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 카드 미리보기 */}
        <View style={styles.cardContainer}>
          <ViewShot
            ref={viewShotRef}
            options={{
              format: 'png',
              quality: 1,
              width: cardWidth,
              height: cardHeight,
            }}
          >
            <WorkoutCardTemplate
              workout={lastWorkout}
              style={selectedStyle}
              width={cardWidth}
              height={cardHeight}
            />
          </ViewShot>
        </View>

        {/* 스타일 선택 */}
        <ThemedView style={styles.styleSection}>
          <ThemedText style={styles.sectionTitle}>스타일 선택</ThemedText>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.styleList}
          >
            {cardStyles.map((style) => (
              <Pressable
                key={style.id}
                style={[
                  styles.styleOption,
                  selectedStyle === style.id && styles.selectedStyle,
                ]}
                onPress={() => setSelectedStyle(style.id as CardStyle)}
              >
                <View
                  style={[
                    styles.stylePreview,
                    { backgroundColor: style.colors[0] },
                  ]}
                />
                <ThemedText style={styles.styleName}>{style.name}</ThemedText>
              </Pressable>
            ))}
          </ScrollView>
        </ThemedView>

        {/* 액션 버튼 */}
        <ThemedView style={styles.actions}>
          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: colors.tint },
              isGenerating && styles.disabledButton,
            ]}
            onPress={handleSaveCard}
            disabled={isGenerating}
          >
            <Ionicons name="download-outline" size={24} color="white" />
            <ThemedText style={styles.actionButtonText}>
              {isGenerating ? '저장 중...' : '갤러리에 저장'}
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              styles.secondaryButton,
              isGenerating && styles.disabledButton,
            ]}
            onPress={handleShareCard}
            disabled={isGenerating}
          >
            <Ionicons name="share-outline" size={24} color={colors.text} />
            <ThemedText style={styles.actionButtonText}>공유하기</ThemedText>
          </Pressable>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  content: {
    flex: 1,
  },
  cardContainer: {
    alignItems: 'center',
    padding: 20,
  },
  styleSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 15,
  },
  styleList: {
    flexDirection: 'row',
  },
  styleOption: {
    alignItems: 'center',
    marginRight: 15,
    padding: 10,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedStyle: {
    borderColor: '#007AFF',
  },
  stylePreview: {
    width: 60,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  styleName: {
    fontSize: 12,
  },
  actions: {
    padding: 20,
    gap: 15,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});