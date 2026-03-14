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
import { fetchEvents } from '../../store/slices/communitySlice';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { Event, CommunityStackParamList } from '../../types';

export default function EventListScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const { events, isLoadingEvents } = useAppSelector((s) => s.community);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    dispatch(fetchEvents());
  }, [dispatch]);

  async function handleRefresh(): Promise<void> {
    setRefreshing(true);
    await dispatch(fetchEvents());
    setRefreshing(false);
  }

  function renderEvent({ item }: { item: Event }): React.JSX.Element {
    const eventDate = new Date(item.startDate);
    const month = eventDate.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
    const day = eventDate.getDate();

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate('EventDetail', { eventId: item.id })}
        activeOpacity={0.8}
      >
        <View style={styles.dateBlock}>
          <Text style={styles.dateMonth}>{month}</Text>
          <Text style={styles.dateDay}>{day}</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.eventTitle} numberOfLines={2}>{item.title}</Text>
          <View style={styles.metaRow}>
            {item.isVirtual ? (
              <View style={styles.metaItem}>
                <Ionicons name="videocam-outline" size={13} color={Colors.textSecondaryLight} />
                <Text style={styles.metaText}>Virtual</Text>
              </View>
            ) : item.location ? (
              <View style={styles.metaItem}>
                <Ionicons name="location-outline" size={13} color={Colors.textSecondaryLight} />
                <Text style={styles.metaText} numberOfLines={1}>{item.location}</Text>
              </View>
            ) : null}
            <View style={styles.metaItem}>
              <Ionicons name="people-outline" size={13} color={Colors.textSecondaryLight} />
              <Text style={styles.metaText}>{item.registrationCount ?? 0} attending</Text>
            </View>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textDisabledLight} />
      </TouchableOpacity>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {isLoadingEvents && events.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.primary} size="large" />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(e) => e.id}
          renderItem={renderEvent}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
          ListEmptyComponent={<Text style={styles.emptyText}>No upcoming events.</Text>}
          ListHeaderComponent={<Text style={styles.sectionHeader}>Upcoming Events</Text>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  sectionHeader: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight, marginBottom: Spacing.md },
  list: { padding: Spacing.lg, gap: Spacing.sm },
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
  dateBlock: {
    width: 48,
    height: 52,
    borderRadius: BorderRadius.md,
    backgroundColor: `${Colors.primary}18`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  dateMonth: { fontSize: 10, fontWeight: FontWeight.bold, color: Colors.primary, letterSpacing: 1 },
  dateDay: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.primary },
  cardContent: { flex: 1 },
  eventTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: Spacing.xs },
  metaRow: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  metaText: { fontSize: FontSize.xs, color: Colors.textSecondaryLight },
  emptyText: { textAlign: 'center', color: Colors.textSecondaryLight, marginTop: Spacing.xxxl, fontSize: FontSize.md },
});
