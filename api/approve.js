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

const streamToString = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = [];
    stream.on("data", (chunk) => chunks.push(chunk));
    stream.on("error", reject);
    stream.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
  });

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = async function handler(req, res) {
  const { id, token } = req.query;

  if (!id || !token) {
    return res.status(400).send('<h1>Erro: Parâmetros inválidos.</h1>');
  }

  // Proteção contra Path Traversal
  if (!/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).send('<h1>Erro: ID malformado ou inválido.</h1>');
  }

  // Verifica se quem clicou foi o bot oficial usando o Token como senha
  if (token !== BOT_TOKEN) {
    return res.status(403).send('<h1>Acesso Negado.</h1>');
  }

  try {
    const key = `tributes/${id}.json`;
    const getCommand = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key });
    const s3Res = await s3Client.send(getCommand);
    const data = JSON.parse(await streamToString(s3Res.Body));

    // Atualiza status
    data.paymentStatus = 'approved';

    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: JSON.stringify(data),
      ContentType: "application/json",
    });
    await s3Client.send(putCommand);

    const viewerUrl = `https://${req.headers.host}/view.html?id=${id}`;
    const whatsappLink = data.customerPhone 
      ? `https://wa.me/55${data.customerPhone.replace(/\D/g, '')}?text=${encodeURIComponent(`Sua homenagem foi aprovada! Aqui está o link mágico: ${viewerUrl}`)}`
      : '#';

    // HTML Bonito de confirmação para o Admin
    const safeCustomerName = escapeHtml(data.customerName || 'Cliente');
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Pagamento Aprovado</title>
        <style>
          body { font-family: -apple-system, system-ui, sans-serif; background: #0f172a; color: #fff; text-align: center; padding: 3rem 1rem; }
          .box { background: #1e293b; padding: 2rem; border-radius: 16px; max-width: 400px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }
          h1 { color: #10b981; margin-bottom: 0.5rem; }
          p { color: #94a3b8; line-height: 1.5; margin-bottom: 2rem; }
          .btn { display: inline-block; background: #25D366; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 1.1rem; }
        </style>
      </head>
      <body>
        <div class="box">
          <div style="font-size: 4rem; margin-bottom: 1rem;">✅</div>
          <h1>Liberado com Sucesso!</h1>
          <p>A tela do cliente (<b>${safeCustomerName}</b>) foi atualizada automaticamente neste exato segundo e o link da homenagem já está na mão dele!</p>
          ${data.customerPhone ? `<a href="${whatsappLink}" class="btn">Chamar no WhatsApp</a>` : ''}
        </div>
      </body>
      </html>
    `;

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(html);

  } catch (error) {
    console.error('Approve error:', error);
    return res.status(500).send(`<h1>Erro ao aprovar: ${error.message}</h1>`);
  }
};
