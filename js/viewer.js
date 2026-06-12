/* ============================================================
   VIEWER.JS — Engine Cinematográfica
   Controla a experiência de "viagem" pelas cenas
   ============================================================ */

(function () {
  'use strict';

  let tributeData = null;
  let theme = null;
  let particles = null;
  let musicPlaying = false;
  let ytPlayer = null;
  let currentSceneIdx = 0;
  let totalScenes = 0;

  /* ── Init ── */
  document.addEventListener('DOMContentLoaded', async () => {
    // Mostrar loading enquanto busca dados
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) loadingText.textContent = 'Buscando sua homenagem...';

    try {
      // Tenta carregar via API (?id=...) ou legado (hash)
      tributeData = await Encoder.loadFromUrl();
    } catch (e) {
      console.error('Erro ao carregar homenagem:', e);
    }

    if (!tributeData) {
      showErrorScreen();
      return;
    }

    // Apply theme
    theme = applyTheme(tributeData.theme || 'valentine');
    document.title = tributeData.recipientName
      ? `Uma Homenagem para ${tributeData.recipientName} ❤️`
      : 'Uma Homenagem Especial para Você';

    // Animate loading
    await animateLoading();

    // Build scenes
    buildExperience();

    // Show opening screen
    showOpeningScreen();

    // Check for demo mode
    const isDemo = new URLSearchParams(window.location.search).get('demo') === 'true';
    if (isDemo) {
      injectDemoWatermark();
    }
  });

  /* ── Demo Watermark ── */
  function injectDemoWatermark() {
    const wm = document.createElement('div');
    wm.style.cssText = `
      position: fixed;
      inset: -50%;
      z-index: 999999;
      pointer-events: none;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      align-items: center;
      overflow: hidden;
      transform: rotate(-25deg);
    `;
    
    for (let i = 0; i < 40; i++) {
      const text = document.createElement('div');
      text.innerHTML = 'PRÉ-VISUALIZAÇÃO<br>AGUARDANDO PAGAMENTO';
      text.style.cssText = `
        font-family: 'Inter', sans-serif;
        font-weight: 900;
        font-size: 3.5rem;
        color: rgba(255, 255, 255, 0.25);
        text-align: center;
        margin: 2rem 4rem;
        white-space: nowrap;
        user-select: none;
        text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
      `;
      wm.appendChild(text);
    }
    
    // Add a top banner
    const banner = document.createElement('div');
    banner.innerHTML = '⚠️ MODO DE PRÉ-VISUALIZAÇÃO — O LINK FINAL NÃO TERÁ ESSA MARCA D\\'ÁGUA';
    banner.style.cssText = `
      position: fixed; top: 0; left: 0; right: 0;
      background: #D4296B; color: #fff; text-align: center;
      padding: 0.75rem; font-family: 'Inter', sans-serif;
      font-weight: bold; font-size: 0.85rem; z-index: 9999999;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    `;
    
    document.body.appendChild(wm);
    document.body.appendChild(banner);
  }

  /* ── Error Screen ── */
  function showErrorScreen() {
    document.getElementById('loadingScreen').innerHTML = `
      <div style="text-align:center; padding:2rem; z-index:2; position:relative;">
        <div style="font-size:4rem; margin-bottom:1rem;">💔</div>
        <h2 style="font-family:'Playfair Display',serif; font-size:1.8rem; margin-bottom:1rem; color:#FFF5F8;">
          Homenagem não encontrada
        </h2>
        <p style="color:rgba(255,245,248,0.6); margin-bottom:2rem;">
          O link pode estar incompleto ou expirado.
        </p>
        <a href="index.html" style="
          display:inline-block; padding:0.875rem 2rem;
          background: linear-gradient(135deg, #D4296B, #FF6B9D);
          color:white; border-radius:50px; text-decoration:none;
          font-weight:600; font-family:'Inter',sans-serif;
        ">Criar uma Homenagem</a>
      </div>
    `;
  }

  /* ── Loading Animation ── */
  async function animateLoading() {
    return new Promise(resolve => {
      const bar = document.getElementById('loadingBarFill');
      const heart = document.querySelector('.loading-heart');
      const t = theme || getTheme('valentine');

      // Update loading heart to theme icon
      if (heart) heart.textContent = t.icon;

      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);

          if (bar) bar.style.width = '100%';
          setTimeout(() => {
            const ls = document.getElementById('loadingScreen');
            if (ls) ls.classList.add('hidden');
            resolve();
          }, 400);
        }
        if (bar) bar.style.width = `${progress}%`;
      }, 120);
    });
  }

  /* ── Opening Screen ── */
  function showOpeningScreen() {
    const screen = document.getElementById('openingScreen');
    if (!screen) return;

    screen.style.display = 'flex';

    // Set content
    const t = theme || getTheme('valentine');
    const d = tributeData;

    document.getElementById('openingBadge').textContent = t.icon;
    document.getElementById('openingOccasion').textContent = t.openingText;
    document.getElementById('openingTitle').textContent = d.recipientName
      ? `Para ${d.recipientName}` : 'Uma Homenagem Especial';
    document.getElementById('openingSubtitle').textContent = d.senderName
      ? `com amor, ${d.senderName}` : 'de alguém especial';

    // Init particles
    particles = new ParticleSystem('particleCanvas', t.particleType, [t.particleColor, t.particleColor2]);

    // Ambient orbs
    addAmbientOrbs(screen);

    // Start button
    document.getElementById('startExperience')?.addEventListener('click', startExperience);
  }

  function addAmbientOrbs(parent) {
    const orbs = [
      { w: 500, h: 500, top: '10%', left: '-10%', type: 'primary', delay: '0s' },
      { w: 400, h: 400, top: '50%', right: '-5%', type: 'secondary', delay: '-3s' },
      { w: 300, h: 300, bottom: '5%', left: '30%', type: 'accent', delay: '-6s' },
    ];

    orbs.forEach(orb => {
      const el = document.createElement('div');
      el.className = `orb orb-${orb.type}`;
      el.style.cssText = `
        width: ${orb.w}px; height: ${orb.h}px;
        top: ${orb.top || 'auto'}; left: ${orb.left || 'auto'};
        right: ${orb.right || 'auto'}; bottom: ${orb.bottom || 'auto'};
        animation-delay: ${orb.delay};
      `;
      parent.appendChild(el);
    });
  }

  /* ── Start Experience ── */
  function startExperience() {
    // Try to play music
    if (tributeData.youtubeUrl) {
      initYouTubeMusic(tributeData.youtubeUrl);
    }

    // Transition opening screen out
    const screen = document.getElementById('openingScreen');
    screen.classList.add('exiting');
    setTimeout(() => {
      screen.style.display = 'none';
    }, 1000);

    // Show scenes container
    const container = document.getElementById('scenesContainer');
    container.style.cssText = `
      display: block;
      position: fixed;
      inset: 0;
      overflow-y: scroll;
      scroll-snap-type: y mandatory;
      -webkit-overflow-scrolling: touch;
      z-index: 2;
    `;
    container.style.cssText += 'scrollbar-width: none;';

    document.body.classList.add('viewer-mode');

    // Init scenes observer
    initScenesObserver();

    // Add progress dots
    buildProgressDots();

    // Show music indicator if music
    if (tributeData.youtubeUrl) {
      showMusicIndicator();
    }

    // Keep particle canvas as fixed overlay above scenes
    const canvas = document.getElementById('particleCanvas');
    if (canvas) {
      canvas.style.position = 'fixed';
      canvas.style.zIndex = '10';
      canvas.style.pointerEvents = 'none';
      document.body.appendChild(canvas);
    }
  }

  /* ── Build Experience ── */
  function buildExperience() {
    const container = document.getElementById('scenesContainer');
    if (!container) return;

    const t = theme || getTheme('valentine');
    const d = tributeData;
    const photos = d.photos || [];

    let html = '';

    // ── Scene 0: Opening ──
    html += `
      <div class="scene scene-opening" id="scene-0" data-scene="0">
        <div style="position:absolute;inset:0;background:${t.gradient}"></div>
        ${buildAmbientOrbsHTML()}
        <div class="scene-opening-content">
          <div style="font-size:5rem;margin-bottom:1.5rem;filter:drop-shadow(0 0 40px rgba(${t.primaryRgb},0.8));animation:heartbeat 2s ease-in-out infinite;">
            ${t.icon}
          </div>
          <div style="font-size:.85rem;font-weight:700;text-transform:uppercase;letter-spacing:.2em;color:var(--secondary);margin-bottom:1rem;opacity:0;animation:fadeIn .8s .3s ease forwards;">
            ${t.name}
          </div>
          <h1 style="font-family:var(--font-display);font-size:clamp(2.5rem,6vw,4.5rem);font-style:italic;font-weight:700;color:var(--text-light);margin-bottom:1rem;opacity:0;animation:fadeIn .9s .6s ease forwards;text-shadow:0 0 60px rgba(${t.primaryRgb},.4);">
            ${d.recipientName ? `Para ${d.recipientName}` : 'Uma Homenagem Especial'}
          </h1>
          ${d.openingMessage ? `
          <p style="font-size:1.15rem;color:var(--text-dim);font-style:italic;max-width:600px;line-height:1.8;opacity:0;animation:fadeIn .8s .9s ease forwards;">
            "${d.openingMessage}"
          </p>` : ''}
          ${d.specialDate ? `
          <div style="margin-top:1.5rem;opacity:0;animation:fadeIn .8s 1.1s ease forwards;">
            <span style="padding:.4rem 1rem;background:rgba(${t.primaryRgb},.12);border:1px solid rgba(${t.primaryRgb},.25);border-radius:50px;font-size:.82rem;color:var(--secondary);">
              📅 ${d.specialDate}
            </span>
          </div>` : ''}
          <div style="margin-top:2rem;opacity:0;animation:fadeIn .8s 1.3s ease forwards,pulse 2s 2.5s ease-in-out infinite;">
            <span style="font-size:.78rem;color:var(--text-muted);text-transform:uppercase;letter-spacing:.12em;">Role para começar ↓</span>
          </div>
        </div>
        <div class="scroll-indicator" style="opacity:0;animation:fadeIn .8s 1.5s ease forwards">
          <div class="scroll-arrow">↓</div>
        </div>
      </div>
    `;

    // ── Photo Scenes ──
    photos.forEach((photo, idx) => {
      const isOdd = idx % 2 !== 0;
      const sceneNum = idx + 1;
      const decorEmoji = t.icons[idx % t.icons.length];

      html += `
        <div class="scene scene-photo ${isOdd ? 'odd' : 'even'}" id="scene-${sceneNum}" data-scene="${sceneNum}">
          <div class="scene-bg-blur" style="background-image:url('${photo.src}')"></div>
          <div class="scene-overlay"></div>
          <div class="scene-overlay-radial"></div>
          <div class="scene-photo-content" id="scene-content-${sceneNum}">
            <div class="photo-frame-wrapper">
              <div class="photo-frame-glow"></div>
              <div class="photo-frame">
                ${photo.type === 'video'
                  ? `<video src="${photo.src}" autoplay loop muted playsinline style="width:100%; height:100%; object-fit:cover;"></video>`
                  : `<img src="${photo.src}" alt="Memória ${sceneNum}" loading="lazy">`}
              </div>
              <div class="photo-decoration">${decorEmoji}</div>
            </div>
            <div class="scene-text-wrapper">
              <div class="scene-number-label">Memória ${sceneNum}</div>
              ${photo.story ? `
              <div class="scene-quote">${escapeHtml(photo.story)}</div>
              <div class="scene-divider"></div>
              ` : ''}
              ${photo.caption ? `
              <div class="scene-date-tag">📅 ${escapeHtml(photo.caption)}</div>
              ` : ''}
            </div>
          </div>
          <div class="scroll-indicator">
            <div class="scroll-arrow">↓</div>
          </div>
        </div>
      `;
    });

    // ── Final Scene ──
    const finalIdx = photos.length + 1;
    const constellationPhotos = photos.slice(0, 8);

    html += `
      <div class="scene scene-final" id="scene-${finalIdx}" data-scene="${finalIdx}">
        <div style="position:absolute;inset:0;background:${t.gradient}"></div>
        <div class="scene-final-bg"></div>
        ${buildAmbientOrbsHTML()}
        <div class="scene-final-content" id="final-content">
          <div class="final-photo-constellation" id="constellation">
            ${constellationPhotos.map((photo, idx) => {
              const sizes = [80, 70, 90, 75, 85, 65, 95, 72];
              const size = sizes[idx % sizes.length];
              const mediaHtml = photo.type === 'video'
                ? `<video src="${photo.src}#t=0.5" muted preload="metadata" style="width:100%; height:100%; object-fit:cover;"></video>`
                : `<img src="${photo.src}" alt="">`;
              return `<div class="constellation-photo" style="width:${size}px;height:${size}px;animation-delay:${idx * 0.1}s">
                ${mediaHtml}
              </div>`;
            }).join('')}
          </div>
          <div class="final-emoji" id="finalEmoji">${t.closingEmoji || t.icon}</div>
          <div class="final-message" id="finalMessage">
            ${escapeHtml(tributeData.closingMessage || `Com todo o meu amor, ${tributeData.senderName || 'para sempre'}`) }
          </div>
          <div class="final-from" id="finalFrom">
            ${tributeData.senderName ? `— ${tributeData.senderName}` : ''}
            ${tributeData.specialDate ? ` · ${tributeData.specialDate}` : ''}
          </div>
        </div>
      </div>
    `;

    // ── CTA Scene ──
    html += `
      <div class="scene-cta" id="scene-cta" data-scene="${finalIdx + 1}">
        <div class="cta-content">
          <h2 class="cta-title">Crie a sua homenagem ✨</h2>
          <p class="cta-subtitle">
            Surpreenda quem você ama com uma experiência cinematográfica única.
            Personalize com fotos, histórias e a trilha sonora perfeita.
          </p>
          <a href="index.html" class="btn-primary" style="font-size:1rem;">
            <span>Criar Minha Homenagem</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
          </a>
          <div class="cta-credit">Feito com ${t.icon} para celebrar os momentos que importam</div>
        </div>
      </div>
    `;

    container.innerHTML = html;
    totalScenes = photos.length + 2; // opening + photos + final
  }

  function buildAmbientOrbsHTML() {
    return `
      <div class="orb orb-primary" style="width:500px;height:500px;top:-10%;left:-15%;animation-delay:0s;pointer-events:none;"></div>
      <div class="orb orb-secondary" style="width:400px;height:400px;bottom:-10%;right:-10%;animation-delay:-3s;animation-duration:8s;pointer-events:none;"></div>
    `;
  }

  /* ── Intersection Observer ── */
  function initScenesObserver() {
    const options = {
      root: document.getElementById('scenesContainer'),
      threshold: 0.45,
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const scene = entry.target;
          const idx = parseInt(scene.dataset.scene || '0');

          // Activate photo scene content
          const content = scene.querySelector('.scene-photo-content');
          if (content) content.classList.add('visible');

          // Activate final scene
          if (scene.classList.contains('scene-final')) {
            scene.classList.add('visible');
            // Particle burst on final scene
            setTimeout(() => {
              if (particles) {
                particles.burst(window.innerWidth / 2, window.innerHeight / 2, 60);
                setTimeout(() => particles.burst(window.innerWidth * 0.3, window.innerHeight * 0.4, 30), 400);
                setTimeout(() => particles.burst(window.innerWidth * 0.7, window.innerHeight * 0.6, 30), 700);
              }
            }, 600);
          }

          // Update progress dots
          updateProgressDots(idx);
          currentSceneIdx = idx;
        }
      });
    }, options);

    document.querySelectorAll('.scene, .scene-cta').forEach(s => observer.observe(s));
  }

  /* ── Progress Dots ── */
  function buildProgressDots() {
    const d = tributeData;
    const count = (d.photos?.length || 0) + 2; // opening + photos + final
    const container = document.createElement('div');
    container.className = 'scene-progress';
    container.id = 'sceneProgress';

    for (let i = 0; i <= count; i++) {
      const dot = document.createElement('button');
      dot.className = `scene-dot${i === 0 ? ' active' : ''}`;
      dot.dataset.target = i;
      dot.title = `Cena ${i + 1}`;
      dot.setAttribute('aria-label', `Ir para cena ${i + 1}`);
      dot.addEventListener('click', () => scrollToScene(i));
      container.appendChild(dot);
    }

    document.body.appendChild(container);
  }

  function updateProgressDots(activeIdx) {
    document.querySelectorAll('.scene-dot').forEach(dot => {
      dot.classList.toggle('active', parseInt(dot.dataset.target) === activeIdx);
    });
  }

  function scrollToScene(idx) {
    const scene = document.querySelector(`[data-scene="${idx}"]`);
    if (scene) {
      scene.scrollIntoView({ behavior: 'smooth' });
    }
  }

  /* ── Music ── */
  function initYouTubeMusic(url) {
    // Extract video ID
    const videoId = extractYouTubeId(url);
    if (!videoId) return;

    const playerDiv = document.getElementById('youtubePlayer');
    if (!playerDiv) return;

    playerDiv.innerHTML = `
      <iframe
        id="ytIframe"
        src="https://www.youtube.com/embed/${videoId}?autoplay=1&loop=1&playlist=${videoId}&controls=0&mute=0&enablejsapi=1"
        allow="autoplay; encrypted-media"
        allowfullscreen
      ></iframe>
    `;
    playerDiv.style.display = 'block';
    musicPlaying = true;
  }

  function extractYouTubeId(url) {
    try {
      const patterns = [
        /youtube\.com\/watch\?v=([^&]+)/,
        /youtu\.be\/([^?]+)/,
        /youtube\.com\/embed\/([^?]+)/,
        /youtube\.com\/shorts\/([^?]+)/,
      ];
      for (const p of patterns) {
        const m = url.match(p);
        if (m) return m[1];
      }
    } catch (e) {}
    return null;
  }

  function showMusicIndicator() {
    const indicator = document.createElement('div');
    indicator.className = 'music-indicator';
    indicator.id = 'musicIndicator';
    indicator.title = 'Clique para pausar/reproduzir música';
    indicator.innerHTML = `
      <div class="music-bars">
        <div class="music-bar"></div>
        <div class="music-bar"></div>
        <div class="music-bar"></div>
        <div class="music-bar"></div>
      </div>
      <span>Música</span>
    `;

    indicator.addEventListener('click', toggleMusic);
    document.body.appendChild(indicator);
  }

  function toggleMusic() {
    const indicator = document.getElementById('musicIndicator');
    const iframe = document.getElementById('ytIframe');

    musicPlaying = !musicPlaying;
    indicator?.classList.toggle('paused', !musicPlaying);

    if (iframe) {
      iframe.contentWindow.postMessage(
        JSON.stringify({ event: 'command', func: musicPlaying ? 'playVideo' : 'pauseVideo' }),
        '*'
      );
    }
  }

  /* ── Helpers ── */
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

})();
