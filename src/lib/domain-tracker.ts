import { query } from './db';

export function extractRootDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
    let hostname = parsed.hostname.toLowerCase();

    // Remove www.
    hostname = hostname.replace(/^www\./, '');

    // Handle subdomains — keep only last 2 parts
    // Exception: country TLDs like .co.in, .co.uk (keep last 3 parts)
    const parts = hostname.split('.');
    const countryTLDs = ['co.in', 'co.uk', 'com.au', 'co.nz', 'org.in'];
    
    if (parts.length >= 3) {
      const lastTwo = parts.slice(-2).join('.');
      if (countryTLDs.includes(lastTwo)) {
        return parts.slice(-3).join('.');   // e.g. blog.co.in -> blog.co.in
      }
    }
    return parts.slice(-2).join('.');     // e.g. sub.domain.com -> domain.com
  } catch {
    // Fallback if URL parsing fails
    return url.toLowerCase().replace(/^www\./, '').split('/')[0];
  }
}

export async function updateDomainLibrary(
  backlinks: any[]
): Promise<{ domainsUpdated: number }> {
  if (backlinks.length === 0) return { domainsUpdated: 0 };

  // Group by domain for efficient upsert
  const domainMap = new Map<string, {
    member: string;
    date: string;
    liveCount: number;
    pendingCount: number;
    rejectedCount: number;
    da: number[];
    spam: number[];
    linkTypes: string[];
  }>();

  for (const link of backlinks) {
    const domain = extractRootDomain(link.url);
    const existing = domainMap.get(domain) || {
      member: link.member_name || link.memberName,
      date: link.entry_date || link.entryDate,
      liveCount: 0, 
      pendingCount: 0, 
      rejectedCount: 0,
      da: [] as number[], 
      spam: [] as number[], 
      linkTypes: [] as string[],
    };

    const status = (link.status || '').toLowerCase();
    if (status === 'live') existing.liveCount++;
    else if (status === 'pending') existing.pendingCount++;
    else if (status === 'rejected') existing.rejectedCount++;

    if (link.da) existing.da.push(parseInt(link.da));
    if (link.spam_score || link.spamScore) {
      existing.spam.push(parseInt(link.spam_score || link.spamScore));
    }
    existing.linkTypes.push(link.link_type || link.linkType);
    domainMap.set(domain, existing);
  }

  // Upsert each domain
  for (const [domain, data] of domainMap) {
    const avgDa = data.da.length
      ? data.da.reduce((a, b) => a + b, 0) / data.da.length 
      : 0;
    const avgSpam = data.spam.length
      ? data.spam.reduce((a, b) => a + b, 0) / data.spam.length 
      : 0;

    await query(`
      INSERT INTO shared_domains (
        domain, first_used_by, first_used_date,
        last_used_date, total_uses,
        live_count, pending_count, rejected_count,
        avg_da, avg_spam
      )
      VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, $9)
      ON CONFLICT (domain) DO UPDATE SET
        last_used_date  = GREATEST(shared_domains.last_used_date, $3::date),
        total_uses      = shared_domains.total_uses + $4,
        live_count      = shared_domains.live_count + $5,
        pending_count   = shared_domains.pending_count + $6,
        rejected_count  = shared_domains.rejected_count + $7,
        avg_da          = CASE WHEN $8 > 0
          THEN (shared_domains.avg_da * shared_domains.total_uses + $8 * $4)
               / (shared_domains.total_uses + $4)
          ELSE shared_domains.avg_da END,
        avg_spam        = CASE WHEN $9 > 0
          THEN (shared_domains.avg_spam * shared_domains.total_uses + $9 * $4)
               / (shared_domains.total_uses + $4)
          ELSE shared_domains.avg_spam END,
        updated_at      = NOW()
    `, [
      domain, data.member, data.date,
      data.liveCount + data.pendingCount + data.rejectedCount,
      data.liveCount, data.pendingCount, data.rejectedCount,
      avgDa, avgSpam,
    ]);
  }

  // Recalculate live_rate + status for all updated domains in the last 1 hour
  // Handle PG interval vs simple local queries
  try {
    await query(`
      UPDATE shared_domains
      SET
        live_rate = CASE WHEN total_uses > 0
          THEN ROUND((live_count::decimal / total_uses) * 100, 2)
          ELSE 0 END,
        status = CASE
          WHEN admin_override IS NOT NULL THEN admin_override
          WHEN avg_spam > 30 THEN 'Avoid'
          WHEN total_uses < 2 THEN 'Ok'
          WHEN live_count::decimal / total_uses >= 0.80
            AND avg_da >= 35 THEN 'Great'
          WHEN live_count::decimal / total_uses >= 0.65 THEN 'Good'
          WHEN live_count::decimal / total_uses >= 0.40 THEN 'Ok'
          ELSE 'Avoid'
        END
      WHERE updated_at >= NOW() - INTERVAL '1 hour'
    `);
  } catch (err) {
    // If local DB doesn't support updates with intervals, fallback
    console.log('Postgres interval update skipped (handled by local mock engine update checks).');
  }

  // Calculate best_link_type and stats per domain
  await recalculateLinkTypeStats();

  return { domainsUpdated: domainMap.size };
}

export async function recalculateLinkTypeStats(): Promise<void> {
  // Query all backlinks to map types
  const linksRes = await query('SELECT root_domain, link_type, status FROM backlinks');
  const allLinks = linksRes.rows;

  const domainGroups = new Map<string, { [type: string]: { total: number; live: number } }>();

  for (const link of allLinks) {
    const domain = link.root_domain;
    const stats = domainGroups.get(domain) || {};
    const type = link.link_type;
    
    if (!stats[type]) {
      stats[type] = { total: 0, live: 0 };
    }
    stats[type].total++;
    if (link.status === 'Live') {
      stats[type].live++;
    }
    domainGroups.set(domain, stats);
  }

  // Update shared_domains records
  for (const [domain, stats] of domainGroups) {
    let bestType = '';
    let bestRate = -1;

    for (const [type, data] of Object.entries(stats)) {
      const rate = data.live / data.total;
      if (rate > bestRate || (rate === bestRate && data.total > (stats[bestType]?.total || 0))) {
        bestRate = rate;
        bestType = type;
      }
    }

    await query(
      'UPDATE shared_domains SET best_link_type = $1, link_type_stats = $2 WHERE domain = $3',
      [bestType, JSON.stringify(stats), domain]
    );
  }
}
