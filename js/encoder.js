/* ============================================================
   ENCODER.JS — Gerenciamento de Dados da Homenagem
   - Salva/carrega via API (links curtos)
   - Compressão de imagens no cliente
   ============================================================ */

const Encoder = {

  // ── API Base URL (auto-detecta produção vs desenvolvimento) ──
  get apiBase() {
    // Em produção (Vercel), usa /api/tribute
    // Em desenvolvimento local, usa o mesmo path (funciona com vercel dev)
    return '/api/tribute';
  },

  /**
   * Salva a homenagem na API e retorna a URL curta para compartilhar
   * @param {Object} data - Dados completos da homenagem
   * @returns {Promise<string>} URL para compartilhar
   */
  async saveAndGetUrl(data) {
    try {
      const response = await fetch(this.apiBase, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status}`);
      }

      const { id } = await response.json();
      if (!id) throw new Error('ID não retornado pela API');

      // Gera a URL de visualização com ID curto
      const base = window.location.href
        .replace('index.html', '')
        .replace(/\/$/, '')
        .split('?')[0]
        .split('#')[0];

      return `${base}/view.html?id=${id}`;
    } catch (error) {
      console.error('Erro ao salvar homenagem:', error);
      throw error;
    }
  },

  /**
   * Carrega a homenagem da API pelo ID (URL param ?id=...)
   * Também mantém compatibilidade com links antigos (URL hash #...)
   * @returns {Promise<Object|null>} Dados da homenagem
   */
  async loadFromUrl() {
    // ── Modo novo: ?id=JSONBIN_ID ──
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    if (id) {
      return await this._loadById(id);
    }

    // ── Compatibilidade: #BASE64_LZSTRING (links antigos) ──
    const hash = window.location.hash.slice(1);
    if (hash && typeof LZString !== 'undefined') {
      try {
        const json = LZString.decompressFromEncodedURIComponent(hash);
        if (json) return JSON.parse(json);
      } catch (e) {
        console.warn('Erro ao decodificar hash legado:', e);
      }
    }

    return null;
  },

  /**
   * Busca homenagem da API pelo ID do JSONBin
   */
  async _loadById(id) {
    try {
      const response = await fetch(`${this.apiBase}?id=${encodeURIComponent(id)}`);

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || `Erro ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Erro ao carregar homenagem:', error);
      throw error;
    }
  },

  /**
   * Redimensiona e comprime uma imagem para WebP em base64
   * @param {File} file - Arquivo de imagem
   * @param {number} maxSize - Tamanho máximo em px
   * @param {number} quality - Qualidade WebP (0-1)
   * @returns {Promise<string>} base64 data URL
   */
  async compressImage(file, maxSize = 400, quality = 0.45) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => { img.src = e.target.result; };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        if (width > maxSize || height > maxSize) {
          if (width > height) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          } else {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/webp', quality));
      };

      img.onerror = reject;
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  // ── Legado: encode/decode para URL hash (mantido para compatibilidade) ──
  encode(data) {
    try {
      return LZString.compressToEncodedURIComponent(JSON.stringify(data));
    } catch (e) { return null; }
  },

  decode(str) {
    try {
      return JSON.parse(LZString.decompressFromEncodedURIComponent(str));
    } catch (e) { return null; }
  },

  // Alias legado
  parseFromUrl() {
    const hash = window.location.hash.slice(1);
    return hash ? this.decode(hash) : null;
  },

  generateViewerUrl(data) {
    const encoded = this.encode(data);
    if (!encoded) return null;
    const base = window.location.href.replace('index.html', '').replace(/\/$/, '');
    return `${base}/view.html#${encoded}`;
  },
};
