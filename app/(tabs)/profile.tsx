import { StyleSheet, ScrollView, Pressable, View } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import useWorkoutStore from '@/stores/workoutStore';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const { workoutHistory } = useWorkoutStore();

  return (
    <ThemedView style={styles.container}>
      <ThemedView style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={40} color="#ccc" />
          </View>
          <ThemedText type="title">사용자</ThemedText>
          <ThemedText style={styles.username}>@user</ThemedText>
        </View>
      </ThemedView>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 통계 섹션 */}
        <ThemedView style={styles.statsSection}>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statNumber}>{workoutHistory.length}</ThemedText>
            <ThemedText style={styles.statLabel}>총 운동</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statNumber}>0</ThemedText>
            <ThemedText style={styles.statLabel}>연속 일수</ThemedText>
          </ThemedView>
          <ThemedView style={styles.statItem}>
            <ThemedText style={styles.statNumber}>0</ThemedText>
            <ThemedText style={styles.statLabel}>팔로워</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* 메뉴 섹션 */}
        <ThemedView style={styles.menuSection}>
          <Pressable style={styles.menuItem}>
            <Ionicons name="settings-outline" size={24} color={colors.text} />
            <ThemedText style={styles.menuText}>설정</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="trophy-outline" size={24} color={colors.text} />
            <ThemedText style={styles.menuText}>뱃지</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="bookmark-outline" size={24} color={colors.text} />
            <ThemedText style={styles.menuText}>저장된 루틴</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>

          <Pressable style={styles.menuItem}>
            <Ionicons name="help-circle-outline" size={24} color={colors.text} />
            <ThemedText style={styles.menuText}>도움말</ThemedText>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </Pressable>
        </ThemedView>

        <Pressable style={[styles.logoutButton, { borderColor: colors.border }]}>
          <ThemedText style={[styles.logoutText, { color: '#ff4444' }]}>
            로그아웃
          </ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 60,
    paddingBottom: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 15,
  },
  username: {
    marginTop: 5,
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  statsSection: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    marginTop: 5,
    fontSize: 14,
    opacity: 0.6,
  },
  menuSection: {
    paddingTop: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    gap: 15,
  },
  menuText: {
    flex: 1,
    fontSize: 16,
  },
  logoutButton: {
    margin: 20,
    padding: 16,
    borderWidth: 1,
    borderRadius: 12,
    alignItems: 'center',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});