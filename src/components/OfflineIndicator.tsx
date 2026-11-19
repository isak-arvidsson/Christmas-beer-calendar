import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus.ts';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-4 left-4 right-4 sm:right-auto z-50 flex items-center gap-2.5 rounded-xl bg-amber-500 px-3.5 py-2 text-xs font-semibold text-slate-950 shadow-xl border border-amber-300/60"
    >
      <WifiOff className="w-4 h-4 shrink-0" />
      <span>Offline-läge — kontrollerar anslutningen till databasen...</span>
    </div>
  );
};
