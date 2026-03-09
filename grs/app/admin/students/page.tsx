'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Plus,
  Trash2,
  AlertCircle,
  X,
  GraduationCap,
  UserPlus,
  Search,
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
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-7xl mx-auto px-4 py-6">
            <Link
              href="/admin/dashboard"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4 w-fit"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Admin Dashboard
            </Link>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <GraduationCap className="w-8 h-8 text-blue-600" />
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">Student Management</h1>
                  <p className="text-gray-500 text-sm mt-1">
                    Only students registered here can log into the system
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowForm(true);
                  setError('');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                <UserPlus className="w-5 h-5" />
                Add Student
              </button>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Alerts */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
              <p className="text-green-800 font-medium text-sm">{success}</p>
              <button onClick={() => setSuccess('')}>
                <X className="w-4 h-4 text-green-600" />
              </button>
            </div>
          )}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
              <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
              <p className="text-red-700 text-sm flex-1">{error}</p>
              <button onClick={() => setError('')} className="ml-3">
                <X className="w-4 h-4 text-red-600" />
              </button>
            </div>
          )}

          {/* Add Student Form */}
          {showForm && (
            <div className="mb-6 bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  Add New Student
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    setForm(EMPTY_FORM);
                    setError('');
                  }}
                >
                  <X className="w-5 h-5 text-gray-500 hover:text-gray-700" />
                </button>
              </div>

              <form
                onSubmit={handleAdd}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
              >
                {/* Required fields */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.fullName}
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Rahul Sharma"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. student@ssn.edu.in"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    value={form.rollNumber}
                    onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 2021IT001"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. Information Technology"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <select
                    value={form.year}
                    onChange={(e) => setForm({ ...form, year: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white"
                  >
                    <option value="">Select year</option>
                    <option value="1">1st Year</option>
                    <option value="2">2nd Year</option>
                    <option value="3">3rd Year</option>
                    <option value="4">4th Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input
                    type="text"
                    value={form.section}
                    onChange={(e) => setForm({ ...form, section: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. A"
                    maxLength={2}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Batch</label>
                  <input
                    type="text"
                    value={form.batch}
                    onChange={(e) => setForm({ ...form, batch: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 2021-2025"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. 19"
                    min={15}
                    max={35}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone (optional)
                  </label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    placeholder="e.g. +91 99999 99999"
                  />
                </div>

                {/* Actions */}
                <div className="md:col-span-2 lg:col-span-3 flex gap-3 pt-2 border-t">
                  <button
                    type="submit"
                    disabled={adding}
                    className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors"
                  >
                    <UserPlus className="w-4 h-4" />
                    {adding ? 'Adding…' : 'Add Student'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setForm(EMPTY_FORM);
                      setError('');
                    }}
                    className="px-5 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Students Table */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <GraduationCap className="w-6 h-6 text-blue-600" />
                Registered Students
                <span className="ml-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded-full">
                  {students.length}
                </span>
              </h2>
              <div className="flex items-center gap-2 border rounded-lg px-3 py-2 w-72 bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500">
                <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by name, email or roll no…"
                  className="bg-transparent text-sm outline-none w-full"
                />
                {search && (
                  <button onClick={() => setSearch('')}>
                    <X className="w-3.5 h-3.5 text-gray-400 hover:text-gray-600" />
                  </button>
                )}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-gray-500">Loading students…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-500">
                {students.length === 0 ? (
                  <>
                    <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="font-medium">No students registered yet.</p>
                    <p className="text-sm mt-1">
                      Click &ldquo;Add Student&rdquo; to register the first student.
                    </p>
                  </>
                ) : (
                  <p>No students match &ldquo;{search}&rdquo;.</p>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-gray-200 text-left">
                      <th className="py-3 px-3 font-semibold text-gray-600">Name</th>
                      <th className="py-3 px-3 font-semibold text-gray-600">Email</th>
                      <th className="py-3 px-3 font-semibold text-gray-600">Roll No</th>
                      <th className="py-3 px-3 font-semibold text-gray-600">Department</th>
                      <th className="py-3 px-3 font-semibold text-gray-600">Year</th>
                      <th className="py-3 px-3 font-semibold text-gray-600">Section</th>
                      <th className="py-3 px-3 font-semibold text-gray-600">Batch</th>
                      <th className="py-3 px-3 font-semibold text-gray-600 text-center">
                        Remove
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((student) => (
                      <tr
                        key={student.id}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-3 font-medium text-gray-900">
                          {student.full_name || '—'}
                        </td>
                        <td className="py-3 px-3 text-gray-600">{student.email}</td>
                        <td className="py-3 px-3 text-gray-600">
                          {student.roll_number || '—'}
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {student.department || '—'}
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {student.year ? `Year ${student.year}` : '—'}
                        </td>
                        <td className="py-3 px-3 text-gray-600">
                          {student.section || '—'}
                        </td>
                        <td className="py-3 px-3 text-gray-600">{student.batch || '—'}</td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleRemove(student)}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={`Remove ${student.full_name || student.email}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
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
    </ProtectedPage>
  );
}
