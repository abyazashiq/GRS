'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Send, 
  AlertCircle, 
  MessageSquare, 
  CheckCircle, 
  Clock, 
  X, 
  Check,
  Users
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedPage } from '@/app/components/ProtectedPage';
import {
  getTeacherAssignments,
  updateGrievanceStatus,
  addTeacherResponse,
  getTeacherResponsesForGrievance,
  getComments,
} from '@/lib/supabase/db';
import { formatLocalDateTime, formatRelativeTime } from '@/lib/dateUtils';
import { Assignment } from '@/lib/supabase/types';

export default function TeacherDashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');
  const [filter, setFilter] = useState<'all' | 'open' | 'in-progress' | 'resolved'>('all');

  // For expanded grievance view
  const [expandedGrievanceId, setExpandedGrievanceId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAssignments = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const data = await getTeacherAssignments(email);
      setAssignments(data as Assignment[] || []);
    } catch (err) {
      setError('Matrix Sync Failure');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedName = localStorage.getItem('userName');
    setUserEmail(storedEmail);
    setUserName(storedName);
    if (!storedEmail) { router.push('/login'); return; }
    fetchAssignments(storedEmail);
  }, [router, fetchAssignments]);

  const handleExpandGrievance = async (grievanceId: string) => {
    if (expandedGrievanceId === grievanceId) {
      setExpandedGrievanceId(null);
      return;
    }
    try {
      setLoadingDetails(true);
      const [responses, comments] = await Promise.all([
        getTeacherResponsesForGrievance(grievanceId),
        getComments(grievanceId),
      ]);
      setResponses(responses || []);
      setComments(comments || []);
      setExpandedGrievanceId(grievanceId);
    } catch (err) {
      setError('Deep Record Access Denied');
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (grievanceId: string, newStatus: 'open' | 'in-progress' | 'resolved') => {
    try {
      await updateGrievanceStatus(grievanceId, newStatus);
      setSuccess(`Workflow Updated: ${newStatus}`);
      setAssignments((prev) => prev.map((a) => a.grievance_id === grievanceId ? { ...a, grievance: { ...a.grievance, status: newStatus } } : a));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Workflow Lockup Detected');
    }
  };

  const handleSendResponse = async (grievanceId: string) => {
    if (!userEmail || !responseText.trim()) { setError('Null Response Blocked'); return; }
    try {
      setSendingResponse(true);
      await addTeacherResponse(grievanceId, userEmail, responseText, true);
      setSuccess('Packet Transmitted Successfully');
      setResponseText('');
      const updatedResponses = await getTeacherResponsesForGrievance(grievanceId);
      setResponses(updatedResponses || []);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Transmission Segment Broken');
    } finally {
      setSendingResponse(false);
    }
  };

  const filteredAssignments = assignments.filter(a => filter === 'all' || a.grievance.status === filter);

  return (
    <ProtectedPage requiredRole="teacher">
      <div className="min-h-screen bg-[var(--color-bg-base)] pb-32">
        {/* Elite Header */}
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--color-blue-soft)] animate-blur-in-elite">
          <div className="max-w-[1400px] mx-auto px-10 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="w-12 h-12 flex items-center justify-center bg-[var(--color-bg-subtle)] text-[var(--color-blue-primary)] rounded-[18px] hover:bg-[var(--color-blue-primary)] hover:text-white transition-all spring-lift">
                <ArrowLeft size={20} strokeWidth={3} />
              </Link>
              <h1 className="text-2xl font-black text-[var(--color-navy)] flex items-center gap-3">
                Resolution <span className="text-[var(--color-blue-primary)]">Portal</span>
              </h1>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[3px] text-[var(--color-blue-primary)] mb-1">Expert Protocol Active</p>
                  <p className="text-xs font-bold text-[var(--color-text-dim)]">{currentTime}</p>
               </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto px-10 pt-40">
          {/* Animated Greeting */}
          <div className="mb-16 animate-reveal-elastic">
            <h2 className="text-4xl font-black text-[var(--color-navy)] tracking-tighter mb-4 leading-none">
              Greetings, <br />
              <span className="text-[var(--color-blue-primary)]">Professor {userName?.split(' ')[0]}</span>
            </h2>
            <p className="text-[var(--color-text-muted)] font-black uppercase tracking-[4px] text-[11px] opacity-70">Authenticated Expert Node: {userEmail}</p>
          </div>

          {/* Feedback Messengers */}
          {error && (
             <div className="mb-10 p-6 bg-red-50 border border-red-100 rounded-[24px] flex items-center gap-4 text-[var(--color-danger)] font-black animate-reveal-elastic">
                <AlertCircle size={24} />
                <span className="uppercase tracking-widest text-xs">{error}</span>
             </div>
          )}
          {success && (
             <div className="mb-10 p-6 bg-blue-50 border border-blue-100 rounded-[24px] flex items-center gap-4 text-[var(--color-blue-primary)] font-black animate-reveal-elastic">
                <CheckCircle size={24} />
                <span className="uppercase tracking-widest text-xs">{success}</span>
             </div>
          )}

          {/* Resolution Stream */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-pulse">
                <div className="w-12 h-12 border-4 border-[var(--color-blue-soft)] border-t-[var(--color-blue-primary)] rounded-full animate-spin mb-4" />
                <p className="text-[var(--color-text-muted)] font-black uppercase tracking-[2px] text-[10px]">Accessing Record Matrix...</p>
              </div>
            ) : filteredAssignments.length === 0 ? (
              <div className="bg-white p-20 rounded-[48px] border border-[var(--color-border)] text-center animate-reveal-elastic shadow-premium-sm">
                <MessageSquare className="w-16 h-16 text-[var(--color-blue-soft)] mx-auto mb-6" />
                <p className="text-[var(--color-navy)] font-black text-xl mb-2">No Active Threads Found</p>
                <p className="text-[var(--color-text-muted)] text-[13px] font-bold">Your resolution queue is currently clear.</p>
              </div>
            ) : (
              filteredAssignments.map((assignment, idx) => {
                const grievance = assignment.grievance;
                const isExpanded = expandedGrievanceId === grievance.id;
                return (
                  <div key={grievance.id} className={`bg-white rounded-[40px] border-2 transition-all animate-reveal-elastic shadow-premium-sm group overflow-hidden ${isExpanded ? 'border-[var(--color-blue-primary)] ring-8 ring-[var(--color-blue-soft)]/20' : 'border-[var(--color-border)] hover:border-[var(--color-blue-soft)] hover:shadow-premium-md'}`} style={{ animationDelay: `${idx * 0.1}s` }}>
                    <div onClick={() => handleExpandGrievance(grievance.id)} className="p-10 cursor-pointer relative overflow-hidden">
                       {/* Intensity Bar */}
                       <div className={`absolute top-0 left-0 w-1 h-full ${grievance.status === 'open' ? 'bg-red-500' : grievance.status === 'in-progress' ? 'bg-[var(--color-blue-primary)]' : 'bg-emerald-500'}`} />
                       
                       <div className="flex items-start justify-between mb-8">
                          <div className="flex-1">
                             <div className="flex items-center gap-3 mb-3">
                                <span className="text-[9px] font-black text-[var(--color-blue-primary)] bg-[var(--color-blue-soft)] px-3 py-1 rounded-full uppercase tracking-widest">{grievance.category}</span>
                                <span className="text-[9px] font-black text-[var(--color-text-dim)] uppercase tracking-widest">{formatRelativeTime(grievance.created_at)}</span>
                             </div>
                             <h3 className="text-2xl font-black text-[var(--color-navy)] tracking-tight leading-[1.1]">{grievance.title}</h3>
                          </div>
                          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-premium-sm transition-all group-hover:scale-110 ${grievance.status === 'open' ? 'bg-red-50 text-red-500' : grievance.status === 'in-progress' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                             {grievance.status === 'open' ? <AlertCircle size={24} /> : grievance.status === 'in-progress' ? <Clock size={24} /> : <CheckCircle size={24} />}
                          </div>
                       </div>
                       
                       <div className="p-6 bg-[var(--color-bg-subtle)] rounded-[24px] border border-[var(--color-blue-soft)]/30 group-hover:bg-white transition-all">
                          <p className="text-[14px] text-[var(--color-text-muted)] font-bold italic leading-relaxed line-clamp-2">&quot;{grievance.description}&quot;</p>
                       </div>

                       <div className="mt-8 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                             <div className="w-10 h-10 rounded-full bg-white border border-[var(--color-border)] flex items-center justify-center shadow-sm">
                                <Users size={16} className="text-[var(--color-blue-primary)]" />
                             </div>
                             <p className="text-xs font-black text-[var(--color-navy)] uppercase tracking-wider">Author: <span className="text-[var(--color-blue-primary)]">{grievance.is_anonymous ? 'Classified' : grievance.author_email}</span></p>
                          </div>
                          <button className="flex items-center gap-3 text-[11px] font-black uppercase tracking-[2px] text-[var(--color-blue-primary)] group-hover:gap-5 transition-all">
                             {isExpanded ? 'Collapse Feed' : 'Resolve Interface'}
                             <ArrowLeft className={isExpanded ? 'rotate-90' : '-rotate-90'} size={14} strokeWidth={4} />
                          </button>
                       </div>
                    </div>

                    {/* Elite Expanded Portal */}
                    {isExpanded && (
                       <div className="p-10 border-t-2 border-[var(--color-blue-soft)] bg-[var(--color-bg-subtle)] animate-reveal-elastic grid grid-cols-1 lg:grid-cols-2 gap-10">
                          {loadingDetails ? (
                             <div className="col-span-full py-10 flex items-center justify-center gap-4">
                                <div className="w-6 h-6 border-4 border-slate-200 border-t-[var(--color-blue-primary)] rounded-full animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Syncing Deep History...</span>
                             </div>
                          ) : (
                             <>
                                <div className="space-y-10">
                                   {/* Detailed Narrative */}
                                   <div className="bg-white p-8 rounded-[32px] shadow-premium-sm border border-[var(--color-border)]">
                                      <h4 className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[3px] mb-6 flex items-center gap-3">
                                         <div className="w-1 h-3 bg-[var(--color-blue-primary)] rounded-full" />
                                         Full Transcript
                                      </h4>
                                      <p className="text-[15px] font-bold text-[var(--color-navy)] leading-[1.6] mb-6">{grievance.description}</p>
                                      <div className="pt-6 border-t border-[var(--color-border)] flex items-center gap-3 text-[10px] font-black text-[var(--color-text-dim)] uppercase tracking-widest">
                                         <Clock size={14} /> Created: {formatLocalDateTime(grievance.created_at)}
                                      </div>
                                   </div>

                                   {/* Workflow Control */}
                                   {grievance.status !== 'resolved' && (
                                      <div className="bg-white p-8 rounded-[32px] shadow-premium-sm border border-[var(--color-border)]">
                                         <h4 className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[3px] mb-6 flex items-center gap-3">
                                            <div className="w-1 h-3 bg-emerald-500 rounded-full" />
                                            Workflow Control
                                         </h4>
                                         <div className="flex gap-4">
                                            {grievance.status !== 'in-progress' && (
                                               <button onClick={() => handleUpdateStatus(grievance.id, 'in-progress')} className="flex-1 py-4 bg-[var(--color-blue-soft)] text-[var(--color-blue-primary)] rounded-[20px] text-xs font-black uppercase tracking-widest hover:bg-[var(--color-blue-primary)] hover:text-white transition-all spring-lift">
                                                  Initialize
                                               </button>
                                            )}
                                            <button onClick={() => handleUpdateStatus(grievance.id, 'resolved')} className="flex-1 py-4 bg-[var(--color-navy)] text-white rounded-[20px] text-xs font-black uppercase tracking-widest hover:shadow-glow-blue transition-all spring-lift">
                                               Finalize Resolution
                                            </button>
                                         </div>
                                      </div>
                                   )}
                                </div>

                                <div className="space-y-10">
                                   {/* Official Response Channel */}
                                   <div className="bg-white p-8 rounded-[32px] shadow-premium-sm border border-[var(--color-border)]">
                                      <h4 className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[3px] mb-6 flex items-center gap-3">
                                         <div className="w-1 h-3 bg-indigo-500 rounded-full" />
                                         Dispatch Feed
                                      </h4>
                                      <div className="mb-6 space-y-4 max-h-[300px] overflow-y-auto px-1">
                                         {responses.length === 0 ? (
                                            <div className="py-10 text-center opacity-30 italic font-bold text-xs uppercase tracking-widest">No Transmissions Logged</div>
                                         ) : (
                                            responses.map((r) => (
                                               <div key={r.id} className="p-5 bg-[var(--color-bg-subtle)] rounded-[20px] relative border border-[var(--color-border)]">
                                                  <p className="text-[13px] font-bold text-[var(--color-navy)] mb-2 leading-relaxed">{r.response_text}</p>
                                                  <p className="text-[9px] font-black text-[var(--color-text-dim)] uppercase tracking-widest">{formatRelativeTime(r.created_at)}</p>
                                               </div>
                                            ))
                                         )}
                                      </div>
                                      <div className="pt-6 border-t border-[var(--color-border)]">
                                         <textarea value={responseText} onChange={(e) => setResponseText(e.target.value)} placeholder="Enter resolution data..." className="w-full p-6 bg-[var(--color-bg-subtle)] border-2 border-transparent rounded-[24px] text-sm font-bold text-[var(--color-navy)] outline-none focus:border-[var(--color-blue-soft)] focus:bg-white transition-all mb-4" rows={4} />
                                         <button onClick={() => handleSendResponse(grievance.id)} disabled={sendingResponse || !responseText.trim()} className="w-full py-4 bg-[var(--color-blue-primary)] text-white rounded-[20px] text-xs font-black uppercase tracking-widest shadow-premium-sm hover:shadow-premium-md transition-all flex items-center justify-center gap-3 action-shimmer disabled:opacity-30">
                                            {sendingResponse ? 'Transmitting...' : <><Send size={16} strokeWidth={3} /> Commit Response</>}
                                         </button>
                                      </div>
                                   </div>
                                </div>
                             </>
                          )}
                       </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </main>

        {/* Resolution Status Dock */}
        <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-10 py-5 glass-blue rounded-[36px] shadow-premium-xl animate-reveal-elastic border-[var(--color-blue-soft)] border-2">
          <div className="flex items-center gap-12">
            {[
              { label: 'All', id: 'all', icon: MessageSquare },
              { label: 'Queued', id: 'open', icon: AlertCircle },
              { label: 'Active', id: 'in-progress', icon: Clock },
              { label: 'Closed', id: 'resolved', icon: CheckCircle }
            ].map((item, idx) => (
              <button key={idx} onClick={() => setFilter(item.id as any)} className={`flex flex-col items-center gap-2 group transition-all ${filter === item.id ? 'scale-110' : 'opacity-40 hover:opacity-100'}`}>
                <div className={`w-14 h-14 rounded-[24px] flex items-center justify-center shadow-premium-sm transition-all ${filter === item.id ? 'bg-[var(--color-blue-primary)] text-white rotate-6' : 'bg-white text-[var(--color-blue-primary)] group-hover:rotate-6'}`}>
                  <item.icon size={22} strokeWidth={3} />
                </div>
                <span className="text-[9px] font-black text-[var(--color-blue-deep)] uppercase tracking-[2px]">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      </div>
    </ProtectedPage>
  );
}
