'use client';

import React, { useState, useEffect } from 'react';
import { User, AlertCircle } from 'lucide-react';
import { getComments, addComment } from '@/lib/supabase/db';
import { Comment } from '@/lib/supabase/types';

interface CommentsSectionProps {
  grievanceId: string;
  userEmail: string | null;
}

export const CommentsSection: React.FC<CommentsSectionProps> = ({
  grievanceId,
  userEmail,
}) => {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, [grievanceId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await getComments(grievanceId);
      setComments(data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!userEmail) {
      setError('You must be logged in to comment');
      return;
    }

    if (!content.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (content.length < 2) {
      setError('Comment must be at least 2 characters');
      return;
    }

    setSubmitting(true);

    try {
      const newComment = await addComment(
        grievanceId,
        content,
        userEmail,
        isAnonymous
      );

      setComments([newComment, ...comments]);
      setContent('');
      setIsAnonymous(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Comments ({comments.length})
      </h3>

      <form onSubmit={handleAddComment} className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
            <AlertCircle size={18} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!userEmail && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded text-blue-700 dark:text-blue-400 text-sm">
            Please log in to add a comment.
          </div>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Add a comment..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={!userEmail || submitting}
        />

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded"
              disabled={!userEmail || submitting}
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              Anonymous comment
            </span>
          </label>

          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!userEmail || submitting}
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>
      </form>

      <div className="space-y-3">
        {loading ? (
          <p className="text-gray-500 dark:text-gray-400">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">No comments yet.</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {comment.is_anonymous ? 'Anonymous' : 'User'}
                  </span>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {formatDate(comment.created_at)}
                </span>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
