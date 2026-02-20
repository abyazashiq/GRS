'use client';

import React, { useState, useEffect } from 'react';
import { Plus, LogOut, Settings } from 'lucide-react';
import Link from 'next/link';
import { GrievanceCard } from './GrievanceCard';
import { GrievanceForm } from './GrievanceForm';
import { Filters } from './Filters';
import {
  getGrievances,
  getCategories,
  getUpvotes,
  addUpvote,
  removeUpvote,
  getUpvoteCount,
} from '@/lib/supabase/db';

interface DashboardProps {
  userEmail: string | null;
  onLogout: () => void;
}

interface GrievanceData {
  id: string;
  title: string;
  description: string;
  category: string;
  status: 'open' | 'in-progress' | 'resolved';
  author_email: string | null;
  is_anonymous: boolean;
  created_at: string;
  upvotes: Array<{ count: number }>;
  comments: Array<{ count: number }>;
}

export const Dashboard: React.FC<DashboardProps> = ({
  userEmail,
  onLogout,
}) => {
  const [grievances, setGrievances] = useState<GrievanceData[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [grievancesData, categoriesData] = await Promise.all([
        getGrievances(selectedCategory || undefined, selectedStatus || undefined),
        getCategories(),
      ]);

      setGrievances(grievancesData);
      setCategories(categoriesData);

      // Fetch user upvotes
      if (userEmail) {
        const upvotesSet = new Set<string>();
        for (const grievance of grievancesData) {
          const upvotes = await getUpvotes(grievance.id);
          const hasUpvoted = upvotes.some((u) => u.user_email === userEmail);
          if (hasUpvoted) {
            upvotesSet.add(grievance.id);
          }
        }
        setUserUpvotes(upvotesSet);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpvote = async (grievanceId: string) => {
    if (!userEmail) {
      alert('Please log in to upvote');
      return;
    }

    try {
      if (userUpvotes.has(grievanceId)) {
        // Remove upvote
        await removeUpvote(grievanceId, userEmail);
        setUserUpvotes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(grievanceId);
          return newSet;
        });
      } else {
        // Add upvote
        await addUpvote(grievanceId, userEmail);
        setUserUpvotes((prev) => new Set([...prev, grievanceId]));
      }

      // Refresh grievance to update counts
      fetchData();
    } catch (err) {
      console.error('Failed to update upvote:', err);
    }
  };

  const getUpvoteCountForGrievance = (grievance: GrievanceData): number => {
    return grievance.upvotes?.[0]?.count || 0;
  };

  const getCommentCountForGrievance = (grievance: GrievanceData): number => {
    return grievance.comments?.[0]?.count || 0;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              GRS - Grievance Redressal System
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Welcome, {userEmail ? userEmail.split('@')[0] : 'Guest'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <Plus size={20} />
              New Grievance
            </button>

            {userEmail && (
              <Link
                href="/admin/categories"
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                title="Admin panel"
              >
                <Settings size={20} className="text-gray-700 dark:text-gray-300" />
              </Link>
            )}

            <button
              onClick={onLogout}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
              title="Logout"
            >
              <LogOut size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar - Filters */}
          <aside className="lg:col-span-1">
            <Filters
              categories={categories}
              selectedCategory={selectedCategory}
              selectedStatus={selectedStatus}
              onCategoryChange={setSelectedCategory}
              onStatusChange={setSelectedStatus}
            />
          </aside>

          {/* Main Content - Grievances */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            ) : grievances.length === 0 ? (
              <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800">
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  No grievances found
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  Be the first to file a grievance
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {grievances.map((grievance) => (
                  <GrievanceCard
                    key={grievance.id}
                    id={grievance.id}
                    title={grievance.title}
                    description={grievance.description}
                    category={grievance.category}
                    status={grievance.status}
                    isAnonymous={grievance.is_anonymous}
                    authorEmail={grievance.author_email || undefined}
                    createdAt={grievance.created_at}
                    upvoteCount={getUpvoteCountForGrievance(grievance)}
                    commentCount={getCommentCountForGrievance(grievance)}
                    onUpvote={() => handleUpvote(grievance.id)}
                    hasUpvoted={userUpvotes.has(grievance.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Grievance Form Modal */}
      {showForm && (
        <GrievanceForm
          userEmail={userEmail}
          onSuccess={() => {
            setSelectedCategory('');
            setSelectedStatus('');
            fetchData();
          }}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  );
};
