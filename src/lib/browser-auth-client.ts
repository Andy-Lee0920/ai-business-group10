import { createFevioBrowserSupabaseClient } from './supabase';

export function createFevioBrowserAuthClient() {
  return createFevioBrowserSupabaseClient();
}
