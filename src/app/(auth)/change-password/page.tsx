'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldAlert, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ChangePasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update password');
      }

      setSuccess('Password changed successfully! Redirecting...');
      setTimeout(() => {
        router.push('/dashboard');
        router.refresh();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Warning header */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-warning/10 border border-brand-warning/20 flex items-center justify-center text-brand-warning mx-auto shadow-xl mb-4">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-bold text-white tracking-tight">Security Action Required</h2>
        <p className="text-sm text-brand-muted mt-1">Please change your temporary password to continue</p>
      </div>

      {/* Main card */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-warning to-brand-purple"></div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-brand-danger/10 border border-brand-danger/20 text-brand-danger rounded-xl p-3 flex items-start gap-2 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="bg-brand-success/10 border border-brand-success/20 text-brand-success rounded-xl p-3 flex items-start gap-2 text-sm">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>{success}</span>
            </div>
          )}

          {/* New Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password (min 6 chars)"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none transition-all focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Confirm Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none transition-all focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 text-white font-semibold text-sm rounded-xl transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Updating Password...' : 'Save and Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
