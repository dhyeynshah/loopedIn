"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { useRouter } from 'next/navigation'; // Add this import

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClientComponentClient();
  const router = useRouter(); // Add this

  useEffect(() => {
    // Function to get the current session
    const getSession = async () => {
      try {
        setLoading(true);
        // Get the current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Auth session error:", error);
          setUser(null);
          return;
        }
        if (session?.user) {
          // Log the authenticated user for debugging
          console.log("Auth provider - authenticated user:", {
            id: session.user.id,
            email: session.user.email
          });
          setUser(session.user);
        } else {
          console.log("Auth provider - no session found");
          setUser(null);
        }
      } catch (err) {
        console.error("Unexpected auth error:", err);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    
    // Call getSession immediately
    getSession();
    
    // Set up auth state change listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state change event:", event);
        if (session?.user) {
          console.log("Auth state change - new user:", {
            id: session.user.id,
            email: session.user.email
          });
          setUser(session.user);
        } else {
          console.log("Auth state change - no user");
          setUser(null);
        }
      }
    );
    
    // Cleanup function to unsubscribe
    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Provide a function to check if auth is ready
  const isAuthReady = () => !loading;

  // Provide a function to force refresh the session
  const refreshSession = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUser(session.user);
      return session.user;
    }
    return null;
  };

  // Fix the logout function and move it here
  const logout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error);
    } else {
      setUser(null);
      router.push('/login');
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthReady, 
      refreshSession, 
      loading,
      logout // Add the logout function to the context
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);