'use client';

import { useState, useEffect } from 'react';
import { Brain, Edit3, Save, Loader } from 'lucide-react';

export default function AdminMlSettingsPage() {
  const [patterns, setPatterns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPattern, setEditingPattern] = useState<any>(null);

  // Form states
  const [weeklyCount, setWeeklyCount] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/ml-settings').then(r => r.json());
        if (res.success) setPatterns(res.patterns);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleEditClick = (p: any) => {
    setEditingPattern(p);
    setWeeklyCount(String(p.optimal_weekly_count || ''));
    setNotes(p.notes || '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/ml-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPattern.id,
          optimalWeeklyCount: weeklyCount,
          notes
        })
      });

      if (res.ok) {
        // Reload list
        const fresh = await fetch('/api/admin/ml-settings').then(r => r.json());
        if (fresh.success) setPatterns(fresh.patterns);
        setEditingPattern(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to update settings');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-brand-muted font-mono">Querying ML settings database...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">🧠 Machine Learning Planner Settings</h2>
        <p className="text-sm text-brand-muted mt-1">
          Review computed recovery behaviors and override weekly targets for target keyword groups.
        </p>
      </div>

      {editingPattern && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Edit target course rules: {editingPattern.property} | {editingPattern.keyword_group}
          </h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Optimal Weekly Target (Backlinks)</label>
              <input
                type="number"
                required
                value={weeklyCount}
                onChange={(e) => setWeeklyCount(e.target.value)}
                placeholder="e.g. 5"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              />
            </div>

            <div className="space-y-1 sm:col-span-2">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Notes / Guidelines</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Increase Guest Post targets if competition increases..."
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingPattern(null)}
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
                <span>Save Rule Settings</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid Table list */}
      <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted text-[10px] uppercase font-bold tracking-wider font-mono">
                <th className="px-6 py-3.5 w-60">Course Keyword Group</th>
                <th className="px-4 py-3.5 w-24 text-center">Property</th>
                <th className="px-4 py-3.5 w-24 text-center">Confidence</th>
                <th className="px-4 py-3.5 w-32 text-center">Avg Recovery</th>
                <th className="px-4 py-3.5 w-36 text-center">Optimal Weekly</th>
                <th className="px-4 py-3.5 w-60">Custom Guidelines</th>
                <th className="px-6 py-3.5 w-24 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {patterns.map((p) => (
                <tr key={p.id} className="border-b border-brand-border/40 hover:bg-brand-card/20 transition-colors text-xs">
                  <td className="px-6 py-3.5 font-semibold text-white">{p.keyword_group}</td>
                  <td className="px-4 py-3.5 text-center font-mono text-white">{p.property}</td>
                  <td className="px-4 py-3.5 text-center font-mono text-brand-success font-bold">{p.confidence}%</td>
                  <td className="px-4 py-3.5 text-center font-mono text-white">{p.avg_recovery_days || 14} days</td>
                  <td className="px-4 py-3.5 text-center font-mono text-brand-primary font-bold">{p.optimal_weekly_count || 3} links</td>
                  <td className="px-4 py-3.5 text-brand-text truncate font-mono" title={p.notes}>{p.notes || '-'}</td>
                  <td className="px-6 py-3.5 text-center">
                    <button
                      onClick={() => handleEditClick(p)}
                      className="text-brand-muted hover:text-white p-1 hover:bg-brand-bg rounded transition-colors"
                      title="Edit Target Rule"
                    >
                      <Edit3 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
              
              {patterns.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-brand-muted font-mono">
                    No active ML settings entries found. Add a course to initialize target parameters.
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
