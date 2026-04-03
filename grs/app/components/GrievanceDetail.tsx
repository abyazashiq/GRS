'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ChevronLeft, User, Clock, ThumbsUp, AlertTriangle, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { CommentsSection } from '@/app/components/CommentsSection';
import { getGrievanceById, addUpvote, removeUpvote, getUpvotes, deleteGrievance } from '@/lib/supabase/db';
import { formatLocalDateTime } from '@/lib/dateUtils';

type Priority = 'Urgent' | 'High' | 'Medium' | 'Low';

interface GrievanceDetailProps {
  userEmail: string | null;
  userRole?: 'student' | 'teacher' | 'admin' | null;
}

const PRIORITY_CONFIG: Record<Priority, { badge: string; dot: string; label: string }> = {
  Urgent: { badge: 'bg-[#FEF2F2] text-[#DC2626] border-[#FEE2E2]', dot: 'bg-[#DC2626]', label: 'Urgent' },
  High:   { badge: 'bg-[#FFFBEB] text-[#D97706] border-[#FEF3C7]', dot: 'bg-[#D97706]', label: 'High' },
  Medium: { badge: 'bg-[#EFF6FF] text-[#2563EB] border-[#DBEAFE]', dot: 'bg-[#2563EB]', label: 'Medium' },
  Low:    { badge: 'bg-[#F1F5F9] text-[#64748B] border-[#E2E8F0]', dot: 'bg-[#94A3B8]', label: 'Low' },
};

