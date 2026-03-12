'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, AlertCircle, UserCheck, X } from 'lucide-react';
import Link from 'next/link';
import { ProtectedPage } from '@/app/components/ProtectedPage';
import { getCategories, deleteCategory, getAllUsers } from '@/lib/supabase/db';

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
  }, [router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data as any);
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
      setTeachers((data || []) as any);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    }
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
