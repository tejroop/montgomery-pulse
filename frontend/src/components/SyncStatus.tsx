import { useState } from 'react';
import { useSyncContext } from '../contexts/SyncContext';
import AuthModal from './AuthModal';

export default function SyncStatus() {
  const { user, syncStatus, isOnline } = useSyncContext();
  const [showAuth, setShowAuth] = useState(false);

  const statusConfig = {
    offline: { color: 'bg-slate-500', label: 'Offline', pulse: false },
    syncing: { color: 'bg-amber-500', label: 'Syncing...', pulse: true },
    synced: { color: 'bg-emerald-500', label: 'Synced', pulse: false },
    error: { color: 'bg-red-500', label: 'Sync Error', pulse: false },
  };

  const config = statusConfig[syncStatus];

  return (
    <>
      <button
        onClick={() => setShowAuth(true)}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700 hover:border-emerald-500/50 transition-all text-xs"
        title={user ? `Signed in as ${user.email}` : 'Sign in for cross-device sync'}
      >
        <div className={`w-2 h-2 rounded-full ${config.color} ${config.pulse ? 'animate-pulse' : ''}`} />
        {!isOnline && <span className="text-slate-500">No Internet</span>}
        {isOnline && !user && <span className="text-slate-400">Sign In</span>}
        {isOnline && user && <span className="text-slate-300">{config.label}</span>}
      </button>
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </>
  );
}
