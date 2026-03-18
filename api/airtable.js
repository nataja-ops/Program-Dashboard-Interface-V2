export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const token = process.env.AIRTABLE_TOKEN;
  if (!token) return res.status(500).json({ error: 'AIRTABLE_TOKEN not set' });

  const BASE_ID = 'apptKJnbKllpLEA8u';
  const { table, fields, filterByFormula, maxRecords = 100, view } = req.query;
  if (!table) return res.status(400).json({ error: 'table param required' });

  const params = new URLSearchParams();
  if (view) params.set('view', view);
  if (filterByFormula) params.set('filterByFormula', filterByFormula);
  params.set('pageSize', Math.min(Number(maxRecords), 100));
  if (fields) {
    fields.split(',').forEach(f => params.append('fields[]', f.trim()));
  }

  const url = `https://api.airtable.com/v0/${BASE_ID}/${table}?${params}`;

  try {
    const airtableRes = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!airtableRes.ok) {
      const err = await airtableRes.text();
      return res.status(airtableRes.status).json({ error: err });
    }
    const data = await airtableRes.json();
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=120');
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
