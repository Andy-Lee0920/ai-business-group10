import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface AdminAuthResult {
  user: User;
  email: string;
}

export async function getAdminUser(supabase: SupabaseClient): Promise<AdminAuthResult | null> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return null;
  if (!isAdminEmail(user.email)) return null;
  return { user, email: user.email };
}

export async function requireAdminUser(supabase: SupabaseClient): Promise<AdminAuthResult | NextResponse> {
  const admin = await getAdminUser(supabase);
  if (!admin) return NextResponse.json({ error: 'admin_forbidden' }, { status: 403 });
  return admin;
}

export function isAdminEmail(email: string, value: string | undefined = process.env.FEVIO_ADMIN_EMAILS): boolean {
  return parseAdminEmails(value).has(email.toLowerCase());
}

export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set((value ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean));
}
