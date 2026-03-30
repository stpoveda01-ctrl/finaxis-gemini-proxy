// FinAxis · Proxy Gemini para Vercel
// Endpoint: POST /api/gemini
// Body: { prompt: "..." }
// Responde: { texto: "..." }

export default async function handler(req, res) {
  // CORS — permite llamadas desde GitHub Pages o cualquier origen
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Pre-flight OPTIONS
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Método no permitido. Use POST.' });
  }

  const { prompt } = req.body;

  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Se requiere el campo "prompt" en el body.' });
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

  if (!GEMINI_API_KEY) {
    return res.status(500).json({ error: 'API Key de Gemini no configurada en variables de entorno.' });
  }

const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;
  try {
    const geminiRes = await fetch(GEMINI_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error('Error Gemini API:', geminiRes.status, errBody);
      return res.status(502).json({
        error: `Error en Gemini API: ${geminiRes.status}`,
        detalle: errBody
      });
    }

    const data = await geminiRes.json();

    // Extraer el texto de la respuesta de Gemini
    const texto = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!texto) {
      return res.status(502).json({
        error: 'Gemini no devolvió texto.',
        raw: data
      });
    }

    return res.status(200).json({ texto });

  } catch (err) {
    console.error('Error interno proxy:', err);
    return res.status(500).json({ error: 'Error interno del proxy: ' + err.message });
  }
}
