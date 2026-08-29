/**
 * CropXense Supabase-powered Auth Store.
 *
 * Integrated with Supabase Auth for production sign-up, sign-in, session persistence,
 * and user profile synchronization. Includes fallback to demo accounts for SIH evaluations.
 */

import { supabase } from "@/lib/supabase";
import { DEMO_USERS, type DemoUser, type UserRole } from "./roles";

const STORAGE_KEY = "cropxense.session";
const SESSION_ONLY_KEY = "cropxense.session.sessiononly";

/** Returns the right storage depending on the "remember me" preference */
function getStorage(): Storage {
  return sessionStorage.getItem(SESSION_ONLY_KEY) === "1" ? sessionStorage : localStorage;
}

export interface SessionUser {
  id?: string;
  email: string;
  name: string;
  role: UserRole;
  district: string;
  mobile?: string;
  language?: string;
}

/** Read the stored session from localStorage synchronously */
export function getSession(): SessionUser | null {
  try {
    // Check sessionStorage first (session-only logins), then localStorage
    const raw = sessionStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SessionUser;
    if (parsed && parsed.email && parsed.role) return parsed;
    return null;
  } catch {
    return null;
  }
}

/** Persist a session — uses sessionStorage if remember=false */
export function saveSession(user: SessionUser, remember = true): void {
  if (remember) {
    sessionStorage.removeItem(SESSION_ONLY_KEY);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  } else {
    sessionStorage.setItem(SESSION_ONLY_KEY, "1");
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(user));
  }
}

/** Clear local session from both storages */
export function clearSession(): void {
  localStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(SESSION_ONLY_KEY);
}

export interface LoginResult {
  ok: boolean;
  user?: SessionUser;
  error?: string;
}

/**
 * Sign in using Supabase Auth with fallback to demo accounts
 */
export async function login(email: string, password: string, remember = true): Promise<LoginResult> {
  const normalised = email.trim().toLowerCase();

  // 1. Check if it's a pre-configured demo account
  const demo = DEMO_USERS.find(
    (u) => u.email === normalised && u.password === password,
  );
  if (demo) {
    const user = toSession(demo);
    saveSession(user, remember);
    return { ok: true, user };
  }

  // 2. Try Supabase Auth
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: normalised,
      password,
    });

    if (error) {
      // Check local offline mock accounts as fallback
      const stored = getSignupAccounts();
      const match = stored.find(
        (u) => u.email === normalised && u.password === password,
      );
      if (match) {
        const user: SessionUser = {
          email: match.email,
          name: match.name,
          role: match.role,
          district: match.district,
          mobile: match.mobile,
          language: match.language,
        };
        saveSession(user, remember);
        return { ok: true, user };
      }
      return { ok: false, error: error.message };
    }

    if (data?.user) {
      const meta = data.user.user_metadata || {};
      const user: SessionUser = {
        id: data.user.id,
        email: data.user.email || normalised,
        name: meta['full_name'] || meta['name'] || normalised.split("@")[0],
        role: (meta['role'] as UserRole) || "officer",
        district: meta['district'] || "amravati",
        mobile: meta['mobile'],
        language: meta['language'] || "en",
      };

      saveSession(user, remember);
      return { ok: true, user };
    }
  } catch (err: any) {
    console.error("Supabase signin error:", err);
  }

  // Fallback to local signups check
  const stored = getSignupAccounts();
  const match = stored.find(
    (u) => u.email === normalised && u.password === password,
  );
  if (match) {
    const user: SessionUser = {
      email: match.email,
      name: match.name,
      role: match.role,
      district: match.district,
    };
    saveSession(user, remember);
    return { ok: true, user };
  }

  return { ok: false, error: "Invalid email or password." };
}

export interface SignupInput {
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: UserRole;
  district: string;
  language: string;
}

/**
 * Register account with Supabase Auth and save profile data
 */
export async function signup(input: SignupInput): Promise<LoginResult> {
  const normalised = input.email.trim().toLowerCase();

  // Save to local cache as immediate reliable backup
  const account = {
    email: normalised,
    password: input.password,
    name: input.name,
    role: input.role,
    district: input.district,
    mobile: input.mobile,
    language: input.language,
  };

  const stored = getSignupAccounts();
  if (!stored.some((u) => u.email === normalised)) {
    stored.push(account);
    localStorage.setItem("cropxense.signups", JSON.stringify(stored));
  }

  try {
    const { data, error } = await supabase.auth.signUp({
      email: normalised,
      password: input.password,
      options: {
        data: {
          full_name: input.name,
          role: input.role,
          mobile: input.mobile,
          district: input.district,
          language: input.language,
        },
      },
    });

    if (error) {
      console.warn("Supabase signup notice:", error.message);
      // If user already registered in Supabase, attempt sign in
      if (error.message.toLowerCase().includes("already registered")) {
        return login(normalised, input.password);
      }
    }

    const userId = data?.user?.id;
    if (userId) {
      // Optional: sync to a profiles table if configured in Supabase
      try {
        await supabase.from("profiles").upsert({
          id: userId,
          email: normalised,
          full_name: input.name,
          role: input.role,
          district: input.district,
          mobile: input.mobile,
          preferred_language: input.language,
          updated_at: new Date().toISOString(),
        });
      } catch (profileErr) {
        // Table might not exist or RLS might block, user metadata is already stored in auth.users
        console.debug("Profile table update skipped:", profileErr);
      }
    }

    const user: SessionUser = {
      ...(userId ? { id: userId } : {}),
      email: normalised,
      name: input.name,
      role: input.role,
      district: input.district,
      mobile: input.mobile,
      language: input.language,
    };

    saveSession(user);
    return { ok: true, user };
  } catch (err: any) {
    console.error("Supabase signup error:", err);
    // Fallback to local session on network issue
    const user: SessionUser = {
      email: account.email,
      name: account.name,
      role: account.role,
      district: account.district,
      mobile: account.mobile,
      language: account.language,
    };
    saveSession(user);
    return { ok: true, user };
  }
}

/**
 * Sign out from Supabase & clear storage
 */
export async function logout(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.warn("Supabase signout notice:", err);
  } finally {
    clearSession();
  }
}

/**
 * Password recovery with Supabase
 */
export async function resetPassword(email: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase());
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err: any) {
    return { ok: true }; // Return true so user sees success message without exposing error
  }
}

/* ----------------------------------------------------------------- helpers */

function toSession(demo: DemoUser): SessionUser {
  let id = "demo-user";
  if (demo.role === "farmer") id = "demo-farmer-ramesh";
  else if (demo.role === "officer") id = "demo-officer-priya";
  else if (demo.role === "expert") id = "demo-expert-anjali";

  return {
    id,
    email: demo.email,
    name: demo.name,
    role: demo.role,
    district: demo.district,
  };
}

interface StoredSignup {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  district: string;
  mobile: string;
  language: string;
}

function getSignupAccounts(): StoredSignup[] {
  try {
    const raw = localStorage.getItem("cropxense.signups");
    return raw ? (JSON.parse(raw) as StoredSignup[]) : [];
  } catch {
    return [];
  }
}
