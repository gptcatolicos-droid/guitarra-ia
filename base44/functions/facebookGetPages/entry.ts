import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');

    const res = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?fields=id,name,fan_count`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await res.json();

    if (data.error) return Response.json({ error: data.error.message }, { status: 400 });

    return Response.json({ pages: data.data || [] });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});