export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    const { topic, description, email, name } = body;

    if (!topic || !description) {
      return res.status(400).json({ error: 'Missing topic or description' });
    }

    const SUPA_URL = 'https://mfrvblouafwgzknikvjc.supabase.co';
    const SUPA_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'sb_publishable_HMEZDito_lYhxDC3Z92qdQ_P2U_19Jp';

    // Save to Supabase
    await fetch(`${SUPA_URL}/rest/v1/reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPA_KEY,
        'Authorization': `Bearer ${SUPA_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify({ topic, description, email: email || null, name: name || null }),
    }).catch(e => console.error('Supabase insert error:', e));

    // Send email via Resend
    if (process.env.RESEND_API_KEY) {
      const emailRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'betty app <onboarding@resend.dev>',
          to: 'mkp2885@gmail.com',
          subject: `betty report: ${topic}`,
          html: `
            <h2>New report from betty app</h2>
            <p><strong>Topic:</strong> ${topic}</p>
            <p><strong>Description:</strong></p>
            <p>${description.replace(/\n/g, '<br>')}</p>
            <hr>
            <p><strong>From:</strong> ${name || 'anonymous'} ${email ? `(${email})` : ''}</p>
          `,
        }),
      });

      if (!emailRes.ok) {
        const err = await emailRes.json().catch(() => ({}));
        console.error('Resend error:', err);
      }
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Report API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
