# 🎬 Homenagem — Site de Homenagens Interativas

Site para criar homenagens cinematográficas para datas especiais (Dia dos Namorados, Mães, Pais, Aniversários, etc.).

## 🚀 Deploy na Vercel

### Passo 1 — Criar conta no JSONBin.io (gratuito)

1. Acesse **[jsonbin.io](https://jsonbin.io)** e crie uma conta gratuita
2. No painel, vá em **API Keys** e copie sua chave de API (Master Key)

> O plano gratuito permite 10.000 requisições/mês e 100 bins — mais do que suficiente para começar.

### Passo 2 — Configurar a variável de ambiente na Vercel

1. No [dashboard da Vercel](https://vercel.com/dashboard), abra seu projeto
2. Vá em **Settings → Environment Variables**
3. Adicione:
   - **Name**: `JSONBIN_API_KEY`
   - **Value**: sua chave do JSONBin.io
   - **Environment**: Production, Preview, Development
4. Clique em **Save**

### Passo 3 — Fazer redeploy

Após adicionar a env var, a Vercel precisa fazer um novo deploy:

```bash
# Na pasta do projeto:
git add .
git commit -m "feat: backend serverless para links curtos"
git push
```

A Vercel vai rebuildar automaticamente.

### ✅ Resultado

Agora os links gerados serão **curtos** como:
```
https://seu-site.vercel.app/view.html?id=64abc123def456
```

---

## 🛠️ Desenvolvimento Local

Para testar localmente com a função serverless:

```bash
npm install
npx vercel dev
```

Isso inicia um servidor local em `http://localhost:3000` com a function `/api/tribute` funcionando.

> **Sem a variável `JSONBIN_API_KEY` no ambiente local**, o botão de preview cai automaticamente para o modo legado (link com hash — funciona localmente, não é ideal para compartilhamento).

---

## 📁 Estrutura do Projeto

```
/
├── index.html         # Editor de homenagens (wizard 5 passos)
├── view.html          # Experiência cinematográfica
├── api/
│   └── tribute.js     # Serverless function (salva/carrega no JSONBin)
├── css/
│   ├── main.css       # Design system
│   ├── themes.css     # Temas por ocasião
│   ├── editor.css     # Estilos do editor
│   └── viewer.css     # Estilos do visualizador
├── js/
│   ├── themes.js      # Definições de temas
│   ├── particles.js   # Sistema de partículas canvas
│   ├── encoder.js     # Salvar/carregar via API + compressão de imagens
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
