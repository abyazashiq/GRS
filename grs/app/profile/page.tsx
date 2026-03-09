'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Lock, Save, AlertCircle, X, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { ProtectedPage } from '@/app/components/ProtectedPage';

interface UserProfile {
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
  profile_picture: string | null;
  bio: string | null;
  role: string;
  created_at: string;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Editable fields
  const [profilePicture, setProfilePicture] = useState('');
  const [bio, setBio] = useState('');
  const [phone, setPhone] = useState('');

  const router = useRouter();

  useEffect(() => {
    const email = localStorage.getItem('userEmail');
    if (!email) {
      router.push('/login');
      return;
    }
    fetchProfile(email);
  }, [router]);

  const fetchProfile = async (email: string) => {
    try {
      const res = await fetch(`/api/user?email=${encodeURIComponent(email)}`);
      const json = await res.json();
      if (!res.ok || !json.user) {
        router.push('/login');
        return;
      }
      const u: UserProfile = json.user;
      setProfile(u);
      setProfilePicture(u.profile_picture || '');
      setBio(u.bio || '');
      setPhone(u.phone || '');
    } catch (err) {
      setError('Failed to load profile');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const res = await fetch('/api/user', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          profilePicture: profilePicture.trim() || null,
          bio: bio.trim() || null,
          phone: phone.trim() || null,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        setError(json.error || 'Failed to save profile');
        return;
      }

      setProfile(json.user);
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError('Failed to save profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const yearLabel = (y: string | null) => {
    const map: Record<string, string> = { '1': '1st Year', '2': '2nd Year', '3': '3rd Year', '4': '4th Year' };
    return y ? (map[y] ?? `Year ${y}`) : '—';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500">Loading profile…</p>
        </div>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <ProtectedPage requiredRole="student">
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow">
          <div className="max-w-3xl mx-auto px-4 py-6">
            <Link
              href="/dashboard"
              className="flex items-center text-blue-600 hover:text-blue-700 mb-4 w-fit"
            >
              <ArrowLeft className="w-5 h-5 mr-2" />
              Back to Dashboard
            </Link>
            <div className="flex items-center gap-4">
              {/* Avatar */}
              <div className="w-16 h-16 rounded-full overflow-hidden bg-blue-100 flex-shrink-0 border-2 border-blue-200">
                {profile.profile_picture ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={profile.profile_picture}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-400" />
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {profile.full_name || 'My Profile'}
                </h1>
                <p className="text-gray-500 text-sm">{profile.email}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {/* Alerts */}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <p className="text-green-800 font-medium text-sm">{success}</p>
              </div>
              <button onClick={() => setSuccess('')}>
                <X className="w-4 h-4 text-green-600" />
              </button>
            </div>
          )}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-red-700 text-sm flex-1">{error}</p>
              <button onClick={() => setError('')}>
                <X className="w-4 h-4 text-red-500" />
              </button>
            </div>
          )}

          {/* Admin-set information (read-only) */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-5">
              <Lock className="w-5 h-5 text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900">Academic Information</h2>
              <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">
                Set by admin
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: 'Full Name', value: profile.full_name },
                { label: 'Email', value: profile.email },
                { label: 'Roll Number', value: profile.roll_number },
                { label: 'Department', value: profile.department },
                { label: 'Year', value: yearLabel(profile.year) },
                { label: 'Section', value: profile.section },
                { label: 'Batch', value: profile.batch },
                { label: 'Age', value: profile.age != null ? String(profile.age) : null },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    {label}
                  </p>
                  <p className="text-sm text-gray-800 font-medium bg-gray-50 px-3 py-2 rounded-lg border border-gray-100">
                    {value || <span className="text-gray-400 font-normal">Not set</span>}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Student-editable fields */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-5">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold text-gray-900">Personal Details</h2>
              <span className="ml-auto text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                Editable
              </span>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profile Picture URL
                </label>
                <input
                  type="url"
                  value={profilePicture}
                  onChange={(e) => setProfilePicture(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="https://example.com/your-photo.jpg"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Paste a direct link to an image (jpg, png, etc.)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={3}
                  maxLength={300}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm resize-none"
                  placeholder="A short description about yourself…"
                />
                <p className="text-xs text-gray-400 mt-1 text-right">{bio.length}/300</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                  placeholder="e.g. +91 99999 99999"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 transition-colors"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedPage>
  );
}
