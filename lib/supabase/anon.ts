"use client";

import { createClient } from "@/lib/supabase/client";

// Ensures the browser has a Supabase auth session before hitting any API
// route. Ruckus never requires an account — this is an anonymous sign-in,
// which requires "Allow anonymous sign-ins" enabled in the Supabase Auth
// settings for the project.
export async function ensureAnonymousSession() {
  const supabase = createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (session) return session;

  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) throw error;
  return data.session;
}
