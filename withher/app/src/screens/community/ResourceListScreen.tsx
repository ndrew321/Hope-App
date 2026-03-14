import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchResources } from '../../store/slices/communitySlice';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { Resource, CommunityStackParamList } from '../../types';

const RESOURCE_TYPES = ['ALL', 'ARTICLE', 'VIDEO', 'GUIDE', 'TEMPLATE', 'TOOL'];
const TYPE_ICONS: Record<string, string> = {
  ARTICLE: 'newspaper-outline',
  VIDEO: 'play-circle-outline',
  GUIDE: 'book-outline',
  TEMPLATE: 'document-text-outline',
  TOOL: 'construct-outline',
};

export default function ResourceListScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const { resources, isLoadingResources } = useAppSelector((s) => s.community);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchResources({ type: filter === 'ALL' ? undefined : filter }));
  }, [dispatch, filter]);

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    await dispatch(fetchResources({ type: filter === 'ALL' ? undefined : filter }));
    setRefreshing(false);
  }

  const filtered = resources.filter((r) =>
    !search || r.title.toLowerCase().includes(search.toLowerCase())
  );

  function renderResource({ item }: { item: Resource }): React.JSX.Element {
    const iconName = TYPE_ICONS[item.type] ?? 'document-outline';
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('ResourceDetail', { resourceId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.iconBox}>
          <Ionicons name={iconName as any} size={24} color={Colors.secondary} />
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.resourceTitle} numberOfLines={2}>{item.title}</Text>
          {item.description && (
            <Text style={styles.resourceDesc} numberOfLines={2}>{item.description}</Text>
          )}
          <View style={styles.cardMeta}>
            <Text style={styles.typeLabel}>{item.type}</Text>
            {item.saveCount != null && (
              <View style={styles.metaItem}>
                <Ionicons name="bookmark-outline" size={12} color={Colors.textDisabledLight} />
                <Text style={styles.metaText}>{item.saveCount}</Text>
              </View>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textDisabledLight} />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search-outline" size={18} color={Colors.textSecondaryLight} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search resources..."
          placeholderTextColor={Colors.textDisabledLight}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={18} color={Colors.textDisabledLight} />
          </TouchableOpacity>
        )}
      </View>

      {/* Type filter */}
      <FlatList
        data={RESOURCE_TYPES}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(t) => t}
        contentContainerStyle={styles.filterBar}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.filterChip, filter === item && styles.filterChipActive]}
            onPress={() => setFilter(item)}
          >
            <Text style={[styles.filterChipText, filter === item && styles.filterChipTextActive]}>{item}</Text>
          </TouchableOpacity>
        )}
      />

      {isLoadingResources && resources.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(r) => r.id}
          renderItem={renderResource}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No resources found.</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    gap: Spacing.xs,
  },
  searchInput: { flex: 1, fontSize: FontSize.md, color: Colors.textPrimaryLight },
  filterBar: { paddingHorizontal: Spacing.md, paddingBottom: Spacing.xs, gap: Spacing.xs },
  filterChip: { paddingHorizontal: Spacing.sm, paddingVertical: 5, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderLight },
  filterChipActive: { backgroundColor: Colors.secondary, borderColor: Colors.secondary },
  filterChipText: { fontSize: FontSize.xs, fontWeight: FontWeight.medium, color: Colors.textSecondaryLight },
  filterChipTextActive: { color: Colors.white },
  list: { padding: Spacing.md, gap: Spacing.sm },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.secondary}18`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  cardContent: { flex: 1 },
  resourceTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: 2 },
  resourceDesc: { fontSize: FontSize.sm, color: Colors.textSecondaryLight, lineHeight: 18, marginBottom: Spacing.xs },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  typeLabel: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.secondary, textTransform: 'uppercase' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  metaText: { fontSize: 11, color: Colors.textDisabledLight },
  emptyText: { textAlign: 'center', color: Colors.textSecondaryLight, marginTop: Spacing.xxxl, fontSize: FontSize.md },
});
