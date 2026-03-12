'use client';

import React, { useState, useEffect } from 'react';
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

interface Assignment {
  id: string;
  grievance_id: string;
  assigned_at: string;
  grievance: {
    id: string;
    title: string;
    description: string;
    category: string;
    status: string;
    author_email: string;
    is_anonymous: boolean;
    created_at: string;
    updated_at: string;
  };
}

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
  }, [router]);

  const fetchAssignments = async (email: string) => {
    try {
      setLoading(true);
      const data = await getTeacherAssignments(email);
      setAssignments(data || []);
    } catch (err) {
      setError('Failed to fetch assigned grievances');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-700 mb-4">
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                Teacher
              </span>
            </div>
            <p className="text-gray-600 mt-2">{userName || 'Teacher'}</p>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-red-800 font-medium">Error</p>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto text-red-600 hover:text-red-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-start">
              <Check className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-green-800 font-medium">Success</p>
                <p className="text-green-700 text-sm">{success}</p>
              </div>
              <button onClick={() => setSuccess('')} className="ml-auto text-green-600 hover:text-green-700">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-6">Assigned Grievances</h2>

          {loading ? (
            <p className="text-gray-600">Loading grievances...</p>
          ) : assignments.length === 0 ? (
            <div className="bg-white p-8 rounded-lg shadow text-center">
              <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600">No grievances assigned to you yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => {
                const grievance = assignment.grievance;
                const isExpanded = expandedGrievanceId === grievance.id;
                const statusColor = getStatusColor(grievance.status);

                return (
                  <div key={grievance.id} className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
                    {/* Summary */}
                    <div
                      onClick={() => handleExpandGrievance(grievance.id)}
                      className="p-4 cursor-pointer hover:bg-gray-50 transition"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-gray-900">{grievance.title}</h3>
                          <p className="text-sm text-gray-600">{grievance.category}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold bg-${statusColor}-100 text-${statusColor}-800 flex items-center gap-1`}
                          >
                            {getStatusIcon(grievance.status)}
                            {grievance.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-700 mb-2">{grievance.description.substring(0, 150)}...</p>
                      <p className="text-xs text-gray-500">
                        By: {grievance.is_anonymous ? 'Anonymous' : grievance.author_email} •{' '}
                        {formatRelativeTime(grievance.created_at)}
                      </p>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 bg-gray-50">
                        {loadingDetails ? (
                          <p className="text-gray-600">Loading details...</p>
                        ) : (
                          <>
                            {/* Full Description */}
                            <div className="mb-6 bg-white p-4 rounded border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-2">Full Description</h4>
                              <p className="text-gray-700">{grievance.description}</p>
                              <p className="text-xs text-gray-500 mt-2">Created: {formatLocalDateTime(grievance.created_at)}</p>
                            </div>

                            {/* Status Update */}
                            {grievance.status !== 'resolved' && (
                              <div className="mb-6 bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3">Update Status</h4>
                                <div className="flex gap-2">
                                  {grievance.status !== 'in-progress' && (
                                    <button
                                      onClick={() => handleUpdateStatus(grievance.id, 'in-progress')}
                                      className="px-4 py-2 bg-white text-[#13017f] rounded font-medium hover:shadow-lg transition text-sm"
                                    >
                                      Mark In Progress
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleUpdateStatus(grievance.id, 'resolved')}
                                    className="px-4 py-2 bg-white text-[#13017f] rounded font-medium hover:shadow-lg transition text-sm"
                                  >
                                    Mark Resolved
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Teacher Responses */}
                            <div className="mb-6 bg-white p-4 rounded border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-3">Your Responses {responses.length > 0 && `(${responses.length})`}</h4>
                              {responses.length === 0 ? (
                                <p className="text-gray-600 text-sm">No responses yet.</p>
                              ) : (
                                <div className="space-y-3">
                                  {responses.map((r) => (
                                    <div key={r.id} className="p-3 bg-blue-50 rounded border border-blue-200">
                                      <p className="text-gray-700">{r.response_text}</p>
                                      <p className="text-xs text-gray-500 mt-2">{formatRelativeTime(r.created_at)}</p>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Add Response */}
                            <div className="mb-6 bg-white p-4 rounded border border-gray-200">
                              <h4 className="font-semibold text-gray-900 mb-3">Add Response</h4>
                              <textarea
                                value={responseText}
                                onChange={(e) => setResponseText(e.target.value)}
                                placeholder="Type your response here..."
                                rows={3}
                                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                              />
                              <button
                                onClick={() => handleSendResponse(grievance.id)}
                                disabled={sendingResponse || !responseText.trim()}
                                className="px-4 py-2 bg-white text-[#13017f] rounded font-medium hover:shadow-lg transition flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                <Send className="w-4 h-4" />
                                Send Response
                              </button>
                            </div>

                            {/* Student Comments */}
                            {comments.length > 0 && (
                              <div className="bg-white p-4 rounded border border-gray-200">
                                <h4 className="font-semibold text-gray-900 mb-3">Student Comments ({comments.length})</h4>
                                <div className="space-y-3">
                                  {comments.map((c) => (
                                    <div key={c.id} className="p-3 bg-gray-100 rounded">
                                      <p className="text-sm text-gray-600 mb-1">
                                        {c.is_anonymous ? 'Anonymous' : c.author_email}
                                      </p>
                                      <p className="text-gray-700">{c.content}</p>
                                      <p className="text-xs text-gray-500 mt-1">{formatRelativeTime(c.created_at)}</p>
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
        </div>
      </div>
    </ProtectedPage>
  );
}
