import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';
import { extractRootDomain, updateDomainLibrary } from '@/lib/domain-tracker';

export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { backlinks } = await request.json();

    if (!Array.isArray(backlinks) || backlinks.length === 0) {
      return NextResponse.json({ error: 'Invalid backlinks format or empty array' }, { status: 400 });
    }

    const insertedLinks = [];

    for (const link of backlinks) {
      const {
        entryDate,
        property,
        course,
        location,
        keywordTargeted,
        linkType,
        url,
        da,
        spamScore,
        status,
        notes
      } = link;

      const rootDomain = extractRootDomain(url);
      
      const res = await query(`
        INSERT INTO backlinks (
          entry_date, member_id, member_name, property, course, 
          location, keyword_targeted, link_type, url, root_domain, 
          da, spam_score, status, notes
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
        RETURNING *
      `, [
        entryDate,
        auth.memberId,
        auth.name,
        property,
        course,
        location || '',
        keywordTargeted || '',
        linkType,
        url,
        rootDomain,
        parseInt(da) || 0,
        parseInt(spamScore) || 0,
        status || 'Pending',
        notes || ''
      ]);

      if (res.rows.length > 0) {
        insertedLinks.push(res.rows[0]);
      }
    }

    // Trigger update of domain library
    let domainsUpdated = 0;
    try {
      const trackerRes = await updateDomainLibrary(insertedLinks);
      domainsUpdated = trackerRes.domainsUpdated;
    } catch (err) {
      console.error('Failed to update domain library from bulk import:', err);
    }

    return NextResponse.json({
      success: true,
      count: insertedLinks.length,
      domainsUpdated
    });
  } catch (error: any) {
    console.error('Bulk Backlink API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
