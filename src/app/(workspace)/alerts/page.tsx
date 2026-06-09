'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  AlertTriangle, 
  CheckCircle2, 
  TrendingDown, 
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Loader
} from 'lucide-react';

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    async function loadAlerts() {
      try {
        const res = await fetch('/api/alerts').then(r => r.json());
        if (res.success) {
          setAlerts(res.alerts);
        }
      } catch (err) {
        console.error('Failed to load alerts:', err);
      } finally {
        setLoading(false);
      }
    }

    loadAlerts();
  }, []);

  const handleResolve = async (id: string) => {
    setResolvingId(id);
    try {
      const res = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: id })
      });

      if (res.ok) {
        setAlerts(prev => prev.map(a => {
          if (a.id === id) {
            return { ...a, status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: 'Self' };
          }
          return a;
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setResolvingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader className="animate-spin text-brand-primary" size={32} />
        <p className="text-brand-muted text-sm font-mono">Loading active alert logs...</p>
      </div>
    );
  }

  const activeAlerts = alerts.filter(a => a.status === 'active');
  const criticalCount = activeAlerts.filter(a => a.severity === 'critical').length;
  const highCount = activeAlerts.filter(a => a.severity === 'high').length;
  const resolvedCount = alerts.filter(a => a.status === 'resolved').length;

  const getSeverityColor = (sev: string) => {
    switch (sev) {
      case 'critical': return 'text-brand-danger bg-brand-danger/10 border-brand-danger/25 animate-pulse';
      case 'high': return 'text-brand-warning bg-brand-warning/10 border-brand-warning/25';
      default: return 'text-brand-primary bg-brand-primary/10 border-brand-primary/25';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">⚠️ Search Volatility Alerts</h2>
        <p className="text-sm text-brand-muted mt-1">
          ML engine rankdrop detections. Build targeted backlinks to resolve these flags.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Active Alerts</span>
          <span className={`text-2xl font-bold mt-2 font-mono ${activeAlerts.length > 0 ? 'text-brand-danger' : 'text-brand-success'}`}>
            {activeAlerts.length}
          </span>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-brand-danger">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Critical Drops</span>
          <span className="text-2xl font-bold text-white mt-2 font-mono">{criticalCount}</span>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-brand-warning">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">High Alert Status</span>
          <span className="text-2xl font-bold text-white mt-2 font-mono">{highCount}</span>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between border-l-4 border-l-brand-success">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Resolved Alerts</span>
          <span className="text-2xl font-bold text-brand-success mt-2 font-mono">{resolvedCount}</span>
        </div>
      </div>

      {/* Alerts Table */}
      <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[950px]">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted text-[10px] uppercase font-bold tracking-wider font-mono">
                <th className="px-6 py-3.5 w-40">Date</th>
                <th className="px-4 py-3.5 w-56">Keyword</th>
                <th className="px-4 py-3.5 w-36">Course Group</th>
                <th className="px-4 py-3.5 w-24 text-center">Property</th>
                <th className="px-4 py-3.5 w-36">Alert Type</th>
                <th className="px-4 py-3.5 w-28 text-center">Severity</th>
                <th className="px-4 py-3.5 w-28 text-center">Status</th>
                <th className="px-6 py-3.5 w-48 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {alerts.map((a) => (
                <tr 
                  key={a.id} 
                  className={`border-b border-brand-border/40 hover:bg-brand-card/20 transition-colors ${
                    a.status === 'resolved' ? 'opacity-60' : ''
                  }`}
                >
                  {/* Date */}
                  <td className="px-6 py-3.5 text-xs text-brand-muted font-mono">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>

                  {/* Keyword link */}
                  <td className="px-4 py-3.5 font-semibold text-white font-mono text-xs truncate">
                    <Link href={`/keywords/${encodeURIComponent(a.keyword)}`} className="hover:text-brand-primary hover:underline flex items-center gap-1">
                      <span>{a.keyword}</span>
                      <ExternalLink size={10} className="text-brand-muted shrink-0" />
                    </Link>
                  </td>

                  {/* Course Group */}
                  <td className="px-4 py-3.5 text-xs text-brand-text font-medium truncate">{a.keyword_group}</td>

                  {/* Property */}
                  <td className="px-4 py-3.5 text-center font-mono text-xs text-white">{a.property}</td>

                  {/* Alert Type */}
                  <td className="px-4 py-3.5 text-xs text-brand-purple font-semibold font-mono capitalize">
                    {a.alert_type.replace('_', ' ')}
                  </td>

                  {/* Severity */}
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getSeverityColor(a.severity)}`}>
                      {a.severity}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      a.status === 'active' 
                        ? 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20' 
                        : 'bg-brand-success/10 text-brand-success border border-brand-success/20'
                    }`}>
                      {a.status}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="px-6 py-3.5 text-center">
                    {a.status === 'active' ? (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          disabled={resolvingId === a.id}
                          onClick={() => handleResolve(a.id)}
                          className="px-2.5 py-1 bg-brand-success hover:bg-brand-success/90 text-white font-semibold text-[10px] rounded-lg transition-colors flex items-center gap-1 shadow-md shadow-brand-success/15"
                        >
                          <CheckCircle2 size={10} />
                          <span>Resolve</span>
                        </button>
                        <Link
                          href="/entry"
                          className="px-2.5 py-1 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary font-semibold text-[10px] rounded-lg transition-colors border border-brand-primary/20"
                        >
                          Log Links
                        </Link>
                      </div>
                    ) : (
                      <span className="text-[10px] text-brand-muted font-mono leading-tight block">
                        Resolved by {a.resolved_by || 'system'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}

              {alerts.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-10 text-brand-muted text-xs font-mono">
                    No active or resolved search alerts recorded.
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
