'use client';

import React, { useState, useEffect } from 'react';
import { X, AlertCircle, CheckCircle, User, Zap, Clock } from 'lucide-react';
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
      if (cats.length > 0) setCategory(cats[0].name);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !category) { setError('Required fields missing'); return; }
    setLoading(true);

    try {
      const res = await fetch('/api/grievance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, category, priority, authorEmail: userEmail, isAnonymous, visibility }),
      });
      if (!res.ok) throw new Error('Dispatch failed');
      setSuccess(true);
      setTimeout(() => { onSuccess(); onClose(); }, 1800);
    } catch (err) {
      setError('System transmission error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-[var(--color-navy)]/40 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-blur-in-elite">
      <div className="bg-white rounded-[48px] shadow-premium-xl w-full max-w-xl max-h-[85vh] overflow-y-auto border border-white/20 animate-reveal-elastic relative">
        <div className="sticky top-0 bg-white/80 backdrop-blur-2xl border-b border-[var(--color-blue-soft)] flex items-center justify-between px-10 py-8 z-10">
          <div>
            <div className="flex items-center gap-2 text-[var(--color-blue-primary)] font-black text-[10px] uppercase tracking-[3px] mb-2 font-accent">
              <span className="w-8 h-[2px] bg-[var(--color-blue-primary)] rounded-full" />
              Direct Transmission
            </div>
            <h2 className="text-3xl font-black text-[var(--color-navy)] tracking-tighter">
              New <span className="text-[var(--color-blue-primary)]">Grievance</span>
            </h2>
          </div>
          <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-[var(--color-bg-subtle)] text-[var(--color-navy)] hover:bg-[var(--color-blue-primary)] hover:text-white rounded-2xl transition-all spring-lift">
            <X size={22} strokeWidth={3} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-10 space-y-10">
          {error && (
            <div className="flex items-start gap-4 p-5 bg-red-50 border border-red-100 rounded-2xl text-[var(--color-danger)] text-sm font-black animate-reveal-elastic">
              <AlertCircle size={20} className="flex-shrink-0" />
              <span className="uppercase tracking-tight">{error}</span>
            </div>
          )}

          {success && (
            <div className="flex flex-col items-center justify-center py-12 animate-reveal-elastic text-center">
              <div className="w-24 h-24 bg-blue-50 text-[var(--color-blue-primary)] rounded-full flex items-center justify-center mb-6 animate-float">
                <CheckCircle size={48} strokeWidth={3} className="animate-reveal-elastic" />
              </div>
              <h3 className="text-2xl font-black text-[var(--color-navy)] mb-2">Filing Established</h3>
              <p className="text-[var(--color-text-dim)] font-bold text-sm uppercase tracking-widest">Integrating with institutional loop...</p>
            </div>
          )}

          {!success && (
            <>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-[var(--color-blue-deep)] px-1 uppercase tracking-[3px] block font-accent opacity-60">
                  Subject Header
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Campus Infrastructure Resolution"
                  className="w-full px-6 py-5 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-[24px] text-[var(--color-navy)] text-base font-black placeholder-[var(--color-text-muted)] outline-none focus:ring-8 focus:ring-[var(--color-blue-primary)]/5 transition-all focus:border-[var(--color-blue-primary)] shadow-inner"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[var(--color-blue-deep)] px-1 uppercase tracking-[3px] block font-accent opacity-60">
                    Category Logic
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-6 py-5 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-[24px] text-[var(--color-navy)] text-sm font-black uppercase tracking-wider outline-none focus:ring-8 focus:ring-[var(--color-blue-primary)]/5 transition-all cursor-pointer"
                  >
                    {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                  </select>
                </div>

                <div className="space-y-4">
                  <label className="text-[10px] font-black text-[var(--color-blue-deep)] px-1 uppercase tracking-[3px] block font-accent opacity-60">
                    Severity Indicator
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as any)}
                    className="w-full px-6 py-5 bg-[var(--color-blue-soft)] border border-[var(--color-blue-soft)] rounded-[24px] text-[var(--color-blue-primary)] text-sm font-black uppercase tracking-wider outline-none focus:ring-8 focus:ring-[var(--color-blue-primary)]/10 transition-all cursor-pointer"
                  >
                    {['Low', 'Medium', 'High', 'Urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-[var(--color-blue-deep)] px-1 uppercase tracking-[3px] block font-accent opacity-60">
                  Full Circumstance
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Provide high-fidelity context for resolution personnel..."
                  rows={4}
                  className="w-full px-6 py-5 bg-[var(--color-bg-subtle)] border border-[var(--color-border)] rounded-[32px] text-[var(--color-navy)] text-base font-bold placeholder-[var(--color-text-muted)] outline-none focus:ring-8 focus:ring-[var(--color-blue-primary)]/5 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-8 bg-[var(--color-frost)] rounded-[36px] border border-[var(--color-border)]">
                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setIsAnonymous(!isAnonymous)}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${isAnonymous ? 'bg-[var(--color-blue-primary)] border-[var(--color-blue-primary)] text-white' : 'bg-white border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
                    <User size={20} className={isAnonymous ? 'animate-float' : ''} />
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-navy)]">Anonymity</p>
                    <p className="text-[9px] font-bold text-[var(--color-text-dim)] uppercase tracking-tighter">{isAnonymous ? 'Secure Cloak Active' : 'Verified Profile'}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setVisibility(visibility === 'public' ? 'private' : 'public')}>
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border-2 transition-all ${visibility === 'public' ? 'bg-[var(--color-blue-primary)] border-[var(--color-blue-primary)] text-white shadow-glow-blue' : 'bg-white border-[var(--color-border)] text-[var(--color-text-muted)]'}`}>
                    {visibility === 'public' ? <Zap size={20} /> : <Clock size={20} />}
                  </div>
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-navy)]">Visibility</p>
                    <p className="text-[9px] font-bold text-[var(--color-text-dim)] uppercase tracking-tighter">{visibility === 'public' ? 'Public Narrative' : 'Private Resolution'}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-6">
                <button type="button" onClick={onClose} className="flex-1 py-5 bg-white border-2 border-[var(--color-border)] text-[var(--color-text-dim)] rounded-[24px] font-black text-sm uppercase tracking-[3px] hover:bg-[var(--color-bg-subtle)] transition-all spring-lift">
                  Discard
                </button>
                <button type="submit" disabled={loading} className="flex-[2] py-5 bg-[var(--color-blue-primary)] text-white rounded-[24px] font-black text-sm uppercase tracking-[3px] shadow-premium-xl spring-lift action-shimmer leading-none">
                  {loading ? 'Establishing Feed...' : 'Dispatch Filing'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  );
};
