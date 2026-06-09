'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Globe, 
  Search, 
  Filter, 
  ArrowUpDown, 
  TrendingUp,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  Loader,
  Plus
} from 'lucide-react';

export default function DomainLibraryPage() {
  const [domains, setDomains] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [linkTypeStats, setLinkTypeStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [daFilter, setDaFilter] = useState('All');
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortField, setSortField] = useState('live_rate');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/domain-library').then(r => r.json());
        if (res.success) {
          setDomains(res.domains);
          setSummary(res.summary);
          setLinkTypeStats(res.linkTypeStats);
        }
      } catch (err) {
        console.error('Failed to fetch domain library:', err);
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
        <p className="text-brand-muted text-sm font-mono">Indexing shared library...</p>
      </div>
    );
  }

  // Filter & Sort Logic
  const filteredDomains = domains
    .filter(d => {
      // 1. Search
      const matchesSearch = d.domain.toLowerCase().includes(search.toLowerCase());
      
      // 2. DA Filter
      let matchesDa = true;
      if (daFilter === 'High') matchesDa = d.avg_da >= 40;
      else if (daFilter === 'Medium') matchesDa = d.avg_da >= 20 && d.avg_da < 40;
      else if (daFilter === 'Low') matchesDa = d.avg_da < 20;

      // 3. Link Type Filter
      const matchesType = typeFilter === 'All' || d.best_link_type === typeFilter;

      // 4. Status Filter
      const matchesStatus = statusFilter === 'All' || d.status === statusFilter;

      return matchesSearch && matchesDa && matchesType && matchesStatus;
    })
    .sort((a, b) => {
      if (sortField === 'live_rate') return b.live_rate - a.live_rate;
      if (sortField === 'da') return b.avg_da - a.avg_da;
      if (sortField === 'uses') return b.total_uses - a.total_uses;
      if (sortField === 'last_used') return new Date(b.last_used_date).getTime() - new Date(a.last_used_date).getTime();
      return 0;
    });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Great': return 'text-brand-success bg-brand-success/10 border-brand-success/20';
      case 'Good': return 'text-brand-primary bg-brand-primary/10 border-brand-primary/20';
      case 'Ok': return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20';
      default: return 'text-brand-danger bg-brand-danger/10 border-brand-danger/20';
    }
  };

  const getRowBorder = (status: string) => {
    switch (status) {
      case 'Great': return 'border-l-4 border-l-brand-success';
      case 'Good': return 'border-l-4 border-l-brand-primary';
      case 'Ok': return 'border-l-4 border-l-brand-warning';
      default: return 'border-l-4 border-l-brand-danger opacity-75';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">🌐 Shared Domain Library</h2>
        <p className="text-sm text-brand-muted mt-1">
          Collective knowledge base of working domains logged by the TechLeads IT SEO team.
        </p>
      </div>

      {/* Stats Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between">
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Total Domains</span>
            <span className="text-2xl font-bold text-white mt-2 font-mono">{summary.total}</span>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-brand-success">
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Great Domains</span>
            <span className="text-2xl font-bold text-brand-success mt-2 font-mono">{summary.great}</span>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-brand-primary">
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Good Domains</span>
            <span className="text-2xl font-bold text-brand-primary mt-2 font-mono">{summary.good}</span>
          </div>
          <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-brand-danger">
            <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Domains to Avoid</span>
            <span className="text-2xl font-bold text-brand-danger mt-2 font-mono">{summary.avoid}</span>
          </div>
        </div>
      )}

      {/* Quick filters / search grid */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domain name..."
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none"
            />
          </div>

          {/* Quick Filters Options */}
          <div className="flex flex-wrap gap-2 w-full md:w-auto">
            <button 
              onClick={() => { setStatusFilter('Great'); setDaFilter('High'); }}
              className="px-3 py-1.5 bg-brand-success/15 border border-brand-success/20 text-brand-success hover:bg-brand-success/25 rounded-xl text-xs font-semibold transition-colors"
            >
              🟢 Best Domains
            </button>
            <button 
              onClick={() => { setDaFilter('High'); setStatusFilter('All'); }}
              className="px-3 py-1.5 bg-brand-primary/15 border border-brand-primary/20 text-brand-primary hover:bg-brand-primary/25 rounded-xl text-xs font-semibold transition-colors"
            >
              ⭐ High DA (40+)
            </button>
            <button 
              onClick={() => { setStatusFilter('Avoid'); setDaFilter('All'); }}
              className="px-3 py-1.5 bg-brand-danger/15 border border-brand-danger/20 text-brand-danger hover:bg-brand-danger/25 rounded-xl text-xs font-semibold transition-colors"
            >
              🔴 Avoid
            </button>
            <button 
              onClick={() => { setStatusFilter('All'); setDaFilter('All'); setTypeFilter('All'); setSearch(''); }}
              className="px-3 py-1.5 border border-brand-border hover:bg-brand-card text-brand-muted hover:text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Clear
            </button>
          </div>
        </div>

        {/* Dropdowns panel */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-brand-border/40">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-muted uppercase">DA Range</label>
            <select
              value={daFilter}
              onChange={(e) => setDaFilter(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
            >
              <option value="All">All DA</option>
              <option value="High">High (40+)</option>
              <option value="Medium">Medium (20-39)</option>
              <option value="Low">Low (&lt; 20)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-muted uppercase">Best Link Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
            >
              <option value="All">All Types</option>
              <option value="Guest Post">Guest Post</option>
              <option value="Forum Post">Forum Post</option>
              <option value="Web 2.0">Web 2.0</option>
              <option value="Directory">Directory</option>
              <option value="Quora/Reddit">Quora/Reddit</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-muted uppercase">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
            >
              <option value="All">All Status</option>
              <option value="Great">Great</option>
              <option value="Good">Good</option>
              <option value="Ok">Ok</option>
              <option value="Avoid">Avoid</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-muted uppercase">Sort By</label>
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
            >
              <option value="live_rate">Live Rate %</option>
              <option value="da">Domain Authority</option>
              <option value="uses">Total Uses</option>
              <option value="last_used">Last Used Date</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Results (Table layout) */}
      <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted text-[10px] uppercase font-bold tracking-wider font-mono">
                <th className="w-64 px-6 py-3.5">Domain</th>
                <th className="w-24 px-4 py-3.5 text-center">DA</th>
                <th className="w-24 px-4 py-3.5 text-center">Spam %</th>
                <th className="w-40 px-4 py-3.5">Best Link Type</th>
                <th className="w-28 px-4 py-3.5 text-center">Uses</th>
                <th className="w-28 px-4 py-3.5 text-center">Live Rate</th>
                <th className="w-32 px-4 py-3.5">Status</th>
                <th className="w-40 px-4 py-3.5">Last Used</th>
              </tr>
            </thead>
            <tbody>
              {filteredDomains.map((d) => (
                <tr 
                  key={d.id} 
                  className={`border-b border-brand-border/40 hover:bg-brand-card/25 cursor-pointer transition-colors ${getRowBorder(d.status)}`}
                >
                  {/* Domain click route link */}
                  <td className="px-6 py-3.5 font-semibold text-white font-mono text-xs">
                    <Link href={`/domain-library/${d.domain}`} className="hover:text-brand-primary hover:underline">
                      {d.domain}
                    </Link>
                  </td>
                  
                  {/* DA */}
                  <td className="px-4 py-3.5 text-center font-mono text-xs text-white">{Math.round(d.avg_da)}</td>

                  {/* Spam */}
                  <td className="px-4 py-3.5 text-center font-mono text-xs text-brand-muted">{Math.round(d.avg_spam)}%</td>

                  {/* Best type */}
                  <td className="px-4 py-3.5 text-xs text-brand-text font-medium">{d.best_link_type || '-'}</td>

                  {/* Uses */}
                  <td className="px-4 py-3.5 text-center font-mono text-xs text-white">{d.total_uses}</td>

                  {/* Live Rate */}
                  <td className="px-4 py-3.5 text-center font-mono text-xs font-bold text-white">{Math.round(d.live_rate)}%</td>

                  {/* Status Badges */}
                  <td className="px-4 py-3.5">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(d.status)}`}>
                      {d.status}
                    </span>
                  </td>

                  {/* Last Used */}
                  <td className="px-4 py-3.5 font-mono text-xs text-brand-muted">
                    {new Date(d.last_used_date).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              
              {filteredDomains.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-brand-muted text-xs font-mono">
                    No domains match the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Link Type Rankings stats section */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">Success Rate by Link Type</h3>
        <p className="text-xs text-brand-muted">
          Historic live rates and average Domain Authority computed across all backlinks logged.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
          {linkTypeStats.map((stat: any) => (
            <div key={stat.link_type} className="bg-brand-bg border border-brand-border rounded-xl p-4 flex flex-col justify-between">
              <span className="text-xs font-bold text-white">{stat.link_type}</span>
              <div className="flex justify-between items-baseline mt-4">
                <div>
                  <span className="text-2xl font-extrabold text-brand-success font-mono">
                    {Math.round(stat.avg_live_rate)}%
                  </span>
                  <span className="text-[9px] text-brand-muted block font-mono">Avg Live Rate</span>
                </div>
                <div className="text-right">
                  <span className="text-lg font-bold text-white font-mono">
                    {Math.round(stat.avg_da)}
                  </span>
                  <span className="text-[9px] text-brand-muted block font-mono">Avg DA</span>
                </div>
              </div>
              <div className="text-[9px] text-brand-muted mt-2 pt-2 border-t border-brand-border/40 font-mono">
                {stat.domain_count} distinct domains mapped
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
