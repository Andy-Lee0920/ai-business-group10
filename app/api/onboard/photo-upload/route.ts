import { randomUUID } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { isPresentationRequest } from '../../../../src/config';
import { createCookieBackedSupabaseClient } from '../../../../src/lib/server-supabase';
import { createSupabaseServiceRoleClient } from '../../../../src/lib/server-supabase-admin';

const CLINIC_PHOTOS_BUCKET = 'clinic-photos';

type DbError = { message: string };
type PhotoUploadSupabaseClient = {
  auth: { getUser(): Promise<{ data: { user: { id: string } | null }; error: DbError | null }> };
  storage: {
    from(bucket: typeof CLINIC_PHOTOS_BUCKET): {
      upload(path: string, file: File, options: { contentType: string; upsert: false }): Promise<{ data: unknown; error: DbError | null }>;
    };
  };
};
type AdminStorageClient = {
  storage: PhotoUploadSupabaseClient['storage'];
};

export async function POST(request: NextRequest) {
  const supabase = (await createCookieBackedSupabaseClient()) as unknown as PhotoUploadSupabaseClient;
  const { data: { user } } = await supabase.auth.getUser();

  if (!user && !isPresentationRequest(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!user && !hasPrivacyGateCookie(request.headers.get('cookie'))) {
    return NextResponse.json({ error: 'privacy_gate_required' }, { status: 403 });
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get('file');

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ error: 'image file is required' }, { status: 400 });
  }

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'image file is required' }, { status: 400 });
  }

  const path = `${user?.id ?? 'presentation'}/${randomUUID()}.jpg`;
  const storageClient = user ? supabase : createSupabaseServiceRoleClient() as unknown as AdminStorageClient;
  const { error } = await storageClient.storage
    .from(CLINIC_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ path });
}

function hasPrivacyGateCookie(cookieHeader: string | null) {
  return cookieHeader?.split(';').some((part) => {
    const trimmed = part.trim();
    return trimmed === 'fevio_privacy_gate_v1=accepted' || trimmed === 'fevio_privacy_accepted=1';
  }) ?? false;
}
