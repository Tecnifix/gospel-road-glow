import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { deviceIdSchema } from './licenses';
import { requireIssuerRole } from './license-permissions';

export const licenseAdminStatus = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    if (error || !data) return { admin: false, licenses: [] };
    const result = await context.supabase.from('device_licenses').select('id, device_id, activation_code, created_at').order('created_at', { ascending: false }).limit(50);
    if (result.error) throw new Error('Não foi possível consultar as licenças.');
    return { admin: true, licenses: result.data };
  });

export const issueDeviceLicense = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator(input => z.object({ deviceId: deviceIdSchema, saleConfirmed: z.literal(true) }).strict().parse(input))
  .handler(async ({ data, context }) => {
    const { data: admin, error } = await context.supabase.rpc('has_role', { _user_id: context.userId, _role: 'admin' });
    requireIssuerRole({ data: admin, error });
    // Only after a server-validated role check may privileged signing/storage be loaded.
    const { issueLicense } = await import('./license-signing.server');
    return issueLicense(data.deviceId, context.userId);
  });