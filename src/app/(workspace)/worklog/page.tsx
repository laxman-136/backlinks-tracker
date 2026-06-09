'use client';

import { useState, useEffect } from 'react';
import { 
  ClipboardList, 
  Clock, 
  Search, 
  PenTool, 
  Share2, 
  MessageSquare, 
  TrendingDown, 
  Calendar,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function WorkLogPage() {
  const [memberCourses, setMemberCourses] = useState<string[]>([]);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [logDate, setLogDate] = useState(new Date().toISOString().split('T')[0]);
  const [courseWorkedOn, setCourseWorkedOn] = useState('');
  const [freeNotes, setFreeNotes] = useState('');
  const [websitesResearched, setWebsitesResearched] = useState(0);
  const [daPaChecked, setDaPaChecked] = useState(0);
  const [contentWritten, setContentWritten] = useState(0);
  const [socialPostsShared, setSocialPostsShared] = useState(0);
  const [quoraRedditPosts, setQuoraRedditPosts] = useState(0);
  const [hoursSpent, setHoursSpent] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function initPage() {
      try {
        // Fetch current active courses to populate target dropdown
        const coursesRes = await fetch('/api/courses').then(r => r.json());
        
        // Fetch logs
        const logsRes = await fetch('/api/worklog').then(r => r.json());

        if (coursesRes.success) {
          // If member is team, show only assigned courses, else show all
          const list = coursesRes.courses.map((c: any) => c.course_name);
          setMemberCourses(list);
          if (list.length > 0) setCourseWorkedOn(list[0]);
        }
        
        if (logsRes.success) {
          setRecentLogs(logsRes.logs);
        }
      } catch (err) {
        console.error('Failed to initialize Work Log page:', err);
      } finally {
        setLoading(false);
      }
    }

    initPage();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!hoursSpent || isNaN(parseFloat(hoursSpent)) || parseFloat(hoursSpent) <= 0) {
      setError('Please enter a valid number of hours spent');
      return;
    }

    if (!freeNotes.trim()) {
      setError('Please write a summary of the work done today');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/worklog', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logDate,
          courseWorkedOn,
          freeNotes,
          websitesResearched,
          daPaChecked,
          contentWritten,
          socialPostsShared,
          quoraRedditPosts,
          hoursSpent: parseFloat(hoursSpent)
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save log');
      }

      setSuccess('Log saved successfully!');
      
      // Reset form (except date/course)
      setFreeNotes('');
      setWebsitesResearched(0);
      setDaPaChecked(0);
      setContentWritten(0);
      setSocialPostsShared(0);
      setQuoraRedditPosts(0);
      setHoursSpent('');

      // Refresh list
      const freshLogs = await fetch('/api/worklog').then(r => r.json());
      if (freshLogs.success) {
        setRecentLogs(freshLogs.logs);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const increment = (setter: React.Dispatch<React.SetStateAction<number>>) => {
    setter(prev => prev + 1);
  };

  const decrement = (setter: React.Dispatch<React.SetStateAction<number>>) => {
    setter(prev => Math.max(0, prev - 1));
  };

  if (loading) {
    return <div className="text-center py-12 text-brand-muted font-mono">Loading Work Log...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white tracking-tight">Daily Work Log</h2>
        <p className="text-sm text-brand-muted mt-1">Record your daily activities and SEO progress updates.</p>
      </div>

      {/* Priority Context Box */}
      <div className="bg-brand-card border border-brand-border rounded-xl p-5 flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-brand-danger/10 border border-brand-danger/20 flex items-center justify-center text-brand-danger shrink-0">
          <TrendingDown size={20} />
        </div>
        <div>
          <h4 className="font-semibold text-white text-sm">Suggested Priority Today</h4>
          <p className="text-xs text-brand-muted mt-1">
            Oracle SCM rankings are showing minor volatility (average position dropped by 0.6). 
            Prioritize guest posting on High-DA technology blogs today to stabilize backlink counts.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Entry Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>
            
            <h3 className="text-base font-bold text-white mb-6">Log Today's SEO Activity</h3>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-brand-danger/10 border border-brand-danger/20 text-brand-danger rounded-xl p-3 flex items-start gap-2 text-xs">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              {success && (
                <div className="bg-brand-success/10 border border-brand-success/20 text-brand-success rounded-xl p-3 flex items-start gap-2 text-xs">
                  <CheckCircle2 size={16} className="shrink-0 mt-0.5" />
                  <span>{success}</span>
                </div>
              )}

              {/* Date and Course Selector */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Log Date</label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
                      <Calendar size={16} />
                    </span>
                    <input
                      type="date"
                      required
                      value={logDate}
                      onChange={(e) => setLogDate(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2.5 pl-10 pr-4 text-white text-xs outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Course Worked On</label>
                  <select
                    value={courseWorkedOn}
                    onChange={(e) => setCourseWorkedOn(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2.5 px-4 text-white text-xs outline-none"
                  >
                    {memberCourses.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Counter Grid */}
              <div className="space-y-4">
                <span className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">SEO Action Counters</span>
                
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                  {/* Researched */}
                  <div className="bg-brand-bg border border-brand-border rounded-xl p-3 flex flex-col items-center justify-between text-center gap-2">
                    <Search size={16} className="text-brand-muted" />
                    <span className="text-[10px] text-brand-muted font-semibold leading-none">Researched</span>
                    <div className="flex items-center gap-3 mt-1">
                      <button type="button" onClick={() => decrement(setWebsitesResearched)} className="text-brand-muted hover:text-white font-bold px-1 text-xs">-</button>
                      <span className="text-sm font-bold text-white font-mono">{websitesResearched}</span>
                      <button type="button" onClick={() => increment(setWebsitesResearched)} className="text-brand-muted hover:text-white font-bold px-1 text-xs">+</button>
                    </div>
                  </div>

                  {/* DA Checked */}
                  <div className="bg-brand-bg border border-brand-border rounded-xl p-3 flex flex-col items-center justify-between text-center gap-2">
                    <TrendingDown size={16} className="text-brand-muted" />
                    <span className="text-[10px] text-brand-muted font-semibold leading-none">DA Checked</span>
                    <div className="flex items-center gap-3 mt-1">
                      <button type="button" onClick={() => decrement(setDaPaChecked)} className="text-brand-muted hover:text-white font-bold px-1 text-xs">-</button>
                      <span className="text-sm font-bold text-white font-mono">{daPaChecked}</span>
                      <button type="button" onClick={() => increment(setDaPaChecked)} className="text-brand-muted hover:text-white font-bold px-1 text-xs">+</button>
                    </div>
                  </div>

                  {/* Content Written */}
                  <div className="bg-brand-bg border border-brand-border rounded-xl p-3 flex flex-col items-center justify-between text-center gap-2">
                    <PenTool size={16} className="text-brand-muted" />
                    <span className="text-[10px] text-brand-muted font-semibold leading-none">Wrote Articles</span>
                    <div className="flex items-center gap-3 mt-1">
                      <button type="button" onClick={() => decrement(setContentWritten)} className="text-brand-muted hover:text-white font-bold px-1 text-xs">-</button>
                      <span className="text-sm font-bold text-white font-mono">{contentWritten}</span>
                      <button type="button" onClick={() => increment(setContentWritten)} className="text-brand-muted hover:text-white font-bold px-1 text-xs">+</button>
                    </div>
                  </div>

                  {/* Social Shared */}
                  <div className="bg-brand-bg border border-brand-border rounded-xl p-3 flex flex-col items-center justify-between text-center gap-2">
                    <Share2 size={16} className="text-brand-muted" />
                    <span className="text-[10px] text-brand-muted font-semibold leading-none">Social Shares</span>
                    <div className="flex items-center gap-3 mt-1">
                      <button type="button" onClick={() => decrement(setSocialPostsShared)} className="text-brand-muted hover:text-white font-bold px-1 text-xs">-</button>
                      <span className="text-sm font-bold text-white font-mono">{socialPostsShared}</span>
                      <button type="button" onClick={() => increment(setSocialPostsShared)} className="text-brand-muted hover:text-white font-bold px-1 text-xs">+</button>
                    </div>
                  </div>

                  {/* Q/R Posts */}
                  <div className="bg-brand-bg border border-brand-border rounded-xl p-3 flex flex-col items-center justify-between text-center gap-2">
                    <MessageSquare size={16} className="text-brand-muted" />
                    <span className="text-[10px] text-brand-muted font-semibold leading-none">Quora/Reddit</span>
                    <div className="flex items-center gap-3 mt-1">
                      <button type="button" onClick={() => decrement(setQuoraRedditPosts)} className="text-brand-muted hover:text-white font-bold px-1 text-xs">-</button>
                      <span className="text-sm font-bold text-white font-mono">{quoraRedditPosts}</span>
                      <button type="button" onClick={() => increment(setQuoraRedditPosts)} className="text-brand-muted hover:text-white font-bold px-1 text-xs">+</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Free Text Monospace Area */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Description of Work</label>
                <textarea
                  required
                  rows={6}
                  value={freeNotes}
                  onChange={(e) => setFreeNotes(e.target.value)}
                  placeholder="e.g. Researched 15 oracle job blogs, checked DA for 10. Wrote 2 forum articles targeting SCM keywords..."
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl p-4 text-white text-xs outline-none font-mono focus:ring-2 focus:ring-brand-primary/10"
                ></textarea>
              </div>

              {/* Hours Spent */}
              <div className="space-y-2 max-w-[200px]">
                <label className="text-xs font-semibold text-brand-muted uppercase tracking-wider block">Hours Spent</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-muted">
                    <Clock size={16} />
                  </span>
                  <input
                    type="text"
                    required
                    value={hoursSpent}
                    onChange={(e) => setHoursSpent(e.target.value)}
                    placeholder="e.g. 4.5"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2.5 pl-10 pr-4 text-white text-xs outline-none font-mono"
                  />
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submitting}
                className="flex items-center justify-center gap-2 py-3 px-6 bg-brand-primary hover:bg-brand-primary/95 text-white font-semibold text-xs rounded-xl transition-all shadow-lg disabled:opacity-50"
              >
                {submitting ? 'Saving...' : <><Save size={14} /> <span>Save Log Entry</span></>}
              </button>
            </form>
          </div>
        </div>

        {/* Timeline Log History */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={16} className="text-brand-primary" />
            <h3 className="text-base font-bold text-white tracking-tight">Recent Logs</h3>
          </div>

          <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl max-h-[600px] overflow-y-auto space-y-6">
            {recentLogs.length === 0 ? (
              <div className="text-center py-8 text-brand-muted text-xs font-mono">No work logs recorded in the last 7 days.</div>
            ) : (
              recentLogs.map((log: any, idx: number) => (
                <div key={log.id} className="relative pl-6 border-l border-brand-border pb-2 last:pb-0">
                  {/* Bullet */}
                  <div className="absolute left-[-5px] top-1.5 w-2 .5 h-2.5 rounded-full bg-brand-primary border border-brand-bg"></div>

                  <div className="flex items-center justify-between text-[10px] text-brand-muted font-mono leading-none">
                    <span>{new Date(log.log_date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                    <span className="px-1.5 py-0.5 bg-brand-bg border border-brand-border rounded font-semibold text-white">
                      {log.hours_spent} hrs
                    </span>
                  </div>

                  <span className="text-xs font-bold text-brand-primary block mt-2">{log.course_worked_on}</span>
                  
                  <p className="text-xs text-brand-text font-mono mt-1 whitespace-pre-wrap leading-relaxed bg-brand-bg/50 border border-brand-border/40 rounded-lg p-3">
                    {log.free_notes}
                  </p>

                  <div className="flex flex-wrap gap-2 mt-3 font-mono text-[9px] text-brand-muted">
                    <span className="bg-brand-bg px-2 py-0.5 rounded border border-brand-border">🔍 Researched: {log.websites_researched}</span>
                    <span className="bg-brand-bg px-2 py-0.5 rounded border border-brand-border">📊 Checked: {log.da_pa_checked}</span>
                    <span className="bg-brand-bg px-2 py-0.5 rounded border border-brand-border">✍️ Content: {log.content_written}</span>
                    <span className="bg-brand-bg px-2 py-0.5 rounded border border-brand-border">💬 Reddit/Q: {log.quora_reddit_posts}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
