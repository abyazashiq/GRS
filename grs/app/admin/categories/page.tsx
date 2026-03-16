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
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Header */}
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
              Manage Categories
            </h1>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Alerts */}
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

          {/* Add Category */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Add New Category</h2>
            <form onSubmit={handleAddCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="e.g., Academic"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={adding}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description (Optional)
                </label>
                <input
                  type="text"
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  placeholder="e.g., Academic-related grievances"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={adding}
                />
              </div>
              <button
                type="submit"
                className="w-full px-4 py-2 bg-white text-[#13017f] rounded-lg font-medium hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={adding}
              >
                <Plus size={20} />
                {adding ? 'Adding...' : 'Add Category'}
              </button>
            </form>
          </div>

          {/* Categories List */}
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Categories ({categories.length})
            </h2>

            {loading ? (
              <p className="text-gray-600 dark:text-gray-400">Loading...</p>
            ) : categories.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400">No categories found.</p>
            ) : (
              <div className="space-y-3">
                {categories.map((cat) => (
                  <div
                    key={cat.id}
                    className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 dark:text-white">{cat.name}</h3>
                        {cat.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{cat.description}</p>
                        )}
                        {/* Routing badge */}
                        <div className="mt-2">
                          {cat.assigned_teacher_email ? (
                            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
                              <UserCheck size={12} />
                              Routes to: {cat.assigned_teacher_email}
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300 rounded-full">
                              General — routes to student&apos;s class advisor
                            </span>
                          )}
                        </div>

                        {/* Teacher assignment inline form */}
                        {assigningCategory === cat.name && (
                          <div className="mt-3 flex items-center gap-2 flex-wrap">
                            <select
                              value={selectedTeacher}
                              onChange={(e) => setSelectedTeacher(e.target.value)}
                              className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="">— General (class advisor) —</option>
                              {teachers.map((t) => (
                                <option key={t.email} value={t.email}>
                                  {t.full_name ? `${t.full_name} (${t.email})` : t.email}
                                </option>
                              ))}
                            </select>
                            <button
                              onClick={() => handleAssignTeacher(cat.name)}
                              className="px-3 py-1.5 text-sm bg-white text-[#13017f] rounded-lg hover:shadow-lg transition"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => { setAssigningCategory(null); setSelectedTeacher(''); }}
                              className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        )}

                        {/* Escalation configuration */}
                        {(() => {
                          const draft = getPolicyDraft(cat.name);
                          return (
                            <div className="mt-4 border border-gray-200 dark:border-gray-700 rounded-lg p-3 bg-white/70 dark:bg-gray-900/40">
                              <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                                Escalation TTL and Path
                              </p>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                <input
                                  type="number"
                                  min={1}
                                  value={draft.warningAfterHours}
                                  onChange={(e) => updatePolicyDraft(cat.name, { warningAfterHours: Number(e.target.value) })}
                                  className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  placeholder="Warning (h)"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  value={draft.escalateAfterHours}
                                  onChange={(e) => updatePolicyDraft(cat.name, { escalateAfterHours: Number(e.target.value) })}
                                  className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  placeholder="Escalate (h)"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  value={draft.criticalAfterHours}
                                  onChange={(e) => updatePolicyDraft(cat.name, { criticalAfterHours: Number(e.target.value) })}
                                  className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  placeholder="Critical (h)"
                                />
                                <input
                                  type="number"
                                  min={1}
                                  value={draft.inactivityAfterHours}
                                  onChange={(e) => updatePolicyDraft(cat.name, { inactivityAfterHours: Number(e.target.value) })}
                                  className="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  placeholder="Inactivity (h)"
                                />
                              </div>

                              <div className="mt-2 flex items-center gap-2 flex-wrap">
                                <input
                                  type="text"
                                  value={draft.escalationPathText}
                                  onChange={(e) => updatePolicyDraft(cat.name, { escalationPathText: e.target.value })}
                                  className="flex-1 min-w-0 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                                  placeholder="Escalation path (e.g. teacher, hod, admin)"
                                />
                                <label className="text-xs text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                  <input
                                    type="checkbox"
                                    checked={draft.autoEscalate}
                                    onChange={(e) => updatePolicyDraft(cat.name, { autoEscalate: e.target.checked })}
                                  />
                                  Auto
                                </label>
                                <button
                                  onClick={() => handleSaveEscalationPolicy(cat.name)}
                                  className="px-3 py-1.5 text-xs bg-white text-[#13017f] rounded-lg hover:shadow-lg transition disabled:opacity-50"
                                  disabled={savingPolicyCategory === cat.name}
                                >
                                  {savingPolicyCategory === cat.name ? 'Saving...' : 'Save Escalation'}
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => {
                            setAssigningCategory(cat.name);
                            setSelectedTeacher(cat.assigned_teacher_email ?? '');
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                          title="Assign teacher"
                        >
                          <UserCheck size={18} />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(cat.id, cat.name)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Delete category"
                        >
                          <Trash2 size={18} />
                        </button>
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
