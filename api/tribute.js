// ============================================================
// api/tribute.js — Vercel Serverless Function
// Salva/recupera homenagens no AWS S3
// ============================================================

const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const crypto = require("crypto");

// ── AWS Configuration ──
const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Helper para converter o ReadableStream do S3 para string
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });

module.exports = async function handler(req, res) {
  // ── CORS ──
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // ── Validação das Variáveis de Ambiente ──
  if (!BUCKET_NAME || !process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    return res.status(500).json({ error: 'Credenciais AWS não configuradas na Vercel.' });
  }

  // ── GET — Carregar homenagem ou Presigned URL ──
  if (req.method === 'GET') {
    const { id, action, filename, filetype } = req.query;

    // 1. Gerar Presigned URL para upload direto de vídeo
    if (action === 'upload' && filename) {
      try {
        const key = `videos/${Date.now()}_${filename.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const command = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          ContentType: filetype || 'video/mp4'
        });

        const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
        const publicUrl = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${key}`;

        return res.status(200).json({ uploadUrl, publicUrl });
      } catch (error) {
        console.error('Presign error:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    // 2. Checar status de pagamento (Polling do Frontend)
    if (action === 'status') {
      try {
        const key = `tributes/${id}.json`;
        const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
        const response = await s3Client.send(command);
        const data = JSON.parse(await streamToString(response.Body));
        return res.status(200).json({ paymentStatus: data.paymentStatus || 'pending' });
      } catch (error) {
        return res.status(200).json({ paymentStatus: 'pending' }); // Fail-safe
      }
    }

    // 3. Carregar homenagem (padrão)
    if (!id) {
      return res.status(400).json({ error: 'ID não fornecido' });
    }

    try {
      const key = `tributes/${id}.json`;
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      const response = await s3Client.send(command);
      const dataString = await streamToString(response.Body);
      const data = JSON.parse(dataString);

      return res.status(200).json(data);
    } catch (error) {
      console.error('Load error (S3):', error);
      if (error.name === 'NoSuchKey') {
        return res.status(404).json({ error: 'Homenagem não encontrada.' });
      }
      return res.status(500).json({ error: error.message });
    }
  }

  // ── POST — Salvar homenagem ──
  if (req.method === 'POST') {
    try {
      const id = crypto.randomBytes(8).toString('hex'); // Gera ID aleatório curto
      const key = `tributes/${id}.json`;

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: JSON.stringify(req.body),
        ContentType: "application/json",
      });

      await s3Client.send(command);

      return res.status(200).json({ id });
    } catch (error) {
      console.error('Save error (S3):', error);
      return res.status(500).json({ error: error.message });
    }
  }

  return res.status(405).json({ error: 'Método não permitido' });
};
