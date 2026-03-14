import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { Resource, CommunityStackParamList } from '../../types';

type RouteProps = RouteProp<CommunityStackParamList, 'ResourceDetail'>;

export default function ResourceDetailScreen(): React.JSX.Element {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const { resourceId } = route.params;

  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<{ data: Resource & { isSaved?: boolean } }>(`/community/resources/${resourceId}`);
        setResource(res.data.data);
        setSaved(res.data.data.isSaved ?? false);
      } catch {
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [resourceId, navigation]);

  async function handleToggleSave(): Promise<void> {
    if (!resource) return;
    setSaving(true);
    try {
      if (saved) {
        await apiClient.delete(`/community/resources/${resourceId}/save`);
        setSaved(false);
        setResource((prev) => prev ? { ...prev, saveCount: Math.max(0, (prev.saveCount ?? 1) - 1) } : prev);
      } else {
        await apiClient.post(`/community/resources/${resourceId}/save`, {});
        setSaved(true);
        setResource((prev) => prev ? { ...prev, saveCount: (prev.saveCount ?? 0) + 1 } : prev);
      }
    } catch {
      Alert.alert('Error', 'Could not save resource.');
    } finally {
      setSaving(false);
    }
  }

  async function handleView(): Promise<void> {
    if (!resource?.url) return;
    try {
      const supported = await Linking.canOpenURL(resource.url);
      if (supported) {
        await Linking.openURL(resource.url);
      }
    } catch {
      Alert.alert('Error', 'Could not open resource link.');
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!resource) return <SafeAreaView style={styles.center}><Text>Not found</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Resource</Text>
        <TouchableOpacity onPress={handleToggleSave} style={styles.backBtn} disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color={Colors.secondary} />
          ) : (
            <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={22} color={Colors.secondary} />
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.typeBadge}>
          <Text style={styles.typeBadgeText}>{resource.type}</Text>
        </View>

        <Text style={styles.title}>{resource.title}</Text>

        {resource.description && (
          <Text style={styles.description}>{resource.description}</Text>
        )}

        {resource.content && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Overview</Text>
            <Text style={styles.bodyText}>{resource.content}</Text>
          </View>
        )}

        {resource.tags && resource.tags.length > 0 && (
          <View style={styles.tagRow}>
            {resource.tags.map((tag: string, i: number) => (
              <View key={i} style={styles.tagChip}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Ionicons name="bookmark" size={14} color={Colors.secondary} />
            <Text style={styles.statText}>{resource.saveCount ?? 0} saves</Text>
          </View>
          <View style={styles.stat}>
            <Ionicons name="eye-outline" size={14} color={Colors.textSecondaryLight} />
            <Text style={styles.statText}>{resource.viewCount ?? 0} views</Text>
          </View>
        </View>

        {resource.url && (
          <TouchableOpacity style={styles.viewBtn} onPress={handleView}>
            <Ionicons name="open-outline" size={18} color={Colors.white} />
            <Text style={styles.viewBtnText}>Open Resource</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.backgroundLight },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surfaceLight,
  },
  backBtn: { width: 40 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: FontSize.lg, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  typeBadge: { alignSelf: 'flex-start', backgroundColor: `${Colors.secondary}18`, paddingHorizontal: Spacing.sm, paddingVertical: 3, borderRadius: BorderRadius.xs, marginBottom: Spacing.sm },
  typeBadgeText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.secondary, textTransform: 'uppercase', letterSpacing: 1 },
  title: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight, marginBottom: Spacing.md, lineHeight: 32 },
  description: { fontSize: FontSize.md, color: Colors.textSecondaryLight, lineHeight: 22, marginBottom: Spacing.lg },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: Spacing.sm },
  bodyText: { fontSize: FontSize.md, color: Colors.textSecondaryLight, lineHeight: 24 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.lg },
  tagChip: { paddingHorizontal: Spacing.xs, paddingVertical: 3, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.xs },
  tagText: { fontSize: FontSize.xs, color: Colors.textSecondaryLight },
  statsRow: { flexDirection: 'row', gap: Spacing.xl, marginBottom: Spacing.lg },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  statText: { fontSize: FontSize.sm, color: Colors.textSecondaryLight },
  viewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.secondary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },
  viewBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
});
