import { useState, useEffect } from 'react';
import { Bell, BellOff, Send, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { requestAndSubscribe } from '../services/pushNotificationService';
import { getAuth } from 'firebase/auth';
import { cn } from '../lib/utils';

export function NotificationDebug() {
  const [permission, setPermission] = useState<NotificationPermission>(Notification.permission);
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Poll for permission changes (since there's no native event for this)
    const interval = setInterval(() => {
      setPermission(Notification.permission);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSubscribe = async () => {
    setIsSubscribing(true);
    setStatus('idle');
    setError(null);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      if (!user) throw new Error('User not logged in');
      
      const token = await user.getIdToken();
      await requestAndSubscribe(user.uid, token);
      
      setStatus('success');
      setPermission(Notification.permission);
    } catch (err: any) {
      console.error('[NotificationDebug] Subscription failed:', err);
      setStatus('error');
      setError(err.message || 'Subscription failed');
    } finally {
      setIsSubscribing(false);
    }
  };

  const testPush = async () => {
    try {
      alert('To test live: Mark any task as "Completed" in your dashboard.');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-4 bg-card rounded-none border border-border space-y-3 transition-colors">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-muted uppercase tracking-wider font-serif">Push Status</h3>
        {permission === 'granted' ? (
          <CheckCircle2 className="w-4 h-4 text-[#da7756]" />
        ) : permission === 'denied' ? (
          <BellOff className="w-4 h-4 text-red-500" />
        ) : (
          <AlertCircle className="w-4 h-4 text-amber-500" />
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className={cn(
          "px-2 py-1 rounded-none text-[10px] font-medium font-serif",
          permission === 'granted' ? "bg-[#da7756]/10 text-[#da7756]" :
          permission === 'denied' ? "bg-red-500/10 text-red-500" :
          "bg-amber-500/10 text-amber-500"
        )}>
          {permission.toUpperCase()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <button
          onClick={handleManualSubscribe}
          disabled={isSubscribing}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-background hover:bg-card disabled:opacity-50 text-xs font-medium rounded-none transition-colors border border-border text-foreground font-serif"
        >
          <RefreshCw className={cn("w-3 h-3", isSubscribing && "animate-spin")} />
          {isSubscribing ? 'Subscribing...' : 'Sync Push'}
        </button>

        {permission === 'granted' && (
          <button
            onClick={testPush}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-[#da7756]/10 hover:bg-[#da7756]/20 text-[#da7756] text-xs font-medium rounded-none transition-colors border border-[#da7756]/20 font-serif"
          >
            <Send className="w-3.5 h-3.5" />
            Test Live Banner
          </button>
        )}
      </div>

      {status === 'error' && (
        <p className="text-[10px] text-red-400 mt-1 font-serif">{error}</p>
      )}
    </div>
  );
}
