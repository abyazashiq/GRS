'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Trash2,
  AlertCircle,
  X,
  GraduationCap,
  UserPlus,
  Search,
  Pencil,
} from 'lucide-react';
import Link from 'next/link';
import { ProtectedPage } from '@/app/components/ProtectedPage';
import { getAllUsers } from '@/lib/supabase/db';

interface Student {
  id: string;
  email: string;
  full_name: string | null;
  roll_number: string | null;
  age: number | null;
  year: string | null;
  section: string | null;
  batch: string | null;
  department: string | null;
  phone: string | null;
  created_at: string;
}

const EMPTY_FORM = {
  email: '',
  fullName: '',
  rollNumber: '',
  age: '',
  year: '',
  section: '',
  batch: '',
  department: '',
  phone: '',
};

const EMPTY_EDIT_FORM = {
  fullName: '',
  rollNumber: '',
  age: '',
  year: '',
  section: '',
  batch: '',
  department: '',
};

export default function AdminStudentsPage() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [search, setSearch] = useState('');
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_EDIT_FORM);
  const [saving, setSaving] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const storedEmail = localStorage.getItem('userEmail');
    setUserEmail(storedEmail);
    if (!storedEmail) {
      router.push('/login');
      return;
    }
    fetchStudents();
  }, [router]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const data = await getAllUsers('student');
      setStudents((data || []) as Student[]);
    } catch (err) {
      setError('Failed to fetch students');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.email.trim() || !form.fullName.trim()) {
      setError('Email and full name are required');
      return;
    }

    setAdding(true);
    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'addStudent',
          callerEmail: userEmail,
          email: form.email.trim().toLowerCase(),
          fullName: form.fullName.trim(),
          rollNumber: form.rollNumber.trim() || null,
          age: form.age || null,
          year: form.year || null,
          section: form.section.trim() || null,
          batch: form.batch.trim() || null,
          department: form.department.trim() || null,
          phone: form.phone.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to add student');
        return;
      }

      setSuccess(`Student "${form.fullName}" added successfully. They can now log in.`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      await fetchStudents();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError('Failed to add student');
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  const openEdit = (student: Student) => {
    setEditingStudent(student);
    setEditForm({
      fullName: student.full_name || '',
      rollNumber: student.roll_number || '',
      age: student.age != null ? String(student.age) : '',
      year: student.year || '',
      section: student.section || '',
      batch: student.batch || '',
      department: student.department || '',
    });
    setError('');
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'updateStudentAdminFields',
          callerEmail: userEmail,
          studentEmail: editingStudent.email,
          fullName: editForm.fullName.trim() || null,
          rollNumber: editForm.rollNumber.trim() || null,
          age: editForm.age || null,
          year: editForm.year || null,
          section: editForm.section.trim() || null,
          batch: editForm.batch.trim() || null,
          department: editForm.department.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to update student');
        return;
      }

      setSuccess(`"${editForm.fullName || editingStudent.email}" updated successfully.`);
      setEditingStudent(null);
      setEditForm(EMPTY_EDIT_FORM);
      await fetchStudents();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to update student');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemove = async (student: Student) => {
    if (
      !confirm(
        `Remove "${student.full_name || student.email}" from the system?\n\nThey will immediately lose access and will no longer be able to log in.`
      )
    )
      return;

    try {
      const res = await fetch('/api/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'removeStudent',
          callerEmail: userEmail,
          studentEmail: student.email,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to remove student');
        return;
      }

      setSuccess(`${student.full_name || student.email} has been removed.`);
      await fetchStudents();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove student');
      console.error(err);
    }
  };

  const filtered = students.filter(
    (s) =>
      !search ||
      s.email.toLowerCase().includes(search.toLowerCase()) ||
      (s.full_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (s.roll_number || '').toLowerCase().includes(search.toLowerCase())
  );

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
                <h1 className="text-[28px] font-[800] text-[#1E3A8A] tracking-[-0.6px]">Student Registry</h1>
                <div className="hidden md:block h-6 w-[1px] bg-[#E2E8F0] mx-2"></div>
                <div className="hidden md:block text-[#94A3B8] text-[11px] font-bold uppercase tracking-[1px]">
                  User Database / Access Control
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForm(true);
                  setError('');
                }}
                className="h-[52px] px-8 bg-[#2563EB] text-white text-[14px] font-[800] rounded-[12px] shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-3"
              >
                <UserPlus size={18} strokeWidth={3} />
                ENROLL STUDENT
              </button>
            </div>
          </div>
        </header>

        <div className="max-w-[1240px] mx-auto px-8 py-8">
          {/* Alerts */}
          {success && (
            <div className="mb-8 p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-[14px] shadow-sm animate-fade-in flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#166534] animate-pulse"></div>
              <span className="text-[#15803D] text-[14px] font-semibold">{success}</span>
              <button onClick={() => setSuccess('')} className="ml-auto opacity-50 hover:opacity-100 transition-opacity">
                <X className="w-5 h-5 text-[#166534]" />
              </button>
            </div>
          )}
          {error && (
            <div className="mb-8 p-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[14px] flex items-start shadow-sm animate-fade-in">
              <AlertCircle className="w-5 h-5 text-[#DC2626] mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-[#991B1B] font-bold text-sm">Action Blocked</p>
                <p className="text-[#B91C1C] text-[13px] font-medium">{error}</p>
              </div>
              <button onClick={() => setError('')} className="ml-auto text-[#DC2626] hover:bg-[#FEE2E2] p-1 rounded-md transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Add Student Form */}
          {showForm && (
            <div className="mb-10 bg-gradient-to-br from-white to-[#F8FAFF] border border-[#E4EAF4] rounded-[24px] shadow-[0_4px_24px_rgba(30,58,138,0.06)] p-8 animate-fade-in">
              <div className="flex justify-between items-center mb-8 pb-4 border-b border-[#F1F5F9]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                    <UserPlus size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-[17px] font-[800] text-[#1E3A8A]">New Student Enrollment</h2>
                    <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-[0.5px]">Add a verified identity to the system</p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setForm(EMPTY_FORM);
                    setError('');
                  }}
                  className="w-11 h-11 flex items-center justify-center text-[#94A3B8] hover:bg-[#F1F5F9] rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <form
                onSubmit={handleAdd}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              >
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">
                    Full Name <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-5 py-4 bg-white border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[15px] text-[#1E293B] font-bold placeholder-[#94A3B8] focus:border-[#2563EB] transition-all"
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">
                    Email Address <span className="text-[#EF4444]">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-5 py-4 bg-white border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[15px] text-[#1E293B] font-bold placeholder-[#94A3B8] focus:border-[#2563EB] transition-all"
                    placeholder="e.g. s1234567@ssn.edu.in"
                    required
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={form.rollNumber}
                    onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                    className="w-full px-5 py-4 bg-white border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[15px] text-[#1E293B] font-bold placeholder-[#94A3B8] focus:border-[#2563EB] transition-all"
                    placeholder="e.g. 2021IT001"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-5 py-4 bg-white border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[15px] text-[#1E293B] font-bold placeholder-[#94A3B8] focus:border-[#2563EB] transition-all"
                    placeholder="e.g. Information Technology"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">Academic Year</label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full h-[58px] px-5 bg-white border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[15px] text-[#1E293B] font-[700] outline-none focus:border-[#2563EB] transition-all"
                  >
                    <option value="">Select year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">Section</label>
                  <input
                    type="text"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full px-5 py-4 bg-white border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[15px] text-[#1E293B] font-bold placeholder-[#94A3B8] focus:border-[#2563EB] transition-all"
                    placeholder="e.g. B"
                    maxLength={2}
                  />
                </div>

                {/* Actions */}
                <div className="md:col-span-2 lg:col-span-3 flex gap-4 pt-6 border-t border-[#F1F5F9] mt-2">
                  <button
                    type="submit"
                    disabled={adding}
                    className="h-[52px] px-8 bg-[#2563EB] text-white text-[14px] font-[800] rounded-[12px] shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all flex items-center gap-3 disabled:opacity-50"
                  >
                    <UserPlus size={18} strokeWidth={3} />
                    {adding ? 'ENROLLING...' : 'CONFIRM ENROLLMENT'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setForm(EMPTY_FORM);
                      setError('');
                    }}
                    className="h-[52px] px-8 bg-white border-[1.5px] border-[#DDE5F7] text-[#64748B] text-[14px] font-[800] rounded-[12px] hover:bg-[#F8FAFF] transition-all"
                  >
                    CANCEL
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Students Table */}
          <div className="bg-white rounded-[24px] border border-[#E2E8F0] shadow-[0_1px_4px_rgba(30,58,138,0.04)] overflow-hidden animate-fade-in" style={{ animationDelay: '0.12s' }}>
            <div className="p-8 border-b border-[#F1F5F9] flex items-center justify-between flex-wrap gap-6">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                  <GraduationCap size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[17px] font-[800] text-[#1E3A8A]">Student Directory</h2>
                  <p className="text-[#94A3B8] text-[11px] font-bold uppercase tracking-[0.5px]">{students.length} Total Records</p>
                </div>
              </div>
              
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8] transition-colors group-focus-within:text-[#2563EB]" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Filter by name, email or roll..."
                  className="w-full md:w-[360px] h-[48px] pl-11 pr-11 bg-[#F8FAFF] border-[1.5px] border-[#DDE5F7] rounded-[12px] text-[14px] text-[#1E3A8A] font-bold outline-none focus:border-[#2563EB] focus:bg-white transition-all shadow-sm"
                />
                {search && (
                  <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#DC2626] transition-colors">
                    <X size={16} strokeWidth={2.5} />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-24">
                <div className="w-8 h-8 border-[3px] border-[#2563EB] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-[#94A3B8] font-bold text-[13px] uppercase tracking-[1px]">Accessing Database...</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 px-8">
                <div className="w-16 h-16 rounded-2xl bg-[#F8FAFF] flex items-center justify-center text-[#CBD5E1] mx-auto mb-6 border border-[#E2E8F0]">
                  <GraduationCap size={32} />
                </div>
                <p className="text-[#1E3A8A] font-[800] text-[18px]">No matches found</p>
                <p className="text-[#94A3B8] text-[14px] mt-2 font-medium max-w-sm mx-auto">
                  We couldn&apos;t find any students matching your current search criteria.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-[#FAFBFF] border-b border-[#E8EDF8]">
                      <th className="py-5 px-8 text-[11px] font-[700] text-[#94A3B8] uppercase tracking-[1.2px]">Identity & Account</th>
                      <th className="py-5 px-8 text-[11px] font-[700] text-[#94A3B8] uppercase tracking-[1.2px]">Academic Profile</th>
                      <th className="py-5 px-8 text-[11px] font-[700] text-[#94A3B8] uppercase tracking-[1.2px]">Cohort</th>
                      <th className="py-5 px-8 text-[11px] font-[700] text-[#94A3B8] uppercase tracking-[1.2px] text-center">Controls</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-[#F0F4FA] hover:bg-[#F8FAFF] transition-all group"
                      >
                        <td className="py-6 px-8">
                          <div className="text-[15px] font-[800] text-[#1E293B] group-hover:text-[#2563EB] transition-colors">{student.full_name || 'Legacy Profile'}</div>
                          <div className="text-[12px] text-[#94A3B8] font-bold mt-0.5">{student.email}</div>
                        </td>
                        <td className="py-6 px-8">
                          <div className="text-[13px] font-[800] text-[#1D4ED8] bg-[#EFF6FF] px-2.5 py-1 rounded-[8px] border border-[#BFDBFE] inline-flex items-center gap-2">
                             {student.roll_number || 'PENDING'}
                          </div>
                          <div className="text-[12px] text-[#64748B] font-bold mt-2 uppercase tracking-[0.4px] line-clamp-1">{student.department || 'Not Categorized'}</div>
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex flex-wrap gap-2">
                            {student.year ? (
                              <span className="text-[10px] font-[800] px-3 py-1 bg-[#F8FAFF] text-[#1E3A8A] border border-[#DDE5F7] rounded-full uppercase tracking-[0.5px]">YR {student.year}</span>
                            ) : (
                               <span className="text-[10px] font-[800] px-3 py-1 bg-[#F1F5F9] text-[#94A3B8] border border-[#E2E8F0] rounded-full uppercase tracking-[0.5px]">YR —</span>
                            )}
                            {student.section && (
                              <span className="text-[10px] font-[800] px-3 py-1 bg-[#F8FAFF] text-[#1E3A8A] border border-[#DDE5F7] rounded-full uppercase tracking-[0.5px]">SEC {student.section}</span>
                            )}
                          </div>
                        </td>
                        <td className="py-6 px-8">
                          <div className="flex items-center justify-center gap-3">
                            <button
                              onClick={() => openEdit(student)}
                              className="w-10 h-10 flex items-center justify-center text-[#2563EB] bg-white border border-[#DBEAFE] hover:bg-[#EFF6FF] rounded-xl shadow-sm transition-all"
                              title="Edit Profile"
                            >
                              <Pencil size={18} strokeWidth={2.5} />
                            </button>
                            <button
                              onClick={() => handleRemove(student)}
                              className="w-10 h-10 flex items-center justify-center text-[#EF4444] bg-white border border-[#FEE2E2] hover:bg-[#FEF2F2] rounded-xl shadow-sm transition-all"
                              title="Revoke Access"
                            >
                              <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F172A]/30 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-[28px] shadow-[0_24px_80px_rgba(15,23,42,0.25)] w-full max-w-[640px] overflow-hidden border border-[#E8EDF8]">
            <div className="flex items-center justify-between px-10 py-10 border-b border-[#F1F5F9] bg-gradient-to-br from-white to-[#F8FAFF]">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
                  <Pencil size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h2 className="text-[22px] font-[800] text-[#1E3A8A] tracking-[-0.5px]">Update Profile</h2>
                  <div className="mt-1 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse"></div>
                    <span className="text-[13px] font-[700] text-[#64748B]">{editingStudent.email}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { setEditingStudent(null); setEditForm(EMPTY_EDIT_FORM); setError(''); }}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-white border border-[#DDE5F7] text-[#94A3B8] hover:text-[#DC2626] transition-all shadow-sm"
              >
                <X size={22} strokeWidth={2.5} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="px-10 py-10 space-y-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">Full Name</label>
                  <input
                    type="text"
                    value={editForm.fullName}
                    onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                    className="w-full px-5 py-4 bg-[#F8FAFF] border-[1.5px] border-[#DDE5F7] rounded-[14px] text-[15px] text-[#1E3A8A] font-bold outline-none focus:border-[#2563EB] transition-all"
                    placeholder="e.g. Rahul Sharma"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">Roll Number</label>
                  <input
                    type="text"
                    value={editForm.rollNumber}
                    onChange={(e) => setEditForm({ ...editForm, rollNumber: e.target.value })}
                    className="w-full px-5 py-4 bg-[#F8FAFF] border-[1.5px] border-[#DDE5F7] rounded-[14px] text-[15px] text-[#1E3A8A] font-bold outline-none focus:border-[#2563EB] transition-all"
                    placeholder="e.g. 2021IT001"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">Department</label>
                  <input
                    type="text"
                    value={editForm.department}
                    onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    className="w-full px-5 py-4 bg-[#F8FAFF] border-[1.5px] border-[#DDE5F7] rounded-[14px] text-[15px] text-[#1E3A8A] font-bold outline-none focus:border-[#2563EB] transition-all"
                    placeholder="e.g. IT"
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">Academic Year</label>
                  <select
                    value={editForm.year}
                    onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                    className="w-full h-[58px] px-5 bg-[#F8FAFF] border-[1.5px] border-[#DDE5F7] rounded-[14px] text-[15px] text-[#1E3A8A] font-[700] outline-none focus:border-[#2563EB] transition-all"
                  >
                    <option value="">Select year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">Section</label>
                  <input
                    type="text"
                    value={editForm.section}
                    onChange={(e) => setEditForm({ ...editForm, section: e.target.value })}
                    className="w-full px-5 py-4 bg-[#F8FAFF] border-[1.5px] border-[#DDE5F7] rounded-[14px] text-[15px] text-[#1E3A8A] font-bold outline-none focus:border-[#2563EB] transition-all"
                    placeholder="e.g. A"
                    maxLength={2}
                  />
                </div>
                <div className="space-y-3">
                  <label className="block text-[11px] font-bold text-[#64748B] uppercase tracking-[0.8px] ml-1">Batch Period</label>
                  <input
                    type="text"
                    value={editForm.batch}
                    onChange={(e) => setEditForm({ ...editForm, batch: e.target.value })}
                    className="w-full px-5 py-4 bg-[#F8FAFF] border-[1.5px] border-[#DDE5F7] rounded-[14px] text-[15px] text-[#1E3A8A] font-bold outline-none focus:border-[#2563EB] transition-all"
                    placeholder="e.g. 2021-2025"
                  />
                </div>
              </div>

              {error && (
                <div className="p-5 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[16px] flex items-start gap-4">
                  <AlertCircle className="w-5 h-5 text-[#DC2626] mt-0.5 flex-shrink-0" />
                  <p className="text-[#991B1B] text-[14px] font-[700]">{error}</p>
                </div>
              )}

              <div className="flex gap-4 pt-8 border-t border-[#F1F5F9]">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 h-[56px] bg-[#2563EB] text-white text-[15px] font-[800] rounded-[16px] shadow-[0_4px_16px_rgba(37,99,235,0.3)] hover:shadow-[0_8px_24px_rgba(37,99,235,0.4)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50"
                >
                  {saving ? 'SYNCING CHANGES...' : 'SAVE PROFILE CHANGES'}
                </button>
                <button
                  type="button"
                  onClick={() => { setEditingStudent(null); setEditForm(EMPTY_EDIT_FORM); setError(''); }}
                  className="px-10 h-[56px] bg-white border-[1.5px] border-[#DDE5F7] text-[#64748B] text-[15px] font-[800] rounded-[16px] hover:bg-[#F8FAFF] transition-all"
                >
                  CANCEL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </ProtectedPage>
  );
}
