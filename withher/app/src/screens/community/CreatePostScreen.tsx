import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch } from '../../store/hooks';
import { createPost } from '../../store/slices/communitySlice';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { CommunityStackParamList } from '../../types';

const CATEGORIES = ['GENERAL', 'CAREER', 'TRAINING', 'WELLBEING', 'SUCCESS'];

export default function CreatePostScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('GENERAL');
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  function addTag(): void {
    const trimmed = tagInput.trim().toLowerCase().replace(/\s+/g, '_');
    if (trimmed && !tags.includes(trimmed) && tags.length < 5) {
      setTags((prev) => [...prev, trimmed]);
    }
    setTagInput('');
  }

  function removeTag(tag: string): void {
    setTags((prev) => prev.filter((t) => t !== tag));
  }

  async function handleSubmit(): Promise<void> {
    if (!title.trim()) { Alert.alert('Required', 'Please enter a title.'); return; }
    if (!content.trim()) { Alert.alert('Required', 'Please enter content.'); return; }
    setSubmitting(true);
    try {
      await dispatch(createPost({ title: title.trim(), content: content.trim(), category, tags })).unwrap();
      navigation.goBack();
    } catch {
      Alert.alert('Error', 'Could not create post. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={Colors.textPrimaryLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>New Post</Text>
          <TouchableOpacity onPress={handleSubmit} disabled={submitting} style={styles.postBtn}>
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.postBtnText}>Post</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Category */}
          <Text style={styles.label}>Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.catChip, category === cat && styles.catChipActive]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Title */}
          <Text style={styles.label}>Title *</Text>
          <TextInput
            style={styles.inputField}
            value={title}
            onChangeText={setTitle}
            placeholder="What's your post about?"
            placeholderTextColor={Colors.textDisabledLight}
            maxLength={140}
          />
          <Text style={styles.charCount}>{title.length}/140</Text>

          {/* Content */}
          <Text style={styles.label}>Content *</Text>
          <TextInput
            style={[styles.inputField, styles.contentField]}
            value={content}
            onChangeText={setContent}
            placeholder="Share your thoughts, experiences, or questions..."
            placeholderTextColor={Colors.textDisabledLight}
            multiline
            numberOfLines={8}
            maxLength={2000}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>{content.length}/2000</Text>

          {/* Tags */}
          <Text style={styles.label}>Tags (optional)</Text>
          <View style={styles.tagInputRow}>
            <TextInput
              style={[styles.inputField, { flex: 1, marginBottom: 0 }]}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="Add a tag"
              placeholderTextColor={Colors.textDisabledLight}
              onSubmitEditing={addTag}
              maxLength={30}
            />
            <TouchableOpacity style={styles.addTagBtn} onPress={addTag}>
              <Text style={styles.addTagBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
          {tags.length > 0 && (
            <View style={styles.tagRow}>
              {tags.map((t) => (
                <TouchableOpacity key={t} style={styles.tagChip} onPress={() => removeTag(t)}>
                  <Text style={styles.tagText}>#{t}</Text>
                  <Ionicons name="close-circle" size={12} color={Colors.textSecondaryLight} style={{ marginLeft: 2 }} />
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  postBtn: { width: 50, alignItems: 'flex-end' },
  postBtnText: { color: Colors.primary, fontSize: FontSize.md, fontWeight: FontWeight.bold },
  scroll: { padding: Spacing.lg, paddingBottom: Spacing.xxxl },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondaryLight, marginBottom: Spacing.xs, marginTop: Spacing.md },
  categoryScroll: { marginBottom: Spacing.sm },
  catChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    marginRight: Spacing.xs,
  },
  catChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  catChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium, color: Colors.textSecondaryLight },
  catChipTextActive: { color: Colors.white },
  inputField: {
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    fontSize: FontSize.md,
    color: Colors.textPrimaryLight,
    backgroundColor: Colors.surfaceLight,
    marginBottom: 2,
  },
  contentField: { minHeight: 140, textAlignVertical: 'top' },
  charCount: { fontSize: 11, color: Colors.textDisabledLight, alignSelf: 'flex-end', marginBottom: Spacing.xs },
  tagInputRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'center', marginBottom: Spacing.sm },
  addTagBtn: { paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, backgroundColor: Colors.primary, borderRadius: BorderRadius.md },
  addTagBtnText: { color: Colors.white, fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs },
  tagChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Spacing.xs, paddingVertical: 3, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.xs },
  tagText: { fontSize: FontSize.sm, color: Colors.textSecondaryLight },
});
