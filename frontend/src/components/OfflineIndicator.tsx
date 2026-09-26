import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2 rounded-xl bg-amber-600 px-3.5 py-2 text-xs font-medium text-white shadow-lg shadow-amber-900/20 border border-amber-500/40 animate-bounce">
      <WifiOff className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Mode Offline — Menampilkan data tersimpan dalam cache perangkat.</span>
    </div>
  );
};
