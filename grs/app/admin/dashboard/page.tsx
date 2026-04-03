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
  LayoutDashboard,
  CheckCircle
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
  const [categoryStats, setCategoryStats] = useState<CategoryStats[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [teacherStats, setTeacherStats] = useState<TeacherStats[]>([]);
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [error, setError] = useState('');
  const [currentTime, setCurrentTime] = useState<string>('');
  
  const router = useRouter();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    const storedName = localStorage.getItem('userName');
    setUserName(storedName);
    if (!storedEmail) { router.push('/login'); return; }
    fetchCategoryStats();
    fetchTeacherStats();
  }, [router]);

  const fetchCategoryStats = async () => {
    try {
      setLoadingCategories(true);
      const allGrievances = await getGrievances();
      const categoryMap = new Map<string, number>();
      (allGrievances as Grievance[]).forEach((g) => {
        const count = categoryMap.get(g.category) || 0;
        categoryMap.set(g.category, count + 1);
      });
      const stats = Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));
      setCategoryStats(stats.sort((a, b) => b.count - a.count));
    } catch (err) { setError('Feeder Sync Failed'); } finally { setLoadingCategories(false); }
  };

  const fetchTeacherStats = async () => {
    try {
      setLoadingTeachers(true);
      const teachers = await getAllUsers('teacher');
      const stats = await Promise.all((teachers as User[]).map(async (teacher) => {
        const assignments = (await getTeacherAssignments(teacher.email)) as Assignment[];
        const resolved = assignments.filter((a) => a.grievance.status === 'resolved').length;
        const pending = assignments.filter((a) => a.grievance.status !== 'resolved').length;
        return { email: teacher.email, full_name: teacher.full_name || teacher.email, assignedCount: assignments.length, resolvedCount: resolved, pendingCount: pending };
      }));
      setTeacherStats(stats);
    } catch (err) { setError('Expert Matrix Failed'); } finally { setLoadingTeachers(false); }
  };

  const totalGrievances = categoryStats.reduce((sum, cat) => sum + cat.count, 0);
  const totalPending = teacherStats.reduce((sum, teacher) => sum + teacher.pendingCount, 0);
  const totalResolved = teacherStats.reduce((sum, teacher) => sum + teacher.resolvedCount, 0);

  return (
    <ProtectedPage requiredRole="admin">
      <div className="min-h-screen bg-[var(--color-bg-base)] pb-32">
        {/* Elite Header */}
        <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-[var(--color-blue-soft)] animate-blur-in-elite">
          <div className="max-w-[1400px] mx-auto px-10 py-6 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link href="/dashboard" className="w-12 h-12 flex items-center justify-center bg-[var(--color-bg-subtle)] text-[var(--color-blue-primary)] rounded-[18px] hover:bg-[var(--color-blue-primary)] hover:text-white transition-all spring-lift">
                <ArrowLeft size={20} strokeWidth={3} />
              </Link>
              <h1 className="text-2xl font-black text-[var(--color-navy)] flex items-center gap-3">
                Command <span className="text-[var(--color-blue-primary)]">Center</span>
              </h1>
            </div>
            <div className="flex items-center gap-6">
               <div className="text-right">
                  <p className="text-[10px] font-black uppercase tracking-[3px] text-[var(--color-blue-primary)] mb-1">Administrative Level</p>
                  <p className="text-xs font-bold text-[var(--color-text-dim)]">{currentTime}</p>
               </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1400px] mx-auto px-10 pt-40">
          {/* Animated Greeting */}
          <div className="mb-16 animate-reveal-elastic">
            <h2 className="text-4xl font-black text-[var(--color-navy)] tracking-tighter mb-4 leading-none">
              Oversight <br />
              <span className="text-[var(--color-blue-primary)]">Loop Active</span>
            </h2>
            <p className="text-[var(--color-text-muted)] font-black uppercase tracking-[4px] text-[11px] opacity-70">Secured Node: {userName}</p>
          </div>

          {error && (
             <div className="mb-10 p-6 bg-red-50 border border-red-100 rounded-[24px] flex items-center gap-4 text-[var(--color-danger)] font-black animate-reveal-elastic">
                <AlertCircle size={24} />
                <span className="uppercase tracking-widest text-xs">{error}</span>
             </div>
          )}

          {/* Elite Bento Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
            {[
              { label: 'Total Narratives', count: totalGrievances, icon: BarChart3, glow: 'shadow-glow-blue' },
              { label: 'Unresolved Nodes', count: totalPending, icon: AlertCircle, glow: '' },
              { label: 'Final Resolutions', count: totalResolved, icon: CheckCircle, glow: '' },
              { label: 'Faculty Mentors', count: teacherStats.length, icon: Users, glow: '' }
            ].map((stat, idx) => (
              <div key={idx} className={`bg-white border border-[var(--color-border)] rounded-[32px] p-8 shadow-premium-sm spring-lift group relative overflow-hidden animate-reveal-elastic`} style={{ animationDelay: `${idx * 0.1}s` }}>
                <div className="flex justify-between items-start mb-10 relative z-10">
                   <div className="w-12 h-12 rounded-2xl bg-[var(--color-blue-soft)] text-[var(--color-blue-primary)] flex items-center justify-center group-hover:scale-110 transition-transform">
                      <stat.icon size={22} strokeWidth={2.5} />
                   </div>
                   {stat.glow && <div className="absolute -top-12 -right-12 w-24 h-24 bg-[var(--color-blue-primary)]/10 blur-3xl rounded-full" />}
                </div>
                <div className="relative z-10">
                   <p className="text-[10px] font-black text-[var(--color-text-muted)] uppercase tracking-[3px] mb-2">{stat.label}</p>
                   <p className="text-5xl font-black text-[var(--color-navy)] leading-none tracking-tighter">{stat.count}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
             {/* Category Performance Hub */}
             <div className="lg:col-span-5 bg-white rounded-[40px] border border-[var(--color-border)] p-10 shadow-premium-md animate-reveal-elastic" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center justify-between mb-12">
                   <h3 className="text-xl font-black text-[var(--color-navy)] flex items-center gap-3">
                      <div className="w-2 h-8 bg-[var(--color-blue-primary)] rounded-full" />
                      Scope Analysis
                   </h3>
                </div>
                
                {loadingCategories ? (
                   <div className="h-64 flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-[var(--color-blue-soft)] border-t-[var(--color-blue-primary)] rounded-full animate-spin" />
                   </div>
                ) : (
                   <div className="space-y-8">
                      {categoryStats.map((cat, i) => {
                         const percentage = totalGrievances > 0 ? (cat.count / totalGrievances) * 100 : 0;
                         return (
                            <div key={cat.name} className="group animate-blur-in-elite" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                               <div className="flex justify-between items-end mb-3">
                                  <span className="text-sm font-black text-[var(--color-navy)] uppercase tracking-wide">{cat.name}</span>
                                  <span className="text-[10px] font-black text-[var(--color-blue-primary)] bg-[var(--color-blue-soft)] px-3 py-1 rounded-full">{cat.count} FILES</span>
                               </div>
                               <div className="h-2 w-full bg-[var(--color-bg-subtle)] rounded-full overflow-hidden">
                                  <div className="h-full bg-[var(--color-blue-primary)] rounded-full transition-all duration-1000 origin-left" style={{ width: `${percentage}%` }} />
                               </div>
                            </div>
                         );
                      })}
                   </div>
                )}
             </div>

             {/* Expert Workload Matrix */}
             <div className="lg:col-span-7 bg-white rounded-[40px] border border-[var(--color-border)] p-10 shadow-premium-md animate-reveal-elastic" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center justify-between mb-12">
                   <h3 className="text-xl font-black text-[var(--color-navy)] flex items-center gap-3">
                      <div className="w-2 h-8 bg-[var(--color-blue-sky)] rounded-full" />
                      Expert Workload
                   </h3>
                </div>

                {loadingTeachers ? (
                   <div className="h-64 flex items-center justify-center">
                      <div className="w-10 h-10 border-4 border-slate-100 border-t-[var(--color-blue-primary)] rounded-full animate-spin" />
                   </div>
                ) : (
                   <div className="overflow-hidden rounded-[24px] border border-[var(--color-border)]">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="bg-[var(--color-bg-subtle)] border-b border-[var(--color-border)]">
                            <th className="py-5 px-8 text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[2px]">Faculty Expert</th>
                            <th className="py-5 px-8 text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[2px] text-center">Load</th>
                            <th className="py-5 px-8 text-[9px] font-black text-[var(--color-text-muted)] uppercase tracking-[2px] text-right">Velocity</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--color-bg-subtle)]">
                          {teacherStats.map((teacher, i) => {
                            const rate = teacher.assignedCount > 0 ? Math.round((teacher.resolvedCount / teacher.assignedCount) * 100) : 0;
                            return (
                              <tr key={teacher.email} className="group hover:bg-[var(--color-blue-soft)]/30 transition-all animate-blur-in-elite" style={{ animationDelay: `${0.6 + i * 0.05}s` }}>
                                <td className="py-5 px-8">
                                  <p className="text-sm font-black text-[var(--color-navy)] group-hover:text-[var(--color-blue-primary)] transition-colors">{teacher.full_name}</p>
                                  <p className="text-[10px] text-[var(--color-text-dim)] font-bold">{teacher.email}</p>
                                </td>
                                <td className="py-5 px-8 text-center font-black text-[var(--color-blue-deep)] text-xs">{teacher.pendingCount} <span className="opacity-40 text-[9px] uppercase tracking-tighter">Active Cases</span></td>
                                <td className="py-5 px-8 text-right font-black text-[var(--color-blue-primary)]">{rate}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                   </div>
                )}
             </div>
          </div>
        </main>

        {/* Admin Floating Command Dock */}
        <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] px-10 py-5 glass-blue rounded-[36px] shadow-premium-xl animate-reveal-elastic border-[var(--color-blue-soft)] border-2">
          <div className="flex items-center gap-12">
            {[
              { label: 'Portal', href: '/dashboard', icon: LayoutDashboard },
              { label: 'Tags', href: '/admin/categories', icon: BarChart3 },
              { label: 'Advisors', href: '/teacher/dashboard', icon: Users },
              { label: 'Students', href: '/admin/dashboard', icon: GraduationCap }
            ].map((item, idx) => (
              <Link key={idx} href={item.href} className="flex flex-col items-center gap-2 group spring-lift">
                <div className="w-14 h-14 bg-white/80 rounded-[24px] flex items-center justify-center text-[var(--color-blue-primary)] shadow-premium-sm group-hover:bg-[var(--color-blue-primary)] group-hover:text-white transition-all group-hover:rotate-6">
                  <item.icon size={22} strokeWidth={3} />
                </div>
                <span className="text-[9px] font-black text-[var(--color-blue-deep)] uppercase tracking-[2px] opacity-60 group-hover:opacity-100 transition-opacity">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </ProtectedPage>
  );
}