export const GrievanceDetail: React.FC<GrievanceDetailProps> = ({ userEmail, userRole }) => {
  const params = useParams();
  const router = useRouter();
  const grievanceId = params.id as string;

  const [grievance, setGrievance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [upvotes, setUpvotes] = useState<any[]>([]);
  const [hasUpvoted, setHasUpvoted] = useState(false);
  const [upvotingLoading, setUpvotingLoading] = useState(false);
  const [priorityMsg, setPriorityMsg] = useState('');
  const [priorityUpdating, setPriorityUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

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

  const handleDelete = async () => {
    if (!grievance || !userEmail) return;
    if (window.confirm("Are you sure? This action cannot be undone.")) {
      try {
        setIsDeleting(true);
        setDeleteError(null);
        await deleteGrievance(grievanceId);
        router.push('/dashboard');
      } catch (err: any) {
        setDeleteError("This grievance can no longer be deleted as it is being reviewed.");
        setIsDeleting(false);
      }
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

  const handlePriorityChange = async (newPriority: Priority) => {
    if (!userEmail || !grievance) return;
    setPriorityUpdating(true);
    setPriorityMsg('');
    try {
      const res = await fetch('/api/grievance/priority', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grievanceId, priority: newPriority, callerEmail: userEmail }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update');
      setGrievance((prev: any) => ({ ...prev, priority: newPriority }));
      setPriorityMsg('Priority updated');
      setTimeout(() => setPriorityMsg(''), 2000);
    } catch (err) {
      setPriorityMsg('Update failed');
    } finally {
      setPriorityUpdating(false);
    }
  };

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

  const canChangePriority = userRole === 'admin' || userRole === 'teacher';
  const grievancePriority = (grievance?.priority || 'Medium') as Priority;
  const priorityCfg = PRIORITY_CONFIG[grievancePriority] || PRIORITY_CONFIG['Medium'];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] flex items-center justify-center p-6">
        <div className="max-w-4xl w-full">
          <div className="h-[500px] bg-white border border-[#DBEAFE] rounded-[32px] animate-pulse shadow-sm" />
        </div>
      </div>
    );
  }

  if (!grievance) {
    return (
      <div className="min-h-screen bg-[#F0F4FF] p-10">
        <div className="max-w-4xl mx-auto">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white text-[#2563EB] font-bold text-[14px] rounded-full border border-[#DBEAFE] shadow-sm hover:shadow-md hover:-translate-x-1 transition-all mb-8"
          >
            <ChevronLeft size={18} strokeWidth={3} />
            Back to Portal
          </Link>
          <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-16 text-center shadow-sm">
            <div className="w-16 h-16 bg-[#EFF6FF] text-[#2563EB] rounded-full flex items-center justify-center mx-auto mb-6">
              <Clock size={32} />
            </div>
            <h2 className="text-[24px] font-bold text-[#0F172A] mb-2 tracking-[-0.5px]">Grievance Not Found</h2>
            <p className="text-[#64748B] font-medium">The record you are seeking does not exist or has been archived.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F0F4FF] font-sans selection:bg-[#BFDBFE] selection:text-[#1E3A8A]">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between gap-4 mb-10">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white text-[#2563EB] font-bold text-[14px] rounded-full border border-[#DBEAFE] shadow-sm hover:shadow-md hover:-translate-x-1 transition-all group"
          >
            <ChevronLeft size={18} strokeWidth={3} className="group-hover:scale-110 transition-transform" />
            Back to Dashboard
          </Link>

          {grievance && userEmail === grievance.author_email && grievance.status === 'open' && (
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="inline-flex items-center gap-2.5 px-6 py-2.5 bg-red-50 text-red-500 font-bold text-[14px] rounded-full border border-red-100 shadow-sm hover:bg-red-500 hover:text-white transition-all spring-lift disabled:opacity-30"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Trash2 size={18} strokeWidth={3} />
                  Retract Filing
                </>
              )}
            </button>
          )}
        </div>

        {deleteError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-[var(--color-danger)] text-[12px] font-black uppercase tracking-widest animate-reveal-elastic">
            <AlertCircle size={18} />
            {deleteError}
          </div>
        )}

        <div className="space-y-10 animate-fade-in">
          {/* Main Content Card */}
          <article className="bg-white border border-[#E2E8F0] rounded-[32px] p-10 shadow-[0_4px_32px_rgba(15,23,42,0.03)] selection:bg-[#BFDBFE]">
            <div className="flex flex-col gap-6 mb-10">

              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2">
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm ${categoryColors[grievance.category as keyof typeof categoryColors] || categoryColors['Other']}`}>
                  {grievance.category}
                </span>
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm ${statusColors[grievance.status as keyof typeof statusColors]}`}>
                  {grievance.status.charAt(0).toUpperCase() + grievance.status.slice(1)}
                </span>
                {/* Priority badge */}
                <span className={`text-[11px] font-bold px-3 py-1 rounded-full border shadow-sm flex items-center gap-1.5 ${priorityCfg.badge}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${priorityCfg.dot}`} />
                  {grievancePriority}
                </span>
              </div>

              <h1 className="text-[36px] font-bold text-[#0F172A] tracking-[-1.5px] leading-[1.2] mb-2">
                {grievance.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 pt-6 border-t border-[#F1F5F9]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                    <User size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-[1px] leading-none mb-1">Author Identity</p>
                    <p className="text-[14px] font-bold text-[#0F172A]">
                      {grievance.is_anonymous ? 'Concealed Contributor' : (grievance.author_email?.split('@')[0] || 'Member')}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#F8FAFF] flex items-center justify-center text-[#1E3A8A]">
                    <Clock size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className="text-[11px] text-[#94A3B8] font-bold uppercase tracking-[1px] leading-none mb-1">Timestamp</p>
                    <p className="text-[14px] font-bold text-[#0F172A]">{formatLocalDateTime(grievance.created_at)}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-auto">
                  <button
                    onClick={handleUpvote}
                    disabled={upvotingLoading}
                    className={`flex items-center gap-3 px-6 py-3 rounded-full text-[15px] font-bold transition-all ${
                      hasUpvoted
                        ? 'bg-[#2563EB] text-white shadow-[0_8px_20px_rgba(37,99,235,0.25)] scale-105'
                        : 'bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] hover:bg-[#2563EB] hover:text-white'
                    }`}
                  >
                    <ThumbsUp size={18} strokeWidth={2.5} fill={hasUpvoted ? 'currentColor' : 'none'} />
                    <span>{upvotes.length} Seconded</span>
                  </button>
                </div>
              </div>

              {/* Priority editor — visible to teacher & admin only */}
              {canChangePriority && (
                <div className="mt-2 p-5 bg-[#F8FAFF] border border-[#DBEAFE] rounded-[18px]">
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle size={14} className="text-[#94A3B8]" />
                    <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[1px]">Change Priority</span>
                    {priorityMsg && (
                      <span className="ml-2 text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
                        {priorityMsg}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {(['Urgent', 'High', 'Medium', 'Low'] as Priority[]).map((p) => {
                      const cfg = PRIORITY_CONFIG[p];
                      const isActive = grievancePriority === p;
                      return (
                        <button
                          key={p}
                          onClick={() => !isActive && handlePriorityChange(p)}
                          disabled={priorityUpdating || isActive}
                          className={`flex items-center gap-1.5 px-4 py-2 rounded-[10px] border-2 text-[12px] font-bold transition-all ${
                            isActive
                              ? cfg.badge + ' cursor-default'
                              : 'bg-white border-[#E2E8F0] text-[#64748B] hover:border-[#CBD5E1]'
                          } disabled:opacity-60`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isActive ? cfg.dot : 'bg-[#CBD5E1]'}`} />
                          {p}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-[#F8FAFF] border border-[#DBEAFE] rounded-[24px] p-8">
              <p className="text-[17px] text-[#475569] font-medium leading-[1.7] whitespace-pre-wrap">
                {grievance.description}
              </p>
            </div>
          </article>

          {/* Discussion Card */}
          <section className="bg-white border border-[#E2E8F0] rounded-[32px] p-10 shadow-[0_4px_32px_rgba(15,23,42,0.03)]">
            <CommentsSection grievanceId={grievanceId} userEmail={userEmail} />
          </section>
        </div>
      </div>
    </div>
  );
};
