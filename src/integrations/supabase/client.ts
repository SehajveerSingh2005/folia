import { createBrowserClient } from '@supabase/ssr'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  throw new Error('Missing Supabase URL or Anon Key from .env file');
}

// Create a browser client for client-side usage
// This properly handles cookies in Next.js
export const supabase = createBrowserClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);