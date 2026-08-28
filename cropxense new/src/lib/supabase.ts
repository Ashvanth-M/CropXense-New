import { createClient } from "@supabase/supabase-js";

export const SUPABASE_URL =
  import.meta.env['VITE_SUPABASE_URL'] ||
  "https://yqolllbkscvabgsqwjrn.supabase.co";

export const SUPABASE_ANON_KEY =
  import.meta.env['VITE_SUPABASE_ANON_KEY'] ||
  import.meta.env['VITE_SUPABASE_PUBLISHABLE_KEY'] ||
  "sb_publishable_NijM7kvdz4j9aGA1_Q2OMw_cgelFFeR";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
