import { cookies } from 'next/headers';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { 
  ArrowLeft, 
  KeyRound, 
  Globe, 
  TrendingUp, 
  TrendingDown, 
  Layers,
  Sparkles,
  ExternalLink,
  Info,
  Flame,
  LayoutList
} from 'lucide-react';
import KeywordHistoryChart from '@/components/KeywordHistoryChart';

export default async function KeywordDetailPage({
  params,
}: {
  params: Promise<{ keyword: string }>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('seo_auth')?.value;
  const payload = verifyToken(token!);
  
  const { keyword } = await params;
  const keywordName = decodeURIComponent(keyword);

  // 1. Fetch keyword metadata
  const kwRes = await query('SELECT * FROM keywords_master WHERE keyword = $1', [keywordName]);
  if (kwRes.rows.length === 0) {
    notFound();
  }

  const kw = kwRes.rows[0];

  // 2. Fetch GSC position history (last 30 entries)
  const historyRes = await query(
    'SELECT * FROM keyword_positions WHERE keyword = $1 AND property = $2 ORDER BY position_date DESC LIMIT 30',
    [keywordName, kw.property]
  );
  const history = historyRes.rows;

  // 3. Fetch SERP competitor detail checks
  const serpRes = await query(
    'SELECT * FROM serp_daily WHERE keyword = $1 ORDER BY check_date DESC LIMIT 1',
    [keywordName]
  );
  const latestSerp = serpRes.rows[0] || null;

  // Aggregate stats
  const latestPos = history[0]?.avg_position !== undefined ? parseFloat(history[0].avg_position) : null;
  const totalClicks = history.reduce((sum, h) => sum + (h.clicks || 0), 0);
  const totalImp = history.reduce((sum, h) => sum + (h.impressions || 0), 0);
  const avgCtr = history.length > 0 
    ? (history.reduce((sum, h) => sum + parseFloat(h.ctr || '0'), 0) / history.length) * 100 
    : 0;

  const firstPos = history[history.length - 1]?.avg_position !== undefined 
    ? parseFloat(history[history.length - 1].avg_position) 
    : null;
  const change = (latestPos !== null && firstPos !== null) ? latestPos - firstPos : 0;

  const trendColor = change < -1 ? 'text-brand-success' : change > 1 ? 'text-brand-danger' : 'text-brand-warning';

  // Format history points for Recharts
  const chartHistory = history.map(h => ({
    date: h.position_date,
    pos: parseFloat(h.avg_position),
    clicks: h.clicks,
    impressions: h.impressions
  }));

  // Build competitor list
  const competitors = [];
  if (latestSerp) {
    if (latestSerp.pos1_domain) competitors.push({ pos: 1, domain: latestSerp.pos1_domain });
    if (latestSerp.pos2_domain) competitors.push({ pos: 2, domain: latestSerp.pos2_domain });
    if (latestSerp.pos3_domain) competitors.push({ pos: 3, domain: latestSerp.pos3_domain });
    if (latestSerp.pos4_domain) competitors.push({ pos: 4, domain: latestSerp.pos4_domain });
    if (latestSerp.pos5_domain) competitors.push({ pos: 5, domain: latestSerp.pos5_domain });
  }

  return (
    <div className="space-y-8">
      {/* Back button */}
      <div>
        <Link 
          href="/keywords" 
          className="inline-flex items-center gap-2 text-xs font-semibold text-brand-muted hover:text-white transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Back to Keywords list</span>
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-brand-surface border border-brand-border flex items-center justify-center text-brand-primary shrink-0 mt-1">
            <KeyRound size={24} />
          </div>
          <div>
            <span className="text-[10px] font-mono text-brand-muted uppercase bg-brand-bg px-2 py-0.5 rounded border border-brand-border">
              {kw.property} | {kw.keyword_group}
            </span>
            <h2 className="text-2xl font-bold text-white tracking-tight mt-2 font-mono">{kw.keyword}</h2>
            {kw.target_url && (
              <a 
                href={kw.target_url} 
                target="_blank" 
                rel="noreferrer" 
                className="inline-flex items-center gap-1.5 text-xs text-brand-primary hover:underline font-mono mt-1"
              >
                <span>{kw.target_url}</span>
                <ExternalLink size={12} />
              </a>
            )}
          </div>
        </div>

        <span className={`px-3 py-1 rounded-xl text-xs font-bold uppercase border ${
          kw.priority === 'High' 
            ? 'bg-brand-danger/20 text-brand-danger border-brand-danger/30' 
            : kw.priority === 'Medium'
            ? 'bg-brand-warning/20 text-brand-warning border-brand-warning/30'
            : 'bg-brand-success/20 text-brand-success border-brand-success/30'
        }`}>
          {kw.priority} Priority
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Current Position */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Current Rank</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-white font-mono">
              {latestPos !== null ? `#${Math.round(latestPos)}` : '-'}
            </span>
            <span className="text-xs text-brand-muted">GSC average</span>
          </div>
        </div>

        {/* 30-day Change */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">30-Day Change</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className={`text-3xl font-extrabold font-mono ${trendColor}`}>
              {change < 0 ? `↑ ${Math.abs(change).toFixed(1)}` : change > 0 ? `↓ ${change.toFixed(1)}` : '→'}
            </span>
            <span className="text-xs text-brand-muted">ranks</span>
          </div>
        </div>

        {/* GSC Impressions */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Impressions</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-brand-primary font-mono">
              {totalImp > 1000 ? `${(totalImp / 1000).toFixed(1)}k` : totalImp}
            </span>
            <span className="text-xs text-brand-muted">impressions</span>
          </div>
        </div>

        {/* GSC Clicks */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Clicks</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-brand-purple font-mono">{totalClicks}</span>
            <span className="text-xs text-brand-muted">clicks (30d)</span>
          </div>
        </div>

        {/* CTR */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">CTR Average</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-brand-success font-mono">{avgCtr.toFixed(2)}%</span>
            <span className="text-xs text-brand-muted">click-through rate</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart and Competitors */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Chart */}
        <div className="lg:col-span-2">
          {chartHistory.length > 0 ? (
            <KeywordHistoryChart history={chartHistory} />
          ) : (
            <div className="bg-brand-surface border border-brand-border rounded-xl p-8 text-center text-brand-muted font-mono text-xs">
              No historical GSC data found for this keyword. Run rank checks to start mapping trends.
            </div>
          )}
        </div>

        {/* Competitor Analysis and SERP Features */}
        <div className="space-y-6">
          {/* SERP Features Widget */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-brand-purple">
              <Sparkles size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider">SERP Features Detected</h3>
            </div>

            {latestSerp ? (
              <div className="space-y-2 font-mono text-xs text-brand-text">
                <div className="flex justify-between py-1.5 border-b border-brand-border/40">
                  <span className="text-brand-muted">Featured Snippet:</span>
                  <span className={latestSerp.has_featured_snippet ? 'text-brand-success font-bold' : 'text-brand-muted'}>
                    {latestSerp.has_featured_snippet ? `Yes (${latestSerp.featured_snippet_domain})` : 'No'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-brand-border/40">
                  <span className="text-brand-muted">People Also Ask (PAA):</span>
                  <span className={latestSerp.has_paa ? 'text-brand-success font-bold' : 'text-brand-muted'}>
                    {latestSerp.has_paa ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-brand-border/40">
                  <span className="text-brand-muted">Local Pack:</span>
                  <span className={latestSerp.has_local_pack ? 'text-brand-success font-bold' : 'text-brand-muted'}>
                    {latestSerp.has_local_pack ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-brand-border/40">
                  <span className="text-brand-muted">Video Carousel:</span>
                  <span className={latestSerp.has_video ? 'text-brand-success font-bold' : 'text-brand-muted'}>
                    {latestSerp.has_video ? 'Yes' : 'No'}
                  </span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-brand-muted">Google Ad Count:</span>
                  <span className={latestSerp.ad_count > 0 ? 'text-brand-warning font-bold' : 'text-brand-muted'}>
                    {latestSerp.ad_count} ads
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-brand-muted font-mono text-center py-4">No live SERP check logged yet.</p>
            )}
          </div>

          {/* Competitor Standings Table */}
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center gap-2 text-brand-danger">
              <Flame size={16} />
              <h3 className="text-xs font-bold uppercase tracking-wider">Top 5 Competitor domains</h3>
            </div>

            {competitors.length > 0 ? (
              <div className="space-y-3 font-mono text-xs">
                {/* Render our own positions first */}
                {latestSerp && latestSerp.tli_position && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                    <span className="font-bold">#{latestSerp.tli_position} TechLeads IT (Us)</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">Target Domain</span>
                  </div>
                )}
                {latestSerp && latestSerp.sot_position && (
                  <div className="flex items-center justify-between p-2 rounded-lg bg-brand-primary/10 border border-brand-primary/20 text-brand-primary">
                    <span className="font-bold">#{latestSerp.sot_position} SoftOnline Training (Us)</span>
                    <span className="text-[10px] uppercase font-bold tracking-wider">Target Domain</span>
                  </div>
                )}

                {/* Render competitor rankings */}
                <div className="space-y-1.5 pt-2 border-t border-brand-border/40">
                  {competitors.map((c) => (
                    <div key={c.pos} className="flex items-center justify-between p-2 rounded-lg bg-brand-bg/60 border border-brand-border/60 text-brand-text">
                      <span>#{c.pos} {c.domain}</span>
                      <span className="text-[10px] text-brand-danger font-bold uppercase">Competitor</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-brand-muted font-mono text-center py-4">No competitor checks recorded.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
