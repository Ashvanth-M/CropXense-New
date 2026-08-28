/**
 * CropXense auth context.
 *
 * Provides current user, login, signup, logout to the component tree.
 * Wraps the Supabase-powered auth store.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { ReactNode } from "react";
import {
  getSession,
  login as storeLogin,
  signup as storeSignup,
  logout as storeLogout,
  type SessionUser,
  type LoginResult,
  type SignupInput,
} from "./authStore";
import { supabase } from "@/lib/supabase";
import type { UserRole } from "./roles";

interface AuthContextValue {
  /** Current authenticated user, or null. */
  user: SessionUser | null;
  /** Whether a user is currently authenticated. */
  isAuthenticated: boolean;
  /** Attempt to log in. Returns a result with ok/error. */
  login: (email: string, password: string, remember?: boolean) => Promise<LoginResult>;
  /** Register a new account. */
  signup: (input: SignupInput) => Promise<LoginResult>;
  /** Log the current user out. */
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  // Hydrate from localStorage or Supabase on mount
  useEffect(() => {
    async function initSession() {
      const stored = getSession();
      if (stored) {
        setUser(stored);
        setReady(true);
        return;
      }

      try {
        const { data } = await supabase.auth.getSession();
        if (data?.session?.user) {
          const u = data.session.user;
          const meta = u.user_metadata || {};
          setUser({
            id: u.id,
            email: u.email || "",
            name: meta['full_name'] || meta['name'] || (u.email ? u.email.split("@")[0] : "Officer"),
            role: (meta['role'] as UserRole) || "officer",
            district: meta['district'] || "amravati",
            mobile: meta['mobile'],
            language: meta['language'] || "en",
          });
        }
      } catch (err) {
        console.debug("Supabase getSession notice:", err);
      } finally {
        setReady(true);
      }
    }

    void initSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!session?.user) {
          const localStored = getSession();
          if (!localStored) setUser(null);
        }
      },
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email: string, password: string, remember = true) => {
    const result = await storeLogin(email, password, remember);
    if (result.ok && result.user) setUser(result.user);
    return result;
  }, []);

  const signup = useCallback(async (input: SignupInput) => {
    const result = await storeSignup(input);
    if (result.ok && result.user) setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    await storeLogout();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      signup,
      logout,
    }),
    [user, login, signup, logout],
  );

  // Don't render children until we've checked session,
  // otherwise guards flash the wrong state.
  if (!ready) return null;

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/** Access the auth context. Must be used inside <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}

/**
 * Convenience: check whether the current user has one of the given roles.
 * Returns false when not authenticated.
 */
export function useHasRole(roles: UserRole[]): boolean {
  const { user } = useAuth();
  return user !== null && roles.includes(user.role);
}
