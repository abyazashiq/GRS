'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, AlertCircle, X } from 'lucide-react';
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
      setAdvisors(advisorData as SectionAdvisor[]);
      setTeachers((teacherData || []) as Array<{ email: string; full_name: string | null }>);
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
      <div className="min-h-screen bg-[#F0F4FA] font-sans selection:bg-[#BFDBFE] selection:text-[#1E3A8A]">
        {/* Header */}
        <header className="bg-white animate-fade-in" style={{ animationDelay: '0s' }}>
          <div className="max-w-[1240px] mx-auto px-8 pt-10 pb-[28px]">
            <Link href="/admin/dashboard" className="inline-flex items-center text-[#2563EB] font-bold text-[13px] hover:underline mb-8 transition-all group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              BACK TO PORTAL
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-5">
                <h1 className="text-[28px] font-[800] text-[#1E3A8A] tracking-[-0.6px]">Class Advisors</h1>
                <div className="hidden md:block h-6 w-[1px] bg-[#E2E8F0] mx-2"></div>
                <div className="hidden md:block text-[#94A3B8] text-[11px] font-bold uppercase tracking-[1px]">
                  Academic Structure / Routing
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1240px] mx-auto px-8 py-8 space-y-8">
          {error && (
            <div className="p-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[14px] flex items-start shadow-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 text-[#DC2626] mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[#991B1B] font-bold text-sm">Update Failed</p>
                <p className="text-[#B91C1C] text-[13px] font-medium">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto text-[#DC2626] hover:bg-[#FEE2E2] p-1 rounded-md transition-colors">
                <X className="w-5 h-5 flex-shrink-0" />
              </button>
            </div>
          )}
          {success && (
            <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-[14px] shadow-sm animate-fade-in flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#166534] animate-pulse"></div>
              <span className="text-[#15803D] text-[14px] font-semibold">{success}</span>
            </div>
          )}

          {/* Info banner */}
          <div className="p-6 bg-white border border-[#E4EAF4] border-l-[4px] border-l-[#2563EB] rounded-[16px] shadow-[0_1px_4px_rgba(30,58,138,0.04)] animate-fade-in" style={{ animationDelay: '0.06s' }}>
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] shrink-0">
                <AlertCircle size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className="text-[15px] font-bold text-[#1E3A8A]">Routing Logic</p>
                <p className="text-[14px] text-[#64748B] mt-1 font-medium leading-relaxed">
                  New grievances in <span className="text-[#2563EB] font-bold">General Categories</span> are automatically routed to the class advisor assigned below based on the student&apos;s academic profile.
                </p>
              </div>
            </div>
          </div>

          {/* Add / Update Form */}
          <div className="bg-white border border-[#E2E8F0] rounded-[24px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] p-8 animate-fade-in" style={{ animationDelay: '0.12s' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[17px] font-[800] text-[#1E3A8A]">Set Section Advisor</h2>
                <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-[0.5px]">Map faculty to academic groups</p>
              </div>
            </div>

            <form onSubmit={handleSave} className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-end">
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.7px] ml-1">Year *</label>
                <input
                  type="text"
                  value={newYear}
                  onChange={(e) => setNewYear(e.target.value)}
                  placeholder="e.g. 3"
                  className="w-full h-[48px] px-4 bg-[#F8FAFF] border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[15px] text-[#1E293B] font-bold outline-none focus:border-[#2563EB] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.7px] ml-1">Section *</label>
                <input
                  type="text"
                  value={newSection}
                  onChange={(e) => setNewSection(e.target.value)}
                  placeholder="e.g. A"
                  className="w-full h-[48px] px-4 bg-[#F8FAFF] border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[15px] text-[#1E293B] font-bold outline-none focus:border-[#2563EB] transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.7px] ml-1">Faculty Member *</label>
                <select
                  value={newTeacher}
                  onChange={(e) => setNewTeacher(e.target.value)}
                  className="w-full h-[48px] px-4 bg-[#F8FAFF] border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[14px] text-[#1E293B] font-[700] outline-none focus:border-[#2563EB] transition-all"
                >
                  <option value="">Select faculty…</option>
                  {teachers.map((t) => (
                    <option key={t.email} value={t.email}>
                      {t.full_name ? `${t.full_name} (${t.email.split('@')[0]})` : t.email}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full h-[48px] px-8 bg-[#2563EB] text-white text-[14px] font-[800] rounded-[12px] shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Plus size={18} strokeWidth={3} />
                  {saving ? 'SAVING…' : 'SAVE ADVISOR'}
                </button>
              </div>
            </form>
          </div>

          {/* Existing Advisors */}
          <div className="bg-white border border-[#E2E8F0] rounded-[24px] shadow-[0_2px_12px_rgba(15,23,42,0.04)] p-8 animate-fade-in" style={{ animationDelay: '0.18s' }}>
            <div className="flex items-center justify-between mb-8 pb-4">
              <h2 className="text-[14px] font-bold text-[#64748B] uppercase tracking-[1.5px] flex items-center gap-3">
                Active Groupings ({advisors.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : advisors.length === 0 ? (
              <div className="text-center py-12 bg-[#F8FAFF] rounded-xl border border-dashed border-[#DBEAFE]">
                <p className="text-[#94A3B8] text-sm">No section advisors configured yet.</p>
              </div>
            ) : (
              <div className="overflow-hidden border border-[#E8EDF8] rounded-xl bg-[#FAFBFF]">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#F3F6FD] border-b border-[#E8EDF8]">
                      <th className="py-4 px-6 text-[11px] font-[600] text-[#94A3B8] uppercase tracking-[0.8px]">Academic Profile</th>
                      <th className="py-4 px-6 text-[11px] font-[600] text-[#94A3B8] uppercase tracking-[0.8px]">Faculty Advisor</th>
                      <th className="py-4 px-6 text-right"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {advisors
                      .sort((a, b) => a.year.localeCompare(b.year) || a.section.localeCompare(b.section))
                      .map((adv) => (
                        <tr key={adv.id} className="border-b border-[#F0F4FA] hover:bg-[#F3F6FD] transition-all group">
                          <td className="py-5 px-6">
                            <div className="flex items-center gap-3">
                              <span className="text-[13px] font-[800] text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded-[8px] border border-[#BFDBFE]">YEAR {adv.year}</span>
                              <span className="text-[13px] font-[800] text-[#1E293B]">SECTION {adv.section}</span>
                            </div>
                          </td>
                          <td className="py-5 px-6">
                            <div className="text-[15px] font-[700] text-[#1E293B] group-hover:text-[#2563EB] transition-colors">{teacherLabel(adv.teacher_email).split('(')[0]}</div>
                            <div className="text-[12px] text-[#94A3B8] font-medium">{adv.teacher_email}</div>
                          </td>
                          <td className="py-5 px-6 text-right">
                            <button
                              onClick={() => handleDelete(adv.year, adv.section)}
                              className="w-10 h-10 flex items-center justify-center text-[#EF4444] bg-white border border-[#FEE2E2] hover:bg-[#FEF2F2] rounded-xl shadow-sm transition-all"
                              title="Revoke assignment"
                            >
                              <Trash2 size={16} strokeWidth={2.5} />
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
