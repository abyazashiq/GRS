'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Send, AlertCircle, MessageSquare, CheckCircle, Clock, X, Check } from 'lucide-react';
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

  // For expanded grievance view
  const [expandedGrievanceId, setExpandedGrievanceId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');
  const [sendingResponse, setSendingResponse] = useState(false);
  const [responses, setResponses] = useState<any[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);

  const router = useRouter();

  const fetchAssignments = useCallback(async (email: string) => {
    try {
      setLoading(true);
      const data = await getTeacherAssignments(email);
      setAssignments(data as Assignment[] || []);
    } catch (err) {
      setError('Failed to fetch assigned grievances');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedName = localStorage.getItem('userName');
    setUserEmail(storedEmail);
    setUserName(storedName);

    if (!storedEmail) {
      router.push('/login');
      return;
    }

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
      setError('Failed to load grievance details');
      console.error(err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleUpdateStatus = async (grievanceId: string, newStatus: 'open' | 'in-progress' | 'resolved') => {
    try {
      await updateGrievanceStatus(grievanceId, newStatus);
      setSuccess(`Status updated to ${newStatus}`);

      // Update local state
      setAssignments((prev) =>
        prev.map((a) =>
          a.grievance_id === grievanceId
            ? {
                ...a,
                grievance: {
                  ...a.grievance,
                  status: newStatus,
                },
              }
            : a
        )
      );

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update status');
    }
  };

  const handleSendResponse = async (grievanceId: string) => {
    if (!userEmail || !responseText.trim()) {
      setError('Please enter a response');
      return;
    }

    try {
      setSendingResponse(true);
      await addTeacherResponse(grievanceId, userEmail, responseText, true);
      setSuccess('Response sent successfully');
      setResponseText('');

      // Reload responses
      const updatedResponses = await getTeacherResponsesForGrievance(grievanceId);
      setResponses(updatedResponses || []);

      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send response');
    } finally {
      setSendingResponse(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'red';
      case 'in-progress':
        return 'yellow';
      case 'resolved':
        return 'green';
      default:
        return 'gray';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="w-5 h-5" />;
      case 'in-progress':
        return <Clock className="w-5 h-5" />;
      case 'resolved':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <ProtectedPage requiredRole="teacher">
      <div className="min-h-screen bg-[#F0F4FF] font-sans selection:bg-[#BFDBFE] selection:text-[#1E3A8A]">
        {/* Header */}
        <header className="bg-white border-b border-[#DBEAFE] shadow-[0_1px_8px_rgba(15,23,42,0.06)] animate-fade-in" style={{ animationDelay: '0s' }}>
          <div className="max-w-[1200px] mx-auto px-10 py-6 flex items-center justify-between flex-wrap gap-6">
            <div className="flex items-center gap-6">
              <Link
                href="/dashboard"
                className="flex items-center gap-2 text-[#2563EB] font-semibold hover:underline transition-all"
              >
                <ArrowLeft size={18} />
                Portal
              </Link>
              <div className="flex items-center gap-3">
                <h1 className="text-[24px] font-bold text-[#0F172A] tracking-[-0.4px]">Teacher Dashboard</h1>
                <span className="inline-flex items-center text-[11px] font-bold px-2.5 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-[6px] uppercase tracking-[0.6px]">
                  Faculty Access
                </span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-[14px] font-bold text-[#1E3A8A] leading-none">{userName || 'Loading...'}</p>
                <p className="text-[11px] text-[#94A3B8] font-medium mt-1">{userEmail}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] flex items-center justify-center text-white font-bold shadow-md">
                {userName?.charAt(0) || 'T'}
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto px-10 py-9">
          {/* Alerts */}
          {error && (
            <div className="mb-6 flex items-center gap-3 p-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[10px] text-[#DC2626] text-[14px] animate-fade-in shadow-sm">
              <AlertCircle size={18} className="flex-shrink-0" />
              <p className="font-medium"><strong>Error:</strong> {error}</p>
              <button onClick={() => setError('')} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">
                <X size={18} />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-[#F0FDF4]/50 border border-[#DCFCE7] rounded-[10px] text-[#166534] text-[14px] font-medium animate-fade-in flex items-center gap-3 shadow-sm">
              <Check size={18} className="text-[#16A34A]" />
              {success}
              <button onClick={() => setSuccess('')} className="ml-auto opacity-60 hover:opacity-100 transition-opacity">
                <X size={18} />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between mb-8 animate-fade-in" style={{ animationDelay: '0.06s' }}>
            <h2 className="text-[20px] font-bold text-[#0F172A] flex items-center gap-3">
              <MessageSquare size={22} className="text-[#2563EB]" />
              Assigned Grievances
              <span className="text-[12px] font-bold px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-full uppercase tracking-[0.5px]">
                {assignments.length} Total
              </span>
            </h2>
          </div>

          {loading ? (
            <p className="text-gray-600">Loading grievances...</p>
          ) : assignments.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No grievances assigned to you yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment, index) => {
                const grievance = assignment.grievance;
                const isExpanded = expandedGrievanceId === grievance.id;

                return (
                  <div
                    key={grievance.id}
                    className={`bg-white rounded-[16px] border border-[#E2E8F0] shadow-[0_2px_12px_rgba(15,23,42,0.06)] overflow-hidden transition-all animate-fade-in hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)] ${isExpanded ? 'ring-[2px] ring-[#2563EB] border-transparent' : 'hover:border-[#DBEAFE]'}`}
                    style={{ animationDelay: `${0.12 + (index * 0.05)}s` }}
                  >
                    {/* Summary Card Content */}
                    <div
                      onClick={() => handleExpandGrievance(grievance.id)}
                      className="p-8 cursor-pointer group"
                    >
                      <div className="flex items-start justify-between mb-4 border-b border-[#F1F5F9] pb-4">
                        <div className="flex-1 min-w-0 pr-8">
                          <h3 className="text-[17px] font-bold text-[#0F172A] group-hover:text-[#2563EB] transition-colors leading-tight">
                            {grievance.title}
                          </h3>
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-[12px] font-semibold text-[#94A3B8] uppercase tracking-[0.5px]">{grievance.category}</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-[#CBD5E1]"></span>
                            <span className="text-[12px] text-[#475569] font-medium">{formatRelativeTime(grievance.created_at)}</span>
                          </div>
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className={`inline-flex items-center gap-1.5 px-3 py-1 bg-white border rounded-[8px] text-[11px] font-bold uppercase tracking-[0.6px] leading-tight
                              ${grievance.status === 'open' ? 'text-[#DC2626] border-[#FEE2E2] bg-[#FEF2F2]/50' : 
                                grievance.status === 'in-progress' ? 'text-[#D97706] border-[#FEF3C7] bg-[#FFFBEB]/50' : 
                                'text-[#166534] border-[#DCFCE7] bg-[#F0FDF4]/50'}`}
                          >
                            {getStatusIcon(grievance.status)}
                            {grievance.status}
                          </span>
                        </div>
                      </div>

                      <div className="relative">
                        <p className="text-[14px] text-[#475569] leading-relaxed line-clamp-3 italic bg-[#F8FAFF] p-4 rounded-[12px] border border-[#EFF6FF]">
                          &quot;{grievance.description}&quot;
                        </p>
                      </div>

                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-[#F1F5F9] flex items-center justify-center">
                            <CheckCircle size={14} className="text-[#94A3B8]" />
                          </div>
                          <span className="text-[13px] text-[#475569] font-medium">
                            Author: <span className="text-[#1E3A8A]">{grievance.is_anonymous ? 'Protected Identity' : grievance.author_email}</span>
                          </span>
                        </div>
                        <div className="text-[#2563EB] text-[13px] font-bold flex items-center gap-1 transition-all group-hover:gap-2">
                          {isExpanded ? 'Collapse View' : 'Respond to Student'}
                          <Send size={14} className={isExpanded ? 'rotate-180' : ''} />
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details View */}
                    {isExpanded && (
                      <div className="border-t border-[#F1F5F9] p-8 bg-[#F8FAFF] space-y-8 animate-fade-in">
                        {loadingDetails ? (
                          <div className="flex items-center gap-3 text-[#94A3B8] text-sm animate-pulse">
                            <Clock size={16} className="animate-spin" /> Fetching detailed history...
                          </div>
                        ) : (
                          <>
                            {/* Detailed Description */}
                            <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                              <h4 className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.7px] mb-4">Grievance Narrative</h4>
                              <p className="text-[15px] text-[#0F172A] leading-[1.6]">{grievance.description}</p>
                              <div className="mt-4 pt-4 border-t border-[#F1F5F9] flex items-center gap-2 text-[12px] text-[#94A3B8]">
                                <Clock size={14} /> Full Record Created: {formatLocalDateTime(grievance.created_at)}
                              </div>
                            </div>

                            {/* Status Change Module */}
                            {grievance.status !== 'resolved' && (
                              <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                                <h4 className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.7px] mb-4">Workflow Execution</h4>
                                <div className="flex flex-wrap gap-4">
                                  {grievance.status !== 'in-progress' && (
                                    <button
                                      onClick={() => handleUpdateStatus(grievance.id, 'in-progress')}
                                      className="px-6 py-2.5 bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] rounded-[10px] text-[13px] font-bold hover:bg-[#2563EB] hover:text-white hover:shadow-lg transition-all"
                                    >
                                      Mark In Progress
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleUpdateStatus(grievance.id, 'resolved')}
                                    className="px-6 py-2.5 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white rounded-[10px] text-[13px] font-bold shadow-md hover:shadow-xl hover:-translate-y-0.5 transition-all"
                                  >
                                    Resolution Complete
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Response History Section */}
                            <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                              <h4 className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.7px] mb-4">Academic Correspondence ({responses.length})</h4>
                              {responses.length === 0 ? (
                                <div className="text-center py-6 bg-[#F8FAFF] rounded-[10px] border border-dashed border-[#DBEAFE]">
                                  <p className="text-[#94A3B8] text-[13px]">No responses documented for this record.</p>
                                </div>
                              ) : (
                                <div className="space-y-4">
                                  {responses.map((r) => (
                                    <div key={r.id} className="p-4 bg-[#F8FAFF] rounded-[10px] border border-[#DBEAFE] relative">
                                      <p className="text-[14px] text-[#0F172A] leading-relaxed">{r.response_text}</p>
                                      <p className="text-[11px] text-[#94A3B8] mt-3 font-semibold uppercase tracking-[0.5px]">Sent {formatRelativeTime(r.created_at)}</p>
                                      <div className="absolute top-4 right-4 text-[#2563EB]/20">
                                        <Send size={18} />
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Submission Flow */}
                            <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                              <h4 className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.7px] mb-4">Dispatch New Response</h4>
                              <div className="space-y-4">
                                <textarea
                                  value={responseText}
                                  onChange={(e) => setResponseText(e.target.value)}
                                  placeholder="Provide documented resolution or update for the student..."
                                  rows={4}
                                  className="w-full px-4 py-3 bg-[#F8FAFF] border border-[#DBEAFE] rounded-[12px] text-[14px] text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-[3px] focus:ring-[#2563EB]/12 transition-all"
                                />
                                <button
                                  onClick={() => handleSendResponse(grievance.id)}
                                  disabled={sendingResponse || !responseText.trim()}
                                  className="px-8 py-3 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white text-[14px] font-bold rounded-[10px] shadow-md hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {sendingResponse ? 'Transmitting...' : (
                                    <>
                                      <Send size={16} />
                                      Commit Official Response
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>

                            {/* Student/Staff Discussions */}
                            {comments.length > 0 && (
                              <div className="bg-white p-6 rounded-[14px] border border-[#E2E8F0] shadow-sm">
                                <h4 className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.7px] mb-4">Internal Discussion Stream ({comments.length})</h4>
                                <div className="space-y-4">
                                  {comments.map((c) => (
                                    <div key={c.id} className="p-4 bg-[#F1F5F9]/50 rounded-[12px] border border-[#E2E8F0]">
                                      <div className="flex items-center gap-2 mb-2">
                                        <div className="w-6 h-6 rounded-full bg-[#CBD5E1] flex items-center justify-center">
                                          <MessageSquare size={12} className="text-white" />
                                        </div>
                                        <p className="text-[12px] font-bold text-[#475569]">
                                          {c.is_anonymous ? 'Protected Entity' : c.author_email}
                                        </p>
                                      </div>
                                      <p className="text-[13px] text-[#0F172A] leading-relaxed">{c.content}</p>
                                      <p className="text-[11px] text-[#94A3B8] mt-2 italic">{formatRelativeTime(c.created_at)}</p>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedPage>
  );
}
