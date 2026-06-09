'use client';

import { useState, useEffect } from 'react';
import { Activity, AlertTriangle, CheckCircle, Loader } from 'lucide-react';

export default function AdminApiStatusPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStatus() {
      try {
        const res = await fetch('/api/admin/api-status').then(r => r.json());
        if (res.success) setData(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadStatus();
  }, []);

  if (loading) {
    return <div className="text-center py-12 text-brand-muted font-mono">Querying key rotation status...</div>;
  }

  const usageList = data?.usage || [];
  const historyList = data?.history || [];

  // Group by api_type
  const searchApiUsage = usageList.filter((u: any) => u.api_type === 'search_api');

  // Build full 10-key array with defaults
  const keysStatus = Array.from({ length: 10 }).map((_, idx) => {
    const keyIndex = idx; // 0-indexed in code
    const logged = searchApiUsage.find((u: any) => u.key_index === keyIndex);
    const count = logged ? parseInt(logged.total_requests) : 0;
    const errors = logged ? parseInt(logged.total_errors) : 0;
    return {
      index: keyIndex + 1,
      count,
      errors,
      pct: Math.min(100, Math.round((count / 95) * 100))
    };
  });

  const totalToday = keysStatus.reduce((sum, k) => sum + k.count, 0);
  const keysVolWarn = keysStatus.filter(k => k.count >= 90).length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">🔧 Rotating API Key Monitor</h2>
        <p className="text-sm text-brand-muted mt-1">Monitor daily quota limits across the 10 rotating Google Custom Search API keys.</p>
      </div>

      {/* Warning Banners */}
      {keysVolWarn > 0 && (
        <div className="bg-brand-danger/10 border border-brand-danger/20 text-brand-danger rounded-xl p-4 flex gap-3 text-xs">
          <AlertTriangle className="shrink-0 mt-0.5" size={16} />
          <div>
            <h4 className="font-bold uppercase tracking-wider text-[10px]">API Key Quota Warning</h4>
            <p className="mt-1">
              {keysVolWarn} Google Search API keys have reached or exceeded 95% of their daily limits. 
              The system rotator will automatically deprioritize these keys and shift request loads to secondary keys.
            </p>
          </div>
        </div>
      )}

      {/* Overall stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Today's Total Queries</span>
          <span className="text-3xl font-extrabold text-white mt-4 font-mono">{totalToday}</span>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between border-l-4 border-l-brand-success">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Active Rotator Keys</span>
          <span className="text-3xl font-extrabold text-brand-success mt-4 font-mono">
            {keysStatus.filter(k => k.count < 95).length} / 10
          </span>
        </div>
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between border-l-4 border-l-brand-danger">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider">Exhausted Keys Today</span>
          <span className="text-3xl font-extrabold text-brand-danger mt-4 font-mono">
            {keysStatus.filter(k => k.count >= 95).length} keys
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Keys status bars */}
        <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-2 text-brand-primary">
            <Activity size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">10-Key Rotation Quota Health</h3>
          </div>

          <div className="space-y-4">
            {keysStatus.map((key) => (
              <div key={key.index} className="space-y-1 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-white font-mono font-bold">Key #{key.index}</span>
                  <span className="text-brand-muted font-mono">
                    {key.count} / 95 calls today {key.errors > 0 && <span className="text-brand-danger">({key.errors} errs)</span>}
                  </span>
                </div>
                <div className="w-full bg-brand-bg h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all ${
                      key.count >= 95 
                        ? 'bg-brand-danger' 
                        : key.count >= 80 
                        ? 'bg-brand-warning' 
                        : 'bg-brand-primary'
                    }`}
                    style={{ width: `${key.pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent API Call Logs */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-4">
          <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider">📜 Recent API Calls Log</h3>
          
          <div className="space-y-3 font-mono text-[10px] max-h-[500px] overflow-y-auto">
            {historyList.length === 0 ? (
              <div className="text-center py-8 text-brand-muted">No API queries logged today.</div>
            ) : (
              historyList.map((log: any) => (
                <div key={log.id} className="p-3 bg-brand-bg/50 border border-brand-border/40 rounded-lg flex flex-col gap-1">
                  <div className="flex justify-between font-bold">
                    <span className="text-brand-primary uppercase">{log.api_type.replace('_', ' ')}</span>
                    <span className="text-brand-muted">{new Date(log.created_at).toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between text-brand-text">
                    <span>Key Index: #{log.key_index !== null ? log.key_index + 1 : 'N/A'}</span>
                    <span>Queries: {log.requests_made}</span>
                  </div>
                  {log.errors > 0 && (
                    <span className="text-brand-danger font-semibold">Errors detected: {log.errors}</span>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
