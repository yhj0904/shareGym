import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  Pressable,
  View,
  Alert,
  Dimensions,
} from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';
import useGroupStore from '@/stores/groupStore';
import useAuthStore from '@/stores/authStore';
import SharedCardTemplate from '@/components/card/SharedCardTemplate';
import ViewShot from 'react-native-view-shot';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = screenWidth - 40;
const cardHeight = cardWidth * 1.4; // Instagram story ratio

export default function CompleteSharedCardScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { cardId } = useLocalSearchParams();
  const viewShotRef = useRef<ViewShot>(null);

  const { lastWorkout, startSession } = useWorkoutStore();
  const { sharedCards, groups, completeSharedCard, joinCollaborativeCard } = useGroupStore();
  const { user, fetchUserProfile } = useAuthStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [sharedCard, setSharedCard] = useState<any>(null);
  const [group, setGroup] = useState<any>(null);
  const [firstUserName, setFirstUserName] = useState<string>('');

  useEffect(() => {
    const card = sharedCards.find((c: any) => c.id === cardId);
    if (card) {
      setSharedCard(card);
      const foundGroup = groups.find((g: any) => g.id === card.groupId);
      setGroup(foundGroup);
      if (card.firstHalf?.userId) {
        fetchUserProfile(card.firstHalf.userId).then((profile) => {
          setFirstUserName(profile?.username ?? card.firstHalf.username ?? card.firstHalf.userId);
        });
      } else {
        setFirstUserName(card.firstHalf?.username ?? '');
      }
    }
  }, [cardId, sharedCards, groups, fetchUserProfile]);

  // 협업 카드인 경우 운동 시작 옵션 표시
  if (!lastWorkout && sharedCard?.type === 'collaborative') {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, {
          borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee'
        }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <ThemedText type="subtitle">협업 카드 참여</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.emptyContainer}>
          <View style={[styles.collaborativeBadge, { backgroundColor: colors.tint }]}>
            <ThemedText style={styles.collaborativeBadgeText}>TOGETHER</ThemedText>
          </View>
          <ThemedText style={styles.emptyText}>
            함께 운동 카드를 완성해요!
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            {firstUserName || sharedCard?.firstHalf?.username || '그룹원'}님이 기다리고 있어요.{'\n'}
            지금 운동을 시작하여 카드를 완성하세요.
          </ThemedText>
          <Pressable
            style={[styles.goWorkoutButton, { backgroundColor: colors.tint }]}
            onPress={() => {
              startSession();
              router.replace('/(tabs)/workout');
            }}
          >
            <Ionicons name="play-circle" size={24} color="white" />
            <ThemedText style={styles.goWorkoutButtonText}>운동 시작하기</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  // 일반 카드인 경우 기존 메시지
  if (!lastWorkout) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, {
          borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee'
        }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <ThemedText type="subtitle">공유 카드 완성</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={48} color="#ccc" />
          <ThemedText style={styles.emptyText}>
            운동을 먼저 완료해주세요
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            공유 카드를 완성하려면 오늘의 운동을 먼저 기록해야 합니다.
          </ThemedText>
          <Pressable
            style={[styles.goWorkoutButton, { backgroundColor: colors.tint }]}
            onPress={() => router.replace('/(tabs)/workout')}
          >
            <ThemedText style={styles.goWorkoutButtonText}>운동하러 가기</ThemedText>
          </Pressable>
        </View>
      </ThemedView>
    );
  }

  if (!sharedCard || !group) {
    return (
      <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, {
          borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee'
        }]}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close" size={28} color={colors.text} />
          </Pressable>
          <ThemedText type="subtitle">공유 카드 완성</ThemedText>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.emptyContainer}>
          <ThemedText>카드를 찾을 수 없습니다</ThemedText>
        </View>
      </ThemedView>
    );
  }

  const handleCompleteCard = async () => {
    if (!user || !lastWorkout) {
      Alert.alert('오류', '필요한 정보가 없습니다.');
      return;
    }

    setIsGenerating(true);
    try {
      // ViewShot으로 이미지 캡처
      const uri = await viewShotRef.current?.capture();

      // 카드 타입에 따라 다른 처리
      if (sharedCard.type === 'collaborative') {
        // 협업 카드 참여
        await joinCollaborativeCard(
          sharedCard.id,
          user.id,
          lastWorkout.id,
          lastWorkout
        );
        Alert.alert('협업 성공!', '함께 운동 카드를 완성했습니다! 🎉');
      } else {
        // 일반 공유 카드 완성
        await completeSharedCard(
          sharedCard.id,
          user.id,
          lastWorkout.id,
          uri
        );
        Alert.alert('완성!', '공유 카드가 완성되었습니다. 그룹 멤버들과 공유해보세요!');
      }

      // 그룹 페이지로 이동
      router.replace('/(tabs)/groups');
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '카드 완성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

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

      // 카드 먼저 완성
      if (sharedCard.status === 'pending') {
        await handleCompleteCard();
      }

      // 스크린샷 캡처
      const uri = await viewShotRef.current.capture();

      // 갤러리에 저장
      const asset = await MediaLibrary.createAssetAsync(uri);
      await MediaLibrary.createAlbumAsync('쉐어핏', asset, false);

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
      // 카드 먼저 완성
      if (sharedCard.status === 'pending') {
        await handleCompleteCard();
      }

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

  // 미리보기용 - 실제 데이터가 있을 때만 표시
  const renderPreview = () => {
    const firstWorkout = sharedCard?.firstHalf?.workout ?? null;

    return (
      <SharedCardTemplate
        firstWorkout={firstWorkout}
        secondWorkout={lastWorkout}
        splitType={sharedCard.splitType}
        splitPosition={sharedCard.splitPosition}
        style={sharedCard.style}
        customOptions={sharedCard.customOptions}
        width={cardWidth}
        height={cardHeight}
        firstUserName={firstUserName || sharedCard?.firstHalf?.username || sharedCard?.firstHalf?.userId || ''}
        secondUserName={user?.username || '나'}
        groupName={group.name}
      />
    );
  };

  return (
    <ThemedView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더 */}
      <View style={[styles.header, {
        borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee'
      }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="close" size={28} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle">공유 카드 완성</ThemedText>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}>
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
            {renderPreview()}
          </ViewShot>
        </View>

        {/* 카드 정보 */}
        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="grid-outline" size={20} color={colors.text} />
            <ThemedText style={styles.infoLabel}>분할 방식:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {sharedCard.splitType === 'horizontal' ? '상하' : '좌우'} 분할
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="person-outline" size={20} color={colors.text} />
            <ThemedText style={styles.infoLabel}>첫 번째 작성자:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {firstUserName || sharedCard.firstHalf?.username || sharedCard.firstHalf?.userId || '-'}
            </ThemedText>
          </View>

          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={20} color={colors.text} />
            <ThemedText style={styles.infoLabel}>그룹:</ThemedText>
            <ThemedText style={styles.infoValue}>
              {group.name}
            </ThemedText>
          </View>
        </View>

        {/* 액션 버튼 */}
        <View style={styles.actions}>
          {sharedCard.status === 'pending' && (
            <Pressable
              style={[
                styles.actionButton,
                { backgroundColor: colors.tint },
                isGenerating && styles.disabledButton,
              ]}
              onPress={handleCompleteCard}
              disabled={isGenerating}
            >
              <Ionicons name="checkmark-circle-outline" size={24} color="white" />
              <ThemedText style={[styles.actionButtonText, { color: 'white' }]}>
                {isGenerating ? '완성 중...' : '카드 완성하기'}
              </ThemedText>
            </Pressable>
          )}

          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' },
              isGenerating && styles.disabledButton,
            ]}
            onPress={handleSaveCard}
            disabled={isGenerating}
          >
            <Ionicons name="download-outline" size={24} color={colors.text} />
            <ThemedText style={[styles.actionButtonText, { color: colors.text }]}>
              갤러리에 저장
            </ThemedText>
          </Pressable>

          <Pressable
            style={[
              styles.actionButton,
              { backgroundColor: colorScheme === 'dark' ? '#2a2a2a' : '#f5f5f5' },
              isGenerating && styles.disabledButton,
            ]}
            onPress={handleShareCard}
            disabled={isGenerating}
          >
            <Ionicons name="share-outline" size={24} color={colors.text} />
            <ThemedText style={[styles.actionButtonText, { color: colors.text }]}>
              공유하기
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
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
    padding: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 10,
    fontSize: 14,
    opacity: 0.6,
    textAlign: 'center',
    lineHeight: 20,
  },
  goWorkoutButton: {
    marginTop: 30,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  goWorkoutButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  collaborativeBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 20,
  },
  collaborativeBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardContainer: {
    alignItems: 'center',
    padding: 20,
  },
  infoSection: {
    padding: 20,
    paddingTop: 0,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    opacity: 0.6,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 10,
  },
  disabledButton: {
    opacity: 0.6,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});