'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock,
  ShieldCheck,
  User,
  ArrowRight,
  Loader
} from 'lucide-react';

export default function TeamPerformancePage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/team-performance').then(r => r.json());
        if (res.success) {
          setData(res);
        }
      } catch (err) {
        console.error('Failed to load team performance data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader className="animate-spin text-brand-primary" size={32} />
        <p className="text-brand-muted text-sm font-mono">Aggregating team performance metrics...</p>
      </div>
    );
  }

  const { combined, mode, membersData, myStats } = data;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">👥 Team Performance</h2>
        <p className="text-sm text-brand-muted mt-1">
          {mode === 'admin' 
            ? 'Monitor individual and combined contributions for the SEO department.' 
            : 'Track collective progress and view your standing in the team.'}
        </p>
      </div>

      {/* Combined Team Stats Cards (Visible to everyone) */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider px-1">Combined Team Totals (This Month)</h3>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Links today */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Team Links Today</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-extrabold text-white font-mono">{combined.todayCount}</span>
              <span className="text-xs text-brand-muted">links built today</span>
            </div>
          </div>

          {/* Links month */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Team Links Month</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-extrabold text-brand-primary font-mono">{combined.monthCount}</span>
              <span className="text-xs text-brand-muted">links this month</span>
            </div>
          </div>

          {/* Live rate */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Team Live Rate</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-extrabold text-brand-success font-mono">{combined.liveRate}%</span>
              <span className="text-xs text-brand-muted">verification success</span>
            </div>
          </div>

          {/* Domain Authority */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Team Average DA</span>
            <div className="flex items-baseline gap-2 mt-4">
              <span className="text-3xl font-extrabold text-brand-purple font-mono">{combined.avgDa}</span>
              <span className="text-xs text-brand-muted">DA rating</span>
            </div>
          </div>
        </div>
      </div>

      {/* Role-based Data Isolation Panels */}
      {mode === 'admin' ? (
        /* Admin View: Full breakdown per member */
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight">Individual Member Breakdown</h3>
          
          <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse table-fixed min-w-[900px]">
                <thead>
                  <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted text-[10px] uppercase font-bold tracking-wider font-mono">
                    <th className="px-6 py-3.5 w-60">SEO Team Member</th>
                    <th className="px-4 py-3.5 w-40">Job Role</th>
                    <th className="px-4 py-3.5 w-32 text-center">Links Today</th>
                    <th className="px-4 py-3.5 w-36 text-center">Links This Month</th>
                    <th className="px-4 py-3.5 w-32 text-center">Live Rate</th>
                    <th className="px-4 py-3.5 w-28 text-center">Avg DA</th>
                    <th className="px-4 py-3.5 w-28 text-center">Avg Spam</th>
                  </tr>
                </thead>
                <tbody>
                  {membersData.map((m: any) => (
                    <tr key={m.id} className="border-b border-brand-border/40 hover:bg-brand-card/20 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-brand-card border border-brand-border flex items-center justify-center font-bold text-brand-primary text-xs uppercase">
                          {m.name.substring(0, 2)}
                        </div>
                        <div>
                          <span className="block text-xs">{m.name}</span>
                          <span className="text-[10px] text-brand-muted font-mono">{m.username}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-brand-text font-medium">{m.jobRole || 'SEO Intern'}</td>
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-white font-bold">{m.todayCount}</td>
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-brand-primary font-bold">{m.monthCount}</td>
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-brand-success font-bold">{m.liveRate}%</td>
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-white">{m.avgDa}</td>
                      <td className="px-4 py-3.5 text-center font-mono text-xs text-brand-danger">{m.avgSpam}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* Team Member View: Comparative "My Stats" side-by-side with Combined Team */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-success"></div>
            
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-brand-success/10 border border-brand-success/20 flex items-center justify-center text-brand-success">
                <ShieldCheck size={18} />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">My Personal Contribution</h3>
                <p className="text-[10px] text-brand-muted font-mono uppercase mt-0.5">{myStats.jobRole} | {myStats.name}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-4 font-mono text-xs text-brand-text">
              <div className="bg-brand-bg/50 border border-brand-border/40 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-brand-muted text-[10px] uppercase font-bold">My Links Today</span>
                <span className="text-2xl font-extrabold text-white mt-2">{myStats.todayCount}</span>
              </div>
              <div className="bg-brand-bg/50 border border-brand-border/40 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-brand-muted text-[10px] uppercase font-bold">My Links Month</span>
                <span className="text-2xl font-extrabold text-brand-primary mt-2">{myStats.monthCount}</span>
              </div>
              <div className="bg-brand-bg/50 border border-brand-border/40 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-brand-muted text-[10px] uppercase font-bold">My Live Rate</span>
                <span className="text-2xl font-extrabold text-brand-success mt-2">{myStats.liveRate}%</span>
              </div>
              <div className="bg-brand-bg/50 border border-brand-border/40 rounded-xl p-4 flex flex-col justify-between">
                <span className="text-brand-muted text-[10px] uppercase font-bold">My Average DA</span>
                <span className="text-2xl font-extrabold text-brand-purple mt-2">{myStats.avgDa}</span>
              </div>
            </div>
          </div>

          {/* Motivational Panel */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <h3 className="text-base font-bold text-white tracking-tight">Motivating Team Progress</h3>
              <p className="text-xs text-brand-muted leading-relaxed">
                As a team, you are building high-quality index backlinks daily. 
                Keep logging your links inside your private entry panel. 
                Our ML engine evaluates positions every day at 3:00 AM IST to ensure the quality of target keywords.
              </p>
            </div>
            
            <div className="bg-brand-bg/50 border border-brand-border/40 rounded-xl p-4 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-brand-muted block">Current Standing:</span>
                <span className="text-white font-bold block mt-1">Tied for Active Targets</span>
              </div>
              <div className="h-8 w-px bg-brand-border"></div>
              <div>
                <span className="text-brand-muted block">Next rank target:</span>
                <span className="text-brand-success font-bold block mt-1">150 Links / Month</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
