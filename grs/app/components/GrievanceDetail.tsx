'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, User, Clock, ThumbsUp } from 'lucide-react';
import Link from 'next/link';
import { CommentsSection } from '@/app/components/CommentsSection';
import { getGrievanceById, addUpvote, removeUpvote, getUpvotes } from '@/lib/supabase/db';

interface GrievanceDetailProps {
  userEmail: string | null;
}

export const GrievanceDetail: React.FC<GrievanceDetailProps> = ({ userEmail }) => {
  const params = useParams();
  const router = useRouter();
  const grievanceId = params.id as string;

  const [grievance, setGrievance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upvotes, setUpvotes] = useState<any[]>([]);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvotingLoading, setUpvotingLoading] = useState(false);

  useEffect(() => {
    fetchGrievance();
  }, [grievanceId]);

  const fetchGrievance = async () => {
    try {
      setLoading(true);
      const data = await getGrievanceById(grievanceId);
      setGrievance(data);

      const upvotesData = await getUpvotes(grievanceId);
      setUpvotes(upvotesData);

      if (userEmail) {
        const hasUpvoted = upvotesData.some((u) => u.user_email === userEmail);
        setHasUpvoted(hasUpvoted);
      }
    } catch (err) {
      console.error('Failed to fetch grievance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async () => {
    if (!userEmail) {
      alert('Please log in to upvote');
      return;
    }

    setUpvotingLoading(true);

    try {
      if (hasUpvoted) {
        await removeUpvote(grievanceId, userEmail);
        setHasUpvoted(false);
      } else {
        await addUpvote(grievanceId, userEmail);
        setHasUpvoted(true);
      }

      // Refresh upvotes
      const upvotesData = await getUpvotes(grievanceId);
      setUpvotes(upvotesData);
    } catch (err) {
      console.error('Failed to update upvote:', err);
    } finally {
      setUpvotingLoading(false);
    }
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-4"
          >
            <ChevronLeft size={20} />
            Back to Dashboard
          </Link>
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400">Grievance not found</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
        >
          <ChevronLeft size={20} />
          Back to Dashboard
        </Link>

        {/* Main Grievance */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8 mb-8">
          <div className="mb-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              {grievance.title}
            </h1>

            <div className="flex flex-wrap gap-2 mb-4">
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  categoryColors[grievance.category as keyof typeof categoryColors] ||
                  categoryColors['Other']
                }`}
              >
                {grievance.category}
              </span>
              <span
                className={`text-sm font-medium px-3 py-1 rounded-full ${
                  statusColors[grievance.status as keyof typeof statusColors]
                }`}
              >
                {grievance.status.charAt(0).toUpperCase() + grievance.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="prose dark:prose-invert max-w-none mb-6">
            <p className="text-base text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {grievance.description}
            </p>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-6">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Posted by</p>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <User size={16} />
                  {grievance.is_anonymous ? 'Anonymous' : 'User'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Posted on</p>
                <p className="font-medium text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock size={16} />
                  {formatDate(grievance.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Upvotes</p>
                <button
                  onClick={handleUpvote}
                  disabled={upvotingLoading}
                  className={`font-medium flex items-center gap-2 px-3 py-1 rounded transition-colors ${
                    hasUpvoted
                      ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  <ThumbsUp size={16} fill={hasUpvoted ? 'currentColor' : 'none'} />
                  {upvotes.length}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Comments Section */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-8">
          <CommentsSection grievanceId={grievanceId} userEmail={userEmail} />
        </div>
      </div>
    </div>
  );
};
