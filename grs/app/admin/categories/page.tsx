'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Trash2, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { getCategories, addCategory, deleteCategory } from '@/lib/supabase/db';

export default function AdminCategoriesPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [categories, setCategories] = useState<Array<{ id: string; name: string; description: string | null }>>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    setUserEmail(storedEmail);

    if (!storedEmail) {
      router.push('/login');
      return;
    }

    fetchCategories();
  }, [router]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      setError('Failed to fetch categories');
      console.error(err);
    } finally {
      setLoading(false);
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
      await addCategory(newCategoryName, newCategoryDesc || undefined);
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

  if (!userEmail) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft size={20} />
              Back to Dashboard
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Manage Categories
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Form to Add New Category */}
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Add New Category
          </h2>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm mb-4">
              <AlertCircle size={18} className="flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded text-green-700 dark:text-green-400 text-sm mb-4">
              <span>{success}</span>
            </div>
          )}

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
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
            Existing Categories ({categories.length})
          </h2>

          {loading ? (
            <p className="text-gray-600 dark:text-gray-400">Loading categories...</p>
          ) : categories.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400">No categories found.</p>
          ) : (
            <div className="space-y-3">
              {categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-start justify-between p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 dark:text-white">
                      {category.name}
                    </h3>
                    {category.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {category.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => handleDeleteCategory(category.id, category.name)}
                    className="ml-4 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                    title="Delete category"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
