import { cookies } from 'next/headers';
import Link from 'next/link';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';
import { 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  CheckCircle, 
  Layers,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import NotificationPanel from '@/components/NotificationPanel';

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('seo_auth')?.value;
  const payload = verifyToken(token!);
  const memberId = payload!.memberId;
  const memberName = payload!.name;

  // 1. Fetch member notifications
  const notifRes = await query(
    'SELECT * FROM notifications WHERE member_id = $1 AND is_read = false ORDER BY created_at DESC', 
    [memberId]
  );
  const notifications = notifRes.rows;

  // 2. Fetch backlinks for today and this month
  const linksRes = await query('SELECT * FROM backlinks WHERE member_id = $1', [memberId]);
  const allLinks = linksRes.rows;
  
  const todayStr = new Date().toISOString().split('T')[0];
  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

  const linksToday = allLinks.filter(l => l.entry_date === todayStr).length;
  const linksThisMonth = allLinks.filter(l => new Date(l.entry_date) >= thisMonthStart).length;

  // 3. Fetch alerts assigned to this member
  const alertsRes = await query(
    "SELECT * FROM alerts WHERE assigned_member_id = $1 AND status = 'active' ORDER BY created_at DESC",
    [memberId]
  );
  const myAlerts = alertsRes.rows;

  // 4. Fetch keywords list and their positions for health grid
  const kwRes = await query("SELECT * FROM keywords_master WHERE status = 'Active'");
  const activeKeywords = kwRes.rows;

  const positionsRes = await query("SELECT * FROM keyword_positions ORDER BY position_date DESC");
  const allPositions = positionsRes.rows;

  // Calculate improving vs declining keywords for this member
  // (Filter keywords assigned to courses this member works on)
  const myCourses = payload!.assignedCourses || [];
  const myKeywords = activeKeywords.filter(k => 
    myCourses.length === 0 || myCourses.includes(k.keyword_group)
  );

  let improvingCount = 0;
  let decliningCount = 0;

  const keywordTrends = myKeywords.map(kw => {
    // Get last 7 position entries
    const kwPos = allPositions
      .filter(p => p.keyword === kw.keyword && p.property === kw.property)
      .slice(0, 7)
      .reverse();

    const currentPos = kwPos[kwPos.length - 1]?.avg_position || 100;
    const baselinePos = kwPos[0]?.avg_position || 100;
    const diff = currentPos - baselinePos; // Negative is good (position is 1 instead of 5)

    if (diff < -1) improvingCount++;
    else if (diff > 1) decliningCount++;

    return {
      ...kw,
      currentPos,
      diff,
      history: kwPos.map(p => p.avg_position),
    };
  });

  return (
    <div className="space-y-8">
      {/* Greetings Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
            Good morning, {memberName}
          </h2>
          <p className="text-sm text-brand-muted mt-1">Here is the status of your SEO workspace today.</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-brand-muted bg-brand-surface border border-brand-border px-3 py-1.5 rounded-lg">
          <Sparkles size={14} className="text-brand-purple" />
          <span>ML Engine online & monitoring</span>
        </div>
      </div>

      {/* Notifications Panel */}
      {notifications.length > 0 && (
        <NotificationPanel notifications={notifications} />
      )}

      {/* Active Alert Banner */}
      {myAlerts.length > 0 && (
        <div className="bg-brand-danger/10 border border-brand-danger/20 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-brand-danger/20 flex items-center justify-center text-brand-danger">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h4 className="font-semibold text-white text-sm">Action Needed</h4>
              <p className="text-xs text-brand-muted">You have {myAlerts.length} active rank drop alerts assigned to your courses.</p>
            </div>
          </div>
          <Link 
            href="/alerts"
            className="flex items-center gap-1 text-xs font-semibold text-brand-danger hover:underline"
          >
            <span>View Alerts</span>
            <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* My Health Cards (5 grids) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Links Today */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider block">Links Today</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-white font-mono">{linksToday}</span>
            <span className="text-xs text-brand-muted">links</span>
          </div>
        </div>

        {/* Links This Month */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider block">Links This Month</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-brand-primary hover:underline font-mono">{linksThisMonth}</span>
            <span className="text-xs text-brand-muted">links</span>
          </div>
        </div>

        {/* Active Alerts */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider block">Active Alerts</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className={`text-3xl font-extrabold font-mono ${myAlerts.length > 0 ? 'text-brand-danger' : 'text-brand-success'}`}>
              {myAlerts.length}
            </span>
            <span className="text-xs text-brand-muted">assigned</span>
          </div>
        </div>

        {/* Improving Keywords */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider block">Keywords Improving</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-brand-success font-mono">{improvingCount}</span>
            <span className="text-xs text-brand-success flex items-center gap-0.5">
              <TrendingUp size={12} />
              <span>green</span>
            </span>
          </div>
        </div>

        {/* Declining Keywords */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
          <span className="text-xs font-bold text-brand-muted uppercase tracking-wider block">Keywords Declining</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-3xl font-extrabold text-brand-danger font-mono">{decliningCount}</span>
            <span className="text-xs text-brand-danger flex items-center gap-0.5">
              <TrendingDown size={12} />
              <span>red</span>
            </span>
          </div>
        </div>
      </div>

      {/* My Active Alerts Panel */}
      {myAlerts.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-base font-bold text-white tracking-tight">Active Alerts Assigned to Me</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {myAlerts.map((alert: any) => (
              <div key={alert.id} className="bg-brand-surface border border-brand-border rounded-xl p-5 flex flex-col justify-between">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider bg-brand-bg px-2 py-0.5 rounded border border-brand-border">
                      {alert.property} | {alert.keyword_group}
                    </span>
                    <h4 className="font-semibold text-white mt-2 text-sm font-mono">{alert.keyword}</h4>
                    <p className="text-xs text-brand-muted mt-1">
                      Type: <span className="text-brand-purple font-semibold">{alert.alert_type.replace('_', ' ')}</span>
                    </p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    alert.severity === 'critical' 
                      ? 'bg-brand-danger/20 text-brand-danger border border-brand-danger/30 animate-pulse'
                      : alert.severity === 'high'
                      ? 'bg-brand-warning/20 text-brand-warning border border-brand-warning/30'
                      : 'bg-brand-primary/20 text-brand-primary border border-brand-primary/30'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
                <div className="mt-4 pt-4 border-t border-brand-border flex items-center justify-between text-xs">
                  <span className="text-brand-muted">Detected: {new Date(alert.created_at).toLocaleDateString()}</span>
                  <Link 
                    href={`/keywords/${encodeURIComponent(alert.keyword)}`}
                    className="text-brand-primary hover:underline flex items-center gap-1 font-semibold"
                  >
                    <span>Investigate</span>
                    <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Keyword Health Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white tracking-tight">Keyword Performance Grid</h3>
          <Link href="/keywords" className="text-xs text-brand-primary hover:underline flex items-center gap-1 font-semibold">
            <span>All Keywords ({activeKeywords.length})</span>
            <ChevronRight size={12} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {keywordTrends.map((kw: any) => {
            // Find trend color
            const isImproving = kw.diff < -1;
            const isDeclining = kw.diff > 1;
            const trendColor = isImproving ? 'text-brand-success' : isDeclining ? 'text-brand-danger' : 'text-brand-warning';
            
            // Build SVG sparkline points
            // standard height 40, width 120
            const maxVal = Math.max(...kw.history, 10);
            const minVal = Math.max(Math.min(...kw.history, 1), 1);
            const range = maxVal - minVal || 1;
            
            const points = kw.history.map((val: number, idx: number) => {
              const x = (idx / 6) * 110 + 5;
              // Invert y since position 1 is at the top
              const y = 35 - ((maxVal - val) / range) * 30;
              return `${x},${y}`;
            }).join(' ');

            return (
              <Link 
                href={`/keywords/${encodeURIComponent(kw.keyword)}`} 
                key={kw.id}
                className="bg-brand-surface border border-brand-border rounded-xl p-5 hover:border-brand-primary transition-all flex flex-col justify-between group"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span className="text-[10px] font-mono text-brand-muted uppercase">
                      {kw.property}
                    </span>
                    <h4 className="font-semibold text-white text-sm truncate font-mono mt-1 group-hover:text-brand-primary transition-colors" title={kw.keyword}>
                      {kw.keyword}
                    </h4>
                  </div>
                  <span className={`text-base font-bold font-mono ${trendColor}`}>
                    #{kw.currentPos !== 100 ? kw.currentPos : '-'}
                  </span>
                </div>

                {/* Sparkline & Direction details */}
                <div className="mt-4 pt-4 border-t border-brand-border flex items-end justify-between">
                  <div className="w-[120px] h-[40px]">
                    {kw.history.length > 1 ? (
                      <svg width="100%" height="100%" viewBox="0 0 120 40" className="overflow-visible">
                        <polyline
                          fill="none"
                          stroke={isImproving ? '#22C55E' : isDeclining ? '#EF4444' : '#F59E0B'}
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          points={points}
                        />
                      </svg>
                    ) : (
                      <div className="text-[10px] text-brand-muted h-full flex items-center justify-center font-mono">No Trend Data</div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className={`text-xs font-bold font-mono ${trendColor}`}>
                      {kw.diff < 0 ? `↑ ${Math.abs(kw.diff)}` : kw.diff > 0 ? `↓ ${kw.diff}` : '→'}
                    </span>
                    <span className="text-[9px] text-brand-muted block font-mono">7-day change</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
