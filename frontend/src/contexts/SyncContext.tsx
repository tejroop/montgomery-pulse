import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { User, RealtimeChannel } from '@supabase/supabase-js';

const APP_TYPE = 'montgomery_pulse';
const STORAGE_KEY = `${APP_TYPE}_sync_state`;

export interface AppState {
  selectedId: string | null;
  page: 'map' | 'assistant';
  activeCategories: string[];
  showFacilities: boolean;
  bookmarks: string[];
  chatHistory: Array<{ role: 'user' | 'assistant'; text: string; timestamp: number }>;
}

const defaultState: AppState = {
  selectedId: null,
  page: 'map',
  activeCategories: ['fire_police', 'tornado_shelters', 'weather_sirens', 'community_centers', 'pharmacies', 'schools', 'parks'],
  showFacilities: false,
  bookmarks: [],
  chatHistory: [],
};

interface SyncContextValue {
  user: User | null;
  appState: AppState;
  updateState: (partial: Partial<AppState>) => void;
  signIn: (email: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  syncStatus: 'offline' | 'syncing' | 'synced' | 'error';
  isOnline: boolean;
}

const SyncContext = createContext<SyncContextValue>({
  user: null,
  appState: defaultState,
  updateState: () => {},
  signIn: async () => ({ error: null }),
  signOut: async () => {},
  syncStatus: 'offline',
  isOnline: true,
});

export function useSyncContext() {
  return useContext(SyncContext);
}

function loadLocal(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...defaultState, ...JSON.parse(raw) };
  } catch {}
  return defaultState;
}

function saveLocal(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function SyncProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<AppState>(loadLocal);
  const [syncStatus, setSyncStatus] = useState<'offline' | 'syncing' | 'synced' | 'error'>('offline');
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Online/offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auth listener
  useEffect(() => {
    if (!supabase) return;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load state from Supabase on login
  useEffect(() => {
    if (!supabase || !user) {
      setSyncStatus('offline');
      return;
    }

    const loadRemote = async () => {
      setSyncStatus('syncing');
      try {
        const { data, error } = await supabase
          .from('user_state')
          .select('state_value')
          .eq('user_id', user.id)
          .eq('app_type', APP_TYPE)
          .eq('state_key', 'app_state')
          .single();

        if (!error && data?.state_value) {
          const remote = { ...defaultState, ...data.state_value } as AppState;
          setAppState(remote);
          saveLocal(remote);
        }
        setSyncStatus('synced');
      } catch {
        setSyncStatus('error');
      }
    };

    loadRemote();

    // Real-time subscription
    const channel = supabase
      .channel(`sync-${user.id}-${APP_TYPE}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'user_state',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        if (payload.new && 'state_value' in payload.new && payload.new.app_type === APP_TYPE) {
          const remote = { ...defaultState, ...(payload.new.state_value as object) } as AppState;
          setAppState(remote);
          saveLocal(remote);
          setSyncStatus('synced');
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user]);

  // Sync state to Supabase (debounced)
  const syncToRemote = useCallback(async (state: AppState) => {
    if (!supabase || !user) return;
    setSyncStatus('syncing');
    try {
      await supabase
        .from('user_state')
        .upsert({
          user_id: user.id,
          app_type: APP_TYPE,
          state_key: 'app_state',
          state_value: state,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id,app_type,state_key' });
      setSyncStatus('synced');
    } catch {
      setSyncStatus('error');
    }
  }, [user]);

  const updateState = useCallback((partial: Partial<AppState>) => {
    setAppState(prev => {
      const next = { ...prev, ...partial };
      saveLocal(next);
      // Debounced remote sync
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => syncToRemote(next), 800);
      return next;
    });
  }, [syncToRemote]);

  const signIn = useCallback(async (email: string) => {
    if (!supabase) return { error: 'Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' };
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin },
    });
    return { error: error?.message ?? null };
  }, []);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUser(null);
    setSyncStatus('offline');
  }, []);

  return (
    <SyncContext.Provider value={{ user, appState, updateState, signIn, signOut, syncStatus, isOnline }}>
      {children}
    </SyncContext.Provider>
  );
}
