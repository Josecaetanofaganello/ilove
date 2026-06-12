# 🎬 Homenagem — Site de Homenagens Interativas

Site para criar homenagens cinematográficas para datas especiais (Dia dos Namorados, Mães, Pais, Aniversários, etc.).

## 🚀 Deploy na Vercel com AWS S3

Para garantir que não haverá limite de tamanho de fotos, o backend usa a Amazon AWS S3.

### Passo 1 — Configurar AWS S3

1. Acesse o [Console da AWS](https://aws.amazon.com/console/) e busque por **S3**.
2. Clique em **Create bucket**. Escolha um nome (ex: `homenagem-bucket-xyz`) e uma região (ex: `us-east-1`).
3. Vá no serviço **IAM** (Identity and Access Management).
4. Em **Users**, clique em **Create user** (ex: `vercel-s3-user`).
5. Em permissões, escolha **Attach policies directly** e selecione `AmazonS3FullAccess`.
6. Após criar o usuário, abra-o, vá na aba **Security credentials**, e crie uma **Access key**.
7. Guarde o `Access Key ID` e a `Secret Access Key`.

### Passo 2 — Configurar as Variáveis na Vercel

1. No [dashboard da Vercel](https://vercel.com/dashboard), abra seu projeto.
2. Vá em **Settings → Environment Variables** e adicione:
   - `AWS_REGION` (a região do bucket, ex: `us-east-1`)
   - `AWS_S3_BUCKET_NAME` (o nome do seu bucket)
   - `AWS_ACCESS_KEY_ID` (a chave do IAM)
   - `AWS_SECRET_ACCESS_KEY` (o segredo do IAM)
3. Marque: Production, Preview e Development.

### Passo 3 — Fazer Redeploy

Após adicionar as variáveis, a Vercel precisa fazer um novo deploy para carregar a configuração. No painel da Vercel vá em Deployments e clique em **Redeploy**.

> **Nota Local**: Sem as variáveis AWS no ambiente local, o botão de preview gerará um link gigante e usará o modo legado (LZString hash).

---

## 📁 Estrutura do Projeto

```
/
├── index.html         # Editor de homenagens (wizard 5 passos)
├── view.html          # Experiência cinematográfica
├── api/
│   └── tribute.js     # Serverless function (salva/carrega no AWS S3)
├── css/
│   ├── main.css       # Design system
│   ├── themes.css     # Temas por ocasião
│   ├── editor.css     # Estilos do editor
│   └── viewer.css     # Estilos do visualizador
├── js/
│   ├── themes.js      # Definições de temas
│   ├── particles.js   # Sistema de partículas canvas
│   ├── encoder.js     # Salvar/carregar via API + fallback Hash URL
│   ├── editor.js      # Lógica do wizard de criação
│   └── viewer.js      # Engine cinematográfica
└── package.json
```

---

## 🎨 Temas disponíveis

| Ocasião | Partículas | Cores |
|---------|-----------|-------|
| 💕 Dia dos Namorados | Corações | Rosa/Dourado |
| 🌸 Dia das Mães | Flores | Lilás/Amarelo |
| ⭐ Dia dos Pais | Estrelas | Azul/Bronze |
| 🎂 Aniversário | Confetes | Roxo/Dourado |
| ✨ Personalizado | Sparkles | Índigo/Dourado |
