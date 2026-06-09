import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { 
  Globe, 
  ArrowLeft, 
  Calendar, 
  Users, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  AlertOctagon,
  Award
} from 'lucide-react';
import AdminOverridePanel from '@/components/AdminOverridePanel';

export default async function DomainDetailPage({
  params,
}: {
  params: Promise<{ domain: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('seo_auth')?.value;
  const payload = verifyToken(token!);
  const userRole = payload!.role;

  const { domain } = await params;
  const domainName = domain.toLowerCase();

  // 1. Fetch domain information
  const domainRes = await query('SELECT * FROM shared_domains WHERE domain = $1', [domainName]);
  if (domainRes.rows.length === 0) {
    notFound();
  }

  const dData = domainRes.rows[0];

  // 2. Fetch usage summary from backlinks (data isolated metrics)
  const usageRes = await query(`
    SELECT 
      COUNT(DISTINCT member_id) as member_count, 
      MIN(entry_date) as first_used_date,
      COUNT(CASE WHEN status = 'Live' THEN 1 END) as live_count,
      COUNT(CASE WHEN status = 'Pending' THEN 1 END) as pending_count,
      COUNT(CASE WHEN status = 'Rejected' THEN 1 END) as rejected_count,
      COUNT(*) as total_uses
    FROM backlinks 
    WHERE root_domain = $1
  `, [domainName]);

  const usage = usageRes.rows[0];
  const totalUses = parseInt(usage.total_uses || '0');
  const liveCount = parseInt(usage.live_count || '0');
  const pendingCount = parseInt(usage.pending_count || '0');
  const rejectedCount = parseInt(usage.rejected_count || '0');
  const memberCount = parseInt(usage.member_count || '0');
  const liveRate = totalUses > 0 ? Math.round((liveCount / totalUses) * 100) : 0;

  // 3. Link Type breakdown from database
  const linkStats = typeof dData.link_type_stats === 'string' 
    ? JSON.parse(dData.link_type_stats) 
    : dData.link_type_stats || {};

  const statsList = Object.entries(linkStats).map(([type, statsVal]: any) => {
    const total = statsVal.total || 0;
    const live = statsVal.live || 0;
    const rate = total > 0 ? Math.round((live / total) * 100) : 0;
    return { type, total, live, rate };
  }).sort((a, b) => b.total - a.total);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Great': return 'text-brand-success bg-brand-success/10 border-brand-success/20';
      case 'Good': return 'text-brand-primary bg-brand-primary/10 border-brand-primary/20';
      case 'Ok': return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20';
      default: return 'text-brand-danger bg-brand-danger/10 border-brand-danger/20';
    }
  };

  const getRecommendation = (rate: number) => {
    if (rate >= 80) return { text: 'Recommended', color: 'text-brand-success', icon: '✅' };
    if (rate >= 50) return { text: 'Mixed Results', color: 'text-brand-warning', icon: '⚠️' };
    return { text: 'Avoid', color: 'text-brand-danger', icon: '❌' };
  };

  return (
    <div className="space-y-8">
      {/* Return button */}
      <div>
        <Link 
          href="/domain-library" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-brand-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Domain Library</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-primary shrink-0">
            <Globe size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight font-mono">{dData.domain}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] text-brand-muted font-mono uppercase">Status rating:</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${getStatusColor(dData.status)}`}>
                {dData.status}
              </span>
            </div>
          </div>
        </div>

        <div className="text-xs text-brand-muted font-mono bg-brand-surface border border-brand-border px-4 py-2 rounded-xl">
          Last used: {dData.last_used_date ? new Date(dData.last_used_date).toLocaleDateString() : 'Never'}
        </div>
      </div>

      {/* Admin Advisory Warning (For non-admins, read-only) */}
      {dData.admin_note && (
        <div className="bg-brand-warning/10 border border-brand-warning/20 text-brand-warning rounded-xl p-4 flex gap-3">
          <AlertTriangle size={18} className="shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold uppercase tracking-wider text-[10px]">Admin Advisory Notice</h4>
            <p className="mt-1 font-mono leading-relaxed">{dData.admin_note}</p>
          </div>
        </div>
      )}

      {/* Metric Cards (Trust Indicators) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Domain Authority */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Domain Authority</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-white font-mono">{Math.round(dData.avg_da)}</span>
            <span className="text-xs text-brand-muted">DA score</span>
          </div>
        </div>

        {/* Spam Score */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Spam Score</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className={`text-3xl font-extrabold font-mono ${dData.avg_spam > 30 ? 'text-brand-danger' : 'text-brand-success'}`}>
              {Math.round(dData.avg_spam)}%
            </span>
            <span className="text-xs text-brand-muted">risk rate</span>
          </div>
        </div>

        {/* Total Uses */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Total Uses</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-brand-primary font-mono">{totalUses}</span>
            <span className="text-xs text-brand-muted">logged links</span>
          </div>
        </div>

        {/* Live rate */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Success Live Rate</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-brand-success font-mono">{liveRate}%</span>
            <span className="text-xs text-brand-muted">{liveCount} Live / {totalUses} Total</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Breakdown and Admin Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Link Types Breakdown */}
        <div className="lg:col-span-2 bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-6">
          <h3 className="text-base font-bold text-white tracking-tight">Success Rate by Link Type</h3>
          
          {statsList.length === 0 ? (
            <div className="text-center py-10 text-brand-muted text-xs font-mono">
              No link type data available.
            </div>
          ) : (
            <div className="space-y-4">
              {statsList.map((stat) => {
                const rec = getRecommendation(stat.rate);
                return (
                  <div 
                    key={stat.type} 
                    className="bg-brand-bg border border-brand-border/60 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 font-mono text-xs"
                  >
                    <div>
                      <h4 className="font-bold text-white text-sm">{stat.type}</h4>
                      <span className="text-[10px] text-brand-muted block mt-1">
                        Logged {stat.total} times | Live: {stat.live}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-right">
                      <div>
                        <span className="text-sm font-extrabold text-white">{stat.rate}%</span>
                        <span className="text-[9px] text-brand-muted block">Live rate</span>
                      </div>
                      <div className="h-8 w-px bg-brand-border hidden sm:block"></div>
                      <span className={`px-2 py-1 rounded-lg bg-brand-surface text-[10px] font-bold ${rec.color}`}>
                        {rec.icon} {rec.text}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Panel controls (Sidebar style details) */}
        <div className="space-y-6">
          {/* Quick usages team metrics */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-4">
            <h3 className="text-xs font-bold text-brand-muted uppercase tracking-wider">👥 Team Usage Info</h3>
            
            <div className="space-y-3 font-mono text-xs text-brand-text">
              <div className="flex justify-between py-1 border-b border-brand-border/40">
                <span className="text-brand-muted">Team Members:</span>
                <span className="font-bold text-white">{memberCount} members</span>
              </div>
              <div className="flex justify-between py-1 border-b border-brand-border/40">
                <span className="text-brand-muted">First Used:</span>
                <span className="font-bold text-white">
                  {usage.firstUsedDate ? new Date(usage.firstUsedDate).toLocaleDateString() : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-brand-border/40">
                <span className="text-brand-muted">Live Links:</span>
                <span className="font-bold text-brand-success">{liveCount}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-brand-border/40">
                <span className="text-brand-muted">Pending Review:</span>
                <span className="font-bold text-brand-warning">{pendingCount}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-brand-muted">Rejected:</span>
                <span className="font-bold text-brand-danger">{rejectedCount}</span>
              </div>
            </div>
          </div>

          {/* Admin controls section */}
          {userRole === 'admin' && (
            <AdminOverridePanel 
              domain={dData.domain} 
              initialOverride={dData.admin_override} 
              initialNote={dData.admin_note || ''} 
            />
          )}
        </div>
      </div>
    </div>
  );
}
