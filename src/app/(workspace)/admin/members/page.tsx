'use client';

import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  Edit3, 
  CheckCircle, 
  XCircle, 
  Lock,
  Loader,
  Save,
  Check
} from 'lucide-react';

export default function AdminMembersPage() {
  const [members, setMembers] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Form edit states
  const [editingMember, setEditingMember] = useState<any>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'team' | 'admin'>('team');
  const [jobRole, setJobRole] = useState('SEO Intern');
  const [assignedCourses, setAssignedCourses] = useState<string[]>([]);
  const [assignedProperty, setAssignedProperty] = useState('Both');
  const [status, setStatus] = useState('Active');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [mRes, cRes] = await Promise.all([
          fetch('/api/admin/members').then(r => r.json()),
          fetch('/api/courses').then(r => r.json())
        ]);
        if (mRes.success) setMembers(mRes.members);
        if (cRes.success) setCourses(cRes.courses);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleEditClick = (member: any) => {
    setEditingMember(member);
    setName(member.name);
    setUsername(member.username);
    setRole(member.role);
    setJobRole(member.job_role || 'SEO Intern');
    setAssignedCourses(member.assigned_courses || []);
    setAssignedProperty(member.assigned_property || 'Both');
    setStatus(member.status || 'Active');
    setShowAddForm(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');

    const payload = editingMember
      ? {
          id: editingMember.id,
          name,
          role,
          jobRole,
          assignedCourses,
          assignedProperty,
          status
        }
      : {
          name,
          username,
          password,
          role,
          jobRole,
          assignedCourses,
          assignedProperty,
          status: 'Active'
        };

    try {
      const res = await fetch('/api/admin/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save member');

      setSuccessMsg(editingMember ? 'Member updated!' : 'Member created!');
      
      // Refresh list
      const freshRes = await fetch('/api/admin/members').then(r => r.json());
      if (freshRes.success) setMembers(freshRes.members);

      setTimeout(() => {
        setSuccessMsg('');
        setEditingMember(null);
        setShowAddForm(false);
        resetForm();
      }, 1500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setName('');
    setUsername('');
    setPassword('');
    setRole('team');
    setJobRole('SEO Intern');
    setAssignedCourses([]);
    setAssignedProperty('Both');
    setStatus('Active');
  };

  const toggleCourseAssignment = (courseName: string) => {
    setAssignedCourses(prev => 
      prev.includes(courseName)
        ? prev.filter(c => c !== courseName)
        : [...prev, courseName]
    );
  };

  if (loading) {
    return <div className="text-center py-12 text-brand-muted font-mono">Loading team logs...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">👥 Manage SEO Members</h2>
          <p className="text-sm text-brand-muted mt-1">Register new team members and assign course focuses.</p>
        </div>
        
        {!showAddForm && !editingMember && (
          <button
            onClick={() => { resetForm(); setShowAddForm(true); }}
            className="flex items-center gap-2 px-4 py-2 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-xs font-semibold transition-colors"
          >
            <UserPlus size={14} />
            <span>Add Member</span>
          </button>
        )}
      </div>

      {successMsg && (
        <div className="bg-brand-success/10 border border-brand-success/20 text-brand-success rounded-xl p-4 flex items-center gap-2 text-xs">
          <Check size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Editor / Creator Panel */}
      {(showAddForm || editingMember) && (
        <div className="bg-brand-surface border border-brand-border rounded-xl p-6 shadow-xl relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 right-0 h-1 bg-brand-primary"></div>
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {editingMember ? `Edit Profile: ${editingMember.username}` : 'Create New Member Profile'}
          </h3>

          <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side Form */}
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-brand-muted uppercase">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2.5 px-4 text-xs text-white outline-none"
                />
              </div>

              {!editingMember && (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted uppercase">Username</label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="e.g. rahul"
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2.5 px-4 text-xs text-white outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted uppercase">Temporary Password</label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2.5 px-4 text-xs text-white outline-none"
                    />
                  </div>
                </>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase">System Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2.5 px-3 text-xs text-white outline-none"
                  >
                    <option value="team">Team Member</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase">Job Title</label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    placeholder="e.g. Senior SEO Manager"
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2.5 px-4 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-muted uppercase">Website Scope</label>
                  <select
                    value={assignedProperty}
                    onChange={(e) => setAssignedProperty(e.target.value)}
                    className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2.5 px-3 text-xs text-white outline-none font-mono"
                  >
                    <option value="Both">Both (TLI + SOT)</option>
                    <option value="TLI">TLI Only</option>
                    <option value="SOT">SOT Only</option>
                  </select>
                </div>

                {editingMember && (
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-muted uppercase">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full bg-brand-bg border border-brand-border focus:border-brand-primary rounded-xl py-2.5 px-3 text-xs text-white outline-none"
                    >
                      <option value="Active">Active Account</option>
                      <option value="Inactive">Deactivated</option>
                    </select>
                  </div>
                )}
              </div>
            </div>

            {/* Right side course checklist */}
            <div className="space-y-4 flex flex-col justify-between">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-brand-muted uppercase block">Assigned Focus Courses</label>
                <div className="bg-brand-bg border border-brand-border rounded-xl p-4 max-h-[180px] overflow-y-auto space-y-2">
                  {courses.map(c => (
                    <label 
                      key={c.id} 
                      className="flex items-center gap-2.5 text-xs text-brand-text cursor-pointer hover:text-white"
                    >
                      <input
                        type="checkbox"
                        checked={assignedCourses.includes(c.course_name)}
                        onChange={() => toggleCourseAssignment(c.course_name)}
                        className="rounded bg-brand-bg border-brand-border text-brand-primary focus:ring-0"
                      />
                      <span>{c.course_name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4 border-t border-brand-border/40">
                <button
                  type="button"
                  onClick={() => { setEditingMember(null); setShowAddForm(false); resetForm(); }}
                  className="flex-1 py-2.5 border border-brand-border hover:bg-brand-card text-brand-text rounded-xl text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2.5 bg-brand-primary hover:bg-brand-primary/95 text-white font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? <Loader className="animate-spin" size={14} /> : <Save size={14} />}
                  <span>Save Profile</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Members Grid List */}
      <div className="bg-brand-surface border border-brand-border rounded-xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-brand-bg/50 border-b border-brand-border text-brand-muted text-[10px] uppercase font-bold tracking-wider font-mono">
                <th className="px-6 py-3.5 w-60">Staff Member</th>
                <th className="px-4 py-3.5 w-40">Job Title</th>
                <th className="px-4 py-3.5 w-32">Username</th>
                <th className="px-4 py-3.5 w-32">Scope</th>
                <th className="px-4 py-3.5 w-32 text-center">Status</th>
                <th className="px-6 py-3.5 w-32 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-brand-border/40 hover:bg-brand-card/20 transition-colors">
                  <td className="px-6 py-3.5 font-semibold text-white flex items-center gap-3">
                    <div className="w-8.5 h-8.5 rounded-full bg-brand-card border border-brand-border flex items-center justify-center font-bold text-brand-primary text-xs uppercase">
                      {m.name.substring(0, 2)}
                    </div>
                    <div>
                      <span className="block text-xs">{m.name}</span>
                      <span className="text-[10px] text-brand-muted font-mono">{m.role.toUpperCase()}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-brand-text font-medium">{m.job_role || 'SEO Analyst'}</td>
                  <td className="px-4 py-3.5 text-xs font-mono text-white">{m.username}</td>
                  <td className="px-4 py-3.5 text-xs font-mono text-brand-primary">{m.assigned_property}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      m.status === 'Active' 
                        ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' 
                        : 'bg-brand-danger/10 text-brand-danger border border-brand-danger/20'
                    }`}>
                      {m.status === 'Active' ? <CheckCircle size={10} /> : <XCircle size={10} />}
                      <span>{m.status}</span>
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-center">
                    <button
                      onClick={() => handleEditClick(m)}
                      className="text-brand-muted hover:text-white p-1 hover:bg-brand-bg rounded transition-colors"
                      title="Edit Member Profile"
                    >
                      <Edit3 size={14} />
                    </button>
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
