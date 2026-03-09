'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  Users,
  BarChart3,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedPage } from '@/app/components/ProtectedPage';
import {
  getGrievances,
  getAllUsers,
  getTeacherAssignments,
} from '@/lib/supabase/db';

interface CategoryStats {
  name: string;
  count: number;
}

interface TeacherStats {
  email: string;
  full_name: string;
  assignedCount: number;
  resolvedCount: number;
  pendingCount: number;
}

export default function AdminDashboardPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  
  // Categories data
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  // Teachers data
  const [teacherStats, setTeacherStats] = useState<TeacherStats[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);

  // Messages
  const [error, setError] = useState('');

  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    setUserEmail(storedEmail);

    if (!storedEmail) {
      router.push('/login');
      return;
    }

    fetchCategoryStats();
    fetchTeacherStats();
  }, [router]);

  const fetchCategoryStats = async () => {
    try {
      setLoadingCategories(true);
      const allGrievances = await getGrievances();

      // Count grievances by category
      const categoryMap = new Map<string, number>();
      allGrievances.forEach((g: any) => {
        const count = categoryMap.get(g.category) || 0;
        categoryMap.set(g.category, count + 1);
      });

      const stats: CategoryStats[] = Array.from(categoryMap.entries()).map(([name, count]) => ({
        name,
        count,
      }));

      setCategoryStats(stats.sort((a, b) => b.count - a.count));
    } catch (err) {
      setError('Failed to fetch category statistics');
      console.error(err);
    } finally {
      setLoadingCategories(false);
    }
  };

  const fetchTeacherStats = async () => {
    try {
      setLoadingTeachers(true);
      const teachers = await getAllUsers('teacher');
      
      const stats: TeacherStats[] = await Promise.all(
        teachers.map(async (teacher: any) => {
          const assignments = await getTeacherAssignments(teacher.email);
          const resolved = assignments.filter((a: any) => a.status === 'resolved').length;
          const pending = assignments.filter((a: any) => a.status !== 'resolved').length;
          
          return {
            email: teacher.email,
            full_name: teacher.full_name || teacher.email,
            assignedCount: assignments.length,
            resolvedCount: resolved,
            pendingCount: pending,
          };
        })
      );

      setTeacherStats(stats);
    } catch (err) {
      setError('Failed to fetch teacher statistics');
      console.error(err);
    } finally {
      setLoadingTeachers(false);
    }
  };

  const totalGrievances = categoryStats.reduce((sum, cat) => sum + cat.count, 0);
  const totalPending = teacherStats.reduce((sum, teacher) => sum + teacher.pendingCount, 0);
  const totalResolved = teacherStats.reduce((sum, teacher) => sum + teacher.resolvedCount, 0);

  return (
    <ProtectedPage requiredRole="admin">
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
              <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
                Admin
              </span>
            </div>
            <p className="text-gray-600 mt-2">{userEmail}</p>
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

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-600">
              <p className="text-gray-600 text-sm font-medium">Total Grievances</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{totalGrievances}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-yellow-600">
              <p className="text-gray-600 text-sm font-medium">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">{totalPending}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-600">
              <p className="text-gray-600 text-sm font-medium">Resolved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{totalResolved}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-600">
              <p className="text-gray-600 text-sm font-medium">Active Teachers</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">{teacherStats.length}</p>
            </div>
          </div>

          {/* Categories Section */}
          <div className="bg-white rounded-lg shadow p-8 mb-8">
            <div className="flex items-center mb-6">
              <BarChart3 className="w-6 h-6 text-blue-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Grievances by Category</h2>
            </div>

            {loadingCategories ? (
              <p className="text-gray-600">Loading categories...</p>
            ) : categoryStats.length === 0 ? (
              <p className="text-gray-600">No grievances yet.</p>
            ) : (
              <div className="space-y-4">
                {categoryStats.map((cat) => {
                  const percentage = totalGrievances > 0 ? (cat.count / totalGrievances) * 100 : 0;
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-700">{cat.name}</span>
                        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                          {cat.count} grievances
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Teachers Section */}
          <div className="bg-white rounded-lg shadow p-8">
            <div className="flex items-center mb-6">
              <Users className="w-6 h-6 text-purple-600 mr-3" />
              <h2 className="text-2xl font-bold text-gray-900">Professor Workload</h2>
            </div>

            {loadingTeachers ? (
              <p className="text-gray-600">Loading teachers...</p>
            ) : teacherStats.length === 0 ? (
              <p className="text-gray-600">No teachers assigned yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-gray-200">
                      <th className="text-left py-3 px-4 font-semibold text-gray-700">Professor Name</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Total Assigned</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Pending</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Resolved</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-700">Completion Rate</th>
                    </tr>
                  </thead>
                  <tbody>
                    {teacherStats.map((teacher) => {
                      const completionRate = teacher.assignedCount > 0 
                        ? Math.round((teacher.resolvedCount / teacher.assignedCount) * 100)
                        : 0;

                      return (
                        <tr key={teacher.email} className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-medium text-gray-900">{teacher.full_name}</div>
                            <div className="text-sm text-gray-500">{teacher.email}</div>
                          </td>
                          <td className="text-center py-4 px-4">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-600 font-semibold">
                              {teacher.assignedCount}
                            </span>
                          </td>
                          <td className="text-center py-4 px-4">
                            <span className={`inline-flex items-center justify-center w-10 h-10 rounded-full font-semibold ${
                              teacher.pendingCount > 0
                                ? 'bg-yellow-100 text-yellow-600'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {teacher.pendingCount}
                            </span>
                          </td>
                          <td className="text-center py-4 px-4">
                            <span className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-600 font-semibold">
                              {teacher.resolvedCount}
                            </span>
                          </td>
                          <td className="text-center py-4 px-4">
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-16 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-green-600 h-2 rounded-full transition-all"
                                  style={{ width: `${completionRate}%` }}
                                ></div>
                              </div>
                              <span className="text-sm font-semibold text-gray-700 w-8 text-right">
                                {completionRate}%
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Manage Categories Link */}
          <div className="mt-8 flex gap-4 justify-center flex-wrap">
            <Link
              href="/admin/categories"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
            >
              Manage Categories
            </Link>
            <Link
              href="/admin/sections"
              className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors"
            >
              Section Class Advisors
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
