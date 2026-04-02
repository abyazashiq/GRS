'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, AlertCircle, UserCheck, X } from 'lucide-react';
import Link from 'next/link';
import { ProtectedPage } from '@/app/components/ProtectedPage';
import { getCategories, deleteCategory, getAllUsers, getEscalationPolicies } from '@/lib/supabase/db';

interface EscalationDraft {
  warningAfterHours: number;
  escalateAfterHours: number;
  criticalAfterHours: number;
  inactivityAfterHours: number;
  escalationPathText: string;
  autoEscalate: boolean;
}

export default function AdminCategoriesPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; description: string | null; assigned_teacher_email: string | null }>>([]);
  const [teachers, setTeachers] = useState<Array<{ email: string; full_name: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [savingPolicyCategory, setSavingPolicyCategory] = useState<string | null>(null);
  const [policyDrafts, setPolicyDrafts] = useState<Record<string, EscalationDraft>>({});

  // Teacher assignment state
  const [assigningCategory, setAssigningCategory] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    setUserEmail(storedEmail);

    if (!storedEmail) {
      router.push('/login');
      return;
    }

    fetchCategories();
    fetchTeachers();
    fetchEscalationPolicyDrafts();
  }, [router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data as Array<{ id: string; name: string; description: string | null; assigned_teacher_email: string | null }>);
    } catch (err) {
      setError('Failed to fetch categories');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const data = await getAllUsers('teacher');
      setTeachers((data || []) as Array<{ email: string; full_name: string | null }>);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
  };

  const fetchEscalationPolicyDrafts = async () => {
    try {
      const data = await getEscalationPolicies();
      const drafts: Record<string, EscalationDraft> = {};

      data.forEach((policy) => {
        drafts[policy.category] = {
          warningAfterHours: policy.warning_after_hours,
          escalateAfterHours: policy.escalate_after_hours,
          criticalAfterHours: policy.critical_after_hours,
          inactivityAfterHours: policy.inactivity_after_hours,
          escalationPathText: (policy.escalation_path || ['teacher', 'admin']).join(', '),
          autoEscalate: policy.auto_escalate,
        };
      });

      setPolicyDrafts((prev) => ({ ...prev, ...drafts }));
    } catch (err) {
      console.error('Failed to fetch escalation policies:', err);
    }
  };

  const getPolicyDraft = (categoryName: string): EscalationDraft => {
    return (
      policyDrafts[categoryName] || {
        warningAfterHours: 24,
        escalateAfterHours: 48,
        criticalAfterHours: 72,
        inactivityAfterHours: 24,
        escalationPathText: 'teacher, admin',
        autoEscalate: true,
      }
    );
  };

  const updatePolicyDraft = (
    categoryName: string,
    updates: Partial<EscalationDraft>
  ) => {
    setPolicyDrafts((prev) => ({
      ...prev,
      [categoryName]: {
        ...getPolicyDraft(categoryName),
        ...updates,
      },
    }));
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }

    if (newCategoryName.length < 2) {
      setError('Category name must be at least 2 characters');
      return;
    }

    setAdding(true);

    try {
      const { addCategory } = await import('@/lib/supabase/db');
      await addCategory(newCategoryName.trim(), newCategoryDesc.trim() || undefined);
      setSuccess(`Category "${newCategoryName}" added successfully`);
      setNewCategoryName('');
      setNewCategoryDesc('');
      await fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        await deleteCategory(id);
        setSuccess(`Category "${name}" deleted successfully`);
        await fetchCategories();
        setTimeout(() => setSuccess(''), 3000);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to delete category');
      }
    }
  };

  const handleAssignTeacher = async (categoryName: string) => {
    setError('');
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setCategoryTeacher',
          callerEmail: userEmail,
          categoryName,
          teacherEmail: selectedTeacher || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      setSuccess(
        selectedTeacher
          ? `Assigned ${selectedTeacher} to category "${categoryName}"`
          : `Removed teacher assignment from "${categoryName}" (now routes to class advisor)`
      );
      setAssigningCategory(null);
      setSelectedTeacher('');
      await fetchCategories();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to assign teacher');
    }
  };

  const handleSaveEscalationPolicy = async (categoryName: string) => {
    if (!userEmail) return;

    const draft = getPolicyDraft(categoryName);
    const escalationPath = draft.escalationPathText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (
      !(draft.warningAfterHours > 0) ||
      !(draft.escalateAfterHours > 0) ||
      !(draft.criticalAfterHours > 0) ||
      !(draft.inactivityAfterHours > 0)
    ) {
      setError('Escalation hours must be positive numbers');
      return;
    }

    if (!(draft.warningAfterHours <= draft.escalateAfterHours && draft.escalateAfterHours <= draft.criticalAfterHours)) {
      setError('Invalid escalation flow: warning <= escalate <= critical');
      return;
    }

    setSavingPolicyCategory(categoryName);
    setError('');

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setEscalationPolicy',
          callerEmail: userEmail,
          categoryName,
          warningAfterHours: draft.warningAfterHours,
          escalateAfterHours: draft.escalateAfterHours,
          criticalAfterHours: draft.criticalAfterHours,
          inactivityAfterHours: draft.inactivityAfterHours,
          escalationPath,
          autoEscalate: draft.autoEscalate,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to save escalation policy');

      setSuccess(`Escalation policy updated for "${categoryName}"`);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save escalation policy');
    } finally {
      setSavingPolicyCategory(null);
    }
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
                <h1 className="text-[28px] font-[800] text-[#1E3A8A] tracking-[-0.6px]">Manage Categories</h1>
                <div className="hidden md:block h-6 w-[1px] bg-[#E2E8F0] mx-2"></div>
                <div className="hidden md:block text-[#94A3B8] text-[11px] font-bold uppercase tracking-[1px]">
                  System Configuration / Routing
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1240px] mx-auto px-8 py-8 space-y-8">
          {/* Alerts */}
          {error && (
            <div className="p-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[14px] flex items-start shadow-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 text-[#DC2626] mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[#991B1B] font-bold text-sm">Action Failed</p>
                <p className="text-[#B91C1C] text-[13px] font-medium">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto text-[#DC2626] hover:bg-[#FEE2E2] p-1 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {success && (
            <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-[14px] shadow-sm animate-fade-in flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#166534] animate-pulse"></div>
              <span className="text-[#15803D] text-[14px] font-semibold">{success}</span>
            </div>
          )}

          {/* Add Category */}
          <div className="bg-gradient-to-br from-white to-[#F8FAFF] border border-[#E4EAF4] rounded-[24px] shadow-[0_2px_12px_rgba(30,58,138,0.04)] p-8 animate-fade-in" style={{ animationDelay: '0.06s' }}>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                <Plus size={20} strokeWidth={2.5} />
              </div>
              <div>
                <h2 className="text-[17px] font-[800] text-[#1E3A8A]">Add New Category</h2>
                <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-[0.5px]">Define a new grievance area</p>
              </div>
            </div>
            
            <form onSubmit={handleAddCategory} className="grid grid-cols-1 md:grid-cols-2 gap-8 items-end">
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">
                  Category Name <span className="text-[#EF4444]">*</span>
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g. Infrastructure Maintenance"
                  className="w-full px-5 py-4 bg-white border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[15px] text-[#1E293B] font-medium placeholder-[#94A3B8] focus:border-[#2563EB] transition-all"
                  disabled={adding}
                />
              </div>
              <div className="space-y-3">
                <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">
                  Scope / Description
                </label>
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Briefly define what falls under this"
                    className="flex-1 px-5 py-4 bg-white border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[15px] text-[#1E293B] font-medium placeholder-[#94A3B8] focus:border-[#2563EB] transition-all"
                    disabled={adding}
                  />
                  <button
                    type="submit"
                    className="h-[58px] px-8 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white text-[15px] font-bold rounded-[12px] shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center gap-2 whitespace-nowrap"
                    disabled={adding}
                  >
                    {adding ? 'ENROLLING...' : 'ADD CATEGORY'}
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Categories List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between px-2">
              <h2 className="text-[14px] font-bold text-[#64748B] uppercase tracking-[1.5px]">
                Active Routings ({categories.length})
              </h2>
            </div>

            {loading ? (
              <div className="flex justify-center py-20">
                <div className="w-8 h-8 border-3 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : categories.length === 0 ? (
              <div className="bg-white rounded-[24px] border border-dashed border-[#DBEAFE] p-16 text-center">
                <p className="text-[#94A3B8] font-medium">No system categories defined yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {categories.map((cat, idx) => (
                  <div
                    key={cat.id}
                    className="bg-white border border-[#E4EAF4] rounded-[20px] shadow-[0_1px_4px_rgba(30,58,138,0.04)] hover:shadow-[0_4px_16px_rgba(30,58,138,0.06)] transition-all animate-fade-in group"
                    style={{ animationDelay: `${0.12 + (idx * 0.05)}s` }}
                  >
                    <div className="p-7">
                      <div className="flex items-start justify-between gap-6">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 flex-wrap">
                            <h3 className="text-[18px] font-[800] text-[#1E3A8A] tracking-[-0.3px]">{cat.name}</h3>
                            {cat.assigned_teacher_email ? (
                              <span className="inline-flex items-center gap-2 text-[10px] font-[800] px-3 py-1 bg-[#F0FDF4] text-[#166534] border border-[#DCFCE7] rounded-full uppercase tracking-[0.5px]">
                                <div className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></div>
                                Dedicated Expert
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-2 text-[10px] font-[800] px-3 py-1 bg-[#F8FAFF] text-[#64748B] border border-[#E2E8F0] rounded-full uppercase tracking-[0.5px]">
                                General Routing
                              </span>
                            )}
                          </div>
                          {cat.description && (
                            <p className="text-[14px] text-[#64748B] mt-2 font-medium leading-relaxed max-w-2xl">{cat.description}</p>
                          )}
                          
                          <div className="mt-4 flex items-center gap-3">
                            <span className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">PRIMARY OWNER:</span>
                            <span className="text-[13px] font-[700] text-[#475569] bg-[#F8FAFF] px-3 py-1 rounded-md border border-[#F1F5F9]">
                              {cat.assigned_teacher_email || "Not Assigned (Auto-Routed to Class Advisor)"}
                            </span>
                          </div>

                          {/* Teacher assignment inline form */}
                          {assigningCategory === cat.name && (
                            <div className="mt-6 flex items-center gap-3 p-4 bg-[#EFF6FF] rounded-[14px] border border-[#BFDBFE] animate-fade-in">
                              <select
                                value={selectedTeacher}
                                onChange={(e) => setSelectedTeacher(e.target.value)}
                                className="flex-1 px-4 py-3 text-[14px] font-bold border border-[#DBEAFE] rounded-[10px] bg-white text-[#1E3A8A] outline-none"
                              >
                                <option value="">— Auto (Class Advisor) —</option>
                                {teachers.map((t) => (
                                  <option key={t.email} value={t.email}>
                                    {t.full_name ? `${t.full_name} (${t.email.split('@')[0]})` : t.email}
                                  </option>
                                ))}
                              </select>
                              <button
                                onClick={() => handleAssignTeacher(cat.name)}
                                className="px-6 py-3 bg-[#2563EB] text-white rounded-[10px] text-[13px] font-bold shadow-md hover:bg-[#1D4ED8] transition-all"
                              >
                                SAVE
                              </button>
                              <button
                                onClick={() => { setAssigningCategory(null); setSelectedTeacher(''); }}
                                className="p-3 text-[#94A3B8] hover:text-[#DC2626] transition-colors"
                              >
                                <X size={20} />
                              </button>
                            </div>
                          )}

                          {/* Escalation configuration */}
                          {(() => {
                            const draft = getPolicyDraft(cat.name);
                            return (
                              <div className="mt-8 border border-[#E2E8F0] rounded-[16px] overflow-hidden bg-[#F8FAFF]">
                                <div className="px-6 py-3 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center justify-between">
                                  <p className="text-[10px] font-[800] text-[#64748B] uppercase tracking-[1px]">
                                    Escalation Lifecycle & Automation
                                  </p>
                                </div>
                                <div className="p-6">
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Warning (h)</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={draft.warningAfterHours}
                                        onChange={(e) => updatePolicyDraft(cat.name, { warningAfterHours: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 text-[14px] font-[800] border border-[#DDE5F7] rounded-lg bg-white text-[#1E3A8A] outline-none text-center"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Escalate (h)</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={draft.escalateAfterHours}
                                        onChange={(e) => updatePolicyDraft(cat.name, { escalateAfterHours: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 text-[14px] font-[800] border border-[#DDE5F7] rounded-lg bg-white text-[#1E3A8A] outline-none text-center"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Critical (h)</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={draft.criticalAfterHours}
                                        onChange={(e) => updatePolicyDraft(cat.name, { criticalAfterHours: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 text-[14px] font-[800] border border-[#DDE5F7] rounded-lg bg-white text-[#1E3A8A] outline-none text-center"
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase">Inactivity (h)</span>
                                      <input
                                        type="number"
                                        min={1}
                                        value={draft.inactivityAfterHours}
                                        onChange={(e) => updatePolicyDraft(cat.name, { inactivityAfterHours: Number(e.target.value) })}
                                        className="w-full px-4 py-2.5 text-[14px] font-[800] border border-[#DDE5F7] rounded-lg bg-white text-[#1E3A8A] outline-none text-center"
                                      />
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-4 pt-6 border-t border-[#E8EDF8]">
                                    <div className="flex-1 space-y-2">
                                      <span className="text-[10px] font-bold text-[#94A3B8] uppercase ml-1">Escalation Path (comma separated)</span>
                                      <input
                                        type="text"
                                        value={draft.escalationPathText}
                                        onChange={(e) => updatePolicyDraft(cat.name, { escalationPathText: e.target.value })}
                                        className="w-full px-5 py-3 text-[14px] font-bold border border-[#DDE5F7] rounded-xl bg-white text-[#1E3A8A] outline-none"
                                        placeholder="teacher, admin, hod, principal"
                                      />
                                    </div>
                                    <div className="flex items-center gap-3 px-4 py-3 bg-white border border-[#DDE5F7] rounded-xl mt-6">
                                      <input
                                        type="checkbox"
                                        checked={draft.autoEscalate}
                                        className="accent-[#2563EB] w-5 h-5 cursor-pointer rounded"
                                        onChange={(e) => updatePolicyDraft(cat.name, { autoEscalate: e.target.checked })}
                                      />
                                      <span className="text-[13px] font-bold text-[#475569]">AUTO-SYNC</span>
                                    </div>
                                    <button
                                      onClick={() => handleSaveEscalationPolicy(cat.name)}
                                      className="px-8 py-3 bg-[#1E3A8A] text-white text-[13px] font-[800] rounded-xl shadow-md hover:bg-[#111827] mt-6 transition-all disabled:opacity-50"
                                      disabled={savingPolicyCategory === cat.name}
                                    >
                                      {savingPolicyCategory === cat.name ? 'SAVING...' : 'SYNC POLICY'}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setAssigningCategory(cat.name);
                              setSelectedTeacher(cat.assigned_teacher_email ?? '');
                            }}
                            className="w-11 h-11 flex items-center justify-center text-[#2563EB] hover:bg-[#EFF6FF] rounded-xl transition-all border-1.5 border-transparent hover:border-[#BFDBFE]"
                            title="Assign Expert"
                          >
                            <UserCheck size={22} strokeWidth={2.5} />
                          </button>
                          <button
                            onClick={() => handleDeleteCategory(cat.id, cat.name)}
                            className="w-11 h-11 flex items-center justify-center text-[#EF4444] hover:bg-[#FEF2F2] rounded-xl transition-all border-1.5 border-transparent hover:border-[#FEE2E2]"
                            title="Delete Category"
                          >
                            <Trash2 size={22} strokeWidth={2.5} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedPage>
  );
}
