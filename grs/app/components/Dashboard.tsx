'use client';

import React, { useState, useEffect } from 'react';
import { Plus, LogOut, Settings, Menu, X, Heart, Zap, MessageSquare, TrendingUp, Clock } from 'lucide-react';
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
  userName?: string | null;
  userRole: 'student' | 'teacher' | 'admin' | null;
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
  visibility: 'private' | 'public';
  created_at: string;
  upvotes: Array<{ count: number }>;
  comments: Array<{ count: number }>;
}

type MenuTab = 'my-grievances' | 'seconded' | 'recent';

export const Dashboard: React.FC<DashboardProps> = ({
  userEmail,
  userName,
  userRole,
  onLogout,
}) => {
  const [grievances, setGrievances] = useState<GrievanceData[]>([]);
  const [myGrievances, setMyGrievances] = useState<GrievanceData[]>([]);
  const [secondedGrievances, setSecondedGrievances] = useState<GrievanceData[]>([]);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [userUpvotes, setUserUpvotes] = useState<Set<string>>(new Set());
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<MenuTab>('recent');
  const [activeGrievanceCount, setActiveGrievanceCount] = useState(0);

  const setActiveTabTyped = (tab: MenuTab): void => {
    setActiveTab(tab);
  };

  useEffect(() => {
    fetchData();
  }, [selectedCategory, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [grievancesData, categoriesData] = await Promise.all([
        getGrievances(
          selectedCategory || undefined,
          selectedStatus || undefined,
          'recent',
          userEmail || undefined,
          userRole || undefined
        ),
        getCategories(),
      ]);

      setGrievances(grievancesData);
      setCategories(categoriesData);

      // Separate into my grievances and others
      const myGriefs = grievancesData.filter((g: GrievanceData) => g.author_email === userEmail);
      const otherPublicGriefs = grievancesData.filter((g: GrievanceData) => g.author_email !== userEmail && g.visibility === 'public');
      setMyGrievances(myGriefs);

      // Count active grievances
      const activeCount = myGriefs.filter((g: GrievanceData) => g.status !== 'resolved').length;
      setActiveGrievanceCount(activeCount);

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
        
        // Get seconded grievances (upvoted by user)
        const seconded = grievancesData.filter((g: GrievanceData) => upvotesSet.has(g.id));
        setSecondedGrievances(seconded);
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
      if (err instanceof Error) {
        console.error('Error message:', err.message);
      }
      setGrievances([]);
      setCategories([]);
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
    <div className="min-h-screen bg-[#13017f] text-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          {/* Hamburger Icon - Toggle Menu - Always visible on all screen sizes */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-[#13017f] hover:bg-gray-100 rounded-lg transition duration-200"
            aria-label="Toggle menu"
            title={sidebarOpen ? 'Close menu' : 'Open menu'}
          >
            {sidebarOpen ? (
              <X size={28} className="text-[#13017f]" strokeWidth={2.5} />
            ) : (
              <Menu size={28} className="text-[#13017f]" strokeWidth={2.5} />
            )}
          </button>

          <div className="flex-1 flex items-center gap-3 ml-4">
            <h1 className="text-2xl font-bold text-[#13017f]">GRS System</h1>
            <span className="px-3 py-1 border border-[#13017f] text-[#13017f] text-xs font-semibold rounded-full">Student</span>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {userRole === 'admin' && (
              <Link href="/admin/categories" className="p-2 hover:shadow-lg transition rounded-lg" title="Admin panel">
                <Settings size={20} className="text-[#13017f]" />
              </Link>
            )}
            <button
              onClick={onLogout}
              className="p-2 hover:shadow-lg transition rounded-lg"
              title="Logout"
            >
              <LogOut size={20} className="text-[#13017f]" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay - Click to close - Always visible when open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Menu - Slide in from left - Always visible on all screen sizes when open */}
      <nav
        className={`fixed left-0 top-20 bottom-0 w-64 bg-[#13017f]/95 backdrop-blur-md border-r border-white/20 z-30 transition-transform duration-300 ease-in-out overflow-y-auto ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Menu Navigation Buttons */}
        <div className="flex flex-col gap-6 p-8 mt-8">
          {/* Button 1: My Grievances */}
          <button
            onClick={() => {
              setActiveTabTyped('my-grievances');
              setSidebarOpen(false);
              // Smooth scroll to My Grievances section
              setTimeout(() => {
                const element = document.getElementById('my-grievances-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
            className={`flex items-center gap-4 px-6 py-6 rounded-2xl font-bold text-lg transition-all duration-200 ${
              activeTab === 'my-grievances'
                ? 'bg-white text-[#13017f] shadow-2xl scale-105'
                : 'bg-white/80 text-[#13017f] hover:bg-white hover:shadow-xl active:scale-95'
            }`}
          >
            <MessageSquare size={26} />
            <span>My Grievances</span>
          </button>

          {/* Button 2: Grievances I Seconded */}
          <button
            onClick={() => {
              setActiveTabTyped('seconded');
              setSidebarOpen(false);
              // Smooth scroll to Seconded section
              setTimeout(() => {
                const element = document.getElementById('seconded-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
            className={`flex items-center gap-4 px-6 py-6 rounded-2xl font-bold text-lg transition-all duration-200 ${
              activeTab === 'seconded'
                ? 'bg-white text-[#13017f] shadow-2xl scale-105'
                : 'bg-white/80 text-[#13017f] hover:bg-white hover:shadow-xl active:scale-95'
            }`}
          >
            <Heart size={26} />
            <span>Seconded</span>
          </button>

          {/* Button 3: Popular active grievances */}
          <button
            onClick={() => {
              setActiveTabTyped('recent');
              setSidebarOpen(false);
              // Smooth scroll to Public Feed section
              setTimeout(() => {
                const element = document.getElementById('public-feed-section');
                if (element) {
                  element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }, 100);
            }}
            className={`flex items-center gap-4 px-6 py-6 rounded-2xl font-bold text-lg transition-all duration-200 ${
              activeTab === 'recent'
                ? 'bg-white text-[#13017f] shadow-2xl scale-105'
                : 'bg-white/80 text-[#13017f] hover:bg-white hover:shadow-xl active:scale-95'
            }`}
          >
            <Zap size={26} />
            <span>Popular Active Grievances</span>
          </button>
        </div>

        {/* Filters Section - shown for My Grievances */}
        {activeTab === 'my-grievances' && (
          <div className="border-t border-white/20 p-6 space-y-4 mt-8">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider">Filters</h3>
            <div>
              <label className="text-xs font-bold text-white/70 mb-2 block">Status</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/10 border border-white/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 hover:border-white/50"
              >
                <option value="" className="bg-[#13017f] text-white">All Status</option>
                <option value="open" className="bg-[#13017f] text-white">Open</option>
                <option value="in-progress" className="bg-[#13017f] text-white">In Progress</option>
                <option value="resolved" className="bg-[#13017f] text-white">Resolved</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-white/70 mb-2 block">Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-white/10 border border-white/30 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-white/50 hover:border-white/50"
              >
                <option value="" className="bg-[#13017f] text-white">All Categories</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name} className="bg-[#13017f] text-white">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Mobile Action Buttons */}
        <div className="absolute bottom-0 left-0 right-0 border-t border-white/20 p-6 space-y-3">
          {userRole === 'admin' && (
            <Link
              href="/admin/categories"
              onClick={() => setSidebarOpen(false)}
              className="flex items-center gap-3 px-4 py-3 bg-white text-[#13017f] rounded-xl font-bold hover:shadow-lg transition w-full"
            >
              <Settings size={20} />
              <span>Admin Panel</span>
            </Link>
          )}
          <button
            onClick={() => {
              onLogout();
              setSidebarOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-3 bg-white text-[#13017f] rounded-xl font-bold hover:shadow-lg transition"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-12">
        {/* Welcome Section - Centered */}
        <div className="mb-12 text-center">
          <h2 className="text-5xl md:text-6xl font-bold text-white mb-3 leading-tight">
            Welcome, <span className="text-white">{userName || 'Student'}</span>
          </h2>
          <p className="text-lg text-white text-opacity-70 mb-8">Manage your grievances and stay informed</p>

          {/* File New Grievance - Center CTA */}
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-white text-[#13017f] rounded-xl font-semibold text-lg hover:shadow-2xl transition-all duration-300"
          >
            <Plus size={28} />
            File a New Grievance
          </button>
        </div>

        {/* Analytics - Horizontal and Bigger */}
        {!loading && (
          <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-transparent border-2 border-white border-opacity-30 rounded-xl p-6 hover:border-opacity-100 hover:shadow-2xl hover:drop-shadow-xl transition cursor-pointer text-center md:text-left">
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <Clock size={40} className="text-white" />
                <div>
                  <p className="text-4xl font-bold text-white">{activeGrievanceCount}</p>
                  <p className="text-sm text-white text-opacity-70 mt-1">Active Grievances</p>
                </div>
              </div>
            </div>
            <div className="bg-transparent border-2 border-white border-opacity-30 rounded-xl p-6 hover:border-opacity-100 hover:shadow-2xl hover:drop-shadow-xl transition cursor-pointer text-center md:text-left">
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <Heart size={40} className="text-white" />
                <div>
                  <p className="text-4xl font-bold text-white">{secondedGrievances.length}</p>
                  <p className="text-sm text-white text-opacity-70 mt-1">Grievances Seconded</p>
                </div>
              </div>
            </div>
            <div className="bg-transparent border-2 border-white border-opacity-30 rounded-xl p-6 hover:border-opacity-100 hover:shadow-2xl hover:drop-shadow-xl transition cursor-pointer text-center md:text-left">
              <div className="flex items-center gap-4 justify-center md:justify-start">
                <TrendingUp size={40} className="text-white" />
                <div>
                  <p className="text-4xl font-bold text-white">{myGrievances.length}</p>
                  <p className="text-sm text-white text-opacity-70 mt-1">Total Filed</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:ml-64">
          {/* Main Content */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 bg-white bg-opacity-5 rounded-xl animate-pulse border border-white border-opacity-10" />
                ))}
              </div>
            ) : (
              <>
                {activeTab === 'my-grievances' && (
                  <div id="my-grievances-section">
                    <h3 className="text-2xl font-bold text-white mb-6">My Grievances</h3>
                    {myGrievances.length === 0 ? (
                      <div className="text-center py-12 bg-transparent border border-white border-opacity-20 rounded-xl">
                        <p className="text-white text-opacity-70 mb-4">You haven't filed any grievances yet</p>
                        <button
                          onClick={() => setShowForm(true)}
                          className="px-4 py-2 bg-white text-[#13017f] rounded-lg font-medium hover:shadow-lg transition"
                        >
                          File Your First Grievance
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myGrievances.map((grievance) => (
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
                            upvoteCount={grievance.upvotes?.[0]?.count || 0}
                            commentCount={grievance.comments?.[0]?.count || 0}
                            onUpvote={() => handleUpvote(grievance.id)}
                            hasUpvoted={userUpvotes.has(grievance.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'seconded' && (
                  <div id="seconded-section">
                    <h3 className="text-2xl font-bold text-white mb-6">Grievances I've Seconded</h3>
                    {secondedGrievances.length === 0 ? (
                      <div className="text-center py-12 bg-transparent border border-white border-opacity-20 rounded-xl">
                        <p className="text-white text-opacity-70 mb-4">You haven't seconded any grievances yet</p>
                        <button
                          onClick={() => setActiveTab('recent')}
                          className="px-4 py-2 bg-white text-[#13017f] rounded-lg font-medium hover:shadow-lg transition"
                        >
                          Browse Public Grievances
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {secondedGrievances.map((grievance) => (
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
                            upvoteCount={grievance.upvotes?.[0]?.count || 0}
                            commentCount={grievance.comments?.[0]?.count || 0}
                            onUpvote={() => handleUpvote(grievance.id)}
                            hasUpvoted={userUpvotes.has(grievance.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'recent' && (
                  <div id="public-feed-section">
                    <h3 className="text-2xl font-bold text-white mb-6">Popular Public Grievances</h3>
                    {grievances.length === 0 ? (
                      <div className="text-center py-12 bg-transparent border border-white border-opacity-20 rounded-xl">
                        <p className="text-white text-opacity-70">No public grievances to display</p>
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
                            upvoteCount={grievance.upvotes?.[0]?.count || 0}
                            commentCount={grievance.comments?.[0]?.count || 0}
                            onUpvote={() => handleUpvote(grievance.id)}
                            hasUpvoted={userUpvotes.has(grievance.id)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </>
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
