export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { topic, description, email, name } = req.body;

  const emailBody = `
New problem report from betty. app

From: ${name || 'Unknown'} (${email || 'Not logged in'})
Topic: ${topic}

Description:
${description}
  `.trim();

  try {
    // Send via Resend (free tier: 100 emails/day)
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'betty. <onboarding@resend.dev>',
        to: ['mkp2885@gmail.com'],
        subject: `betty. report: ${topic}`,
        text: emailBody,
      }),
    });
    const data = await response.json();
    return res.status(200).json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
