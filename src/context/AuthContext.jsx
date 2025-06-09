"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    let mounted = true;
    let authSubscription = null;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Auth session error:", error);
        }
        
        if (mounted) {
          setUser(session?.user ?? null);
          setInitialized(true);
          setLoading(false);
        }

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            if (mounted && (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED')) {
              setUser(session?.user ?? null);
              
              if (event === 'SIGNED_OUT') {
                router.push('/login');
              }
            }
          }
        );
        
        authSubscription = subscription;
      } catch (err) {
        console.error("Unexpected auth error:", err);
        if (mounted) {
          setUser(null);
          setInitialized(true);
          setLoading(false);
        }
      }
    };
    
    initializeAuth();
    
    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, [supabase.auth, router]);

  const refreshSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        return session.user;
      }
      return null;
    } catch (error) {
      console.error("Error refreshing session:", error);
      return null;
    }
  };

  const logout = async () => {
    try {
      setUser(null);
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error logging out:", error);
      }
      
      // Clear any potential stored tokens
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token');
        sessionStorage.removeItem('supabase.auth.token');
        localStorage.clear();
        sessionStorage.clear();
      }
      
      router.push('/login');
    } catch (error) {
      console.error("Unexpected logout error:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      refreshSession, 
      loading: loading || !initialized,
      logout,
      initialized
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};