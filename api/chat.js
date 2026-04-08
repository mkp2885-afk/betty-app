export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

    // Handle URL scraping requests
    if (body.scrape_url) {
      try {
        const pageRes = await fetch(body.scrape_url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15',
            'Accept': 'text/html,application/xhtml+xml',
            'Accept-Language': 'bg,en;q=0.9',
          }
        });
        const html = await pageRes.text();

        // Strip HTML tags and extract readable text
        const text = html
          .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
          .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
          .replace(/<[^>]+>/g, ' ')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/\s+/g, ' ')
          .trim()
          .slice(0, 8000); // Limit to 8000 chars for Claude context

        // Now send to Claude with the scraped text
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            system: `You are Betty. Extract the recipe from this webpage text and structure it. Keep the SAME LANGUAGE as the recipe content. Return ONLY valid JSON: {"title":"Name","time":"X min","tags":["tag"],"betty":"funny one-liner","steps":["step1"],"ingredients":["item with qty"],"calories":"~XXX kcal"}`,
            messages: [{ role: 'user', content: `Extract the recipe from this page:\n\n${text}` }]
          })
        });

        const claudeData = await claudeRes.json();
        return res.status(200).json(claudeData);

      } catch (scrapeError) {
        // If scraping fails, fall back to Claude's knowledge
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 2000,
            system: `You are Betty. The user gave you a recipe URL but we couldn't scrape it. Use your knowledge to create a recipe based on the URL. Keep the SAME LANGUAGE as the recipe. Return ONLY valid JSON: {"title":"Name","time":"X min","tags":["tag"],"betty":"funny one-liner","steps":["step1"],"ingredients":["item with qty"],"calories":"~XXX kcal"}`,
            messages: [{ role: 'user', content: `Create a recipe for this URL: ${body.scrape_url}` }]
          })
        });
        const claudeData = await claudeRes.json();
        return res.status(200).json(claudeData);
      }
    }

    // Regular Claude API call
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();
    return res.status(response.status).json(data);

  } catch (error) {
    console.error('Betty API error:', error);
    return res.status(500).json({ error: error.message });
  }
}
