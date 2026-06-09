import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('x-cron-secret');
    const cronSecret = process.env.CRON_SECRET || 'cron_jobs_verification_token';
    
    if (authHeader !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    // Verify it is the first day of the month (skip if forced)
    const today = new Date();
    if (today.getDate() !== 1 && !force) {
      return NextResponse.json({ skipped: 'Not the first day of the month. Pass ?force=true to override.' });
    }

    const planMonth = today.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

    // Retrieve active members
    const membersRes = await query("SELECT id, name, assigned_courses, job_role FROM members WHERE status = 'Active'");
    const members = membersRes.rows;

    if (members.length === 0) {
      return NextResponse.json({ success: false, error: 'No active members to assign plan targets' });
    }

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
      plan_year: today.getFullYear(),
      confidence: 90,
      insights: [
        'Plan generated automatically by the GSC ML engine.',
        `Target allocation completed for ${members.length} team members.`
      ],
      member_plans: JSON.stringify(memberPlans),
      total_targets: JSON.stringify(totalTargets),
      status: 'active'
    };

    // Save monthly plan
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

    // Send notifications to members
    for (const member of members) {
      const targetDetails = memberPlans[member.name];
      if (targetDetails) {
        await query(`
          INSERT INTO notifications (member_id, type, title, message)
          VALUES ($1, 'plan', $2, $3)
        `, [
          member.id,
          `📅 New Monthly Plan Activated: ${planMonth}`,
          `Your target is ${targetDetails.totalTarget} backlinks. Focus courses: ${targetDetails.assignedCourses.join(', ')}.`
        ]);
      }
    }

    return NextResponse.json({ success: true, month: planMonth, membersAssigned: members.length });
  } catch (error: any) {
    console.error('Monthly Plan Cron Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
