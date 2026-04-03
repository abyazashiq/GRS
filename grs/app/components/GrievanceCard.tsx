'use client';

import React from 'react';
import { ThumbsUp, MessageSquare, Clock, User, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatRelativeTime } from '@/lib/dateUtils';

interface GrievanceCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in-progress' | 'resolved';
  priority?: 'Urgent' | 'High' | 'Medium' | 'Low';
  isAnonymous: boolean;
  authorEmail?: string;
  createdAt: string;
  upvoteCount: number;
  commentCount: number;
  onUpvote: () => void;
  hasUpvoted: boolean;
  onDelete?: (id: string) => void;
  isAuthor?: boolean;
}

export const GrievanceCard: React.FC<GrievanceCardProps> = ({
  id,
  title,
  description,
  category,
  status,
  priority,
  isAnonymous,
  authorEmail,
  createdAt,
  upvoteCount,
  commentCount,
  onUpvote,
  hasUpvoted,
  onDelete,
  isAuthor,
}) => {
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const statusStyles: Record<string, string> = {
    open: 'bg-[var(--color-blue-primary)] text-white shadow-glow-blue',
    'in-progress': 'bg-[var(--color-blue-deep)] text-white opacity-90',
    resolved: 'bg-[var(--color-blue-soft)] text-[var(--color-blue-primary)] border-[var(--color-blue-soft)]',
  };

  const priorityGlow = {
    Urgent: 'animate-glow-pulse shadow-[0_0_15px_rgba(220,38,38,0.4)] border-red-200 text-[var(--color-danger)]',
    High:   'border-[var(--color-blue-primary)] text-[var(--color-blue-primary)]',
    Medium: 'border-[var(--color-border)] text-[var(--color-text-dim)]',
    Low:    'border-[var(--color-border)] text-[var(--color-text-muted)]',
  } as Record<string, string>;

  return (
    <Link href={`/grievance/${id}`} className="block group">
      <div className="bg-white border border-[var(--color-border)] rounded-[28px] p-6 shadow-premium-sm transition-all duration-500 spring-lift group-hover:border-[var(--color-blue-sky)] relative overflow-hidden action-shimmer">
        <div className="flex justify-between items-start gap-4 mb-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[8px] font-black px-2 py-0.5 bg-[var(--color-blue-soft)] text-[var(--color-blue-primary)] rounded-full uppercase tracking-[2px] border border-[var(--color-blue-soft)] font-accent">
                {category}
              </span>
              <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-[2px] font-accent transition-all animate-reveal-elastic ${statusStyles[status]}`}>
                {status.replace('-', ' ')}
              </span>
            </div>
            <h3 className="text-xl font-black text-[var(--color-navy)] tracking-tight mb-3 group-hover:text-[var(--color-blue-primary)] transition-colors leading-[1.2]">
              {title}
            </h3>
            <p className="text-[13px] text-[var(--color-text-dim)] font-medium leading-relaxed line-clamp-2 opacity-80 group-hover:opacity-100 transition-opacity">
              {description}
            </p>
          </div>
          {priority && (
            <div className={`px-3 py-1 rounded-full border text-[8px] font-black uppercase tracking-[1px] flex items-center gap-1.5 transition-all font-accent ${priorityGlow[priority] || priorityGlow['Medium']}`}>
              <div className={`w-1 h-1 rounded-full ${priority === 'Urgent' ? 'bg-[var(--color-danger)] animate-pulse' : 'bg-[var(--color-blue-primary)]'}`} />
              {priority}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[9px] text-[var(--color-text-muted)] font-black mb-6 pt-6 border-t border-[var(--color-bg-subtle)] font-accent uppercase tracking-[1.5px]">
          <div className="flex items-center gap-3 group/author">
            <div className="w-8 h-8 rounded-xl bg-[var(--color-bg-subtle)] flex items-center justify-center text-[var(--color-navy)] border border-[var(--color-border)] group-hover/author:bg-[var(--color-blue-soft)] group-hover/author:text-[var(--color-blue-primary)] transition-colors">
              <User size={14} strokeWidth={3} />
            </div>
            <div className="flex flex-col">
               <span className="text-[var(--color-text-dim)]">{isAnonymous ? 'Restricted' : 'Authorized'}</span>
               {!isAnonymous && authorEmail && <span className="text-[7px] opacity-60 lowercase mt-0.5">{authorEmail}</span>}
            </div>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[var(--color-frost)] text-[var(--color-blue-deep)] rounded-lg border border-[var(--color-border)]">
            <Clock size={12} strokeWidth={3} />
            <span>{formatRelativeTime(createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              onUpvote();
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black transition-all active:scale-95 spring-lift group/btn flex-1 justify-center ${
              hasUpvoted 
                ? 'bg-[var(--color-blue-primary)] text-white shadow-glow-blue' 
                : 'bg-[var(--color-blue-soft)] text-[var(--color-blue-primary)] hover:bg-[var(--color-blue-primary)] hover:text-white border border-transparent'
            }`}
          >
            <ThumbsUp size={14} strokeWidth={3} fill={hasUpvoted ? 'currentColor' : 'none'} className="group-hover/btn:rotate-12 transition-transform" />
            <span className="uppercase tracking-[0.5px]">{upvoteCount}</span>
          </button>

          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black bg-[var(--color-bg-subtle)] text-[var(--color-navy)] border border-[var(--color-border)] group-hover:border-[var(--color-blue-sky)] transition-colors font-accent flex-1 justify-center">
            <MessageSquare size={14} strokeWidth={3} />
            <span className="uppercase tracking-[0.5px]">{commentCount}</span>
          </div>

          {isAuthor && status === 'open' && onDelete && (
             <button
                onClick={async (e) => {
                  e.preventDefault();
                  if (window.confirm("Are you sure? This cannot be undone.")) {
                    try {
                      setIsDeleting(true);
                      setDeleteError(null);
                      await onDelete(id);
                    } catch (err: any) {
                      setDeleteError("This grievance can no longer be deleted as it is being reviewed.");
                      setIsDeleting(false);
                    }
                  }
                }}
                disabled={isDeleting}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all spring-lift disabled:opacity-30"
                title="Retract Filing"
             >
                {isDeleting ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Trash2 size={16} strokeWidth={3} />
                )}
             </button>
          )}
        </div>
        {deleteError && (
          <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl flex items-center gap-2 text-[var(--color-danger)] text-[9px] font-black uppercase tracking-widest animate-reveal-elastic">
            <AlertCircle size={14} />
            {deleteError}
          </div>
        )}
      </div>
    </Link>
  );
};
