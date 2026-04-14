import { useState, useRef, useEffect } from 'react';
import { Bell, X, AlertTriangle, AlertCircle, Info, CheckCheck, Zap } from 'lucide-react';
import { useNotifications, AppNotification } from '../context/NotificationContext';
import { useNavigate } from 'react-router-dom';

function NotificationIcon({ type }: { type: AppNotification['type'] }) {
  if (type === 'limit_reached') return <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />;
  if (type === 'warning') return <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />;
  return <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function NotificationBell() {
  const { activeNotifications, unreadCount, dismissNotification, dismissAll } = useNotifications();
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown on outside click
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', onOutside);
    return () => document.removeEventListener('mousedown', onOutside);
  }, [open]);

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        id="notification-bell-btn"
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full hover:bg-slate-100 transition-colors focus:outline-none"
        aria-label="Notifications"
      >
        <Bell className="h-5 w-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-2xl z-[200] overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
            <span className="text-sm font-semibold text-slate-800">
              Notifications {unreadCount > 0 && (
                <span className="ml-1.5 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{unreadCount}</span>
              )}
            </span>
            {activeNotifications.length > 0 && (
              <button
                onClick={dismissAll}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700 transition-colors"
              >
                <CheckCheck className="h-3 w-3" />
                Clear all
              </button>
            )}
          </div>

          {/* Notification list */}
          <div className="max-h-72 overflow-y-auto divide-y divide-slate-50">
            {activeNotifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <Bell className="h-8 w-8 mb-2 opacity-30" />
                <p className="text-sm">No notifications</p>
              </div>
            ) : (
              activeNotifications.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 px-4 py-3 transition-colors hover:bg-slate-50 ${
                    n.type === 'limit_reached' ? 'bg-red-50/50' :
                    n.type === 'warning' ? 'bg-amber-50/50' : ''
                  }`}
                >
                  <NotificationIcon type={n.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{n.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{timeAgo(n.created_at)}</p>
                  </div>
                  <button
                    onClick={() => dismissNotification(n.id)}
                    className="flex-shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
                    aria-label="Dismiss"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer CTA when limit reached */}
          {activeNotifications.some(n => n.type === 'limit_reached') && (
            <div className="border-t border-slate-100 px-4 py-3 bg-gradient-to-r from-amber-50 to-orange-50">
              <button
                onClick={() => { navigate('/roadmap'); setOpen(false); }}
                className="flex items-center gap-2 w-full justify-center bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold px-3 py-2 rounded-lg hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                Upgrade to Premium
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
