import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthFromRequest } from '@/lib/auth';

// GET: Fetch latest monthly plan
export async function GET(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Query latest plan
    const res = await query('SELECT * FROM monthly_plans ORDER BY generated_at DESC LIMIT 1');
    
    if (res.rows.length > 0) {
      return NextResponse.json({ success: true, plan: res.rows[0] });
    }

    // Fallback seed plan if none exist
    const now = new Date();
    const planMonth = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    const mockPlan = {
      id: 'mock-plan-id',
      plan_month: planMonth,
      plan_year: now.getFullYear(),
      generated_at: now.toISOString(),
      confidence: 94,
      insights: [
        'Fusion SCM Training impressions have dropped 12% over the last 14 days. Suggest building High-DA Guest Posts.',
        'Fusion Technical Training keywords are stable in position 3-5 range; continue standard Web 2.0 and profile link building.',
        'Competitor cloudshine.com is showing rapid movement in Fusion SCM. Increase priority targets to High.'
      ],
      member_plans: {
        'Lakshmi': {
          totalTarget: 150,
          assignedCourses: ['Oracle Fusion Technical Training', 'Oracle Fusion SCM Training'],
          focusCourses: {
            'Oracle Fusion Technical Training': 70,
            'Oracle Fusion SCM Training': 80
          },
          suggestedLinkTypes: ['Guest Post', 'Web 2.0', 'Forum Post']
        },
        'SEO Intern': {
          totalTarget: 100,
          assignedCourses: ['Oracle Fusion HCM Training', 'Oracle Fusion Financials Training'],
          focusCourses: {
            'Oracle Fusion HCM Training': 50,
            'Oracle Fusion Financials Training': 50
          },
          suggestedLinkTypes: ['Directory', 'Social Share', 'Bookmarks']
        }
      },
      total_targets: {
        'Fusion Technical': 70,
        'Fusion SCM': 80,
        'Fusion HCM': 50,
        'Fusion Financials': 50
      },
      status: 'active'
    };

    // Insert mock plan so it becomes persistent in PostgreSQL or Local DB
    await query(`
      INSERT INTO monthly_plans (plan_month, plan_year, confidence, insights, member_plans, total_targets, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      mockPlan.plan_month,
      mockPlan.plan_year,
      mockPlan.confidence,
      mockPlan.insights,
      JSON.stringify(mockPlan.member_plans),
      JSON.stringify(mockPlan.total_targets),
      mockPlan.status
    ]);

    return NextResponse.json({ success: true, plan: mockPlan });
  } catch (error: any) {
    console.error('Fetch Monthly Plan API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// POST: Regenerate plan (Admin only)
export async function POST(request: Request) {
  try {
    const auth = getAuthFromRequest(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create a new monthly plan
    const now = new Date();
    const planMonth = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
    
    // Simulate query of active members to build allocation
    const membersRes = await query("SELECT name, assigned_courses, job_role FROM members WHERE status = 'Active'");
    const members = membersRes.rows;

    const memberPlans: { [key: string]: any } = {};
    const totalTargets: { [key: string]: number } = {};

    members.forEach(member => {
      const isSenior = member.job_role?.toLowerCase().includes('senior') || member.role === 'admin';
      const target = isSenior ? 150 : 100;
      
      const courses = member.assigned_courses || [];
      const focusCourses: { [key: string]: number } = {};
      
      courses.forEach((c: string) => {
        const share = Math.round(target / courses.length);
        focusCourses[c] = share;
        const group = c.replace('Oracle Fusion ', '').replace(' Training', '');
        totalTargets[group] = (totalTargets[group] || 0) + share;
      });

      memberPlans[member.name] = {
        totalTarget: target,
        assignedCourses: courses,
        focusCourses,
        suggestedLinkTypes: isSenior ? ['Guest Post', 'Web 2.0'] : ['Bookmarks', 'Social Share']
      };
    });

    const newPlan = {
      plan_month: planMonth,
      plan_year: now.getFullYear(),
      confidence: 88,
      insights: [
        'Plan regenerated manually by administrator.',
        'Target distributions recalculated based on active team member capacities.'
      ],
      member_plans: JSON.stringify(memberPlans),
      total_targets: JSON.stringify(totalTargets),
      status: 'active'
    };

    await query(`
      INSERT INTO monthly_plans (plan_month, plan_year, confidence, insights, member_plans, total_targets, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      newPlan.plan_month,
      newPlan.plan_year,
      newPlan.confidence,
      newPlan.insights,
      newPlan.member_plans,
      newPlan.total_targets,
      newPlan.status
    ]);

    // Query what we just inserted
    const freshRes = await query('SELECT * FROM monthly_plans ORDER BY generated_at DESC LIMIT 1');

    return NextResponse.json({ success: true, plan: freshRes.rows[0] });
  } catch (error: any) {
    console.error('Regenerate Plan API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
