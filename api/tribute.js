// ============================================================
// api/tribute.js — Vercel Serverless Function
// Salva/recupera homenagens no JSONBin.io
// Env var necessária: JSONBIN_API_KEY
// ============================================================

const JSONBIN_API_KEY = process.env.JSONBIN_API_KEY;
const JSONBIN_URL = 'https://api.jsonbin.io/v3/b';

module.exports = async function handler(req, res) {
  // ── CORS ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── POST — Salvar homenagem ──
  if (req.method === 'POST') {
    if (!JSONBIN_API_KEY) {
      return res.status(500).json({ error: 'JSONBIN_API_KEY não configurado. Veja o README.' });
    }

    try {
      const response = await fetch(JSONBIN_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Master-Key': JSONBIN_API_KEY,
          'X-Bin-Private': 'false',
          'X-Bin-Name': `tribute_${Date.now()}`,
        },
        body: JSON.stringify(req.body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `JSONBin error: ${response.status}`);
      }

      return res.status(200).json({ id: data.metadata.id });
    } catch (error) {
      console.error('Save error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  // ── GET — Carregar homenagem ──
  if (req.method === 'GET') {
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'ID não fornecido' });
    }

    if (!JSONBIN_API_KEY) {
      return res.status(500).json({ error: 'JSONBIN_API_KEY não configurado.' });
    }

    try {
      const response = await fetch(`${JSONBIN_URL}/${id}/latest`, {
        headers: {
          'X-Master-Key': JSONBIN_API_KEY,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Homenagem não encontrada');
      }

      return res.status(200).json(data.record);
    } catch (error) {
      console.error('Load error:', error);
      return res.status(404).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
};
