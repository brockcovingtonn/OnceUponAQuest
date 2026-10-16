// RevenueCat webhook: turns App Store / Google Play purchases into Quest Pass
// time and outfit packs. RevenueCat sends every purchase, renewal,
// cancellation and refund here; public.apply_store_event() does the rest and
// ignores events it has already seen, so RevenueCat's retries are safe.
//
// Set the shared secret (the same value goes in RevenueCat → Integrations →
// Webhooks → Authorization header, as "Bearer <secret>"):
//   supabase secrets set REVENUECAT_WEBHOOK_SECRET=<long random string>
import { createClient } from 'jsr:@supabase/supabase-js@2';

function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const secret = Deno.env.get('REVENUECAT_WEBHOOK_SECRET');
  if (!secret || !sameSecret(req.headers.get('Authorization') ?? '', `Bearer ${secret}`)) {
    return new Response('Unauthorized', { status: 401 });
  }

  let event: unknown;
  try {
    event = (await req.json())?.event;
  } catch {
    return new Response('Bad request', { status: 400 });
  }
  if (!event || typeof event !== 'object') return new Response('Bad request', { status: 400 });

  const client = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '', {
    auth: { persistSession: false },
  });
  const { data, error } = await client.rpc('apply_store_event', { p_event: event });
  if (error) {
    console.error('apply_store_event failed', error.message);
    // A 5xx makes RevenueCat retry later.
    return new Response('Error', { status: 500 });
  }
  const e = event as { type?: string; id?: string };
  console.log(e.type, e.id, data);
  return Response.json({ result: data });
});
