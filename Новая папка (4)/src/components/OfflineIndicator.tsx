import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineIndicator() {
  const [offline, setOffline] = useState(
    typeof navigator !== 'undefined' ? !navigator.onLine : false
  );

  useEffect(() => {
    const onOffline = () => setOffline(true);
    const onOnline = () => setOffline(false);
    window.addEventListener('offline', onOffline);
    window.addEventListener('online', onOnline);
    return () => {
      window.removeEventListener('offline', onOffline);
      window.removeEventListener('online', onOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-2 left-1/2 -translate-x-1/2 z-50 px-3.5 py-1.5 rounded-xl bg-[#161c24]/95 border border-[#ff6a1a]/50 text-white text-xs font-semibold flex items-center gap-2 shadow-lg pointer-events-none"
    >
      <WifiOff className="w-3.5 h-3.5 text-[#ff8b4a] shrink-0" />
      <span>Офлайн-режим</span>
    </div>
  );
}
