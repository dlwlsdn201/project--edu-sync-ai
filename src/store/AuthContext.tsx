import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { getCurrentProfile, signInWithKakao, signOut } from '../api/auth';
import type { Profile } from '../types';

interface AuthContextValue {
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCurrentProfile().then((p) => {
      setProfile(p);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN') {
        const p = await getCurrentProfile();
        setProfile(p);
      } else if (event === 'SIGNED_OUT') {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignIn = async () => {
    const p = await signInWithKakao();
    setProfile(p);
  };

  const handleSignOut = async () => {
    await signOut();
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        profile,
        isLoading,
        isAuthenticated: profile !== null,
        signIn: handleSignIn,
        signOut: handleSignOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuthContext must be used within AuthProvider');
  }
  return ctx;
}
