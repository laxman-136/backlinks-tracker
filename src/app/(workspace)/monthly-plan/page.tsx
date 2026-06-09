'use client';

import { useState, useEffect } from 'react';
import { 
  Calendar, 
  Brain, 
  Target, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight,
  RefreshCw,
  Loader
} from 'lucide-react';

export default function MonthlyPlanPage() {
  const [plan, setPlan] = useState<any>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  useEffect(() => {
    async function loadPlan() {
      try {
        // Fetch current session for role check
        // (We can read role from page session cookie via a quick request or parse)
        // Let's call /api/monthly-plan
        const res = await fetch('/api/monthly-plan').then(r => r.json());
        
        // Quick session check to see if user is admin
        // We'll read the sidebar user object in layout, but here we can check local storage or auth cookies
        // Better: decode token, or since we don't have decode here, fetch a quick profile check
        // Or simply determine if we can regenerate based on API response
        const meRes = await fetch('/api/team-performance').then(r => r.json());

        if (res.success) {
          setPlan(res.plan);
        }
        if (meRes.success && meRes.mode === 'admin') {
          setIsAdmin(true);
        }
      } catch (err) {
        console.error('Failed to load monthly plan:', err);
      } finally {
        setLoading(false);
      }
    }

    loadPlan();
  }, []);

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const res = await fetch('/api/monthly-plan', { method: 'POST' }).then(r => r.json());
      if (res.success) {
        setPlan(res.plan);
      } else {
        alert(res.error || 'Regeneration failed');
      }
    } catch (err) {
      console.error(err);
      alert('Error regenerating plan');
    } finally {
      setRegenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader className="animate-spin text-brand-primary" size={32} />
        <p className="text-brand-muted text-sm font-mono">Running ML planner engines...</p>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="text-center py-12 text-brand-muted font-mono">
        No active monthly plan found.
      </div>
    );
  }

  // Parse JSON fields
  const memberPlans = typeof plan.member_plans === 'string' 
    ? JSON.parse(plan.member_plans) 
    : plan.member_plans || {};

  const totalTargets = typeof plan.total_targets === 'string' 
    ? JSON.parse(plan.total_targets) 
    : plan.total_targets || {};

  const memberKeys = Object.keys(memberPlans);
  const totalTargetLinks = Object.values(memberPlans).reduce((sum: number, mp: any) => sum + (mp.totalTarget || 0), 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">📅 Monthly Action Plan</h2>
          <p className="text-sm text-brand-muted mt-1">
            Plan targets generated automatically by the ML engine based on keyword ranks.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleRegenerate}
            disabled={regenerating}
            className="flex items-center gap-2 px-4 py-2 bg-brand-purple hover:bg-brand-purple/95 text-white rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
          >
            {regenerating ? <Loader className="animate-spin" size={14} /> : <RefreshCw size={14} />}
            <span>Regenerate Targets</span>
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Month */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Target Month</span>
          <div className="flex items-baseline gap-2 mt-4 text-white font-semibold text-lg">
            <Calendar size={18} className="text-brand-primary" />
            <span>{plan.plan_month}</span>
          </div>
        </div>

        {/* Confidence */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">ML Confidence</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-2xl font-bold text-brand-success font-mono">{plan.confidence}%</span>
            <span className="text-xs text-brand-muted">confidence rate</span>
          </div>
        </div>

        {/* Total Target */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Total link targets</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-2xl font-bold text-brand-primary font-mono">{totalTargetLinks}</span>
            <span className="text-xs text-brand-muted">links needed</span>
          </div>
        </div>

        {/* Assigned Members */}
        <div className="bg-brand-surface border border-brand-border rounded-xl p-4 flex flex-col justify-between">
          <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Active Staff Allocations</span>
          <div className="flex items-baseline gap-2 mt-4">
            <span className="text-2xl font-bold text-brand-purple font-mono">{memberKeys.length}</span>
            <span className="text-xs text-brand-muted">team members</span>
          </div>
        </div>
      </div>

      {/* ML Insights checklist */}
      {plan.insights && plan.insights.length > 0 && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 text-brand-purple">
            <Brain size={18} />
            <h3 className="text-sm font-bold uppercase tracking-wider">🧠 ML Engine Rank Insights</h3>
          </div>
          <ul className="space-y-2">
            {plan.insights.map((insight: string, idx: number) => (
              <li key={idx} className="flex items-start gap-3 bg-brand-bg/40 border border-brand-border/40 rounded-lg p-3 text-xs text-brand-text">
                <AlertCircle size={16} className="text-brand-purple shrink-0 mt-0.5" />
                <span className="font-mono leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Member Allocations Grids */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white tracking-tight">Active Workload Allocations</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {memberKeys.map((name) => {
            const mp = memberPlans[name];
            return (
              <div 
                key={name} 
                className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl relative overflow-hidden space-y-6 flex flex-col justify-between"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>
                
                {/* Header info */}
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="font-bold text-white text-sm">{name}</h4>
                    <span className="text-[10px] text-brand-muted font-mono uppercase">Assigned Team Member</span>
                  </div>
                  <div className="text-right">
                    <span className="text-base font-extrabold text-brand-primary font-mono">{mp.totalTarget}</span>
                    <span className="text-[9px] text-brand-muted block font-mono">link target</span>
                  </div>
                </div>

                {/* Course Allocations list */}
                <div className="space-y-3 pt-4 border-t border-brand-border/40">
                  <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Target Course Distributions</span>
                  <div className="space-y-2">
                    {Object.entries(mp.focusCourses || {}).map(([course, count]: any) => (
                      <div key={course} className="flex justify-between items-center text-xs font-mono">
                        <span className="text-brand-text truncate max-w-[200px]" title={course}>{course}</span>
                        <span className="text-white font-bold">{count} links</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Suggested link types */}
                <div className="space-y-2 pt-4 border-t border-brand-border/40">
                  <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider block">Suggested link types</span>
                  <div className="flex flex-wrap gap-1.5">
                    {mp.suggestedLinkTypes?.map((t: string) => (
                      <span key={t} className="px-2 py-0.5 bg-brand-bg border border-brand-border rounded text-[10px] text-white font-mono">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
