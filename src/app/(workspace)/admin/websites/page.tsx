'use client';

import { useState, useEffect } from 'react';
import { AppWindow, Plus, Save, Loader } from 'lucide-react';

export default function AdminWebsitesPage() {
  const [websites, setWebsites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [code, setCode] = useState('');
  const [domain, setDomain] = useState('');
  const [propertyUrl, setPropertyUrl] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/websites').then(r => r.json());
        if (res.success) setWebsites(res.websites);
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
      const res = await fetch('/api/admin/websites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, domain, propertyUrl })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add website');

      // Reset
      setCode('');
      setDomain('');
      setPropertyUrl('');
      setShowForm(false);

      // Reload
      const fresh = await fetch('/api/admin/websites').then(r => r.json());
      if (fresh.success) setWebsites(fresh.websites);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-brand-muted font-mono">Loading properties...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">🌐 Manage Websites</h2>
          <p className="text-sm text-brand-muted mt-1">Configure target properties tracked in GSC.</p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus size={14} />
            <span>Add Property</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Website Property</h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Code</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="e.g. TLI"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Root Domain</label>
              <input
                type="text"
                required
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. techleadsit.com"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">GSC Property URL</label>
              <input
                type="url"
                required
                value={propertyUrl}
                onChange={(e) => setPropertyUrl(e.target.value)}
                placeholder="https://www.techleadsit.com"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              />
            </div>

            <div className="sm:col-span-3 flex justify-end gap-3 pt-2">
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
                <span>Save Property</span>
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
                <th className="px-6 py-3.5 w-24">Code</th>
                <th className="px-4 py-3.5 w-48">Root Domain</th>
                <th className="px-4 py-3.5 w-64">Property URL</th>
                <th className="px-4 py-3.5 w-32">Status</th>
                <th className="px-4 py-3.5 w-40">Added</th>
              </tr>
            </thead>
            <tbody>
              {websites.map((w) => (
                <tr key={w.id} className="border-b border-brand-border/40 hover:bg-brand-card/20 transition-colors">
                  <td className="px-6 py-3.5 font-bold text-white font-mono text-xs">{w.code}</td>
                  <td className="px-4 py-3.5 text-xs text-white font-mono">{w.domain}</td>
                  <td className="px-4 py-3.5 text-xs text-brand-muted font-mono">{w.property_url}</td>
                  <td className="px-4 py-3.5">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-brand-success/10 border border-brand-success/20 text-brand-success font-bold uppercase">
                      {w.status}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-brand-muted font-mono">
                    {new Date(w.created_at).toLocaleDateString()}
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
