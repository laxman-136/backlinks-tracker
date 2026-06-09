'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Plus, Save, Loader } from 'lucide-react';

export default function AdminCompetitorsPage() {
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [domain, setDomain] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [threatLevel, setThreatLevel] = useState('Medium');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/competitors').then(r => r.json());
        if (res.success) setCompetitors(res.competitors);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain, displayName, threatLevel, notes })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add competitor');

      // Reset
      setDomain('');
      setDisplayName('');
      setThreatLevel('Medium');
      setNotes('');
      setShowForm(false);

      // Reload
      const fresh = await fetch('/api/admin/competitors').then(r => r.json());
      if (fresh.success) setCompetitors(fresh.competitors);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-brand-muted font-mono">Loading competitors...</div>;
  }

  const getThreatBadge = (t: string) => {
    if (t === 'High') return 'text-brand-danger bg-brand-danger/10 border-brand-danger/20';
    if (t === 'Medium') return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20';
    return 'text-brand-success bg-brand-success/10 border-brand-success/20';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">🎯 Manage Competitors</h2>
          <p className="text-sm text-brand-muted mt-1">Configure competitor domains tracked in daily SERP checks.</p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus size={14} />
            <span>Add Competitor</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Competitor Target</h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Root Domain</label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. cloudshine.com"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Display Name</label>
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. Cloudshine Job Prep"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Threat Level</label>
              <select
                value={threatLevel}
                onChange={(e) => setThreatLevel(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              >
                <option value="High">High Threat</option>
                <option value="Medium">Medium Threat</option>
                <option value="Low">Low Threat</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Notes / Profile</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Target courses, strategies..."
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              />
            </div>

            <div className="sm:col-span-4 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-brand-border hover:bg-brand-card text-brand-text rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1"
              >
                {saving ? <Loader className="animate-spin" size={12} /> : <Save size={12} />}
                <span>Save Competitor</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid list */}
      <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted text-[10px] uppercase font-bold tracking-wider font-mono">
                <th className="px-6 py-3.5 w-60">Display Name</th>
                <th className="px-4 py-3.5 w-48">Domain Name</th>
                <th className="px-4 py-3.5 w-28 text-center">Threat Level</th>
                <th className="px-4 py-3.5 w-64">Strategy Notes</th>
                <th className="px-4 py-3.5 w-32">Status</th>
              </tr>
            </thead>
            <tbody>
              {competitors.map((c) => (
                <tr key={c.id} className="border-b border-brand-border/40 hover:bg-brand-card/20 transition-colors text-xs">
                  <td className="px-6 py-3.5 font-semibold text-white">{c.display_name}</td>
                  <td className="px-4 py-3.5 text-brand-muted font-mono">{c.domain}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getThreatBadge(c.threat_level)}`}>
                      {c.threat_level}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-brand-text truncate font-mono" title={c.notes}>{c.notes || '-'}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-brand-success/10 border border-brand-success/20 text-brand-success font-bold uppercase">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
