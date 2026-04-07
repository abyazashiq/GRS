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
  deleteGrievance,
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
  is_escalated: boolean;
  current_escalation_level: number;
  escalation_reason: string | null;
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
  const [activeTab, setActiveTab] = useState<MenuTab>('recent');
  const [activeGrievanceCount, setActiveGrievanceCount] = useState(0);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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

      const myGriefs = grievancesData.filter((g: GrievanceData) => g.author_email === userEmail);
      setMyGrievances(myGriefs);
      setActiveGrievanceCount(myGriefs.filter((g: GrievanceData) => g.status !== 'resolved').length);

      if (userEmail) {
        const upvotesSet = new Set<string>();
        for (const grievance of grievancesData) {
          const upvotes = await getUpvotes(grievance.id);
          const hasUpvoted = upvotes.some((u) => u.user_email === userEmail);
          if (hasUpvoted) upvotesSet.add(grievance.id);
        }
        setUserUpvotes(upvotesSet);
        setSecondedGrievances(grievancesData.filter((g: GrievanceData) => upvotesSet.has(g.id)));
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
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
    if (!userEmail) return;
    try {
      if (userUpvotes.has(grievanceId)) {
        await removeUpvote(grievanceId, userEmail);
        setUserUpvotes((prev) => {
          const newSet = new Set(prev);
          newSet.delete(grievanceId);
          return newSet;
        });
      } else {
        await addUpvote(grievanceId, userEmail);
        setUserUpvotes((prev) => new Set([...prev, grievanceId]));
      }
      fetchData();
    } catch (err) {
      console.error('Failed to update upvote:', err);
    }
  };

  const handleDeleteGrievance = async (id: string) => {
    try {
      await deleteGrievance(id);
      // Update local state optimistically or after success
      setGrievances((prev) => prev.filter((g) => g.id !== id));
      setMyGrievances((prev) => prev.filter((g) => g.id !== id));
      setSecondedGrievances((prev) => prev.filter((g) => g.id !== id));
    } catch (err) {
      console.error('Failed to delete grievance:', err);
      // Re-throw to be caught by the component and show error message
      throw err;
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-base)] selection:bg-[var(--color-blue-soft)] selection:text-[var(--color-blue-deep)] pb-32">
      {/* Dynamic Header */}
      <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--color-border)] animate-blur-in-elite">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-3xl font-black text-[var(--color-navy)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[var(--color-blue-primary)] flex items-center justify-center text-white shadow-glow-blue animate-float">
                <Zap size={22} fill="white" />
              </div>
              GRS<span className="text-[var(--color-blue-primary)] opacity-80">.</span>
            </h1>
            <div className="hidden lg:flex items-center gap-5 text-[10px] font-black uppercase tracking-[3px] text-[var(--color-text-muted)] border-l border-[var(--color-border)] pl-8">
              <span>Institution Level</span>
              <div className="w-1.5 h-1.5 rounded-full bg-[var(--color-blue-primary)]" />
              <span>{new Date().toLocaleDateString(undefined, { month: 'long', day: 'numeric' })}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="hidden md:flex items-center gap-4 text-right">
              <div>
                <p className="text-xs font-black text-[var(--color-navy)] leading-none mb-1 uppercase tracking-wider">{userName || 'Authorized User'}</p>
                <div className="flex items-center gap-2 justify-end">
                  <span className="text-[10px] text-[var(--color-blue-primary)] font-black uppercase tracking-widest">{userRole}</span>
                  <div className="w-1 h-1 rounded-full bg-[var(--color-border)]" />
                  <span className="text-[10px] text-[var(--color-text-dim)] font-bold">{currentTime}</span>
                </div>
              </div>
            </div>
            <button
              onClick={onLogout}
              className="w-11 h-11 flex items-center justify-center rounded-2xl bg-[var(--color-bg-subtle)] text-[var(--color-navy)] hover:bg-[var(--color-blue-primary)] hover:text-white transition-all shadow-premium-sm spring-lift group"
            >
              <LogOut size={18} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 md:px-12 pt-32 lg:pt-40">
        {/* Cinematic Greeting */}
        <div className="mb-20 stagger-1">
          <div className="flex items-center gap-3 mb-4">
             <span className="text-[11px] font-black uppercase tracking-[4px] text-[var(--color-blue-primary)]">Commander Center</span>
             <div className="h-[1px] w-12 bg-[var(--color-blue-primary)] opacity-30" />
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-[var(--color-navy)] leading-[1.1] tracking-tighter mb-8">
            Greetings, <br />
            <span className="text-[var(--color-blue-primary)]">
              {userName?.split(' ')[0] || 'User'}
            </span>
          </h2>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
            <p className="text-xl text-[var(--color-text-dim)] font-medium max-w-xl leading-relaxed">
              Managing institution integrity through high-fidelity redressal and automated oversight loops.
            </p>
            <button
              onClick={() => setShowForm(true)}
              className="px-10 py-5 bg-[var(--color-blue-primary)] text-white rounded-[24px] font-black text-sm uppercase tracking-[2px] shadow-premium-xl hover:shadow-glow-blue spring-lift action-shimmer flex items-center gap-3"
            >
              <Plus size={20} strokeWidth={3} />
              Dispatch New Filing
            </button>
          </div>
        </div>

        {/* Elite Analytics Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-24 stagger-2">
            {[
              { label: 'Active Filings', count: activeGrievanceCount, icon: Zap, bg: 'bg-[var(--color-blue-primary)]', text: 'text-white' },
              { label: 'Community Support', count: secondedGrievances.length, icon: Heart, bg: 'bg-white', text: 'text-[var(--color-blue-primary)]' },
              { label: 'Full Perspective', count: grievances.length, icon: TrendingUp, bg: 'bg-white', text: 'text-[var(--color-navy)]' }
            ].map((stat, idx) => (
              <div key={idx} className={`${stat.bg} border border-[var(--color-border)] rounded-[36px] p-10 shadow-premium-md spring-lift group relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-32 h-32 ${stat.bg === 'bg-white' ? 'bg-[var(--color-blue-soft)]' : 'bg-white/10'} rounded-bl-[80px] z-0 transition-all group-hover:w-40 group-hover:h-40`} />
                <div className="relative z-10">
                  <div className={`w-14 h-14 rounded-2xl ${stat.bg === 'bg-white' ? 'bg-[var(--color-blue-soft)]' : 'bg-white/20'} ${stat.text} flex items-center justify-center mb-10 transition-transform group-hover:rotate-12`}>
                    <stat.icon size={26} strokeWidth={2.5} />
                  </div>
                  <p className={`text-6xl font-black ${stat.text} tracking-tighter mb-2 animate-blur-in-elite`}>{stat.count}</p>
                  <p className={`text-[10px] ${stat.text === 'text-white' ? 'opacity-80' : 'text-[var(--color-text-muted)]'} font-black uppercase tracking-[3px]`}>{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Content Engine */}
        <div className="space-y-20 stagger-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-[var(--color-border)] pb-8">
            <div className="flex items-center gap-6">
              <h3 className="text-3xl font-black text-[var(--color-navy)] italic">
                {activeTab === 'my-grievances' ? 'Personal Narratives' : activeTab === 'seconded' ? 'Community Interest' : 'Authorized Feed'}
              </h3>
              <span className="px-4 py-1 bg-[var(--color-blue-soft)] text-[var(--color-blue-primary)] text-[10px] font-black rounded-full uppercase tracking-widest border border-[var(--color-blue-soft)]">
                {activeTab === 'my-grievances' ? myGrievances.length : activeTab === 'seconded' ? secondedGrievances.length : grievances.length} Total
              </span>
            </div>
            
            <div className="flex items-center gap-3">
               <select
                 value={selectedCategory}
                 onChange={(e) => setSelectedCategory(e.target.value)}
                 className="px-6 py-3 bg-white border border-[var(--color-border)] rounded-2xl text-xs font-black uppercase tracking-widest text-[var(--color-navy)] outline-none focus:ring-4 focus:ring-[var(--color-blue-primary)]/5 transition-all cursor-pointer shadow-premium-sm"
               >
                 <option value="">All Scopes</option>
                 {categories.map((cat) => (
                   <option key={cat.id} value={cat.name}>{cat.name}</option>
                 ))}
               </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 gap-8 animate-blur-in-elite">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 bg-white border border-[var(--color-border)] rounded-[32px] relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-blue-soft)]/20 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {((activeTab === 'my-grievances' && myGrievances.length === 0) || 
                (activeTab === 'seconded' && secondedGrievances.length === 0) || 
                (activeTab === 'recent' && grievances.length === 0)) ? (
                <div className="py-32 text-center glass border-2 border-dashed border-[var(--color-border)] rounded-[48px] animate-reveal-elastic">
                  <div className="w-24 h-24 bg-[var(--color-blue-soft)] rounded-full flex items-center justify-center mx-auto mb-8 text-[var(--color-blue-primary)] animate-float">
                    <MessageSquare size={40} />
                  </div>
                  <h4 className="text-2xl font-black text-[var(--color-navy)] mb-4">Establishing Context...</h4>
                  <p className="text-[var(--color-text-muted)] font-bold mb-10 max-w-sm mx-auto uppercase tracking-tighter text-xs">The current narrative stream is awaiting institutional records.</p>
                </div>
              ) : (
                (activeTab === 'my-grievances' ? myGrievances : activeTab === 'seconded' ? secondedGrievances : grievances).map((g, idx) => (
                  <div key={g.id} className="stagger-4" style={{ animationDelay: `${0.2 + idx * 0.08}s` }}>
                    <GrievanceCard
                      id={g.id}
                      title={g.title}
                      description={g.description}
                      category={g.category}
                      status={g.status}
                      priority={g.priority}
                      isAnonymous={g.is_anonymous}
                      authorEmail={g.author_email || undefined}
                      createdAt={g.created_at}
                      upvoteCount={g.upvotes?.[0]?.count || 0}
                      commentCount={g.comments?.[0]?.count || 0}
                      onUpvote={() => handleUpvote(g.id)}
                      hasUpvoted={userUpvotes.has(g.id)}
                      onDelete={handleDeleteGrievance}
                      isAuthor={g.author_email === userEmail}
                      isEscalated={g.is_escalated}
                    />
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </main>

      {/* Floating Glass Dock Navigation */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 glass-blue rounded-[32px] shadow-premium-xl animate-reveal-elastic border-[var(--color-blue-soft)] border-2">
        <div className="flex items-center gap-6 md:gap-12">
          {[
            { id: 'recent', label: 'Authorized Feed', icon: Zap },
            { id: 'my-grievances', label: 'My Records', icon: MessageSquare },
            { id: 'seconded', label: 'Seconded', icon: Heart }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTabTyped(item.id as MenuTab)}
              className={`flex flex-col items-center gap-2 px-6 py-2 rounded-2xl transition-all spring-lift group ${
                activeTab === item.id 
                  ? 'bg-[var(--color-blue-primary)] text-white shadow-glow-blue scale-110' 
                  : 'text-[var(--color-blue-deep)] hover:bg-[var(--color-blue-soft)]'
              }`}
            >
              <item.icon size={22} strokeWidth={activeTab === item.id ? 3 : 2} className="transition-transform group-hover:scale-110" />
              <span className="text-[8px] font-black uppercase tracking-[2px]">{item.id === 'recent' ? 'Feed' : item.id === 'seconded' ? 'Votes' : 'Mine'}</span>
            </button>
          ))}
          <div className="w-[1px] h-10 bg-[var(--color-blue-soft)] mx-2" />
          <button
              onClick={() => setShowForm(true)}
              className="w-14 h-14 bg-white text-[var(--color-blue-primary)] flex items-center justify-center rounded-[24px] shadow-premium-md hover:shadow-premium-xl hover:-translate-y-2 transition-all active:scale-95 group"
            >
              <Plus size={28} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
          </button>
        </div>
      </nav>

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
;
