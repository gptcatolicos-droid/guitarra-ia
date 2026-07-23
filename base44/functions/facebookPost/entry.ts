import { createClientFromRequest } from 'npm:@base44/sdk@0.8.40';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user || user.role !== 'admin') return Response.json({ error: 'Forbidden' }, { status: 403 });

    const { message, pageId } = await req.json();
    if (!message) return Response.json({ error: 'message is required' }, { status: 400 });

    const { accessToken } = await base44.asServiceRole.connectors.getConnection('facebook_pages');

    // Get the page access token for the selected page (or first page)
    const accountsRes = await fetch(
      `https://graph.facebook.com/v25.0/me/accounts?fields=id,name,access_token`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const accounts = await accountsRes.json();
    if (!accounts.data || accounts.data.length === 0) {
      return Response.json({ error: 'No Facebook Pages found for this account' }, { status: 404 });
    }

    const page = pageId
      ? accounts.data.find((p) => p.id === pageId) || accounts.data[0]
      : accounts.data[0];

    const postRes = await fetch(
      `https://graph.facebook.com/v25.0/${page.id}/feed`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, access_token: page.access_token }),
      }
    );
    const postData = await postRes.json();

    if (postData.error) {
      return Response.json({ error: postData.error.message }, { status: 400 });
    }

    return Response.json({ success: true, post_id: postData.id, page_name: page.name });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});