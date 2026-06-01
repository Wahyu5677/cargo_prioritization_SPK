import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [authActionLoading, setAuthActionLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (isMounted) {
          setSession(data.session ?? null);
          setUser(data.session?.user ?? null);
        }
      } catch (error) {
        console.error("Failed to load Supabase session:", error.message);
        if (isMounted) {
          setSession(null);
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setInitialLoading(false);
        }
      }
    }

    loadSession();

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession ?? null);
      setUser(currentSession?.user ?? null);
      setInitialLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function login(email, password) {
    setAuthActionLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      setSession(data.session ?? null);
      setUser(data.user ?? null);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Login failed. Please check your credentials."
      };
    } finally {
      setAuthActionLoading(false);
    }
  }

  async function register(email, password) {
    setAuthActionLoading(true);

    try {
      const redirectTo = `${window.location.origin}/login`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo
        }
      });

      if (error) throw error;

      return {
        success: true,
        session: data.session ?? null,
        user: data.user ?? null
      };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Registration failed. Please try again."
      };
    } finally {
      setAuthActionLoading(false);
    }
  }

  async function sendPasswordReset(email) {
    setAuthActionLoading(true);

    try {
      const redirectTo = `${window.location.origin}/reset-password`;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo
      });

      if (error) throw error;

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message:
          error.message || "Failed to send password reset email. Please try again."
      };
    } finally {
      setAuthActionLoading(false);
    }
  }

  async function logout() {
    setAuthActionLoading(true);

    try {
      const { error } = await supabase.auth.signOut();

      if (error) throw error;

      setSession(null);
      setUser(null);

      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.message || "Logout failed. Please try again."
      };
    } finally {
      setAuthActionLoading(false);
    }
  }

  const value = useMemo(
    () => ({
      session,
      user,
      initialLoading,
      authActionLoading,
      isAuthenticated: Boolean(session?.user),
      login,
      register,
      sendPasswordReset,
      logout
    }),
    [session, user, initialLoading, authActionLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}