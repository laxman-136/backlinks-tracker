'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, X, Calendar, AlertTriangle, ShieldCheck, Info } from 'lucide-react';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
}

interface NotificationPanelProps {
  notifications: Notification[];
}

export default function NotificationPanel({ notifications: initialNotifications }: NotificationPanelProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);

  const handleDismiss = async (id: string) => {
    try {
      const res = await fetch('/api/notifications/dismiss', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });

      if (res.ok) {
        setNotifications(prev => prev.filter(n => n.id !== id));
        router.refresh();
      }
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'plan':
        return <Calendar size={16} className="text-brand-primary" />;
      case 'alert':
        return <AlertTriangle size={16} className="text-brand-danger" />;
      case 'recovery':
        return <ShieldCheck size={16} className="text-brand-success" />;
      default:
        return <Info size={16} className="text-brand-purple" />;
    }
  };

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-brand-muted uppercase tracking-wider px-1">
        <Bell size={14} className="text-brand-primary" />
        <span>Recent Notifications ({notifications.length})</span>
      </div>

      <div className="space-y-2">
        {notifications.map((notif) => (
          <div 
            key={notif.id} 
            className="bg-brand-surface border border-brand-border rounded-xl p-4 flex items-start justify-between gap-4 shadow-lg shadow-black/5"
          >
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-brand-bg flex items-center justify-center border border-brand-border shrink-0 mt-0.5">
                {getIcon(notif.type)}
              </div>
              <div className="min-w-0">
                <h5 className="font-semibold text-white text-xs leading-none">{notif.title}</h5>
                <p className="text-xs text-brand-muted mt-1 leading-normal">{notif.message}</p>
                <span className="text-[9px] text-brand-muted/70 font-mono mt-2 block">
                  {new Date(notif.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <button 
              onClick={() => handleDismiss(notif.id)}
              className="text-brand-muted hover:text-white p-1 hover:bg-brand-bg rounded-lg transition-all shrink-0"
              title="Dismiss"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
