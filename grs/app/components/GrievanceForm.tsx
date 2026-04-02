'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle } from 'lucide-react';
import { getCategories } from '@/lib/supabase/db';

interface GrievanceFormProps {
  userEmail: string | null;
  onSuccess: () => void;
  onClose: () => void;
}

export const GrievanceForm: React.FC<GrievanceFormProps> = ({
  userEmail,
  onSuccess,
  onClose,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [priority, setPriority] = useState<'Urgent' | 'High' | 'Medium' | 'Low'>('Medium');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [visibility, setVisibility] = useState<'private' | 'public'>('private');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
      if (cats.length > 0) {
        setCategory(cats[0].name);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!title.trim() || !description.trim() || !category) {
      setError('Please fill in all fields');
      return;
    }

    if (title.length < 5) {
      setError('Title must be at least 5 characters');
      return;
    }

    if (description.length < 20) {
      setError('Description must be at least 20 characters');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/grievance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
          category,
          priority,
          authorEmail: userEmail,
          isAnonymous,
          visibility,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to create grievance');

      setSuccess(true);
      setTitle('');
      setDescription('');
      setPriority('Medium');
      setIsAnonymous(false);
      setVisibility('private');

      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create grievance');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-[6px] flex items-center justify-center z-[100] p-4 animate-fade-in transition-all">
      <div className="bg-white rounded-[24px] shadow-[0_24px_48px_-12px_rgba(15,23,42,0.18)] w-full max-w-lg max-h-[90vh] overflow-y-auto border border-[#DBEAFE] animate-scale-in">
        <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-[#F1F5F9] flex items-center justify-between px-8 py-6 z-10">
          <div>
            <h2 className="text-[22px] font-bold text-[#0F172A] tracking-[-0.5px]">
              Initiate <span className="text-[#2563EB]">Grievance</span>
            </h2>
            <p className="text-[13px] text-[#64748B] font-medium mt-0.5">Please provide accurate details for resolution.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[#94A3B8] hover:text-[#0F172A] hover:bg-[#F1F5F9] rounded-full transition-all"
          >
            <X size={22} strokeWidth={2.5} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
          {error && (
            <div className="flex items-start gap-3 p-4 bg-[#FEF2F2] border border-[#FEE2E2] rounded-[12px] text-[#DC2626] text-[14px] font-bold animate-shake">
              <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="flex items-center gap-3 p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-[12px] text-[#16A34A] text-[14px] font-bold animate-fade-in">
              <CheckCircle size={18} className="flex-shrink-0" />
              <span>Grievance dispatched successfully!</span>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#475569] px-1 uppercase tracking-[0.5px]">
              Subject Narrative
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Technical issue in Laboratory 4..."
              className="w-full px-4 py-3.5 bg-[#F8FAFF] border border-[#DBEAFE] rounded-[14px] text-[#0F172A] text-[15px] font-medium placeholder-[#94A3B8] focus:outline-none focus:ring-[4px] focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all"
              disabled={loading || success}
            />
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#475569] px-1 uppercase tracking-[0.5px]">
              Classification Group
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-3.5 bg-[#F8FAFF] border border-[#DBEAFE] rounded-[14px] text-[#0F172A] text-[15px] font-medium focus:outline-none focus:ring-[4px] focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all appearance-none cursor-pointer"
              disabled={loading || success}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#475569] px-1 uppercase tracking-[0.5px]">
              Priority Level
            </label>
            <div className="grid grid-cols-4 gap-2">
              {(['Urgent', 'High', 'Medium', 'Low'] as const).map((p) => {
                const colors = {
                  Urgent: { active: 'bg-[#FEF2F2] border-[#DC2626] text-[#DC2626]', dot: 'bg-[#DC2626]' },
                  High:   { active: 'bg-[#FFFBEB] border-[#D97706] text-[#D97706]', dot: 'bg-[#D97706]' },
                  Medium: { active: 'bg-[#EFF6FF] border-[#2563EB] text-[#2563EB]', dot: 'bg-[#2563EB]' },
                  Low:    { active: 'bg-[#F1F5F9] border-[#64748B] text-[#64748B]', dot: 'bg-[#94A3B8]' },
                };
                const isActive = priority === p;
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => !loading && !success && setPriority(p)}
                    className={`flex flex-col items-center gap-1.5 py-2.5 rounded-[12px] border-2 text-[12px] font-bold transition-all ${
                      isActive
                        ? colors[p].active
                        : 'bg-white border-[#E2E8F0] text-[#94A3B8] hover:border-[#CBD5E1]'
                    }`}
                    disabled={loading || success}
                  >
                    <span className={`w-2 h-2 rounded-full ${isActive ? colors[p].dot : 'bg-[#CBD5E1]'}`} />
                    {p}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[13px] font-bold text-[#475569] px-1 uppercase tracking-[0.5px]">
              Detailed Circumstance
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context, evidence, or specific instances..."
              rows={5}
              className="w-full px-4 py-3.5 bg-[#F8FAFF] border border-[#DBEAFE] rounded-[14px] text-[#0F172A] text-[15px] font-medium placeholder-[#94A3B8] focus:outline-none focus:ring-[4px] focus:ring-[#2563EB]/10 focus:border-[#2563EB] transition-all resize-none"
              disabled={loading || success}
            />
          </div>

          <div className="p-4 bg-[#F8FAFF] border border-[#DBEAFE] rounded-[16px] space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="anonymous"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  className="w-5 h-5 text-[#2563EB] border-[#DBEAFE] rounded-[6px] focus:ring-[#2563EB]/20 transition-all cursor-pointer"
                  disabled={loading || success}
                />
                <label
                  htmlFor="anonymous"
                  className="text-[14px] font-bold text-[#1E3A8A] cursor-pointer"
                >
                  Conceal Identity
                </label>
              </div>
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-[0.5px]">Highly Secure</span>
            </div>

            <div className="pt-4 border-t border-[#EFF6FF] space-y-3">
              <label className="text-[12px] font-bold text-[#64748B] uppercase tracking-[0.5px] block mb-2">
                Visibility Scope
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className={`p-3 rounded-[12px] border-2 cursor-pointer transition-all flex flex-col gap-1 ${
                    visibility === 'private' 
                      ? 'bg-[#EFF6FF] border-[#2563EB] shadow-sm' 
                      : 'bg-white border-[#F1F5F9] hover:border-[#BFDBFE]'
                  }`}
                  onClick={() => !loading && !success && setVisibility('private')}
                >
                  <span className={`text-[13px] font-bold ${visibility === 'private' ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>Restricted</span>
                  <span className="text-[11px] text-[#94A3B8]">Only Admin/Self</span>
                </div>

                <div 
                  className={`p-3 rounded-[12px] border-2 cursor-pointer transition-all flex flex-col gap-1 ${
                    visibility === 'public' 
                      ? 'bg-[#EFF6FF] border-[#2563EB] shadow-sm' 
                      : 'bg-white border-[#F1F5F9] hover:border-[#BFDBFE]'
                  }`}
                  onClick={() => !loading && !success && setVisibility('public')}
                >
                  <span className={`text-[13px] font-bold ${visibility === 'public' ? 'text-[#2563EB]' : 'text-[#64748B]'}`}>Public Feed</span>
                  <span className="text-[11px] text-[#94A3B8]">Visible to Portal</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 bg-white border border-[#E2E8F0] text-[#64748B] rounded-[16px] font-bold text-[15px] hover:bg-[#F8FAFF] hover:text-[#0F172A] transition-all disabled:opacity-50"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-[2] px-6 py-4 bg-gradient-to-br from-[#1E3A8A] to-[#2563EB] text-white rounded-[16px] font-bold text-[15px] shadow-[0_4px_12px_rgba(37,99,235,0.2)] hover:shadow-[0_8px_18px_rgba(37,99,235,0.3)] hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || success}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Dispatching...
                </span>
              ) : 'Submit Grievance'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
