'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, LogOut, Settings, Menu, X, Heart, Zap, MessageSquare, TrendingUp, Clock } from 'lucide-react';
import Link from 'next/link';
import { GrievanceCard } from './GrievanceCard';
import { GrievanceForm } from './GrievanceForm';
import {
  getGrievances,
  getCategories,
  getUpvotes,
  addUpvote,
  removeUpvote,
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
  priority?: 'Urgent' | 'High' | 'Medium' | 'Low';
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

  const fetchData = useCallback(async () => {
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
  }, [selectedCategory, selectedStatus, userEmail, userRole]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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

  return (
    <div className="min-h-screen bg-[#F0F4FF] font-sans selection:bg-[#BFDBFE] selection:text-[#1E3A8A]">
      {/* Header */}
      <header className="bg-white border-b border-[#DBEAFE] sticky top-0 z-50 shadow-[0_1px_8px_rgba(15,23,42,0.06)] animate-fade-in">
        <div className="max-w-[1200px] mx-auto px-10 py-5 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2.5 text-[#2563EB] hover:bg-[#EFF6FF] rounded-[10px] transition-all border border-transparent hover:border-[#BFDBFE]"
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-[22px] font-bold text-[#0F172A] tracking-[-0.4px]">GRS <span className="text-[#2563EB]">Portal</span></h1>
              <span className="hidden sm:inline-flex items-center text-[11px] font-bold px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-[6px] uppercase tracking-[0.5px]">
                Student Access
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-2 pr-4 border-r border-[#E2E8F0]">
              <div className="text-right">
                <p className="text-[13px] font-bold text-[#1E3A8A] leading-tight">{userName || 'Loading...'}</p>
                <p className="text-[10px] text-[#94A3B8] font-medium mt-0.5">{userEmail}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {userRole === 'admin' && (
                <Link 
                  href="/admin/dashboard" 
                  className="p-2 text-[#475569] hover:text-[#2563EB] hover:bg-[#EFF6FF] rounded-[8px] transition-all"
                  title="Admin Control Center"
                >
                  <Settings size={20} />
                </Link>
              )}
              <button
                onClick={onLogout}
                className="p-2 text-[#475569] hover:text-[#DC2626] hover:bg-[#FEF2F2] rounded-[8px] transition-all"
                title="Secure Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 backdrop-blur-[2px] transition-opacity"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Navigation */}
      <nav
        className={`fixed left-0 top-[73px] bottom-0 w-[280px] bg-white border-r border-[#DBEAFE] z-30 transition-all duration-400 ease-out shadow-[4px_0_24px_rgba(15,23,42,0.04)] overflow-y-auto ${
          sidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        <div className="p-6 space-y-8">
          <div>
            <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px] mb-4 px-4">Navigation</h3>
            <div className="space-y-2">
              <button
                onClick={() => {
                  setActiveTabTyped('my-grievances');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-bold text-[14px] transition-all ${
                  activeTab === 'my-grievances'
                    ? 'bg-[#EFF6FF] text-[#2563EB] shadow-sm'
                    : 'text-[#64748B] hover:bg-[#F8FAFF] hover:text-[#0F172A]'
                }`}
              >
                <MessageSquare size={18} />
                My Grievances
              </button>

              <button
                onClick={() => {
                  setActiveTabTyped('seconded');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-bold text-[14px] transition-all ${
                  activeTab === 'seconded'
                    ? 'bg-[#EFF6FF] text-[#2563EB] shadow-sm'
                    : 'text-[#64748B] hover:bg-[#F8FAFF] hover:text-[#0F172A]'
                }`}
              >
                <Heart size={18} />
                Seconded Issues
              </button>

              <button
                onClick={() => {
                  setActiveTabTyped('recent');
                  setSidebarOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-[12px] font-bold text-[14px] transition-all ${
                  activeTab === 'recent'
                    ? 'bg-[#EFF6FF] text-[#2563EB] shadow-sm'
                    : 'text-[#64748B] hover:bg-[#F8FAFF] hover:text-[#0F172A]'
                }`}
              >
                <Zap size={18} />
                Public Feed
              </button>
            </div>
          </div>

          <div>
            <h3 className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px] mb-4 px-4">Preference Filters</h3>
            <div className="space-y-4 px-4">
              <div>
                <label className="text-[11px] font-bold text-[#475569] mb-2 block">Resolution Status</label>
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFF] border border-[#DBEAFE] text-[#0F172A] text-[13px] font-medium rounded-[8px] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/10 transition-all"
                >
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold text-[#475569] mb-2 block">Category Group</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFF] border border-[#DBEAFE] text-[#0F172A] text-[13px] font-medium rounded-[8px] focus:outline-none focus:ring-[3px] focus:ring-[#2563EB]/10 transition-all"
                >
                  <option value="">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-6 left-6 right-6 pt-6 border-t border-[#F1F5F9]">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#FEF2F2] text-[#DC2626] rounded-[10px] text-[13px] font-bold hover:bg-[#DC2626] hover:text-white transition-all shadow-sm"
          >
            <LogOut size={16} />
            Terminate Session
          </button>
        </div>
      </nav>

      <main className={`max-w-[1200px] mx-auto px-10 py-12 transition-all duration-400 ${sidebarOpen ? 'blur-[2px] opacity-40 pointer-events-none brightness-95' : ''}`}>
        {/* Welcome Section */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 animate-fade-in" style={{ animationDelay: '0.05s' }}>
          <div>
            <h2 className="text-[36px] font-bold text-[#0F172A] tracking-[-1px] leading-tight mb-2">
              Welcome back, <span className="text-[#2563EB]">{userName?.split(' ')[0] || 'Student'}</span>
            </h2>
            <p className="text-[15px] text-[#64748B] font-medium">Identify and resolve grievances efficiently.</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white rounded-[12px] font-bold text-[15px] shadow-[0_4px_14px_rgba(37,99,235,0.25)] hover:shadow-[0_6px_20px_rgba(37,99,235,0.35)] hover:-translate-y-0.5 active:translate-y-0 transition-all whitespace-nowrap"
          >
            <Plus size={20} strokeWidth={2.5} />
            File New Grievance
          </button>
        </div>

        {/* Analytics Section */}
        {!loading && (
          <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-7 shadow-sm transition-all hover:shadow-md group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[12px] bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Clock size={30} />
                </div>
                <div>
                  <p className="text-[32px] font-bold text-[#0F172A] tracking-[-0.5px] leading-none">{activeGrievanceCount}</p>
                  <p className="text-[13px] text-[#94A3B8] font-bold uppercase tracking-[0.5px] mt-2">Active Filings</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-7 shadow-sm transition-all hover:shadow-md group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[12px] bg-[#FEF2F2] text-[#DC2626] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Heart size={30} />
                </div>
                <div>
                  <p className="text-[32px] font-bold text-[#0F172A] tracking-[-0.5px] leading-none">{secondedGrievances.length}</p>
                  <p className="text-[13px] text-[#94A3B8] font-bold uppercase tracking-[0.5px] mt-2">Seconded Issues</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-[#E2E8F0] rounded-[16px] p-7 shadow-sm transition-all hover:shadow-md group">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-[12px] bg-[#F8FAFF] text-[#1E3A8A] flex items-center justify-center group-hover:scale-110 transition-transform">
                  <TrendingUp size={30} />
                </div>
                <div>
                  <p className="text-[32px] font-bold text-[#0F172A] tracking-[-0.5px] leading-none">{myGrievances.length}</p>
                  <p className="text-[13px] text-[#94A3B8] font-bold uppercase tracking-[0.5px] mt-2">Cumulative Total</p>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-12">
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-white/50 border border-[#DBEAFE] rounded-[20px] animate-pulse shadow-sm" />
              ))}
            </div>
          ) : (
            <>
              {activeTab === 'my-grievances' && (
                <div id="my-grievances-section" className="animate-fade-in" style={{ animationDelay: '0.15s' }}>
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-[20px] font-bold text-[#0F172A]">Author History</h3>
                    <span className="text-[12px] font-bold px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full uppercase tracking-[0.5px]">
                      {myGrievances.length} Filings
                    </span>
                  </div>
                  {myGrievances.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed border-[#DBEAFE] rounded-[20px] shadow-sm">
                      <MessageSquare size={48} className="mx-auto text-[#BFDBFE] mb-4" />
                      <p className="text-[#64748B] text-[15px] font-medium mb-6">You haven&apos;t filed any grievances yet.</p>
                      <button
                        onClick={() => setShowForm(true)}
                        className="px-6 py-2.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-[10px] text-[13px] font-bold hover:bg-[#2563EB] hover:text-white transition-all shadow-sm"
                      >
                        Initiate First Grievance
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
                          priority={grievance.priority}
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
                <div id="seconded-section" className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-[20px] font-bold text-[#0F172A]">Seconded Issues</h3>
                    <span className="text-[12px] font-bold px-2 py-0.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] rounded-full uppercase tracking-[0.5px]">
                      {secondedGrievances.length} Active
                    </span>
                  </div>
                  {secondedGrievances.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed border-[#FEE2E2] rounded-[20px] shadow-sm">
                      <Heart size={48} className="mx-auto text-[#FEE2E2] mb-4" />
                      <p className="text-[#64748B] text-[15px] font-medium mb-6">You haven&apos;t seconded any grievances yet.</p>
                      <button
                        onClick={() => setActiveTab('recent')}
                        className="px-6 py-2.5 bg-[#FEF2F2] text-[#DC2626] border border-[#FEE2E2] rounded-[10px] text-[13px] font-bold hover:bg-[#DC2626] hover:text-white transition-all shadow-sm"
                      >
                        Discover Community Issues
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
                          priority={grievance.priority}
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
                <div id="public-feed-section" className="animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <h3 className="text-[20px] font-bold text-[#0F172A]">Public Narrative Feed</h3>
                    <span className="text-[12px] font-bold px-2 py-0.5 bg-[#F8FAFF] text-[#1E3A8A] border border-[#DBEAFE] rounded-full uppercase tracking-[0.5px]">
                      Global View
                    </span>
                  </div>
                  {grievances.length === 0 ? (
                    <div className="text-center py-16 bg-white border border-dashed border-[#DBEAFE] rounded-[20px] shadow-sm">
                      <Zap size={48} className="mx-auto text-[#DBEAFE] mb-4" />
                      <p className="text-[#64748B] text-[15px] font-medium">No public grievances match your current filters.</p>
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
                          priority={grievance.priority}
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
