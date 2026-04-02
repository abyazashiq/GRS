'use client';

import React from 'react';
import { ThumbsUp, MessageSquare, Clock, User } from 'lucide-react';
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
}) => {
  const statusColors = {
    open: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
    'in-progress': 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]',
    resolved: 'bg-[#F0FDF4] text-[#16A34A] border-[#DCFCE7]',
  };

  const categoryColors = {
    Hostel: 'bg-[#F3E8FF] text-[#7E22CE] border-[#E9D5FF]',
    Club: 'bg-[#FCE7F3] text-[#BE185D] border-[#FBCFE8]',
    Department: 'bg-[#E0E7FF] text-[#4338CA] border-[#C7D2FE]',
    CDC: 'bg-[#FFEDD5] text-[#C2410C] border-[#FED7AA]',
    Mentor: 'bg-[#CFFAFE] text-[#0E7490] border-[#A5F3FC]',
    Facilities: 'bg-[#DCFCE7] text-[#15803D] border-[#BBF7D0]',
    Other: 'bg-[#F1F5F9] text-[#475569] border-[#E2E8F0]',
  } as Record<string, string>;

  const priorityColors = {
    Urgent: 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]',
    High:   'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]',
    Medium: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]',
    Low:    'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]',
  } as Record<string, string>;

  const priorityDots = {
    Urgent: 'bg-[#DC2626]',
    High:   'bg-[#D97706]',
    Medium: 'bg-[#2563EB]',
    Low:    'bg-[#94A3B8]',
  } as Record<string, string>;

  return (
    <Link href={`/grievance/${id}`} className="block group">
      <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-6 shadow-[0_2px_12px_rgba(15,23,42,0.06)] hover:shadow-[0_8px_24px_rgba(15,23,42,0.1)] transition-all duration-300 group-hover:-translate-y-1">
        <div className="flex justify-between items-start gap-4 mb-4">
          <div className="flex-1">
            <h3 className="text-[18px] font-bold text-[#0F172A] tracking-[-0.4px] mb-2 line-clamp-1 group-hover:text-[#2563EB] transition-colors">
              {title}
            </h3>
            <p className="text-[14px] text-[#64748B] font-medium leading-relaxed line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-5 flex-wrap">
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${categoryColors[category as keyof typeof categoryColors] || categoryColors['Other']}`}>
            {category}
          </span>
          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
          {priority && (
            <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${priorityColors[priority] || priorityColors['Medium']}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${priorityDots[priority] || priorityDots['Medium']}`} />
              {priority}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between text-[13px] text-[#94A3B8] font-bold mb-5 pb-5 border-b border-[#F1F5F9]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#F8FAFF] flex items-center justify-center text-[#1E3A8A]">
              <User size={12} strokeWidth={3} />
            </div>
            <span>{isAnonymous ? 'Identity Concealed' : 'Public Profile'}</span>
          </div>
          <div className="flex items-center gap-1.5 bg-[#F8FAFF] text-[#1E3A8A] px-2.5 py-1 rounded-full">
            <Clock size={14} strokeWidth={2.5} />
            <span className="uppercase tracking-[0.5px] text-[10px]">{formatRelativeTime(createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={(e) => {
              e.preventDefault();
              onUpvote();
            }}
            className={`flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold transition-all ${
              hasUpvoted 
                ? 'bg-[#2563EB] text-white shadow-[0_4px_12px_rgba(37,99,235,0.25)]' 
                : 'bg-[#EFF6FF] text-[#2563EB] hover:bg-[#2563EB] hover:text-white border border-transparent hover:border-[#BFDBFE]'
            }`}
          >
            <ThumbsUp size={16} strokeWidth={2.5} fill={hasUpvoted ? 'currentColor' : 'none'} />
            <span>{upvoteCount} Seconded</span>
          </button>

          <div className="flex items-center gap-2 px-4 py-2 rounded-[10px] text-[13px] font-bold bg-[#F8FAFF] text-[#64748B] border border-[#E2E8F0]">
            <MessageSquare size={16} strokeWidth={2.5} />
            <span>{commentCount} Response{commentCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
