/* ============================================================
   ENCODER.JS — Serialização de Dados para URL
   Uses LZString for compression — allows sharing via URL
   ============================================================ */

const Encoder = {
  /**
   * Encode tribute data to a URL-safe compressed string
   */
  encode(data) {
    try {
      const json = JSON.stringify(data);
      return LZString.compressToEncodedURIComponent(json);
    } catch (e) {
      console.error('Encode error:', e);
      return null;
    }
  },

  /**
   * Decode a compressed string back to tribute data
   */
  decode(str) {
    try {
      const json = LZString.decompressFromEncodedURIComponent(str);
      if (!json) return null;
      return JSON.parse(json);
    } catch (e) {
      console.error('Decode error:', e);
      return null;
    }
  },

  /**
   * Generate the viewer URL for a tribute
   */
  generateViewerUrl(data) {
    const encoded = this.encode(data);
    if (!encoded) return null;
    const base = window.location.href.replace('index.html', '').replace(/\/$/, '');
    return `${base}/view.html#${encoded}`;
  },

  /**
   * Parse tribute data from the current URL hash
   */
  parseFromUrl() {
    const hash = window.location.hash.slice(1);
    if (!hash) return null;
    return this.decode(hash);
  },

  /**
   * Resize and compress an image file to base64
   * @param {File} file
   * @param {number} maxSize - max width/height in pixels
   * @param {number} quality - JPEG quality 0-1
   * @returns {Promise<string>} base64 data URL
   */
  async compressImage(file, maxSize = 700, quality = 0.6) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.src = e.target.result;
      };

      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;

        // Scale down if necessary
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

        resolve(canvas.toDataURL('image/jpeg', quality));
      };

      img.onerror = reject;
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  },

  /**
   * Estimate the size of encoded data in KB
   */
  estimateSize(data) {
    const encoded = this.encode(data);
    if (!encoded) return 0;
    return Math.round(encoded.length / 1024);
  },
};
