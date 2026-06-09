'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Link2, 
  ClipboardList, 
  TrendingUp, 
  Globe, 
  Users, 
  KeyRound, 
  AlertTriangle, 
  CalendarDays,
  UserCheck,
  BookOpen,
  ShieldAlert,
  BarChart3,
  Activity,
  Brain,
  LogOut,
  AppWindow
} from 'lucide-react';

interface SidebarProps {
  user: {
    name: string;
    username: string;
    role: 'team' | 'admin';
  };
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isActive = (path: string) => pathname === path;

  const linkClass = (path: string) => {
    const active = isActive(path);
    return `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
      active 
        ? 'bg-brand-primary text-white shadow-md shadow-brand-primary/20' 
        : 'text-brand-text/75 hover:text-white hover:bg-brand-card'
    }`;
  };

  return (
    <aside className="w-60 bg-brand-surface border-r border-brand-border flex flex-col h-screen fixed left-0 top-0 z-20">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-brand-border bg-brand-bg/50">
        <div className="w-8 h-8 rounded-lg bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/25">
          <Brain size={18} />
        </div>
        <div>
          <h1 className="font-semibold text-white tracking-tight leading-none text-sm">SEO Intelligence</h1>
          <span className="text-[10px] text-brand-muted font-mono">TechLeads IT</span>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
        {/* Workspace Section */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider px-3">My Workspace</span>
          <nav className="space-y-1 flex flex-col">
            <Link href="/dashboard" className={linkClass('/dashboard')}>
              <LayoutDashboard size={16} />
              <span>My Dashboard</span>
            </Link>
            <Link href="/entry" className={linkClass('/entry')}>
              <Link2 size={16} />
              <span>Log Backlinks</span>
            </Link>
            <Link href="/worklog" className={linkClass('/worklog')}>
              <ClipboardList size={16} />
              <span>Work Log</span>
            </Link>
            <Link href="/performance" className={linkClass('/performance')}>
              <TrendingUp size={16} />
              <span>My Performance</span>
            </Link>
          </nav>
        </div>

        {/* Knowledge Base Section */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider px-3">Domain Library</span>
          <nav className="space-y-1 flex flex-col">
            <Link href="/domain-library" className={linkClass('/domain-library')}>
              <Globe size={16} />
              <span>Shared Library</span>
            </Link>
          </nav>
        </div>

        {/* Team & Keywords Section */}
        <div className="space-y-2">
          <span className="text-[10px] font-bold text-brand-muted uppercase tracking-wider px-3">Team & Keywords</span>
          <nav className="space-y-1 flex flex-col">
            <Link href="/team-performance" className={linkClass('/team-performance')}>
              <Users size={16} />
              <span>Team Performance</span>
            </Link>
            <Link href="/keywords" className={linkClass('/keywords')}>
              <KeyRound size={16} />
              <span>All Keywords</span>
            </Link>
            <Link href="/alerts" className={linkClass('/alerts')}>
              <AlertTriangle size={16} />
              <span>⚠️ Alerts</span>
            </Link>
            <Link href="/monthly-plan" className={linkClass('/monthly-plan')}>
              <CalendarDays size={16} />
              <span>📅 Monthly Plan</span>
            </Link>
          </nav>
        </div>

        {/* Admin Command Section (Conditionally Rendered) */}
        {user.role === 'admin' && (
          <div className="space-y-2 pt-2 border-t border-brand-border">
            <span className="text-[10px] font-bold text-brand-purple uppercase tracking-wider px-3">⚙️ Admin Control</span>
            <nav className="space-y-1 flex flex-col">
              <Link href="/admin/members" className={linkClass('/admin/members')}>
                <UserCheck size={16} />
                <span>Manage Members</span>
              </Link>
              <Link href="/admin/websites" className={linkClass('/admin/websites')}>
                <AppWindow size={16} />
                <span>Manage Websites</span>
              </Link>
              <Link href="/admin/courses" className={linkClass('/admin/courses')}>
                <BookOpen size={16} />
                <span>Manage Courses</span>
              </Link>
              <Link href="/admin/competitors" className={linkClass('/admin/competitors')}>
                <ShieldAlert size={16} />
                <span>Manage Competitors</span>
              </Link>
              <Link href="/admin/members-data" className={linkClass('/admin/members-data')}>
                <BarChart3 size={16} />
                <span>All Members' Data</span>
              </Link>
              <Link href="/admin/api-status" className={linkClass('/admin/api-status')}>
                <Activity size={16} />
                <span>API Status</span>
              </Link>
              <Link href="/admin/ml-settings" className={linkClass('/admin/ml-settings')}>
                <Brain size={16} />
                <span>ML Settings</span>
              </Link>
            </nav>
          </div>
        )}
      </div>

      {/* Profile & Logout Footer */}
      <div className="p-4 border-t border-brand-border bg-brand-bg/20 flex flex-col gap-3">
        <div className="flex items-center gap-3 px-2">
          <div className="w-9 h-9 rounded-full bg-brand-card border border-brand-border flex items-center justify-center font-semibold text-brand-primary text-sm uppercase">
            {user.name.substring(0, 2)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate leading-tight">{user.name}</p>
            <p className="text-[10px] text-brand-muted font-mono truncate capitalize">{user.role} | {user.username}</p>
          </div>
        </div>
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-brand-danger bg-brand-danger/10 hover:bg-brand-danger/20 rounded-lg transition-colors border border-brand-danger/20"
        >
          <LogOut size={12} />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
}
