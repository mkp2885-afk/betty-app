export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { token, userId } = body;

    if (!token || !userId) {
      return res.status(400).json({ error: 'Missing token or userId' });
    }

    const SUPA_URL = 'https://mfrvblouafwgzknikvjc.supabase.co';
    const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!SERVICE_KEY) {
      return res.status(500).json({ error: 'Server not configured for account deletion' });
    }

    // Delete user's recipes
    await fetch(`${SUPA_URL}/rest/v1/recipes?user_id=eq.${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
    });

    // Delete user's reports
    await fetch(`${SUPA_URL}/rest/v1/reports?email=eq.${encodeURIComponent(body.email||'')}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Prefer': 'return=minimal',
      },
    }).catch(() => {});

    // Delete the auth user (requires service role)
    const deleteRes = await fetch(`${SUPA_URL}/auth/v1/admin/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      },
    });

    if (!deleteRes.ok) {
      const err = await deleteRes.json().catch(() => ({}));
      console.error('Auth user delete error:', err);
      return res.status(500).json({ error: 'Failed to delete auth user', detail: err });
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Delete account error:', error);
    return res.status(500).json({ error: error.message });
  }
}
