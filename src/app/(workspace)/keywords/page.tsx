'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  KeyRound, 
  Search, 
  Filter, 
  TrendingUp, 
  TrendingDown, 
  ArrowRight,
  Loader
} from 'lucide-react';

export default function KeywordsPage() {
  const [keywords, setKeywords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [propertyFilter, setPropertyFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [groupFilter, setGroupFilter] = useState('All');

  useEffect(() => {
    async function loadKeywords() {
      try {
        const res = await fetch('/api/keywords').then(r => r.json());
        if (res.success) {
          setKeywords(res.keywords);
        }
      } catch (err) {
        console.error('Failed to load keywords:', err);
      } finally {
        setLoading(false);
      }
    }

    loadKeywords();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader className="animate-spin text-brand-primary" size={32} />
        <p className="text-brand-muted text-sm font-mono">Loading keyword index...</p>
      </div>
    );
  }

  // Get unique keyword groups for filters
  const groups = Array.from(new Set(keywords.map(k => k.keyword_group)));

  // Filter logic
  const filteredKeywords = keywords.filter(k => {
    const matchesSearch = k.keyword.toLowerCase().includes(search.toLowerCase()) ||
                          k.target_url?.toLowerCase().includes(search.toLowerCase());
    
    const matchesProp = propertyFilter === 'All' || k.property === propertyFilter;
    const matchesPriority = priorityFilter === 'All' || k.priority === priorityFilter;
    const matchesGroup = groupFilter === 'All' || k.keyword_group === groupFilter;

    return matchesSearch && matchesProp && matchesPriority && matchesGroup;
  });

  const getPriorityBadge = (prio: string) => {
    switch (prio) {
      case 'High': return 'text-brand-danger bg-brand-danger/10 border-brand-danger/20';
      case 'Medium': return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20';
      default: return 'text-brand-success bg-brand-success/10 border-brand-success/20';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">🔑 Tracked Keywords</h2>
        <p className="text-sm text-brand-muted mt-1">
          Master keyword index and historic positions mapped from Google Search Console.
        </p>
      </div>

      {/* Search & Filters */}
      <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative w-full md:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
              <Search size={16} />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search keyword or URL..."
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none"
            />
          </div>

          <div className="text-xs text-brand-muted font-mono bg-brand-bg border border-brand-border px-3 py-1.5 rounded-lg flex items-center gap-2">
            <Filter size={14} className="text-brand-primary" />
            <span>Found {filteredKeywords.length} matching keywords</span>
          </div>
        </div>

        {/* Dropdown filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-brand-border/40">
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-muted uppercase">Property</label>
            <select
              value={propertyFilter}
              onChange={(e) => setPropertyFilter(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
            >
              <option value="All">All Properties</option>
              <option value="TLI">TLI (techleadsit.com)</option>
              <option value="SOT">SOT (softonlinetraining.com)</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-muted uppercase">Course / Group</label>
            <select
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
            >
              <option value="All">All Courses</option>
              {groups.map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-brand-muted uppercase">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
            >
              <option value="All">All Priorities</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid List */}
      <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1000px]">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted text-[10px] uppercase font-bold tracking-wider font-mono">
                <th className="px-6 py-3.5 w-64">Keyword</th>
                <th className="px-4 py-3.5 w-40">Group</th>
                <th className="px-4 py-3.5 w-24 text-center">Property</th>
                <th className="px-4 py-3.5 w-64">Target URL</th>
                <th className="px-4 py-3.5 w-28 text-center">Priority</th>
                <th className="px-4 py-3.5 w-32 text-center">Rank Trend</th>
                <th className="px-4 py-3.5 w-24 text-center">Latest Rank</th>
                <th className="px-4 py-3.5 w-28 text-center">7-day Change</th>
              </tr>
            </thead>
            <tbody>
              {filteredKeywords.map((kw) => {
                const historyList = kw.history.map((h: any) => h.pos);
                
                const isImproving = kw.change < -1;
                const isDeclining = kw.change > 1;
                const trendColor = isImproving ? 'text-brand-success' : isDeclining ? 'text-brand-danger' : 'text-brand-warning';
                
                // SVG sparkline points
                const maxVal = Math.max(...historyList, 10);
                const minVal = Math.max(Math.min(...historyList, 1), 1);
                const range = maxVal - minVal || 1;
                
                const points = historyList.map((val: number, idx: number) => {
                  const x = (idx / 14) * 90 + 5;
                  const y = 30 - ((maxVal - val) / range) * 20;
                  return `${x},${y}`;
                }).join(' ');

                return (
                  <tr 
                    key={kw.id} 
                    className="border-b border-brand-border/40 hover:bg-brand-card/25 cursor-pointer transition-colors"
                  >
                    {/* Keyword */}
                    <td className="px-6 py-3.5 font-semibold text-white font-mono text-xs truncate">
                      <Link href={`/keywords/${encodeURIComponent(kw.keyword)}`} className="hover:text-brand-primary hover:underline">
                        {kw.keyword}
                      </Link>
                    </td>

                    {/* Group */}
                    <td className="px-4 py-3.5 text-xs text-brand-text font-medium truncate">{kw.keyword_group}</td>

                    {/* Property */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs text-white">{kw.property}</td>

                    {/* URL */}
                    <td className="px-4 py-3.5 text-xs text-brand-muted truncate font-mono" title={kw.target_url}>
                      {kw.target_url ? (
                        <a href={kw.target_url} target="_blank" rel="noreferrer" className="hover:underline hover:text-brand-primary">
                          {kw.target_url.replace(/^https?:\/\/(www\.)?/, '')}
                        </a>
                      ) : '-'}
                    </td>

                    {/* Priority */}
                    <td className="px-4 py-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(kw.priority)}`}>
                        {kw.priority}
                      </span>
                    </td>

                    {/* Trend Sparkline */}
                    <td className="px-4 py-3.5 text-center">
                      <div className="w-[100px] h-[30px] mx-auto">
                        {historyList.length > 1 ? (
                          <svg width="100%" height="100%" viewBox="0 0 100 30" className="overflow-visible">
                            <polyline
                              fill="none"
                              stroke={isImproving ? '#22C55E' : isDeclining ? '#EF4444' : '#F59E0B'}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              points={points}
                            />
                          </svg>
                        ) : (
                          <span className="text-[9px] text-brand-muted font-mono">No History</span>
                        )}
                      </div>
                    </td>

                    {/* Latest Rank */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-bold text-white">
                      {kw.currentPos !== null ? `#${kw.currentPos}` : '-'}
                    </td>

                    {/* 7-day Change */}
                    <td className="px-4 py-3.5 text-center font-mono text-xs font-bold">
                      <span className={trendColor}>
                        {kw.change < 0 ? `↑ ${Math.abs(kw.change)}` : kw.change > 0 ? `↓ ${kw.change}` : '→'}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {filteredKeywords.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-brand-muted text-xs font-mono">
                    No keywords matched your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
