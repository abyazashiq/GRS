'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, AlertCircle, Users } from 'lucide-react';
import Link from 'next/link';
import { ProtectedPage } from '@/app/components/ProtectedPage';
import { getSectionAdvisors, getAllUsers } from '@/lib/supabase/db';

interface SectionAdvisor {
  id: string;
  year: string;
  section: string;
  teacher_email: string;
}

export default function AdminSectionsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [advisors, setAdvisors] = useState<SectionAdvisor[]>([]);
  const [teachers, setTeachers] = useState<Array<{ email: string; full_name: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // New advisor form
  const [newYear, setNewYear] = useState('');
  const [newSection, setNewSection] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    setUserEmail(storedEmail);
    if (!storedEmail) { router.push('/login'); return; }
    fetchAll();
  }, [router]);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [advisorData, teacherData] = await Promise.all([
        getSectionAdvisors(),
        getAllUsers('teacher'),
      ]);
      setAdvisors(advisorData as any);
      setTeachers((teacherData || []) as any);
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!newYear.trim() || !newSection.trim() || !newTeacher) {
      setError('Year, section, and teacher are all required');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setSectionAdvisor',
          callerEmail: userEmail,
          year: newYear.trim(),
          section: newSection.trim().toUpperCase(),
          teacherEmail: newTeacher,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess(`Class advisor set for Year ${newYear} Section ${newSection.toUpperCase()}`);
      setNewYear('');
      setNewSection('');
      setNewTeacher('');
      await fetchAll();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (year: string, section: string) => {
    if (!confirm(`Remove advisor for Year ${year} Section ${section}?`)) return;
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'deleteSectionAdvisor',
          callerEmail: userEmail,
          year,
          section,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setSuccess(`Advisor removed for Year ${year} Section ${section}`);
      await fetchAll();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove');
    }
  };

  const teacherLabel = (email: string) => {
    const t = teachers.find((t) => t.email === email);
    return t?.full_name ? `${t.full_name} (${email})` : email;
  };

  if (!userEmail) return null;

  return (
    <ProtectedPage requiredRole="admin">
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
            <Link
              href="/admin/dashboard"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Section Class Advisors
            </h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
          {success && (
            <div className="p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm">
              {success}
            </div>
          )}

          {/* Info banner */}
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
            <strong>How routing works:</strong> When a student files a grievance in a &quot;General&quot; category (no professor assigned),
            it is automatically routed to their section&apos;s class advisor below. Assign the advisor per year and section.
          </div>

          {/* Add / Update Form */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Set Class Advisor
            </h2>
            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year *</label>
                <input
                  type="text"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="e.g. 1, 2, 3, 4"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Section *</label>
                <input
                  type="text"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="e.g. A, B, C"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Class Advisor *</label>
                <select
                  value={newTeacher}
                  onChange={(e) => setNewTeacher(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select teacher…</option>
                  {teachers.map((t) => (
                    <option key={t.email} value={t.email}>
                      {t.full_name ? `${t.full_name} (${t.email})` : t.email}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus size={18} />
                  {saving ? 'Saving…' : 'Save Advisor'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Advisors */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users size={20} />
              Current Advisors ({advisors.length})
            </h2>

            {loading ? (
              <p className="text-gray-600 dark:text-gray-400">Loading…</p>
            ) : advisors.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No section advisors configured yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700 dark:text-gray-300">Year</th>
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700 dark:text-gray-300">Section</th>
                      <th className="text-left py-2 pr-4 font-semibold text-gray-700 dark:text-gray-300">Class Advisor</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisors
                      .sort((a, b) => a.year.localeCompare(b.year) || a.section.localeCompare(b.section))
                      .map((adv) => (
                        <tr key={adv.id} className="border-b border-gray-100 dark:border-gray-800">
                          <td className="py-2 pr-4 text-gray-900 dark:text-white">{adv.year}</td>
                          <td className="py-2 pr-4 text-gray-900 dark:text-white">{adv.section}</td>
                          <td className="py-2 pr-4 text-gray-700 dark:text-gray-300">{teacherLabel(adv.teacher_email)}</td>
                          <td className="py-2">
                            <button
                              onClick={() => handleDelete(adv.year, adv.section)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded"
                              title="Remove"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
