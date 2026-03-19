module.exports = async function  handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return res.status(500).json({ error: 'AIRTABLE_TOKEN not configured in Vercel environment variables' });

  const BASE = 'apptKJnbKllpLEA8u';
  const { table, fields, filterByFormula, maxRecords } = req.query;
  if (!table) return res.status(400).json({ error: 'table param required' });

  const p = new URLSearchParams();
  p.set('pageSize', Math.min(Number(maxRecords || 100), 100));
  if (filterByFormula) p.set('filterByFormula', filterByFormula);
  if (fields) fields.split(',').forEach(f => p.append('fields[]', f.trim()));

  try {
    const r = await fetch(`https://api.airtable.com/v0/${BASE}/${encodeURIComponent(table)}?${p}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!r.ok) return res.status(r.status).json({ error: await r.text() });
    const data = await r.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
