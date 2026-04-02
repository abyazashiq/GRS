'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  AlertCircle,
  Users,
  BarChart3,
  X,
  GraduationCap,
  LayoutDashboard
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedPage } from '@/app/components/ProtectedPage';
import {
  getGrievances,
  getAllUsers,
  getTeacherAssignments,
} from '@/lib/supabase/db';
import { Grievance, User, Assignment } from '@/lib/supabase/types';

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
  const [userName, setUserName] = useState<string | null>(null);
  
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
    const storedName = localStorage.getItem('userName');
    setUserName(storedName);

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
      (allGrievances as Grievance[]).forEach((g) => {
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
        (teachers as User[]).map(async (teacher) => {
          const assignments = (await getTeacherAssignments(teacher.email)) as Assignment[];
          const resolved = assignments.filter((a) => a.grievance.status === 'resolved').length;
          const pending = assignments.filter((a) => a.grievance.status !== 'resolved').length;
          
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
      <div className="min-h-screen bg-[#F0F4FA] font-sans selection:bg-[#BFDBFE] selection:text-[#1E3A8A]">
        {/* Header */}
        <div className="bg-white animate-fade-in" style={{ animationDelay: '0s' }}>
          <div className="max-w-[1240px] mx-auto px-8 pt-10 pb-[28px]">
            <Link href="/dashboard" className="inline-flex items-center text-[#2563EB] font-bold text-[13px] hover:underline mb-8 transition-all group">
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              BACK TO PORTAL
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-5">
                <h1 className="text-[28px] font-[800] text-[#1E3A8A] tracking-[-0.6px]">Admin Dashboard</h1>
                <span className="px-3 py-1 bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] text-[#1D4ED8] text-[11px] font-[700] rounded-full border border-[#BFDBFE] uppercase tracking-[0.8px]">
                  Admin
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-[#64748B] text-[14px] font-medium">{userName || 'Administrator'}</p>
                  <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-[0.5px] leading-none mt-1">Super User</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-[1240px] mx-auto px-8 py-8">
          {error && (
            <div className="mb-8 p-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[14px] flex items-start shadow-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 text-[#DC2626] mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[#991B1B] font-bold text-sm">System Alert</p>
                <p className="text-[#B91C1C] text-[13px] font-medium">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto text-[#DC2626] hover:bg-[#FEE2E2] p-1 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Stat Cards - 4 Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-10 animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="bg-white p-5 rounded-[14px] border border-[#DDE5F7] shadow-[0_1px_4px_rgba(30,58,138,0.06)] group hover:shadow-[0_4px_16px_rgba(30,58,138,0.04)] transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#64748B] text-[11px] font-[700] uppercase tracking-[0.7px]">Total Grievances</p>
                  <p className="text-[32px] font-[800] text-[#1E3A8A] mt-1 leading-none">{totalGrievances}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                  <BarChart3 className="w-4 h-4" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[14px] border border-[#DDE5F7] shadow-[0_1px_4px_rgba(30,58,138,0.06)] group hover:shadow-[0_4px_16px_rgba(30,58,138,0.04)] transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#64748B] text-[11px] font-[700] uppercase tracking-[0.7px]">Pending Action</p>
                  <p className="text-[32px] font-[800] text-[#1E3A8A] mt-1 leading-none">{totalPending}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#FEF9EE] flex items-center justify-center text-[#D97706]">
                  <AlertCircle className="w-4 h-4" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[14px] border border-[#DDE5F7] shadow-[0_1px_4px_rgba(30,58,138,0.06)] group hover:shadow-[0_4px_16px_rgba(30,58,138,0.04)] transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#64748B] text-[11px] font-[700] uppercase tracking-[0.7px]">Resolved Items</p>
                  <p className="text-[32px] font-[800] text-[#1E3A8A] mt-1 leading-none">{totalResolved}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
                  <X className="w-4 h-4 rotate-45" strokeWidth={2.5} />
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-[14px] border border-[#DDE5F7] shadow-[0_1px_4px_rgba(30,58,138,0.06)] group hover:shadow-[0_4px_16px_rgba(30,58,138,0.04)] transition-all relative overflow-hidden">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[#64748B] text-[11px] font-[700] uppercase tracking-[0.7px]">Faculty Experts</p>
                  <p className="text-[32px] font-[800] text-[#1E3A8A] mt-1 leading-none">{teacherStats.length}</p>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#F5F3FF] flex items-center justify-center text-[#7C3AED]">
                  <Users className="w-4 h-4" strokeWidth={2.5} />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Categories Section */}
            <div className="lg:col-span-5 bg-white rounded-b-[16px] border border-[#E4EAF4] border-top-[3px] border-t-[#2563EB] shadow-[0_1px_4px_rgba(30,58,138,0.06)] p-7 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                  <BarChart3 className="w-5 h-5" strokeWidth={2} />
                </div>
                <h2 className="text-[16px] font-[700] text-[#1E3A8A]">Grievances by Category</h2>
              </div>

              {loadingCategories ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="space-y-5">
                  {categoryStats.map((cat) => {
                    const percentage = totalGrievances > 0 ? (cat.count / totalGrievances) * 100 : 0;
                    return (
                      <div key={cat.name} className="group">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[14px] font-bold text-[#475569] group-hover:text-[#1E3A8A] transition-colors">{cat.name}</span>
                          <span className="text-[11px] font-bold text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded-md border border-[#DBEAFE]">
                            {cat.count} CASES
                          </span>
                        </div>
                        <div className="w-full bg-[#FAFBFF] border border-[#E8EDF8] rounded-full h-[8px] overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-[#1E3A8A] to-[#2563EB] h-full rounded-full"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Workload Section */}
            <div className="lg:col-span-7 bg-white rounded-b-[16px] border border-[#E4EAF4] border-top-[3px] border-t-[#2563EB] shadow-[0_1px_4px_rgba(30,58,138,0.06)] p-7 animate-fade-in" style={{ animationDelay: '0.25s' }}>
              <div className="flex items-center gap-4 mb-8">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                  <Users className="w-5 h-5" strokeWidth={2} />
                </div>
                <h2 className="text-[16px] font-[700] text-[#1E3A8A]">Professor Workload</h2>
              </div>

              {loadingTeachers ? (
                <div className="flex items-center justify-center py-10">
                  <div className="w-6 h-6 border-2 border-[#2563EB] border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="overflow-hidden border border-[#E8EDF8] rounded-xl bg-[#FAFBFF]">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#F3F6FD] border-b border-[#E8EDF8]">
                        <th className="py-4 px-6 text-[11px] font-[600] text-[#94A3B8] uppercase tracking-[0.8px]">Faculty Expert</th>
                        <th className="py-4 px-6 text-[11px] font-[600] text-[#94A3B8] uppercase tracking-[0.8px] text-center">Status</th>
                        <th className="py-4 px-6 text-[11px] font-[600] text-[#94A3B8] uppercase tracking-[0.8px] text-center">Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teacherStats.map((teacher) => {
                        const completionRate = teacher.assignedCount > 0 
                          ? Math.round((teacher.resolvedCount / teacher.assignedCount) * 100)
                          : 0;
                        return (
                          <tr key={teacher.email} className="border-b border-[#F0F4FA] hover:bg-[#F3F6FD] transition-all group">
                            <td className="py-4 px-6">
                              <div className="text-[14px] font-[700] text-[#1E293B] group-hover:text-[#2563EB] transition-colors">{teacher.full_name}</div>
                              <div className="text-[12px] text-[#94A3B8] font-medium">{teacher.email}</div>
                            </td>
                            <td className="py-4 px-6 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <span className="text-[13px] font-[800] text-[#1E3A8A]">{teacher.pendingCount}</span>
                                <span className="text-[11px] font-bold text-[#94A3B8] uppercase">Pending</span>
                              </div>
                            </td>
                            <td className="py-4 px-6">
                              <div className="flex items-center justify-end gap-3 min-w-[100px]">
                                <div className="flex-1 bg-[#E8EDF8] rounded-full h-[6px] hidden sm:block">
                                  <div
                                    className="bg-[#2563EB] h-full rounded-full"
                                    style={{ width: `${completionRate}%` }}
                                  ></div>
                                </div>
                                <span className="text-[13px] font-[700] text-[#1E3A8A]">{completionRate}%</span>
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
          </div>

          {/* Quick Actions Redesign */}
          <div className="mt-16 animate-fade-in" style={{ animationDelay: '0.35s' }}>
            <div className="text-center mb-8">
              <p className="text-[11px] font-[700] text-[#94A3B8] uppercase tracking-[1.5px]">Quick Actions</p>
              <div className="h-1 w-12 bg-[#DBEAFE] mx-auto mt-2 rounded-full"></div>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <Link href="/admin/categories" className="group flex items-center gap-4 bg-white border-[1.5px] border-[#DBEAFE] rounded-[16px] px-7 py-5 shadow-sm hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:shadow-[0_8px_20px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform">
                  <BarChart3 size={20} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-[700] text-[#1E3A8A]">Manage Categories</p>
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">Edit routing & tags</p>
                </div>
              </Link>

              <Link href="/admin/sections" className="group flex items-center gap-4 bg-white border-[1.5px] border-[#DBEAFE] rounded-[16px] px-7 py-5 shadow-sm hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:shadow-[0_8px_20px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform">
                  <Users size={20} strokeWidth={2.5} />
                </div>
                <div className="text-left" style={{ cursor: 'pointer' }}>
                  <p className="text-[15px] font-[700] text-[#1E3A8A]">Account Advisors</p>
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">Section assignments</p>
                </div>
              </Link>

              <Link href="/admin/students" className="group flex items-center gap-4 bg-white border-[1.5px] border-[#DBEAFE] rounded-[16px] px-7 py-5 shadow-sm hover:border-[#2563EB] hover:bg-[#EFF6FF] hover:shadow-[0_8px_20px_rgba(37,99,235,0.12)] hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB] group-hover:scale-110 transition-transform">
                  <GraduationCap size={20} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-[700] text-[#1E3A8A]">Student Directory</p>
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">Manage enrollments</p>
                </div>
              </Link>

              <Link href="/dashboard" className="group flex items-center gap-4 bg-white border-[1.5px] border-[#E2E8F0] rounded-[16px] px-7 py-5 shadow-sm hover:border-[#94A3B8] hover:bg-[#F8FAFF] hover:-translate-y-1 transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#F1F5F9] flex items-center justify-center text-[#475569] group-hover:scale-110 transition-transform">
                  <LayoutDashboard size={20} strokeWidth={2.5} />
                </div>
                <div className="text-left">
                  <p className="text-[15px] font-[700] text-[#475569]">User Portal</p>
                  <p className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">Back to dashboard</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
