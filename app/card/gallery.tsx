import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  Pressable,
  Image,
  Alert,
  Dimensions,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import useWorkoutStore from '@/stores/workoutStore';

const { width: screenWidth } = Dimensions.get('window');
const cardWidth = (screenWidth - 45) / 2; // 2열 그리드

interface SavedCard {
  id: string;
  uri: string;
  createdAt: Date;
  workoutDate?: Date;
  style?: string;
}

export default function CardGalleryScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const insets = useSafeAreaInsets();
  const { workoutHistory } = useWorkoutStore();

  const [savedCards, setSavedCards] = useState<SavedCard[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCard, setSelectedCard] = useState<SavedCard | null>(null);

  // 갤러리에서 쉐어핏 앨범의 카드들 불러오기
  useEffect(() => {
    loadSavedCards();
  }, []);

  const loadSavedCards = async () => {
    try {
      // 권한 확인
      const { status } = await MediaLibrary.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await MediaLibrary.requestPermissionsAsync();
        if (newStatus !== 'granted') {
          Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
          return;
        }
      }

      // 쉐어핏 앨범 찾기
      const albums = await MediaLibrary.getAlbumsAsync();
      const shareGymAlbum = albums.find(album => album.title === '쉐어핏');

      if (shareGymAlbum) {
        // 앨범의 사진들 가져오기
        const assets = await MediaLibrary.getAssetsAsync({
          album: shareGymAlbum,
          sortBy: MediaLibrary.SortBy.creationTime,
          mediaType: MediaLibrary.MediaType.photo,
          first: 50, // 최근 50개
        });

        const cards: SavedCard[] = assets.assets.map(asset => ({
          id: asset.id,
          uri: asset.uri,
          createdAt: new Date(asset.creationTime),
          workoutDate: new Date(asset.creationTime), // 실제로는 메타데이터에서 가져와야 함
        }));

        setSavedCards(cards);
      }
    } catch (error) {
      console.error('카드 불러오기 실패:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  // 새로고침
  const onRefresh = () => {
    setRefreshing(true);
    loadSavedCards();
  };

  // 카드 삭제
  const deleteCard = (card: SavedCard) => {
    Alert.alert(
      '카드 삭제',
      '이 카드를 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              await MediaLibrary.deleteAssetsAsync([card.id]);
              setSavedCards(prev => prev.filter(c => c.id !== card.id));
              Alert.alert('성공', '카드가 삭제되었습니다.');
            } catch (error) {
              console.error('카드 삭제 실패:', error);
              Alert.alert('오류', '카드 삭제에 실패했습니다.');
            }
          },
        },
      ],
    );
  };

  // 카드 공유
  const shareCard = async (card: SavedCard) => {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(card.uri);
      } else {
        Alert.alert('알림', '이 기기에서는 공유 기능을 사용할 수 없습니다.');
      }
    } catch (error) {
      console.error('카드 공유 실패:', error);
      Alert.alert('오류', '카드 공유에 실패했습니다.');
    }
  };

  // 카드 렌더링
  const renderCard = ({ item }: { item: SavedCard }) => (
    <Pressable
      style={styles.cardItem}
      onPress={() => setSelectedCard(item)}
      onLongPress={() => {
        Alert.alert(
          '카드 옵션',
          '원하는 작업을 선택하세요',
          [
            { text: '공유', onPress: () => shareCard(item) },
            { text: '삭제', onPress: () => deleteCard(item), style: 'destructive' },
            { text: '취소', style: 'cancel' },
          ],
        );
      }}
    >
      <Image source={{ uri: item.uri }} style={styles.cardImage} />
      <View style={styles.cardOverlay}>
        <ThemedText style={styles.cardDate}>
          {item.createdAt.toLocaleDateString('ko-KR', {
            month: 'short',
            day: 'numeric',
          })}
        </ThemedText>
      </View>
    </Pressable>
  );

  return (
    <ThemedView style={styles.container}>
      {/* 헤더 - SafeArea 포함 */}
      <View style={[styles.header, {
        backgroundColor: colors.background,
        paddingTop: insets.top + 10,
        borderBottomColor: colorScheme === 'dark' ? '#333' : '#eee',
      }]}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </Pressable>
        <ThemedText type="subtitle">운동 카드 갤러리</ThemedText>
        <Pressable
          onPress={() => router.push('/card/create')}
          style={styles.createButton}
        >
          <Ionicons name="add" size={24} color={colors.tint} />
        </Pressable>
      </View>

      {/* 통계 바 */}
      <View style={[styles.statsBar, { backgroundColor: colors.card }]}>
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{savedCards.length}</ThemedText>
          <ThemedText style={styles.statLabel}>저장된 카드</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>{workoutHistory.length}</ThemedText>
          <ThemedText style={styles.statLabel}>총 운동</ThemedText>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <ThemedText style={styles.statValue}>
            {savedCards.length > 0
              ? Math.round((savedCards.length / workoutHistory.length) * 100)
              : 0}%
          </ThemedText>
          <ThemedText style={styles.statLabel}>카드 생성률</ThemedText>
        </View>
      </View>

      {/* 카드 그리드 */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ThemedText>불러오는 중...</ThemedText>
        </View>
      ) : savedCards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={64} color={colors.text + '40'} />
          <ThemedText style={styles.emptyText}>저장된 카드가 없습니다</ThemedText>
          <ThemedText style={styles.emptySubtext}>
            운동을 완료하고 카드를 만들어보세요
          </ThemedText>
          <Pressable
            style={[styles.createCardButton, { backgroundColor: colors.tint }]}
            onPress={() => router.push('/card/create')}
          >
            <ThemedText style={styles.createCardButtonText}>카드 만들기</ThemedText>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={savedCards}
          renderItem={renderCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.gridContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* 카드 상세 보기 모달 */}
      {selectedCard && (
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedCard(null)}
        >
          <View style={styles.modalContent}>
            <Image
              source={{ uri: selectedCard.uri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
            <View style={styles.modalActions}>
              <Pressable
                style={[styles.modalButton, { backgroundColor: colors.tint }]}
                onPress={() => shareCard(selectedCard)}
              >
                <Ionicons name="share-outline" size={20} color="white" />
                <ThemedText style={styles.modalButtonText}>공유</ThemedText>
              </Pressable>
              <Pressable
                style={[styles.modalButton, { backgroundColor: '#FF3B30' }]}
                onPress={() => {
                  deleteCard(selectedCard);
                  setSelectedCard(null);
                }}
              >
                <Ionicons name="trash-outline" size={20} color="white" />
                <ThemedText style={styles.modalButtonText}>삭제</ThemedText>
              </Pressable>
            </View>
          </View>
        </Pressable>
      )}
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
    paddingHorizontal: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  createButton: {
    padding: 5,
  },
  statsBar: {
    flexDirection: 'row',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginVertical: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: '70%',
    backgroundColor: '#E0E0E0',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 20,
    opacity: 0.6,
  },
  emptySubtext: {
    fontSize: 14,
    marginTop: 8,
    opacity: 0.4,
    textAlign: 'center',
  },
  createCardButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  createCardButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  gridContent: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  cardItem: {
    width: cardWidth,
    height: cardWidth * 1.4, // Instagram story ratio
    marginBottom: 15,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#f5f5f5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  cardDate: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    maxWidth: 400,
  },
  modalImage: {
    width: '100%',
    height: undefined,
    aspectRatio: 1 / 1.4,
    borderRadius: 12,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  modalButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});