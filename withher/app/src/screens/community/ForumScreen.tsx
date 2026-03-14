import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPosts } from '../../store/slices/communitySlice';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { ForumPost, CommunityStackParamList } from '../../types';

const CATEGORIES = ['All', 'GENERAL', 'CAREER', 'TRAINING', 'WELLBEING', 'SUCCESS'];

export default function ForumScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const { posts, isLoadingPosts } = useAppSelector((s) => s.community);
  const [activeCategory, setActiveCategory] = useState('All');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchPosts({ category: activeCategory === 'All' ? undefined : activeCategory }));
  }, [dispatch, activeCategory]);

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    await dispatch(fetchPosts({ category: activeCategory === 'All' ? undefined : activeCategory }));
    setRefreshing(false);
  }

  const filtered = activeCategory === 'All' ? posts : posts.filter((p) => p.category === activeCategory);

  function renderPost({ item }: { item: ForumPost }): React.JSX.Element {
    return (
      <TouchableOpacity
        style={styles.postCard}
        onPress={() => navigation.navigate('PostDetail', { postId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.postMeta}>
          <View style={styles.categoryChip}>
            <Text style={styles.categoryChipText}>{item.category}</Text>
          </View>
          <Text style={styles.postDate}>
            {new Date(item.createdAt).toLocaleDateString()}
          </Text>
        </View>
        <Text style={styles.postTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.postExcerpt} numberOfLines={3}>{item.content}</Text>
        <View style={styles.postFooter}>
          <View style={styles.postStat}>
            <Ionicons name="arrow-up" size={14} color={Colors.textSecondaryLight} />
            <Text style={styles.postStatText}>{item.upvoteCount ?? 0}</Text>
          </View>
          <View style={styles.postStat}>
            <Ionicons name="chatbubble-outline" size={14} color={Colors.textSecondaryLight} />
            <Text style={styles.postStatText}>{item.commentCount ?? 0}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Category tabs */}
      <FlatList
        data={CATEGORIES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(c) => c}
        contentContainerStyle={styles.tabBar}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.tab, activeCategory === item && styles.tabActive]}
            onPress={() => setActiveCategory(item)}
          >
            <Text style={[styles.tabText, activeCategory === item && styles.tabTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {isLoadingPosts && posts.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(p) => p.id}
          renderItem={renderPost}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No posts yet. Be the first!</Text>}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('CreatePost')}
      >
        <Ionicons name="add" size={28} color={Colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  tabBar: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, gap: Spacing.xs },
  tab: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.xs, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderLight },
  tabActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  tabText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondaryLight },
  tabTextActive: { color: Colors.white },
  list: { padding: Spacing.md, gap: Spacing.md },
  postCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  postMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.xs },
  categoryChip: { backgroundColor: `${Colors.primary}18`, paddingHorizontal: Spacing.xs, paddingVertical: 2, borderRadius: BorderRadius.xs },
  categoryChipText: { fontSize: 10, color: Colors.primary, fontWeight: FontWeight.semibold },
  postDate: { fontSize: 11, color: Colors.textDisabledLight },
  postTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: Spacing.xs },
  postExcerpt: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, lineHeight: 20, marginBottom: Spacing.sm },
  postFooter: { flexDirection: 'row', gap: Spacing.md },
  postStat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  postStatText: { fontSize: FontSize.sm, color: Colors.textSecondaryLight },
  emptyText: { textAlign: 'center', color: Colors.textSecondaryLight, marginTop: Spacing.xxxl, fontSize: FontSize.md },
  fab: {
    position: 'absolute',
    right: Spacing.lg,
    bottom: Spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});
