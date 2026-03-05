import { useState } from 'react';
import { createPortal } from 'react-dom';
import { useSyncContext } from '../contexts/SyncContext';
import { isSupabaseConfigured } from '../lib/supabase';

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
  const { user, signIn, signOut } = useSyncContext();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    const result = await signIn(email.trim());
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      setSent(true);
    }
  };

  let content: React.ReactNode;

  if (!isSupabaseConfigured) {
    content = (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-2">Sync Not Available</h2>
        <p className="text-sm text-slate-400 mb-4">Cross-device sync requires Supabase configuration. The app works fully offline.</p>
        <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors">
          Continue Offline
        </button>
      </div>
    );
  } else if (user) {
    content = (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-2">Signed In</h2>
        <p className="text-sm text-slate-400 mb-1">Syncing as:</p>
        <p className="text-sm text-emerald-400 font-medium mb-4">{user.email}</p>
        <p className="text-xs text-slate-500 mb-4">Your selections, bookmarks, and chat history sync across all your devices in real-time.</p>
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-slate-700 text-white font-semibold text-sm hover:bg-slate-600 transition-colors">
            Close
          </button>
          <button onClick={() => { signOut(); onClose(); }} className="flex-1 py-2.5 rounded-lg bg-red-600/20 text-red-400 font-semibold text-sm hover:bg-red-600/30 border border-red-500/30 transition-colors">
            Sign Out
          </button>
        </div>
      </div>
    );
  } else if (sent) {
    content = (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="text-4xl mb-3">📧</div>
          <h2 className="text-lg font-bold text-white mb-2">Check Your Email</h2>
          <p className="text-sm text-slate-400 mb-4">We sent a magic link to <span className="text-emerald-400">{email}</span>. Click it to sign in and enable cross-device sync.</p>
          <button onClick={onClose} className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 transition-colors">
            Got It
          </button>
        </div>
      </div>
    );
  } else {
    content = (
      <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-white mb-1">Enable Cross-Device Sync</h2>
        <p className="text-sm text-slate-400 mb-4">Sign in to sync your selections, bookmarks, and chat history across web and mobile.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500/50 mb-3"
            autoFocus
          />
          {error && <p className="text-xs text-red-400 mb-2">{error}</p>}
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-500 disabled:opacity-40 transition-colors"
          >
            {loading ? 'Sending...' : 'Send Magic Link'}
          </button>
        </form>
        <p className="text-[10px] text-slate-500 mt-3 text-center">No password needed. We'll email you a secure sign-in link.</p>
      </div>
    );
  }

  return createPortal(
    <div
      className="flex items-center justify-center"
      style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      {content}
    </div>,
    document.body
  );
}
