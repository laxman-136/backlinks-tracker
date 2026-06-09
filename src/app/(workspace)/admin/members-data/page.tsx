'use client';

import { useState, useEffect } from 'react';
import { LayoutList, Search, Loader, ExternalLink } from 'lucide-react';

export default function AdminMembersDataPage() {
  const [backlinks, setBacklinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/members-data').then(r => r.json());
        if (res.success) setBacklinks(res.backlinks);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-brand-muted font-mono">Loading data archives...</div>;
  }

  const filteredLinks = backlinks.filter(l => {
    return l.url.toLowerCase().includes(search.toLowerCase()) ||
           l.member_name.toLowerCase().includes(search.toLowerCase()) ||
           l.course.toLowerCase().includes(search.toLowerCase()) ||
           l.keyword_targeted?.toLowerCase().includes(search.toLowerCase());
  });

  const getStatusBadge = (status: string) => {
    if (status === 'Live') return 'bg-brand-success/15 border-brand-success/20 text-brand-success';
    if (status === 'Pending') return 'bg-brand-warning/15 border-brand-warning/20 text-brand-warning';
    return 'bg-brand-danger/15 border-brand-danger/20 text-brand-danger';
  };

  const getMonthName = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('default', { month: 'long' });
    } catch {
      return '-';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">📊 All Members' Data Audit</h2>
          <p className="text-sm text-brand-muted mt-1">Audit all backlinks logged by every member of the SEO team.</p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-80">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-brand-muted">
            <Search size={16} />
          </span>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search member, course, URL..."
            className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 pl-9 pr-4 text-xs text-white outline-none"
          />
        </div>
      </div>

      {/* Grid table list */}
      <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[1800px]">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted text-[10px] uppercase font-bold tracking-wider font-mono">
                <th className="px-4 py-3.5 w-28">Date</th>
                <th className="px-4 py-3.5 w-24">Month</th>
                <th className="px-4 py-3.5 w-40">Team Member</th>
                <th className="px-4 py-3.5 w-24 text-center">Website</th>
                <th className="px-4 py-3.5 w-52">Course</th>
                <th className="px-4 py-3.5 w-36">Location</th>
                <th className="px-4 py-3.5 w-44">Keyword Targeted</th>
                <th className="px-4 py-3.5 w-36">Backlink Type</th>
                <th className="px-4 py-3.5 w-64">Backlink URL</th>
                <th className="px-4 py-3.5 w-16 text-center">DA</th>
                <th className="px-4 py-3.5 w-20 text-center">Spam Score</th>
                <th className="px-4 py-3.5 w-28 text-center">Link Status</th>
                <th className="px-4 py-3.5 w-48">Notes</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((l) => (
                <tr key={l.id} className="border-b border-brand-border/40 hover:bg-brand-card/20 transition-colors text-xs">
                  {/* Date */}
                  <td className="px-4 py-3.5 font-mono text-brand-muted">{new Date(l.entry_date).toLocaleDateString()}</td>
                  
                  {/* Month */}
                  <td className="px-4 py-3.5 text-brand-muted capitalize">{getMonthName(l.entry_date)}</td>
                  
                  {/* Team Member */}
                  <td className="px-4 py-3.5 font-semibold text-white flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-brand-card border border-brand-border flex items-center justify-center font-bold text-brand-primary text-[10px] uppercase">
                      {l.member_name.substring(0, 2)}
                    </div>
                    <span>{l.member_name}</span>
                  </td>
                  
                  {/* Website */}
                  <td className="px-4 py-3.5 text-center font-mono text-white">{l.property}</td>
                  
                  {/* Course */}
                  <td className="px-4 py-3.5 font-semibold text-brand-text truncate" title={l.course}>{l.course}</td>
                  
                  {/* Location */}
                  <td className="px-4 py-3.5 text-brand-text truncate" title={l.location || '-'}>{l.location || '-'}</td>
                  
                  {/* Keyword Targeted */}
                  <td className="px-4 py-3.5 font-mono text-brand-text truncate" title={l.keyword_targeted || '-'}>{l.keyword_targeted || '-'}</td>
                  
                  {/* Backlink Type */}
                  <td className="px-4 py-3.5 text-brand-muted truncate" title={l.link_type}>{l.link_type}</td>
                  
                  {/* Backlink URL */}
                  <td className="px-4 py-3.5 font-mono text-xs text-brand-muted truncate" title={l.url}>
                    <a href={l.url} target="_blank" rel="noreferrer" className="hover:underline hover:text-brand-primary flex items-center gap-1">
                      <span className="truncate">{l.url.replace(/^https?:\/\//, '')}</span>
                      <ExternalLink size={10} className="shrink-0" />
                    </a>
                  </td>
                  
                  {/* DA */}
                  <td className="px-4 py-3.5 text-center font-mono text-white">{l.da || '-'}</td>
                  
                  {/* Spam Score */}
                  <td className="px-4 py-3.5 text-center font-mono text-brand-muted">{l.spam_score !== null && l.spam_score !== undefined ? `${l.spam_score}%` : '-'}</td>
                  
                  {/* Link Status */}
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusBadge(l.status)}`}>
                      {l.status}
                    </span>
                  </td>

                  {/* Notes */}
                  <td className="px-4 py-3.5 text-brand-muted truncate" title={l.notes || '-'}>{l.notes || '-'}</td>
                </tr>
              ))}

              {filteredLinks.length === 0 && (
                <tr>
                  <td colSpan={13} className="text-center py-10 text-brand-muted font-mono">
                    No backlink records found.
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
