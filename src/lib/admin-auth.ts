import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

export interface AdminAuthResult {
  user: User;
  email: string;
}

export async function requireAdminUser(supabase: SupabaseClient): Promise<AdminAuthResult | NextResponse> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user?.email) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const allowedEmails = parseAdminEmails(process.env.FEVIO_ADMIN_EMAILS);
  if (!allowedEmails.has(user.email.toLowerCase())) {
    return NextResponse.json({ error: 'admin_forbidden' }, { status: 403 });
  }

  return { user, email: user.email };
}

export function parseAdminEmails(value: string | undefined): Set<string> {
  return new Set((value ?? '')
    .split(',')
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean));
}
