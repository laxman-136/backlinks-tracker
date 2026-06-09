'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  Award,
  Calendar,
  Loader
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const COLORS = ['#4F6EF7', '#A855F7', '#22C55E', '#F59E0B', '#EF4444', '#64748B'];

export default function PerformancePage() {
  const [selectedMonth, setSelectedMonth] = useState(MONTHS[new Date().getMonth()]);
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const res = await fetch(`/api/performance?month=${selectedMonth}&year=${selectedYear}`)
          .then(r => r.json());
        if (res.success) {
          setStats(res.stats);
        }
      } catch (err) {
        console.error('Failed to load performance stats:', err);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [selectedMonth, selectedYear]);

  if (loading && !stats) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader className="animate-spin text-brand-primary" size={32} />
        <p className="text-brand-muted text-sm font-mono">Calculating metrics...</p>
      </div>
    );
  }

  const completionPct = stats ? Math.round((stats.totalBuilt / stats.targetCount) * 100) : 0;
  const liveRate = stats && stats.totalBuilt > 0 ? Math.round((stats.liveLinks / stats.totalBuilt) * 100) : 0;

  // Format link types for Recharts
  const typeData = stats ? Object.entries(stats.typeDistribution).map(([type, count]) => ({
    name: type,
    count
  })).sort((a: any, b: any) => b.count - a.count) : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">My Performance Analytics</h2>
          <p className="text-sm text-brand-muted mt-1">Review your backlink metrics, targets, and building history.</p>
        </div>

        {/* Date Filters */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
              <Calendar size={14} />
            </span>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="bg-brand-surface border border-brand-border rounded-xl py-2 pl-9 pr-6 text-xs text-white outline-none focus:border-brand-primary"
            >
              {MONTHS.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-brand-surface border border-brand-border rounded-xl py-2 px-4 text-xs text-white outline-none focus:border-brand-primary"
          >
            <option value="2026">2026</option>
            <option value="2025">2025</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader className="animate-spin text-brand-primary" size={24} />
        </div>
      ) : (
        <>
          {/* Metrics summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Completion card */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold text-brand-muted uppercase tracking-wider block">Monthly Targets</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                  completionPct >= 100 
                    ? 'bg-brand-success/20 text-brand-success' 
                    : completionPct >= 75 
                    ? 'bg-brand-primary/20 text-brand-primary'
                    : 'bg-brand-warning/20 text-brand-warning'
                }`}>
                  {completionPct}% Complete
                </span>
              </div>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-extrabold text-white font-mono">{stats.totalBuilt}</span>
                <span className="text-xs text-brand-muted">/ {stats.targetCount} links</span>
              </div>
              {/* Progress bar */}
              <div className="w-full bg-brand-bg h-1.5 rounded-full overflow-hidden mt-4">
                <div 
                  className={`h-full rounded-full transition-all ${
                    completionPct >= 100 ? 'bg-brand-success' : 'bg-brand-primary'
                  }`}
                  style={{ width: `${Math.min(100, completionPct)}%` }}
                ></div>
              </div>
            </div>

            {/* Live Rate Card */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider block">Live Verification</span>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-extrabold text-brand-success font-mono">{liveRate}%</span>
                <span className="text-xs text-brand-muted">{stats.liveLinks} Live / {stats.totalBuilt} built</span>
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-[10px] text-brand-muted">
                <CheckCircle size={12} className="text-brand-success" />
                <span>Pending link review count: {stats.pendingLinks}</span>
              </div>
            </div>

            {/* Averages Card */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider block">Average Authority & Spam</span>
              <div className="flex items-baseline justify-between mt-4">
                <div>
                  <span className="text-2xl font-extrabold text-white font-mono">{stats.avgDa}</span>
                  <span className="text-[10px] text-brand-muted block font-mono">AVG Domain Authority</span>
                </div>
                <div className="text-right">
                  <span className={`text-2xl font-extrabold font-mono ${stats.avgSpam > 15 ? 'text-brand-danger' : 'text-brand-success'}`}>
                    {stats.avgSpam}%
                  </span>
                  <span className="text-[10px] text-brand-muted block font-mono">AVG Spam Score</span>
                </div>
              </div>
            </div>

            {/* Lifetime Cumulative Card */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
              <span className="text-xs font-bold text-brand-muted uppercase tracking-wider block">Career Performance</span>
              <div className="flex items-baseline gap-2 mt-4">
                <span className="text-3xl font-extrabold text-brand-purple font-mono">{stats.cumulativeTotal}</span>
                <span className="text-xs text-brand-muted">total links built</span>
              </div>
              <div className="flex items-center gap-1.5 mt-4 text-[10px] text-brand-muted">
                <Award size={12} className="text-brand-purple" />
                <span>Senior SEO Tier Rank achievement</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Daily volume trend chart */}
            <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-4">
              <div className="flex items-center gap-2">
                <TrendingUp size={16} className="text-brand-primary" />
                <h3 className="text-base font-bold text-white tracking-tight">Daily Link Volume Trend</h3>
              </div>
              
              <div className="h-[250px] w-full pt-4 font-mono text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.dailyChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4F6EF7" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#4F6EF7" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#21253A', borderColor: '#2E3350', borderRadius: '12px' }}
                      labelStyle={{ color: '#E2E8F0', fontFamily: 'monospace' }}
                      itemStyle={{ color: '#4F6EF7' }}
                    />
                    <Area type="monotone" dataKey="count" name="Links Logged" stroke="#4F6EF7" strokeWidth={2} fillOpacity={1} fill="url(#colorCount)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Course targets breakdown */}
            <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-6">
              <h3 className="text-base font-bold text-white tracking-tight">Assigned Course Distribution</h3>
              
              {Object.keys(stats.courseDistribution).length === 0 ? (
                <div className="text-center py-10 text-brand-muted text-xs font-mono">No courses logged this month.</div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(stats.courseDistribution).map(([course, count]: any, idx) => {
                    const pct = Math.min(100, Math.round((count / stats.totalBuilt) * 100));
                    return (
                      <div key={course} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-white font-medium truncate max-w-[200px]" title={course}>{course}</span>
                          <span className="text-brand-muted font-mono">{count} links ({pct}%)</span>
                        </div>
                        <div className="w-full bg-brand-bg h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full rounded-full transition-all"
                            style={{ 
                              width: `${pct}%`,
                              backgroundColor: COLORS[idx % COLORS.length]
                            }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Link Type Distribution Bar Chart */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white tracking-tight">Link Type distribution</h3>
            
            {typeData.length === 0 ? (
              <div className="text-center py-10 text-brand-muted text-xs font-mono">No link types recorded.</div>
            ) : (
              <div className="h-[250px] w-full pt-4 font-mono text-xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={typeData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#21253A', borderColor: '#2E3350', borderRadius: '12px' }}
                      itemStyle={{ color: '#ffffff' }}
                    />
                    <Bar dataKey="count" name="Uses" radius={[4, 4, 0, 0]}>
                      {typeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
