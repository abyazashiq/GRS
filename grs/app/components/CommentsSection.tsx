'use client';

import React, { useState, useEffect } from 'react';
import { User, AlertCircle, CheckCircle } from 'lucide-react';
import { getComments, addComment } from '@/lib/supabase/db';
import { Comment } from '@/lib/supabase/types';
import { formatRelativeTime } from '@/lib/dateUtils';

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

  const formatDate = formatRelativeTime;

  return (
    <div className="space-y-10 animate-slide-up">
      <div className="flex items-center justify-between border-b border-[var(--color-bg-subtle)] pb-6">
        <div className="flex items-center gap-4">
          <h3 className="text-xl font-bold text-[var(--color-navy)] tracking-tight">
            Internal Discussion
          </h3>
          <div className="h-1.5 w-1.5 rounded-full bg-[var(--color-blue-primary)] opacity-40" />
          <span className="text-[10px] font-black px-3 py-1 bg-[var(--color-blue-soft)] text-[var(--color-blue-primary)] border border-[var(--color-blue-soft)] rounded-full uppercase tracking-widest">
            {comments.length} Response{comments.length !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      <form onSubmit={handleAddComment} className="space-y-6 bg-white border border-[var(--color-border)] rounded-2xl p-8 shadow-premium-sm hover:shadow-premium-md transition-shadow group animate-scale-in">
        {error && (
          <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl text-[var(--color-danger)] text-[13px] font-bold animate-slide-up">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!userEmail && (
          <div className="p-4 bg-[var(--color-blue-soft)] border border-[var(--color-blue-soft)] rounded-xl text-[var(--color-blue-primary)] text-[13px] font-bold">
            Authentication required to participate in institutional discussions.
          </div>
        )}

        <div className="relative group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contribute your perspective to this case..."
            rows={3}
            className="w-full px-5 py-4 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-xl text-[var(--color-navy)] text-[15px] font-semibold placeholder-[var(--color-text-muted)] outline-none focus:ring-4 focus:ring-[var(--color-blue-primary)]/5 transition-all resize-none"
            disabled={!userEmail || submitting}
          />
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-1">
          <div className="flex items-center gap-3 px-5 py-2.5 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-full group-hover:border-[var(--color-border-alt)] transition-colors">
            <div className="relative">
              <input
                type="checkbox"
                id="comment-anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4 text-[var(--color-blue-primary)] border-[var(--color-border)] rounded-[4px] focus:ring-[var(--color-blue-primary)]/20 transition-all cursor-pointer appearance-none checked:bg-[var(--color-blue-primary)] border-2 bg-white"
                disabled={!userEmail || submitting}
              />
              {isAnonymous && <CheckCircle size={12} className="absolute inset-0 m-auto text-white pointer-events-none" strokeWidth={4} />}
            </div>
            <label htmlFor="comment-anonymous" className="text-[11px] font-black text-[var(--color-blue-deep)] cursor-pointer uppercase tracking-widest">
              Publish Anonymously
            </label>
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3 bg-[var(--color-blue-primary)] text-white rounded-xl text-sm font-bold hover:bg-[var(--color-blue-deep)] shadow-premium-md hover:shadow-premium-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
            disabled={!userEmail || submitting}
          >
            {submitting ? 'Dispatching...' : 'Dispatch Contribution'}
          </button>
        </div>
      </form>

      <div className="space-y-6">
        {loading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="h-32 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-20 bg-[var(--color-bg-subtle)] border-2 border-dashed border-[var(--color-border)] rounded-2xl">
            <p className="text-[var(--color-text-muted)] text-[14px] font-semibold italic tracking-tight">Establishing the dialogue... be the first to contribute.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment, idx) => (
              <div
                key={comment.id}
                className="p-6 bg-white border border-[var(--color-border)] rounded-2xl shadow-premium-sm hover:shadow-premium-md transition-all group animate-slide-up"
                style={{ animationDelay: `${0.1 + idx * 0.05}s` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-[var(--color-blue-soft)] flex items-center justify-center text-[var(--color-blue-primary)] border border-[var(--color-blue-soft)] group-hover:scale-110 transition-transform">
                      <User size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <p className="text-[15px] font-bold text-[var(--color-navy)] leading-none mb-1.5">
                        {comment.is_anonymous ? 'Restricted Identity' : (comment.author_email?.split('@')[0] || 'Contributor')}
                      </p>
                      <p className="text-[10px] text-[var(--color-text-muted)] font-black uppercase tracking-widest">
                        {formatDate(comment.created_at)}
                      </p>
                    </div>
                  </div>
                  {comment.is_anonymous && (
                    <span className="px-3 py-1 bg-[var(--color-bg-subtle)] text-[var(--color-text-dim)] text-[9px] font-black uppercase tracking-[1.5px] rounded-lg border border-[var(--color-border)] shadow-premium-sm">
                      Verified Anonymous
                    </span>
                  )}
                </div>
                <div className="pl-14">
                  <p className="text-[15px] text-[var(--color-text-main)] font-medium leading-relaxed bg-[var(--color-bg-subtle)]/50 p-4 rounded-xl border border-transparent group-hover:border-[var(--color-border)] transition-all">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
