'use client';

import React, { useState, useEffect } from 'react';
import { User, AlertCircle } from 'lucide-react';
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
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h3 className="text-[18px] font-bold text-[#0F172A] tracking-[-0.3px]">
          Internal Discussion
        </h3>
        <span className="px-2.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full text-[11px] font-bold">
          {comments.length} Response{comments.length !== 1 ? 's' : ''}
        </span>
      </div>

      <form onSubmit={handleAddComment} className="space-y-4 bg-white border border-[#E2E8F0] rounded-[20px] p-6 shadow-sm">
        {error && (
          <div className="flex items-start gap-3 p-3 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[12px] text-[#DC2626] text-[13px] font-bold animate-shake">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {!userEmail && (
          <div className="p-3 bg-[#EFF6FF] border border-[#BFDBFE] rounded-[12px] text-[#2563EB] text-[13px] font-bold">
            Authentication required to participate in discussions.
          </div>
        )}

        <div className="relative group">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Contribute your perspective..."
            rows={3}
            className="w-full px-4 py-3 bg-[#F8FAFF] border border-[#DBEAFE] rounded-[14px] text-[#0F172A] text-[15px] font-medium placeholder-[#94A3B8] focus:outline-none focus:ring-[4px] focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all resize-none"
            disabled={!userEmail || submitting}
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3 px-3 py-2 bg-[#F8FAFF] border border-[#DBEAFE] rounded-full">
            <input
              type="checkbox"
              id="comment-anonymous"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="w-4 h-4 text-[#2563EB] border-[#DBEAFE] rounded-[4px] focus:ring-[#2563EB]/20 transition-all cursor-pointer"
              disabled={!userEmail || submitting}
            />
            <label htmlFor="comment-anonymous" className="text-[12px] font-bold text-[#1E3A8A] cursor-pointer selection:none">
              Publish Anonymously
            </label>
          </div>

          <button
            type="submit"
            className="px-6 py-2.5 bg-[#2563EB] text-white rounded-full text-[13px] font-bold hover:bg-[#1E40AF] shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_6px_16px_rgba(37,99,235,0.3)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!userEmail || submitting}
          >
            {submitting ? 'Dispatching...' : 'Dispatch Contribution'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map((i) => (
              <div key={i} className="h-24 bg-[#F8FAFF] border border-[#E2E8F0] rounded-[16px] animate-pulse" />
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 bg-[#F8FAFF] border border-dashed border-[#DBEAFE] rounded-[16px]">
            <p className="text-[#94A3B8] text-[14px] font-medium italic">Establishing the dialogue... be the first to contribute.</p>
          </div>
        ) : (
          comments.map((comment, idx) => (
            <div
              key={comment.id}
              className="p-5 bg-white border border-[#E2E8F0] rounded-[16px] shadow-sm hover:shadow-md transition-shadow group animate-fade-in"
              style={{ animationDelay: `${idx * 0.05}s` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                    <User size={16} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[14px] font-bold text-[#0F172A]">
                      {comment.is_anonymous ? 'Identity Concealed' : (comment.author_email?.split('@')[0] || 'Contributor')}
                    </p>
                    <p className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-[0.5px]">
                      {formatDate(comment.created_at)}
                    </p>
                  </div>
                </div>
                {comment.is_anonymous && (
                  <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#64748B] text-[9px] font-black uppercase tracking-[1px] rounded-full">
                    Verified Anonymous
                  </span>
                )}
              </div>
              <p className="text-[14px] text-[#475569] font-medium leading-relaxed pl-11">
                {comment.content}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
