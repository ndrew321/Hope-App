import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { updateUserProfile, fetchCurrentUser } from '../../store/slices/userSlice';
import { apiService } from '../../services/api';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { ProfileStackParamList, CareerLevel } from '../../types';

const POSITIONS = ['Forward', 'Midfielder', 'Defender', 'Goalkeeper', 'Winger', 'Striker'];
const CAREER_LEVELS = ['YOUTH', 'HIGH_SCHOOL', 'COLLEGE', 'PROFESSIONAL', 'ALUM'];

export default function EditProfileScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { profile: currentUser, isLoading } = useAppSelector((s) => s.user);
  const profile = currentUser?.profile;

  const [firstName, setFirstName] = useState(currentUser?.firstName ?? '');
  const [lastName, setLastName] = useState(currentUser?.lastName ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [position, setPosition] = useState(profile?.position ?? '');
  const [currentTeam, setCurrentTeam] = useState(profile?.currentTeam ?? '');
  const [location, setLocation] = useState(profile?.location ?? '');
  const [careerLevel, setCareerLevel] = useState<CareerLevel | ''>(profile?.careerLevel ?? '');
  const [yearsExperience, setYearsExperience] = useState(String(profile?.yearsExperience ?? ''));
  const [photoURI, setPhotoURI] = useState<string | null>(currentUser?.profilePhotoUrl ?? null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) dispatch(fetchCurrentUser());
  }, [dispatch, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    setFirstName(currentUser.firstName ?? '');
    setLastName(currentUser.lastName ?? '');
    setBio(currentUser.profile?.bio ?? '');
    setPosition(currentUser.profile?.position ?? '');
    setCurrentTeam(currentUser.profile?.currentTeam ?? '');
    setLocation(currentUser.profile?.location ?? '');
    setCareerLevel(currentUser.profile?.careerLevel ?? '');
    setYearsExperience(
      typeof currentUser.profile?.yearsExperience === 'number'
        ? String(currentUser.profile.yearsExperience)
        : '',
    );
    setPhotoURI(currentUser.profilePhotoUrl ?? null);
  }, [currentUser]);

  async function pickPhoto(): Promise<void> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Please allow photo library access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const uri = result.assets[0].uri;
    setPhotoURI(uri);
    setUploadingPhoto(true);
    try {
      if (!currentUser?.id) throw new Error('Missing user id');
      const formData = new FormData();
      formData.append('photo', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      await apiService.postForm(`/users/${currentUser.id}/profile-photo`, formData);
    } catch {
      Alert.alert('Upload failed', 'Could not upload photo. Please try again.');
      setPhotoURI(currentUser?.profilePhotoUrl ?? null);
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave(): Promise<void> {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert('Required', 'First and last name are required.');
      return;
    }
    setSaving(true);
    try {
      const parsedYears = yearsExperience ? parseInt(yearsExperience, 10) : undefined;
      await dispatch(updateUserProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
        position,
        currentTeam: currentTeam.trim(),
        location: location.trim(),
        careerLevel: careerLevel || undefined,
        yearsExperience: typeof parsedYears === 'number' && !Number.isNaN(parsedYears)
          ? parsedYears
          : undefined,
      })).unwrap();
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimaryLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <TouchableOpacity onPress={handleSave} disabled={saving || isLoading} style={styles.saveBtn}>
            {saving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.saveBtnText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Photo */}
          <View style={styles.photoSection}>
            <TouchableOpacity onPress={pickPhoto} disabled={uploadingPhoto}>
              {photoURI ? (
                <Image source={{ uri: photoURI }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]}>
                  <Ionicons name="person" size={40} color={Colors.textDisabledLight} />
                </View>
              )}
              <View style={styles.photoEditBadge}>
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={Colors.white} />
                ) : (
                  <Ionicons name="camera" size={14} color={Colors.white} />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.photoHint}>Tap to change photo</Text>
          </View>

          {/* Basic */}
          <Text style={styles.sectionTitle}>Basic Info</Text>
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput style={styles.input} value={firstName} onChangeText={setFirstName} maxLength={50} />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Last Name *</Text>
              <TextInput style={styles.input} value={lastName} onChangeText={setLastName} maxLength={50} />
            </View>
          </View>
          <Text style={styles.label}>Location</Text>
          <TextInput style={styles.input} value={location} onChangeText={setLocation} placeholder="City, Country" placeholderTextColor={Colors.textDisabledLight} />

          {/* Bio */}
          <Text style={styles.sectionTitle}>About</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder="Tell your story..."
            placeholderTextColor={Colors.textDisabledLight}
            multiline
            numberOfLines={4}
            maxLength={500}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{bio.length}/500</Text>

          {/* Career */}
          <Text style={styles.sectionTitle}>Soccer Career</Text>
          <Text style={styles.label}>Career Level</Text>
          <View style={styles.chipGrid}>
            {CAREER_LEVELS.map((cl) => (
              <TouchableOpacity
                key={cl}
                style={[styles.chip, careerLevel === cl && styles.chipActive]}
                onPress={() => setCareerLevel(cl as CareerLevel)}
              >
                <Text style={[styles.chipText, careerLevel === cl && styles.chipTextActive]}>
                  {cl.replace('_', ' ')}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Position</Text>
          <View style={styles.chipGrid}>
            {POSITIONS.map((pos) => (
              <TouchableOpacity
                key={pos}
                style={[styles.chip, position === pos && styles.chipActive]}
                onPress={() => setPosition(pos)}
              >
                <Text style={[styles.chipText, position === pos && styles.chipTextActive]}>{pos}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.label}>Current Team</Text>
          <TextInput style={styles.input} value={currentTeam} onChangeText={setCurrentTeam} placeholder="Team name" placeholderTextColor={Colors.textDisabledLight} />
          <Text style={styles.label}>Years of Experience</Text>
          <TextInput style={styles.input} value={yearsExperience} onChangeText={setYearsExperience} placeholder="0" placeholderTextColor={Colors.textDisabledLight} keyboardType="number-pad" maxLength={2} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  kav: { flex: 1 },
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
  saveBtn: { width: 50, alignItems: 'flex-end' },
  saveBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  photoSection: { alignItems: 'center', marginBottom: Spacing.xl },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarPlaceholder: { backgroundColor: Colors.borderLight, justifyContent: 'center', alignItems: 'center' },
  photoEditBadge: { position: 'absolute', bottom: 0, right: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: Colors.backgroundLight },
  photoHint: { fontSize: FontSize.xs, color: Colors.textSecondaryLight, marginTop: Spacing.xs },
  sectionTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: Spacing.sm, marginTop: Spacing.lg },
  row: { flexDirection: 'row', gap: Spacing.sm },
  halfField: { flex: 1 },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondaryLight, marginBottom: Spacing.xs, marginTop: Spacing.xs },
  input: { borderWidth: 1, borderColor: Colors.borderLight, borderRadius: BorderRadius.md, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, fontSize: FontSize.md, color: Colors.textPrimaryLight, backgroundColor: Colors.surfaceLight, marginBottom: Spacing.xs },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: Colors.textDisabledLight, alignSelf: 'flex-end', marginBottom: Spacing.xs },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginBottom: Spacing.sm },
  chip: { paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.borderLight },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondaryLight },
  chipTextActive: { color: Colors.white },
});
