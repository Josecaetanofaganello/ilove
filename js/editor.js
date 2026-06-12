/* ============================================================
   EDITOR.JS — Lógica Completa do Editor Wizard
   ============================================================ */

(function () {
  'use strict';

  /* ── State ── */
  const state = {
    currentStep: 1,
    theme: 'valentine',
    recipientName: '',
    senderName: '',
    specialDate: '',
    openingMessage: '',
    closingMessage: '',
    photos: [],         // array of { src: base64, story: string, caption: string }
    youtubeUrl: '',
  };

  let particles = null;

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', () => {
    initParticles();
    initThemeCards();
    initPhotoUpload();
    initNavigation();
    initFinalize();

    // Scroll to editor when CTA clicked
    document.getElementById('startCreating')?.addEventListener('click', () => {
      document.getElementById('create').scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ── Particles ── */
  function initParticles() {
    const t = getTheme(state.theme);
    particles = new ParticleSystem('particleCanvas', t.particleType, [t.particleColor, t.particleColor2]);
  }

  /* ── Theme Cards ── */
  function initThemeCards() {
    document.querySelectorAll('.occasion-card').forEach(card => {
      card.addEventListener('click', () => {
        document.querySelectorAll('.occasion-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        state.theme = card.dataset.theme;
        switchTheme(state.theme);
      });
    });
  }

  function switchTheme(themeId) {
    const t = applyTheme(themeId);
    if (particles) {
      particles.updateType(t.particleType);
      particles.updateColors([t.particleColor, t.particleColor2]);
    }
    // Update phone preview
    const preview = document.querySelector('.phone-screen');
    if (preview) preview.style.background = t.gradient;
    const previewEmoji = document.querySelector('.preview-hearts');
    if (previewEmoji) previewEmoji.textContent = t.icons[0];
  }

  /* ── Photo Upload ── */
  function initPhotoUpload() {
    const zone    = document.getElementById('uploadZone');
    const input   = document.getElementById('photoInput');
    const grid    = document.getElementById('photosGrid');

    if (!zone || !input) return;

    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => zone.classList.remove('drag-over'));

    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('drag-over');
      handleFiles(Array.from(e.dataTransfer.files));
    });

    input.addEventListener('change', (e) => {
      handleFiles(Array.from(e.target.files));
      input.value = '';
    });

    async function handleFiles(files) {
      const remaining = 8 - state.photos.length;
      const toProcess = files.filter(f => f.type.startsWith('image/') || f.type.startsWith('video/')).slice(0, remaining);

      if (toProcess.length === 0) {
        if (state.photos.length >= 8) showToast('Máximo de 8 mídias atingido!');
        return;
      }

      for (const file of toProcess) {
        try {
          if (file.type.startsWith('video/')) {
            if (file.size > 200 * 1024 * 1024) {
              showToast(`Vídeo ${file.name} ignorado (maior que 200MB).`);
              continue;
            }
            showToast(`Enviando vídeo ${file.name}... (isso pode demorar)`);
            const videoUrl = await uploadVideoDirectly(file);
            state.photos.push({ src: videoUrl, type: 'video', story: '', caption: '' });
            showToast(`Vídeo ${file.name} enviado!`);
          } else {
            showToast(`Processando foto ${file.name}...`);
            const src = await Encoder.compressImage(file, 700, 0.62);
            state.photos.push({ src, type: 'image', story: '', caption: '' });
          }
        } catch (e) {
          console.error('Error processing file:', e);
          showToast(`Erro ao processar ${file.name}`);
        }
      }

      renderPhotoGrid();
      updatePhotoCounter();
    }

    async function uploadVideoDirectly(file) {
      // 1. Obter Presigned URL da API
      const res = await fetch(`${Encoder.apiBase}?action=upload&filename=${encodeURIComponent(file.name)}&filetype=${encodeURIComponent(file.type)}`);
      if (!res.ok) throw new Error('Falha ao obter link de upload.');
      const { uploadUrl, publicUrl } = await res.json();

      // 2. Fazer PUT direto no S3
      const putRes = await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
      });
      
      if (!putRes.ok) throw new Error('Falha no upload para o S3.');
      return publicUrl;
    }

    function renderPhotoGrid() {
      grid.innerHTML = '';

      state.photos.forEach((media, idx) => {
        const item = document.createElement('div');
        item.className = 'photo-item';
        item.dataset.index = idx;
        item.draggable = true;
        
        const previewHtml = media.type === 'video' 
          ? `<video src="${media.src}#t=0.5" muted preload="metadata" style="object-fit: cover; width: 100%; height: 100%; border-radius: 8px;"></video>
             <div style="position:absolute; top:5px; left:5px; background:rgba(0,0,0,0.6); color:#fff; font-size:10px; padding:2px 5px; border-radius:4px;">🎥 VÍDEO</div>`
          : `<img src="${media.src}" alt="Mídia ${idx + 1}">`;

        item.innerHTML = `
          <span class="photo-order">${idx + 1}</span>
          ${previewHtml}
          <button class="photo-remove" title="Remover" data-idx="${idx}">✕</button>
        `;
        grid.appendChild(item);
      });

      // Remove buttons
      grid.querySelectorAll('.photo-remove').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          state.photos.splice(parseInt(btn.dataset.idx), 1);
          renderPhotoGrid();
          updatePhotoCounter();
        });
      });

      initDragSort(grid);
    }

    function updatePhotoCounter() {
      let counter = document.querySelector('.photo-count');
      if (!counter) {
        counter = document.createElement('p');
        counter.className = 'photo-count';
        zone.insertAdjacentElement('afterend', counter);
      }
      counter.textContent = `${state.photos.length}/8 fotos adicionadas`;
      counter.style.display = state.photos.length > 0 ? 'block' : 'none';
    }

    // Expose renderPhotoGrid for use in step 4
    window._renderPhotoGrid = renderPhotoGrid;
  }

  /* ── Drag-sort photos ── */
  function initDragSort(grid) {
    let dragSrc = null;

    grid.querySelectorAll('.photo-item').forEach(item => {
      item.addEventListener('dragstart', () => {
        dragSrc = item;
        setTimeout(() => item.style.opacity = '0.4', 0);
      });

      item.addEventListener('dragend', () => {
        item.style.opacity = '1';
      });

      item.addEventListener('dragover', (e) => {
        e.preventDefault();
        item.style.border = '2px solid var(--primary)';
      });

      item.addEventListener('dragleave', () => {
        item.style.border = '';
      });

      item.addEventListener('drop', (e) => {
        e.preventDefault();
        item.style.border = '';
        if (dragSrc !== item) {
          const srcIdx = parseInt(dragSrc.dataset.index);
          const dstIdx = parseInt(item.dataset.index);
          const tmp = state.photos[srcIdx];
          state.photos[srcIdx] = state.photos[dstIdx];
          state.photos[dstIdx] = tmp;
          if (window._renderPhotoGrid) window._renderPhotoGrid();
        }
      });
    });
  }

  /* ── Navigation ── */
  function initNavigation() {
    // Step 1 → 2
    document.getElementById('step1Next')?.addEventListener('click', () => goToStep(2));

    // Step 2 ↔ 3
    document.getElementById('step2Back')?.addEventListener('click', () => goToStep(1));
    document.getElementById('step2Next')?.addEventListener('click', () => {
      collectStep2();
      goToStep(3);
    });

    // Step 3 ↔ 4
    document.getElementById('step3Back')?.addEventListener('click', () => goToStep(2));
    document.getElementById('step3Next')?.addEventListener('click', () => {
      if (state.photos.length === 0) {
        showToast('Adicione pelo menos 1 foto para continuar!');
        return;
      }
      goToStep(4);
      renderStoryCards();
    });

    // Step 4 ↔ 5
    document.getElementById('step4Back')?.addEventListener('click', () => goToStep(3));
    document.getElementById('step4Next')?.addEventListener('click', () => {
      collectStories();
      goToStep(5);
    });

    // Step 5 back
    document.getElementById('step5Back')?.addEventListener('click', () => goToStep(4));
  }

  function goToStep(step) {
    const current = document.querySelector('.editor-step.active');
    const next = document.getElementById(`step-${step}`);
    if (!next) return;

    if (current) {
      current.style.opacity = '0';
      current.style.transform = 'translateY(10px)';
      setTimeout(() => {
        current.classList.remove('active');
        current.style.opacity = '';
        current.style.transform = '';
        showStep(next);
      }, 200);
    } else {
      showStep(next);
    }

    updateProgressBar(step);
    state.currentStep = step;

    // Scroll to editor
    document.getElementById('create').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function showStep(el) {
    el.classList.add('active');
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        el.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
        el.style.opacity = '1';
        el.style.transform = 'translateY(0)';
        setTimeout(() => { el.style.transition = ''; }, 400);
      });
    });
  }

  function updateProgressBar(activeStep) {
    document.querySelectorAll('.progress-step').forEach((step) => {
      const n = parseInt(step.dataset.step);
      step.classList.toggle('active', n === activeStep);
      step.classList.toggle('completed', n < activeStep);
    });

    document.querySelectorAll('.progress-line').forEach((line, idx) => {
      line.classList.toggle('filled', idx < activeStep - 1);
    });
  }

  /* ── Collect form data ── */
  function collectStep2() {
    state.recipientName   = document.getElementById('recipientName')?.value.trim() || '';
    state.senderName      = document.getElementById('senderName')?.value.trim() || '';
    state.specialDate     = document.getElementById('specialDate')?.value.trim() || '';
    state.openingMessage  = document.getElementById('openingMessage')?.value.trim() || '';
    state.closingMessage  = document.getElementById('closingMessage')?.value.trim() || '';
  }

  function collectStories() {
    document.querySelectorAll('.story-card').forEach(card => {
      const idx = parseInt(card.dataset.index);
      if (state.photos[idx]) {
        state.photos[idx].story   = card.querySelector('.story-text')?.value.trim() || '';
        state.photos[idx].caption = card.querySelector('.story-caption')?.value.trim() || '';
      }
    });
  }

  /* ── Story Cards ── */
  function renderStoryCards() {
    const container = document.getElementById('storiesContainer');
    if (!container) return;

    container.innerHTML = state.photos.map((photo, idx) => `
      <div class="story-card" data-index="${idx}">
        <div class="story-card-thumb">
          <img src="${photo.src}" alt="Foto ${idx + 1}">
        </div>
        <div class="story-card-body">
          <div class="story-card-label">Cena ${idx + 1}</div>
          <textarea
            class="form-textarea story-text"
            placeholder="Descreva esse momento especial... (aparecerá na cena ${idx + 1})"
            rows="2"
          >${photo.story}</textarea>
          <input
            class="form-input story-caption"
            type="text"
            placeholder="Legenda ou data (ex: 'Verão de 2022')"
            value="${photo.caption}"
          >
        </div>
      </div>
    `).join('');
  }

  /* ── Finalize ── */
  function initFinalize() {
    document.getElementById('previewBtn')?.addEventListener('click', async () => {
      collectStep2();
      collectStories();
      state.youtubeUrl = document.getElementById('youtubeUrl')?.value.trim() || '';

      const btn = document.getElementById('previewBtn');
      btn.textContent = '⏳ Gerando preview...';
      btn.disabled = true;

      try {
        const url = await Encoder.saveAndGetUrl(buildTributeData());
        window.open(url, '_blank');
      } catch (e) {
        // Fallback para URL hash se a API falhar (ex: ambiente local sem config)
        const url = Encoder.generateViewerUrl(buildTributeData());
        if (url) window.open(url, '_blank');
        else showToast('Erro ao gerar preview: ' + e.message);
      } finally {
        btn.textContent = '👁️ Pré-visualizar';
        btn.disabled = false;
      }
    });

    let tributeId = null;

    document.getElementById('generateBtn')?.addEventListener('click', async () => {
      collectStep2();
      collectStories();
      state.youtubeUrl = document.getElementById('youtubeUrl')?.value.trim() || '';

      if (state.photos.length === 0) {
        showToast('Adicione pelo menos 1 foto para gerar!');
        return;
      }

      const btn = document.getElementById('generateBtn');
      const originalText = btn.innerHTML;
      btn.innerHTML = '⏳ Salvando homenagem...';
      btn.disabled = true;

      try {
        // Salva a homenagem no S3 (status pendente implicito via API) e pega o ID
        const urlObj = await Encoder.saveAndGetUrl(buildTributeData());
        tributeId = new URL(urlObj).searchParams.get('id');

        // Show Payment Modal
        const modal = document.getElementById('paymentModal');
        if (modal) {
          modal.style.display = 'flex';
          document.getElementById('paymentForm').style.display = 'block';
          document.getElementById('pixContainer').style.display = 'none';
          document.getElementById('waitingContainer').style.display = 'none';
        }
      } catch (e) {
        showToast('Erro ao salvar homenagem: ' + e.message);
      } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
      }
    });

    document.getElementById('viewDemoBtn')?.addEventListener('click', () => {
      if (tributeId) {
        window.open(`${window.location.origin}/view.html?id=${tributeId}&demo=true`, '_blank');
      } else {
        showToast('Homenagem não foi salva ainda!');
      }
    });

    document.getElementById('generatePixBtn')?.addEventListener('click', async () => {
      const name = document.getElementById('payName').value.trim();
      const phone = document.getElementById('payPhone').value.trim();

      if (!name) {
        showToast('Por favor, informe seu nome!');
        return;
      }

      const btn = document.getElementById('generatePixBtn');
      btn.textContent = 'Gerando PIX...';
      btn.disabled = true;

      try {
        // Notifica o Telegram via API e marca status pendente
        const res = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: tributeId, customerName: name, customerPhone: phone })
        });
        
        if (!res.ok) throw new Error('Falha ao iniciar checkout.');

        // Usa imagem estática para proteção
        const qrCodeUrl = `assets/pix.jpeg`;
        document.getElementById('pixQrCode').src = qrCodeUrl;
        
        // A chave estática do mercado pago foi definida no HTML, então apenas mostramos o container
        document.getElementById('paymentForm').style.display = 'none';
        document.getElementById('pixContainer').style.display = 'block';

      } catch (e) {
        showToast('Erro ao iniciar pagamento: ' + e.message);
        btn.textContent = 'Tentar Novamente';
        btn.disabled = false;
      }
    });

    document.getElementById('copyPixBtn')?.addEventListener('click', () => {
      const input = document.getElementById('pixCodeInput');
      navigator.clipboard.writeText(input.value).then(() => {
        showToast('Código PIX copiado!');
      });
    });

    document.getElementById('confirmPaymentBtn')?.addEventListener('click', () => {
      document.getElementById('pixContainer').style.display = 'none';
      document.getElementById('waitingContainer').style.display = 'block';
      
      startStatusPolling();
    });

    function startStatusPolling() {
      if (!tributeId) return;
      
      const interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/tribute?action=status&id=${tributeId}`);
          if (res.ok) {
            const data = await res.json();
            if (data.paymentStatus === 'approved') {
              clearInterval(interval);
              document.getElementById('paymentModal').style.display = 'none';
              const finalUrl = `${window.location.origin}/view.html?id=${tributeId}`;
              showGeneratedLink(finalUrl);
            }
          }
        } catch (e) {
          console.error('Polling error', e);
        }
      }, 3000); // Polling a cada 3 segundos
    }
  } // <-- MISSING BRACKET FOR initFinalize()

  function buildTributeData() {
    return {
      v: 1,                                    // version
      theme: state.theme,
      recipientName: state.recipientName,
      senderName: state.senderName,
      specialDate: state.specialDate,
      openingMessage: state.openingMessage,
      closingMessage: state.closingMessage,
      youtubeUrl: state.youtubeUrl,
      photos: state.photos,
    };
  }

  function showGeneratedLink(url) {
    const container = document.getElementById('generatedLinkContainer');
    const linkInput = document.getElementById('generatedLink');
    const nameDisplay = document.getElementById('recipientNameDisplay');
    const openBtn = document.getElementById('openViewerBtn');

    if (!container || !linkInput) return;

    linkInput.value = url;
    if (nameDisplay) nameDisplay.textContent = state.recipientName || 'a pessoa especial';
    if (openBtn) openBtn.href = url;

    container.style.display = 'block';
    container.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    // Particle burst celebration
    if (particles) {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      particles.burst(cx, cy, 40);
    }

    showToast('🎉 Homenagem criada com sucesso!');
  }

  /* ── Toast ── */
  function showToast(message, duration = 3000) {
    let toast = document.getElementById('editor-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'editor-toast';
      toast.style.cssText = `
        position: fixed;
        bottom: 2rem;
        left: 50%;
        transform: translateX(-50%) translateY(80px);
        background: rgba(20, 20, 40, 0.95);
        color: #fff;
        padding: 0.875rem 1.75rem;
        border-radius: 50px;
        font-size: 0.95rem;
        font-weight: 500;
        z-index: 9999;
        border: 1px solid rgba(255,255,255,0.12);
        backdrop-filter: blur(20px);
        box-shadow: 0 8px 32px rgba(0,0,0,0.4);
        transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease;
        font-family: 'Inter', sans-serif;
        white-space: nowrap;
      `;
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';

    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(-50%) translateY(80px)';
    }, duration);
  }

})();
