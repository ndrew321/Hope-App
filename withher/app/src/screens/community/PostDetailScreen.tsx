import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import { fetchPost, votePost, addComment } from '../../store/slices/communitySlice';
import { Colors, FontSize, FontWeight, Spacing, BorderRadius } from '../../constants/theme';
import type { ForumComment, CommunityStackParamList } from '../../types';

type RouteProps = RouteProp<CommunityStackParamList, 'PostDetail'>;

export default function PostDetailScreen(): React.JSX.Element {
  const dispatch = useAppDispatch();
  const route = useRoute<RouteProps>();
  const navigation = useNavigation<NativeStackNavigationProp<CommunityStackParamList>>();
  const { postId } = route.params;

  const { selectedPost, isLoading } = useAppSelector((s) => s.community);
  const [commentText, setCommentText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    dispatch(fetchPost(postId));
  }, [dispatch, postId]);

  async function handleVote(direction: 'up' | 'down'): Promise<void> {
    dispatch(votePost({ postId, direction }));
  }

  async function handleComment(): Promise<void> {
    const trimmed = commentText.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await dispatch(addComment({ postId, content: trimmed })).unwrap();
      setCommentText('');
    } finally {
      setSubmitting(false);
    }
  }

  if (isLoading || !selectedPost) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.kav} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimaryLight} />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Discussion</Text>
          <View style={styles.backBtn} />
        </View>

        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Post content */}
          <View style={styles.postContainer}>
            <View style={styles.categoryRow}>
              <View style={styles.chip}>
                <Text style={styles.chipText}>{selectedPost.category}</Text>
              </View>
              <Text style={styles.dateText}>{new Date(selectedPost.createdAt).toLocaleDateString()}</Text>
            </View>
            <Text style={styles.postTitle}>{selectedPost.title}</Text>
            <Text style={styles.postContent}>{selectedPost.content}</Text>
            {selectedPost.tags && selectedPost.tags.length > 0 && (
              <View style={styles.tagRow}>
                {selectedPost.tags.map((tag: string, i: number) => (
                  <View key={i} style={styles.tagChip}>
                    <Text style={styles.tagText}>#{tag}</Text>
                  </View>
                ))}
              </View>
            )}
            <View style={styles.voteRow}>
              <TouchableOpacity style={styles.voteBtn} onPress={() => handleVote('up')}>
                <Ionicons name="arrow-up" size={18} color={Colors.primary} />
                <Text style={styles.voteBtnText}>{selectedPost.upvoteCount ?? 0}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.voteBtn} onPress={() => handleVote('down')}>
                <Ionicons name="arrow-down" size={18} color={Colors.textSecondaryLight} />
                <Text style={styles.voteBtnText}>{selectedPost.downvoteCount ?? 0}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Comments */}
          <Text style={styles.commentsTitle}>
            {(selectedPost.comments?.length ?? 0)} Comments
          </Text>
          {(selectedPost.comments ?? []).map((comment: ForumComment) => (
            <View key={comment.id} style={styles.commentCard}>
              <Text style={styles.commentAuthor}>
                {comment.author?.firstName ?? 'User'} {comment.author?.lastName ?? ''}
              </Text>
              <Text style={styles.commentContent}>{comment.content}</Text>
              <Text style={styles.commentDate}>{new Date(comment.createdAt).toLocaleDateString()}</Text>
            </View>
          ))}
          <View style={styles.spacer} />
        </ScrollView>

        {/* Comment input */}
        <View style={styles.inputBar}>
          <TextInput
            style={styles.input}
            value={commentText}
            onChangeText={setCommentText}
            placeholder="Write a comment..."
            placeholderTextColor={Colors.textDisabledLight}
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!commentText.trim() || submitting) && styles.sendBtnDisabled]}
            onPress={handleComment}
            disabled={!commentText.trim() || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color={Colors.white} />
            ) : (
              <Ionicons name="send" size={18} color={Colors.white} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.backgroundLight },
  kav: { flex: 1 },
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
  scroll: { paddingBottom: Spacing.xl },
  postContainer: { padding: Spacing.lg, backgroundColor: Colors.surfaceLight, marginBottom: Spacing.md },
  categoryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.sm },
  chip: { backgroundColor: `${Colors.primary}18`, paddingHorizontal: Spacing.sm, paddingVertical: 2, borderRadius: BorderRadius.xs },
  chipText: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: FontWeight.semibold },
  dateText: { fontSize: FontSize.xs, color: Colors.textDisabledLight },
  postTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, color: Colors.textPrimaryLight, marginBottom: Spacing.md },
  postContent: { fontSize: FontSize.md, color: Colors.textSecondaryLight, lineHeight: 24 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.xs, marginTop: Spacing.md },
  tagChip: { paddingHorizontal: Spacing.xs, paddingVertical: 2, backgroundColor: Colors.borderLight, borderRadius: BorderRadius.xs },
  tagText: { fontSize: 11, color: Colors.textSecondaryLight },
  voteRow: { flexDirection: 'row', gap: Spacing.md, marginTop: Spacing.lg },
  voteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  voteBtnText: { fontSize: FontSize.sm, color: Colors.textSecondaryLight },
  commentsTitle: { fontSize: FontSize.md, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  commentCard: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colors.borderLight },
  commentAuthor: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimaryLight, marginBottom: 2 },
  commentContent: { fontSize: FontSize.md, color: Colors.textSecondaryLight, lineHeight: 20 },
  commentDate: { fontSize: 11, color: Colors.textDisabledLight, marginTop: 4 },
  spacer: { height: 40 },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
    backgroundColor: Colors.surfaceLight,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    fontSize: FontSize.md,
    color: Colors.textPrimaryLight,
    backgroundColor: Colors.backgroundLight,
  },
  sendBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
});
