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
  isAnonymous,
  authorEmail,
  createdAt,
  upvoteCount,
  commentCount,
  onUpvote,
  hasUpvoted,
}) => {
  const statusColors = {
    open: 'bg-blue-100 text-blue-800',
    'in-progress': 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
  };

  const categoryColors = {
    Hostel: 'bg-purple-100 text-purple-800',
    Club: 'bg-pink-100 text-pink-800',
    Department: 'bg-indigo-100 text-indigo-800',
    CDC: 'bg-orange-100 text-orange-800',
    Mentor: 'bg-cyan-100 text-cyan-800',
    Facilities: 'bg-green-100 text-green-800',
    Other: 'bg-gray-100 text-gray-800',
  } as Record<string, string>;

  const formatDate = formatRelativeTime;

  return (
    <Link href={`/grievance/${id}`}>
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex justify-between items-start gap-4 mb-3">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">
              {title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
              {description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${categoryColors[category as keyof typeof categoryColors] || categoryColors['Other']}`}>
            {category}
          </span>
          <span className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-3 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <User size={14} />
            <span>{isAnonymous ? 'Anonymous' : 'User'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock size={14} />
            <span>{formatDate(createdAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={(e) => {
              e.preventDefault();
              onUpvote();
            }}
            className="flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-white text-[#13017f] hover:shadow-lg transition"
          >
            <ThumbsUp size={16} fill="currentColor" />
            <span>{upvoteCount}</span>
          </button>

          <div className="flex items-center gap-1 px-3 py-1 rounded text-sm font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
            <MessageSquare size={16} />
            <span>{commentCount}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
