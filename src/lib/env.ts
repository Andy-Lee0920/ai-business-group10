export type SupabasePublicConfig = {
  url: string;
  anonKey: string;
};

type PublicEnvSource = Record<string, string | undefined>;

const REQUIRED_PUBLIC_KEYS = ['NEXT_PUBLIC_SUPABASE_URL', 'NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;

export function hasSupabasePublicConfig(source: PublicEnvSource = process.env) {
  return REQUIRED_PUBLIC_KEYS.every((key) => Boolean(source[key]?.trim()));
}

export function requireSupabasePublicConfig(source: PublicEnvSource = process.env): SupabasePublicConfig {
  const missing = REQUIRED_PUBLIC_KEYS.filter((key) => !source[key]?.trim());

  if (missing.length > 0) {
    throw new Error(`Missing Supabase public config: ${missing.join(', ')}`);
  }

  return {
    url: source.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    anonKey: source.NEXT_PUBLIC_SUPABASE_ANON_KEY!.trim(),
  };
}
