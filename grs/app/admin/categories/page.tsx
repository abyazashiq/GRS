'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, AlertCircle, UserCheck, X, Edit2, Check } from 'lucide-react';
import Link from 'next/link';
import { ProtectedPage } from '@/app/components/ProtectedPage';
import { getCategories, deleteCategory, getAllUsers, getEscalationPolicies } from '@/lib/supabase/db';

interface EscalationStageDraft {
  name: string;
  email: string;
  duration_hours: number;
}

interface EscalationDraft {
  warningAfterHours: number;
  escalateAfterHours: number;
  criticalAfterHours: number;
  inactivityAfterHours: number;
  escalationPathText: string;
  stages: EscalationStageDraft[];
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
  const [newCategoryStages, setNewCategoryStages] = useState<EscalationStageDraft[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [policyDrafts, setPolicyDrafts] = useState<Record<string, EscalationDraft>>({});

  // Teacher assignment state
  const [assigningCategory, setAssigningCategory] = useState<string | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState('');

  // Category Edit State
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDesc, setEditCategoryDesc] = useState('');
  const [editCategoryStages, setEditCategoryStages] = useState<EscalationStageDraft[]>([]);

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
          stages: policy.stages || [],
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
        stages: [],
        autoEscalate: true,
      }
    );
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
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addCategory',
          callerEmail: userEmail,
          name: newCategoryName.trim(),
          description: newCategoryDesc.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add category');

      // Now immediately set the initial escalation policy if there are stages (or to populate defaults)
      const policyRes = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setEscalationPolicy',
          callerEmail: userEmail,
          categoryName: newCategoryName.trim(),
          warningAfterHours: 24,
          escalateAfterHours: 48,
          criticalAfterHours: 72,
          inactivityAfterHours: 24,
          escalationPath: ['teacher', 'admin'],
          stages: newCategoryStages,
          autoEscalate: true,
        }),
      });
      const policyJson = await policyRes.json();
      if (!policyRes.ok) console.error('Failed to immediately set policy on category create:', policyJson);

      setSuccess(`Category "${newCategoryName}" created successfully!`);
      setNewCategoryName('');
      setNewCategoryDesc('');
      setNewCategoryStages([]);
      await fetchCategories();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add category');
    } finally {
      setAdding(false);
    }
  };

  const handleUpdateCategory = async (id: string, oldName: string) => {
    setError('');
    setSuccess('');
    if (!editCategoryName.trim()) {
      setError('Category name is required');
      return;
    }
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateCategory',
          callerEmail: userEmail,
          id,
          newName: editCategoryName.trim(),
          description: editCategoryDesc.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to update category');

      await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'setEscalationPolicy',
          callerEmail: userEmail,
          categoryName: editCategoryName.trim(),
          warningAfterHours: 24,
          escalateAfterHours: 48,
          criticalAfterHours: 72,
          inactivityAfterHours: 24,
          escalationPath: ['teacher', 'admin'],
          stages: editCategoryStages,
          autoEscalate: true,
        }),
      });

      setSuccess(`Category updated successfully`);
      setEditingCategoryId(null);
      await fetchCategories();
      await fetchEscalationPolicyDrafts();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete "${name}"?`)) {
      try {
        const res = await fetch('/api/admin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'deleteCategory',
            callerEmail: userEmail,
            id,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || 'Failed to delete category');

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
            
            <form onSubmit={handleAddCategory} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                  <input
                    type="text"
                    value={newCategoryDesc}
                    onChange={(e) => setNewCategoryDesc(e.target.value)}
                    placeholder="Briefly define what falls under this"
                    className="w-full px-5 py-4 bg-white border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[15px] text-[#1E293B] font-medium placeholder-[#94A3B8] focus:border-[#2563EB] transition-all"
                    disabled={adding}
                  />
                </div>
              </div>

              {/* Add category stages */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[12px] font-[800] text-[#1E3A8A] uppercase tracking-[0.5px]">Dynamic Escalation Track (Optional)</p>
                  <button 
                    type="button"
                    onClick={() => setNewCategoryStages([...newCategoryStages, { name: '', email: '', duration_hours: 24 }])}
                    className="text-[11px] font-bold flex items-center gap-1 text-[#2563EB] bg-[#EFF6FF] px-3 py-1.5 rounded-lg hover:bg-[#DBEAFE] transition-all"
                    disabled={adding}
                  >
                    <Plus size={14} /> ADD STAGE
                  </button>
                </div>
                <div className="space-y-3">
                  {newCategoryStages.map((stage, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-3 p-3 bg-white border border-[#DDE5F7] rounded-xl relative group">
                      <div className="w-6 h-6 flex items-center justify-center bg-[#F1F5F9] text-[#64748B] font-bold text-[10px] rounded-md shrink-0">
                        {sIdx + 1}
                      </div>
                      <input
                        type="text"
                        value={stage.name}
                        onChange={(e) => {
                          const newStages = [...newCategoryStages];
                          newStages[sIdx].name = e.target.value;
                          setNewCategoryStages(newStages);
                        }}
                        className="flex-1 px-3 py-2 text-[13px] font-semibold border border-[#E2E8F0] rounded-lg focus:border-[#2563EB] outline-none bg-transparent"
                        placeholder="Assignee Name (e.g. Prof 1, HOD)"
                        disabled={adding}
                      />
                      <input
                        type="email"
                        value={stage.email}
                        onChange={(e) => {
                          const newStages = [...newCategoryStages];
                          newStages[sIdx].email = e.target.value;
                          setNewCategoryStages(newStages);
                        }}
                        className="flex-1 px-3 py-2 text-[13px] font-medium border border-[#E2E8F0] rounded-lg focus:border-[#2563EB] outline-none bg-transparent"
                        placeholder="Assignee Email"
                        disabled={adding}
                      />
                      <div className="w-24">
                        <input
                          type="number"
                          min={1}
                          value={stage.duration_hours}
                          onChange={(e) => {
                            const newStages = [...newCategoryStages];
                            newStages[sIdx].duration_hours = Number(e.target.value);
                            setNewCategoryStages(newStages);
                          }}
                          className="w-full px-3 py-2 text-[13px] font-bold border border-[#E2E8F0] rounded-lg focus:border-[#2563EB] outline-none text-center bg-transparent"
                          placeholder="Hours"
                          disabled={adding}
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={() => {
                          const newStages = [...newCategoryStages];
                          newStages.splice(sIdx, 1);
                          setNewCategoryStages(newStages);
                        }}
                        className="text-[#94A3B8] hover:text-[#EF4444] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Remove Stage"
                        disabled={adding}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                  {newCategoryStages.length === 0 && (
                    <p className="text-[12px] text-[#94A3B8] font-medium py-4 bg-white/50 border border-dashed border-[#CBD5E1] rounded-xl text-center">
                      No initial escalation stages specified. You can configure them later.
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-[#E4EAF4]">
                <button
                  type="submit"
                  className="h-[52px] px-8 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white text-[14px] font-bold rounded-[12px] shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 flex items-center gap-2"
                  disabled={adding}
                >
                  {adding ? 'SAVING...' : 'CREATE CATEGORY'}
                </button>
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
                          {editingCategoryId === cat.id ? (
                            <div className="mb-4 space-y-4">
                              <div className="space-y-3">
                                <input
                                  type="text"
                                  value={editCategoryName}
                                  onChange={(e) => setEditCategoryName(e.target.value)}
                                  className="w-full px-4 py-2 text-[16px] font-[800] text-[#1E3A8A] border border-[#DDE5F7] rounded-lg focus:border-[#2563EB] outline-none"
                                  placeholder="Category Name"
                                />
                                <input
                                  type="text"
                                  value={editCategoryDesc}
                                  onChange={(e) => setEditCategoryDesc(e.target.value)}
                                  className="w-full px-4 py-2 text-[14px] text-[#475569] border border-[#DDE5F7] rounded-lg focus:border-[#2563EB] outline-none"
                                  placeholder="Scope / Description"
                                />
                              </div>
                              
                              <div className="pt-2">
                                <div className="flex items-center justify-between mb-3">
                                  <p className="text-[11px] font-[800] text-[#1E3A8A] uppercase tracking-[0.5px]">Dynamic Escalation Track</p>
                                  <button 
                                    type="button"
                                    onClick={() => setEditCategoryStages([...editCategoryStages, { name: '', email: '', duration_hours: 24 }])}
                                    className="text-[10px] font-bold flex items-center gap-1 text-[#2563EB] bg-[#EFF6FF] px-2 py-1 rounded-lg hover:bg-[#DBEAFE] transition-all"
                                  >
                                    <Plus size={12} /> ADD STAGE
                                  </button>
                                </div>
                                <div className="space-y-2">
                                  {editCategoryStages.map((stage, sIdx) => (
                                    <div key={sIdx} className="flex items-center gap-2 p-2 bg-white border border-[#DDE5F7] rounded-lg relative group">
                                      <div className="w-5 h-5 flex items-center justify-center bg-[#F1F5F9] text-[#64748B] font-bold text-[9px] rounded-sm shrink-0">
                                        {sIdx + 1}
                                      </div>
                                      <input
                                        type="text"
                                        value={stage.name}
                                        onChange={(e) => {
                                          const newStages = [...editCategoryStages];
                                          newStages[sIdx].name = e.target.value;
                                          setEditCategoryStages(newStages);
                                        }}
                                        className="flex-1 px-2 py-1 text-[12px] font-semibold border border-[#E2E8F0] rounded-md focus:border-[#2563EB] outline-none bg-transparent"
                                        placeholder="Assignee Name"
                                      />
                                      <input
                                        type="email"
                                        value={stage.email}
                                        onChange={(e) => {
                                          const newStages = [...editCategoryStages];
                                          newStages[sIdx].email = e.target.value;
                                          setEditCategoryStages(newStages);
                                        }}
                                        className="flex-1 px-2 py-1 text-[12px] font-medium border border-[#E2E8F0] rounded-md focus:border-[#2563EB] outline-none bg-transparent"
                                        placeholder="Assignee Email"
                                      />
                                      <div className="w-16">
                                        <input
                                          type="number"
                                          min={1}
                                          value={stage.duration_hours}
                                          onChange={(e) => {
                                            const newStages = [...editCategoryStages];
                                            newStages[sIdx].duration_hours = Number(e.target.value);
                                            setEditCategoryStages(newStages);
                                          }}
                                          className="w-full px-2 py-1 text-[12px] font-bold border border-[#E2E8F0] rounded-md focus:border-[#2563EB] outline-none text-center bg-transparent"
                                          placeholder="Hours"
                                        />
                                      </div>
                                      <button 
                                        type="button"
                                        onClick={() => {
                                          const newStages = [...editCategoryStages];
                                          newStages.splice(sIdx, 1);
                                          setEditCategoryStages(newStages);
                                        }}
                                        className="text-[#94A3B8] hover:text-[#EF4444] p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                  ))}
                                  {editCategoryStages.length === 0 && (
                                    <p className="text-[11px] text-[#94A3B8] font-medium py-2 bg-white/50 border border-dashed border-[#CBD5E1] rounded-lg text-center">
                                      No escalation stages. Default fallback active.
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex gap-2 pt-2">
                                <button onClick={() => handleUpdateCategory(cat.id, cat.name)} className="flex items-center gap-1 px-4 py-2 bg-[#16A34A] text-white text-[12px] font-bold rounded-lg hover:bg-[#15803D]">
                                  <Check size={14} /> SAVE
                                </button>
                                <button onClick={() => setEditingCategoryId(null)} className="flex items-center gap-1 px-4 py-2 bg-[#F1F5F9] text-[#64748B] text-[12px] font-bold rounded-lg hover:bg-[#E2E8F0]">
                                  <X size={14} /> CANCEL
                                </button>
                              </div>
                            </div>
                          ) : (
                            <>
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
                            </>
                          )}
                          
                          {/* Display the Assignee Info */}
                          <div className="mt-4 flex flex-wrap items-center gap-3">
                            <span className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">PRIMARY OWNER:</span>
                            <span className="text-[13px] font-[700] text-[#475569] bg-[#F8FAFF] px-3 py-1 rounded-md border border-[#F1F5F9]">
                              {cat.assigned_teacher_email || "Not Assigned (Auto-Routed to Class Advisor)"}
                            </span>
                          </div>

                          {/* Display Read-Only Stages */}
                          {editingCategoryId !== cat.id && (
                            <div className="mt-5">
                              <span className="text-[12px] font-bold text-[#94A3B8] uppercase tracking-[0.5px] mb-2 block">Ticket Escalation Track:</span>
                              <div className="flex flex-col gap-2">
                                {getPolicyDraft(cat.name).stages.length > 0 ? (
                                  getPolicyDraft(cat.name).stages.map((stage, idx) => (
                                    <div key={idx} className="flex items-center gap-2 text-[13px] text-[#475569] bg-[#F1F5F9] px-3 py-2 rounded-lg border border-[#E2E8F0] w-max">
                                      <span className="font-[800] text-[#1E3A8A]">Stage {idx + 1}:</span>
                                      <span className="font-semibold">{stage.name}</span>
                                      <span className="text-[#94A3B8]">({stage.email})</span>
                                      <span className="ml-2 font-bold text-[#EF4444]">— escalates after {stage.duration_hours}h</span>
                                    </div>
                                  ))
                                ) : (
                                  <span className="text-[13px] text-[#94A3B8] italic">Using fallback escalation settings</span>
                                )}
                              </div>
                            </div>
                          )}

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
                        </div>

                        <div className="flex flex-col items-center gap-2 shrink-0">
                          <button
                            onClick={() => {
                              setEditingCategoryId(cat.id);
                              setEditCategoryName(cat.name);
                              setEditCategoryDesc(cat.description || '');
                              const currentPolicy = getPolicyDraft(cat.name);
                              setEditCategoryStages(currentPolicy.stages || []);
                            }}
                            className="w-11 h-11 flex items-center justify-center text-[#10B981] hover:bg-[#D1FAE5] rounded-xl transition-all border-1.5 border-transparent hover:border-[#A7F3D0]"
                            title="Edit Category"
                          >
                            <Edit2 size={22} strokeWidth={2.5} />
                          </button>
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
