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
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { apiClient } from '../../services/api';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { Event, CommunityStackParamList } from '../../types';

type RouteProps = RouteProp<CommunityStackParamList, 'EventDetail'>;

export default function EventDetailScreen(): React.JSX.Element {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const { eventId } = route.params;

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<{ data: Event & { isRegistered?: boolean } }>(`/community/events/${eventId}`);
        setEvent(res.data.data);
        setIsRegistered(res.data.data.isRegistered ?? false);
      } catch {
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    })();
  }, [eventId, navigation]);

  async function handleRegister(): Promise<void> {
    if (!event) return;
    setRegistering(true);
    try {
      if (isRegistered) {
        await apiClient.delete(`/community/events/${eventId}/register`);
        setIsRegistered(false);
        setEvent((prev) => prev ? { ...prev, registrationCount: (prev.registrationCount ?? 1) - 1 } : prev);
      } else {
        await apiClient.post(`/community/events/${eventId}/register`, {});
        setIsRegistered(true);
        setEvent((prev) => prev ? { ...prev, registrationCount: (prev.registrationCount ?? 0) + 1 } : prev);
      }
    } catch {
      Alert.alert('Error', 'Could not update registration. Please try again.');
    } finally {
      setRegistering(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  if (!event) return <SafeAreaView style={styles.center}><Text>Not found</Text></SafeAreaView>;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimaryLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Event</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.eventTitle}>{event.title}</Text>

        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="calendar-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>
              {new Date(event.startDate).toLocaleDateString('en-US', {
                weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
              })}
            </Text>
          </View>
          {event.endDate && event.endDate !== event.startDate && (
            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>
                Until {new Date(event.endDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          {event.isVirtual ? (
            <View style={styles.infoRow}>
              <Ionicons name="videocam-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>Virtual Event</Text>
            </View>
          ) : event.location ? (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>{event.location}</Text>
            </View>
          ) : null}
          <View style={styles.infoRow}>
            <Ionicons name="people-outline" size={18} color={Colors.primary} />
            <Text style={styles.infoText}>{event.registrationCount ?? 0} registered</Text>
          </View>
          {event.maxCapacity && (
            <View style={styles.infoRow}>
              <Ionicons name="person-add-outline" size={18} color={Colors.primary} />
              <Text style={styles.infoText}>Capacity: {event.maxCapacity}</Text>
            </View>
          )}
        </View>

        {event.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About This Event</Text>
            <Text style={styles.description}>{event.description}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[styles.registerBtn, isRegistered && styles.unregisterBtn]}
          onPress={handleRegister}
          disabled={registering}
        >
          {registering ? (
            <ActivityIndicator color={isRegistered ? Colors.primary : Colors.white} />
          ) : (
            <>
              <Ionicons
                name={isRegistered ? 'checkmark-circle' : 'add-circle-outline'}
                size={20}
                color={isRegistered ? Colors.primary : Colors.white}
              />
              <Text style={[styles.registerBtnText, isRegistered && styles.unregisterBtnText]}>
                {isRegistered ? 'Registered' : 'Register Now'}
              </Text>
            </>
          )}
        </TouchableOpacity>
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
  eventTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight, marginBottom: Spacing.lg },
  infoCard: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.sm },
  infoText: { fontSize: FontSize.md, color: Colors.textPrimaryLight, flex: 1 },
  section: { marginBottom: Spacing.lg },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: Spacing.xs },
  description: { fontSize: FontSize.md, color: Colors.textSecondaryLight, lineHeight: 24 },
  registerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.md,
  },
  unregisterBtn: { backgroundColor: 'transparent', borderWidth: 2, borderColor: Colors.primary },
  registerBtnText: { color: Colors.white, fontSize: FontSize.md, fontWeight: FontWeight.semibold },
  unregisterBtnText: { color: Colors.primary },
});
