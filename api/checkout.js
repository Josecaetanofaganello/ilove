const { S3Client, PutObjectCommand, GetObjectCommand } = require("@aws-sdk/client-s3");

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;

const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;

// Helper function
const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method !== 'POST') return res.status(405).json({ error: 'Método não permitido' });

  const { id, customerName, customerPhone } = req.body;

  if (!id || !customerName) {
    return res.status(400).json({ error: 'Faltam dados do cliente.' });
  }

  try {
    // 1. Atualizar o arquivo no S3 com os dados do cliente e marcar como "pending"
    const key = `tributes/${id}.json`;
    const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const s3Res = await s3Client.send(getCommand);
    const data = JSON.parse(await streamToString(s3Res.Body));

    data.paymentStatus = 'pending';
    data.customerName = customerName;
    data.customerPhone = customerPhone;

    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    });
    await s3Client.send(putCommand);

    // 2. Avisar o Telegram
    if (BOT_TOKEN && CHAT_ID) {
      const approveUrl = `https://${req.headers.host}/api/approve?id=${id}&token=${BOT_TOKEN}`;
      const text = `💸 *Novo Pagamento PIX (Aguardando)*\n\n👤 *Cliente:* ${customerName}\n📱 *WhatsApp:* ${customerPhone || 'Não informado'}\n💰 *Valor:* R$ 20,00\n\n_Quando o dinheiro cair na sua conta, clique abaixo para liberar a homenagem no celular do cliente automaticamente._`;

      const telegramUrl = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;
      await fetch(telegramUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: text,
          parse_mode: 'Markdown',
          reply_markup: {
            inline_keyboard: [
              [{ text: '✅ APROVAR PAGAMENTO', url: approveUrl }]
            ]
          }
        })
      });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Checkout error:', error);
    return res.status(500).json({ error: error.message });
  }
};
