import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/auth';
import Sidebar from '@/components/Sidebar';

export default async function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('seo_auth')?.value;

  if (!token) {
    redirect('/login');
  }

  const payload = verifyToken(token);
  if (!payload) {
    redirect('/login');
  }

  const user = {
    name: payload.name,
    username: payload.username,
    role: payload.role,
  };

  return (
    <div className="min-h-screen bg-brand-bg flex text-brand-text">
      {/* Sidebar - Fixed 240px */}
      <Sidebar user={user} />

      {/* Main Content Area */}
      <div className="flex-1 pl-60 flex flex-col min-h-screen">
        {/* Top Header */}
        <header className="h-16 border-b border-brand-border bg-brand-surface/40 flex items-center justify-between px-8 sticky top-0 z-10 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-brand-muted">ENVIRONMENT:</span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
              process.env.DATABASE_URL 
                ? 'bg-brand-success/10 text-brand-success border border-brand-success/20' 
                : 'bg-brand-warning/10 text-brand-warning border border-brand-warning/20'
            }`}>
              {process.env.DATABASE_URL ? 'Neon PostgreSQL' : 'Local Demo Mode'}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right">
              <span className="text-xs text-brand-muted block font-mono">Assigned courses:</span>
              <span className="text-xs font-medium text-white truncate max-w-[200px] block">
                {payload.assignedCourses && payload.assignedCourses.length > 0 
                  ? payload.assignedCourses.join(', ') 
                  : 'All Courses'}
              </span>
            </div>
            <div className="h-8 w-px bg-brand-border"></div>
            <div className="text-right">
              <span className="text-xs text-brand-muted block font-mono">Property:</span>
              <span className="text-xs font-bold text-brand-primary uppercase">
                {payload.assignedProperty}
              </span>
            </div>
          </div>
        </header>

        {/* Dynamic Content Panel */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
