import { createClient } from '@supabase/supabase-js';

export function createSupabaseAdmin({ url, serviceRoleKey }) {
  if (!url || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { 'X-Client-Info': 'zakaria-mansour-marketplace-server' } }
  });
}

export function publicUser(row) {
  if (!row) return null;
  const { password_hash, ...safe } = row;
  return safe;
}

export function throwIfError(result) {
  if (result.error) {
    const error = new Error(result.error.message);
    error.code = result.error.code;
    error.details = result.error.details;
    throw error;
  }
  return result.data;
}

export async function single(resultPromise) {
  const result = await resultPromise;
  if (result.error && result.error.code !== 'PGRST116') throwIfError(result);
  return result.data || null;
}
