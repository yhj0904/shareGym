import { create } from 'zustand';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '@/config/firebase';
import { FeedItem, WorkoutSession, Comment } from '@/types';
import uuid from 'react-native-uuid';

interface FeedStore {
  feedItems: FeedItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  hasMore: boolean;
  lastVisible: any;

  // 피드 관리
  fetchFeed: (userId?: string) => Promise<void>;
  fetchUserFeed: (userId: string) => Promise<void>;
  fetchFollowingFeed: (followingIds: string[]) => Promise<void>;
  loadMore: () => Promise<void>;
  refreshFeed: () => Promise<void>;

  // 게시물 생성
  shareWorkout: (workout: WorkoutSession, userId: string) => Promise<void>;

  // 상호작용
  likePost: (feedItemId: string, userId: string) => Promise<void>;
  unlikePost: (feedItemId: string, userId: string) => Promise<void>;
  addComment: (feedItemId: string, comment: Comment) => Promise<void>;
  deleteComment: (feedItemId: string, commentId: string) => Promise<void>;
}

const useFeedStore = create<FeedStore>((set, get) => ({
  feedItems: [],
  isLoading: false,
  isRefreshing: false,
  hasMore: true,
  lastVisible: null,

  fetchFeed: async (userId?: string) => {
    set({ isLoading: true });
    try {
      let q;
      if (userId) {
        // 특정 사용자의 피드
        q = query(
          collection(db, 'feed'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      } else {
        // 전체 공개 피드
        q = query(
          collection(db, 'feed'),
          where('isPublic', '==', true),
          orderBy('createdAt', 'desc'),
          limit(10)
        );
      }

      const querySnapshot = await getDocs(q);
      const items: FeedItem[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as FeedItem);
      }

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      set({
        feedItems: items,
        lastVisible: lastDoc,
        hasMore: querySnapshot.docs.length === 10,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching feed:', error);
      set({ isLoading: false });
    }
  },

  fetchUserFeed: async (userId: string) => {
    await get().fetchFeed(userId);
  },

  fetchFollowingFeed: async (followingIds: string[]) => {
    if (followingIds.length === 0) {
      set({ feedItems: [], isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const q = query(
        collection(db, 'feed'),
        where('userId', 'in', followingIds),
        orderBy('createdAt', 'desc'),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const items: FeedItem[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as FeedItem);
      }

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      set({
        feedItems: items,
        lastVisible: lastDoc,
        hasMore: querySnapshot.docs.length === 10,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching following feed:', error);
      set({ isLoading: false });
    }
  },

  loadMore: async () => {
    const { lastVisible, hasMore } = get();
    if (!hasMore || !lastVisible) return;

    try {
      const q = query(
        collection(db, 'feed'),
        where('isPublic', '==', true),
        orderBy('createdAt', 'desc'),
        startAfter(lastVisible),
        limit(10)
      );

      const querySnapshot = await getDocs(q);
      const items: FeedItem[] = [];

      for (const doc of querySnapshot.docs) {
        const data = doc.data();
        items.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
        } as FeedItem);
      }

      const lastDoc = querySnapshot.docs[querySnapshot.docs.length - 1];

      set((state) => ({
        feedItems: [...state.feedItems, ...items],
        lastVisible: lastDoc,
        hasMore: querySnapshot.docs.length === 10,
      }));
    } catch (error) {
      console.error('Error loading more:', error);
    }
  },

  refreshFeed: async () => {
    set({ isRefreshing: true });
    await get().fetchFeed();
    set({ isRefreshing: false });
  },

  shareWorkout: async (workout: WorkoutSession, userId: string) => {
    try {
      const feedItem: Omit<FeedItem, 'id'> = {
        userId,
        type: 'workout',
        content: workout,
        likes: [],
        comments: [],
        createdAt: new Date(),
      };

      const docRef = doc(collection(db, 'feed'));
      await setDoc(docRef, {
        ...feedItem,
        createdAt: serverTimestamp(),
      });

      // 로컬 상태 업데이트
      set((state) => ({
        feedItems: [
          {
            id: docRef.id,
            ...feedItem,
          } as FeedItem,
          ...state.feedItems,
        ],
      }));
    } catch (error) {
      console.error('Error sharing workout:', error);
      throw error;
    }
  },

  likePost: async (feedItemId: string, userId: string) => {
    try {
      const feedRef = doc(db, 'feed', feedItemId);
      const feedDoc = await getDoc(feedRef);

      if (feedDoc.exists()) {
        const likes = feedDoc.data().likes || [];
        if (!likes.includes(userId)) {
          await updateDoc(feedRef, {
            likes: [...likes, userId],
          });

          // 로컬 상태 업데이트
          set((state) => ({
            feedItems: state.feedItems.map((item) =>
              item.id === feedItemId
                ? { ...item, likes: [...item.likes, userId] }
                : item
            ),
          }));
        }
      }
    } catch (error) {
      console.error('Error liking post:', error);
    }
  },

  unlikePost: async (feedItemId: string, userId: string) => {
    try {
      const feedRef = doc(db, 'feed', feedItemId);
      const feedDoc = await getDoc(feedRef);

      if (feedDoc.exists()) {
        const likes = feedDoc.data().likes || [];
        await updateDoc(feedRef, {
          likes: likes.filter((id: string) => id !== userId),
        });

        // 로컬 상태 업데이트
        set((state) => ({
          feedItems: state.feedItems.map((item) =>
            item.id === feedItemId
              ? { ...item, likes: item.likes.filter(id => id !== userId) }
              : item
          ),
        }));
      }
    } catch (error) {
      console.error('Error unliking post:', error);
    }
  },

  addComment: async (feedItemId: string, comment: Comment) => {
    try {
      const feedRef = doc(db, 'feed', feedItemId);
      const feedDoc = await getDoc(feedRef);

      if (feedDoc.exists()) {
        const comments = feedDoc.data().comments || [];
        await updateDoc(feedRef, {
          comments: [...comments, comment],
        });

        // 로컬 상태 업데이트
        set((state) => ({
          feedItems: state.feedItems.map((item) =>
            item.id === feedItemId
              ? { ...item, comments: [...item.comments, comment] }
              : item
          ),
        }));
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  },

  deleteComment: async (feedItemId: string, commentId: string) => {
    try {
      const feedRef = doc(db, 'feed', feedItemId);
      const feedDoc = await getDoc(feedRef);

      if (feedDoc.exists()) {
        const comments = feedDoc.data().comments || [];
        await updateDoc(feedRef, {
          comments: comments.filter((c: Comment) => c.id !== commentId),
        });

        // 로컬 상태 업데이트
        set((state) => ({
          feedItems: state.feedItems.map((item) =>
            item.id === feedItemId
              ? { ...item, comments: item.comments.filter(c => c.id !== commentId) }
              : item
          ),
        }));
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  },
}));

export default useFeedStore;