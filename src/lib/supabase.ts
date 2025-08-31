import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let supabase: SupabaseClient | undefined;

export const getSupabase = () => {
  if (supabase) {
    return supabase;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      "Supabase URL and Anon Key are not defined. Please check your .env.local file."
    );
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    db: {
      schema: "public",
    },
  });
  return supabase;
};
