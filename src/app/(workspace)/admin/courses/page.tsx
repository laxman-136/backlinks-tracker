'use client';

import { useState, useEffect } from 'react';
import { BookOpen, Plus, Save, Loader } from 'lucide-react';

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  // Form states
  const [courseName, setCourseName] = useState('');
  const [keywordGroup, setKeywordGroup] = useState('');
  const [property, setProperty] = useState('Both');
  const [priority, setPriority] = useState('Medium');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const res = await fetch('/api/admin/courses').then(r => r.json());
        if (res.success) setCourses(res.courses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseName, keywordGroup, property, priority })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add course');

      // Reset
      setCourseName('');
      setKeywordGroup('');
      setProperty('Both');
      setPriority('Medium');
      setShowForm(false);

      // Reload
      const fresh = await fetch('/api/admin/courses').then(r => r.json());
      if (fresh.success) setCourses(fresh.courses);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12 text-brand-muted font-mono">Loading courses...</div>;
  }

  const getPriorityBadge = (p: string) => {
    if (p === 'High') return 'text-brand-danger bg-brand-danger/10 border-brand-danger/20';
    if (p === 'Medium') return 'text-brand-warning bg-brand-warning/10 border-brand-warning/20';
    return 'text-brand-success bg-brand-success/10 border-brand-success/20';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">📚 Manage Courses</h2>
          <p className="text-sm text-brand-muted mt-1">Configure training courses and keyword groups.</p>
        </div>

        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <Plus size={14} />
            <span>Add Course</span>
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl relative overflow-hidden space-y-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Add Course & Keyword Group</h3>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 sm:grid-cols-4 gap-6 items-end">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Course Name</label>
              <input
                type="text"
                required
                value={courseName}
                onChange={(e) => setCourseName(e.target.value)}
                placeholder="e.g. Oracle Fusion Technical Training"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Keyword Group Name</label>
              <input
                type="text"
                required
                value={keywordGroup}
                onChange={(e) => setKeywordGroup(e.target.value)}
                placeholder="e.g. Fusion Technical"
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Property</label>
              <select
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              >
                <option value="Both">Both (TLI + SOT)</option>
                <option value="TLI">TLI</option>
                <option value="SOT">SOT</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-brand-muted uppercase">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2 px-3 text-xs text-white outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="sm:col-span-4 flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-brand-border hover:bg-brand-card text-brand-text rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white font-semibold rounded-xl text-xs flex items-center gap-1"
              >
                {saving ? <Loader className="animate-spin" size={12} /> : <Save size={12} />}
                <span>Save Course</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Grid list */}
      <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[700px]">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted text-[10px] uppercase font-bold tracking-wider font-mono">
                <th className="px-6 py-3.5 w-64">Course Name</th>
                <th className="px-4 py-3.5 w-48">Keyword Group</th>
                <th className="px-4 py-3.5 w-24 text-center">Property</th>
                <th className="px-4 py-3.5 w-28 text-center">Priority</th>
                <th className="px-4 py-3.5 w-32 text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} className="border-b border-brand-border/40 hover:bg-brand-card/20 transition-colors text-xs">
                  <td className="px-6 py-3.5 font-semibold text-white">{c.course_name}</td>
                  <td className="px-4 py-3.5 font-semibold text-brand-text font-mono">{c.keyword_group}</td>
                  <td className="px-4 py-3.5 text-center font-mono text-brand-muted">{c.property}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border ${getPriorityBadge(c.priority)}`}>
                      {c.priority}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-brand-success/10 border border-brand-success/20 text-brand-success font-bold uppercase">
                      {c.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
