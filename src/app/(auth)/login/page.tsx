'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Brain, KeyRound, User, Lock, AlertCircle, Settings } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Setup Admin Modal States
  const [showSetup, setShowSetup] = useState(false);
  const [setupName, setSetupName] = useState('');
  const [setupUser, setSetupUser] = useState('');
  const [setupPass, setSetupPass] = useState('');
  const [setupKey, setSetupKey] = useState('');
  const [setupError, setSetupError] = useState('');
  const [setupSuccess, setSetupSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      if (data.mustChangePassword) {
        router.push('/change-password');
      } else {
        router.push('/dashboard');
      }
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError('');
    setSetupSuccess('');

    try {
      const res = await fetch('/api/auth/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: setupName,
          username: setupUser,
          password: setupPass,
          setupKey,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Setup failed');
      }

      setSetupSuccess('Admin account created! You can now log in.');
      setTimeout(() => {
        setShowSetup(false);
        setUsername(setupUser);
      }, 2000);
    } catch (err: any) {
      setSetupError(err.message);
    }
  };

  return (
    <div className="w-full max-w-md">
      {/* Brand Logo & Title */}
      <div className="text-center mb-8">
        <div className="w-14 h-14 rounded-2xl bg-brand-primary flex items-center justify-center text-white mx-auto shadow-xl shadow-brand-primary/25 mb-4 animate-pulse">
          <Brain size={32} />
        </div>
        <h2 className="text-2xl font-bold text-white tracking-tight">SEO Intelligence System</h2>
        <p className="text-sm text-brand-muted mt-1">TechLeads IT Command Center</p>
      </div>

      {/* Main Login Card */}
      <div className="bg-brand-surface border border-brand-border rounded-2xl p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-primary via-brand-purple to-brand-primary"></div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-brand-danger/10 border border-brand-danger/20 text-brand-danger rounded-xl p-3 flex items-start gap-2 text-sm">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Username Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Username</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
                <User size={16} />
              </span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. lakshmi"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none transition-all placeholder:text-brand-muted/50 focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
                <Lock size={16} />
              </span>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-3 pl-10 pr-4 text-white text-sm outline-none transition-all placeholder:text-brand-muted/50 focus:ring-2 focus:ring-brand-primary/10"
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-brand-primary hover:bg-brand-primary/95 text-white font-semibold text-sm rounded-xl transition-all shadow-lg shadow-brand-primary/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>

        {/* Database setup trigger */}
        <div className="mt-6 pt-6 border-t border-brand-border text-center">
          <button
            onClick={() => {
              setSetupError('');
              setSetupSuccess('');
              setShowSetup(true);
            }}
            className="inline-flex items-center gap-2 text-xs font-medium text-brand-muted hover:text-white transition-colors"
          >
            <Settings size={12} />
            <span>Database Setup (First Admin)</span>
          </button>
        </div>
      </div>

      {/* Initialize First Admin Modal */}
      {showSetup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-brand-surface border border-brand-border rounded-2xl w-full max-w-md p-8 shadow-2xl relative">
            <h3 className="text-lg font-bold text-white mb-2">Initialize First Admin</h3>
            <p className="text-xs text-brand-muted mb-6">
              Create the initial database administrator account. This can only be executed once.
            </p>

            <form onSubmit={handleSetupAdmin} className="space-y-4">
              {setupError && (
                <div className="bg-brand-danger/10 border border-brand-danger/20 text-brand-danger rounded-xl p-3 flex items-start gap-2 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{setupError}</span>
                </div>
              )}
              {setupSuccess && (
                <div className="bg-brand-success/10 border border-brand-success/20 text-brand-success rounded-xl p-3 text-xs">
                  {setupSuccess}
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={setupName}
                  onChange={(e) => setSetupName(e.target.value)}
                  placeholder="SEO Manager"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-white text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Username</label>
                <input
                  type="text"
                  required
                  value={setupUser}
                  onChange={(e) => setSetupUser(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-white text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Password</label>
                <input
                  type="password"
                  required
                  value={setupPass}
                  onChange={(e) => setSetupPass(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-white text-xs outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Admin Setup Key (From .env)</label>
                <input
                  type="password"
                  required
                  value={setupKey}
                  onChange={(e) => setSetupKey(e.target.value)}
                  placeholder="e.g. admin12345"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-white text-xs outline-none font-mono"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowSetup(false)}
                  className="flex-1 py-2 border border-brand-border hover:bg-brand-card text-brand-text rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-semibold transition-colors"
                >
                  Create Admin
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
