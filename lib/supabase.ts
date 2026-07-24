import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://rnqmwvlgllhehfqwuapq.supabase.co";

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJucW13dmxnbGxoZWhmcXd1YXBxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2NDY0NTcsImV4cCI6MjEwMDIyMjQ1N30.r6Cy9KR81A528RtI4laK9fStHmNlWFxPJuBKYTebUKI";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
