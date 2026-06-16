import { useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/useAuthStore';
import './AuthProvider.css';

interface AuthProviderProps {
  children: React.ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  const { setSession, setProfile, setInitialized, isInitialized, clearAuth } = useAuthStore();

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;
        
        if (session && session.user) {
          setSession(session);
          
          // Fetch user profile to get onboarding status
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
            
          if (profileError) {
            if (profileError.code !== 'PGRST116') {
              console.error('Error fetching profile:', profileError);
            }
          } else if (profile) {
            setProfile(profile);
          }
        } else {
          clearAuth();
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        clearAuth();
      } finally {
        if (mounted) {
          setInitialized(true);
        }
      }
    }

    initializeAuth();

    // Listen for auth state changes (login, logout, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        clearAuth();
      } else if (session) {
        setSession(session);
        // We only fetch profile if we don't have it, to avoid unnecessary calls on token refresh
        const currentProfile = useAuthStore.getState().profile;
        if (!currentProfile || currentProfile.user_id !== session.user.id) {
          const { data: profile } = await supabase
            .from('users')
            .select('*')
            .eq('user_id', session.user.id)
            .single();
          if (profile) setProfile(profile);
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [setSession, setProfile, setInitialized, clearAuth]);

  if (!isInitialized) {
    return (
      <div className="auth-loader">
        <div className="auth-loader__spinner" />
        <p className="auth-loader__text">Loading Booktrovert...</p>
      </div>
    );
  }

  return <>{children}</>;
}
