/* ============================================================
   PARTICLES.JS — Sistema de Partículas Temáticas
   Canvas-based particles for cinematic experience
   ============================================================ */

class ParticleSystem {
  constructor(canvasId, type, colors) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;

    this.ctx = this.canvas.getContext('2d');
    this.type = type || 'heart';
    this.colors = colors || ['#FF6B9D', '#D4296B'];
    this.particles = [];
    this.maxParticles = this.getMaxParticles();
    this.running = true;
    this.mouseX = 0;
    this.mouseY = 0;

    this.resize();
    this.bindEvents();
    this.init();
    this.animate();
  }

  getMaxParticles() {
    const isMobile = window.innerWidth < 768;
    switch(this.type) {
      case 'heart':    return isMobile ? 20 : 40;
      case 'flower':   return isMobile ? 18 : 35;
      case 'star':     return isMobile ? 30 : 55;
      case 'confetti': return isMobile ? 40 : 70;
      case 'sparkle':  return isMobile ? 25 : 45;
      default:         return isMobile ? 20 : 40;
    }
  }

  resize() {
    this.canvas.width  = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.maxParticles = this.getMaxParticles();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });
  }

  randomColor() {
    return this.colors[Math.floor(Math.random() * this.colors.length)];
  }

  createParticle(x, y) {
    const base = {
      x: x ?? (Math.random() * this.canvas.width),
      y: y ?? (Math.random() * this.canvas.height + this.canvas.height),
      color: this.randomColor(),
      life: 1,
      decay: 0.003 + Math.random() * 0.004,
      size: 6 + Math.random() * 14,
      speedX: (Math.random() - 0.5) * 0.8,
      speedY: -(0.4 + Math.random() * 1.2),
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      swing: Math.random() * 0.03,
      swingOffset: Math.random() * Math.PI * 2,
      opacity: 0,
      fadeIn: true,
    };

    if (this.type === 'confetti') {
      base.size = 5 + Math.random() * 9;
      base.speedY = -(0.2 + Math.random() * 0.8);
      base.decay = 0.002 + Math.random() * 0.003;
      base.width = base.size;
      base.height = base.size * (0.3 + Math.random() * 0.7);
      base.color = this.confettiColors[Math.floor(Math.random() * this.confettiColors.length)];
    }

    return base;
  }

  get confettiColors() {
    return [
      '#FF6B9D','#FFD700','#7D3C98','#AF7AC5',
      '#F1C40F','#E74C3C','#3498DB','#2ECC71',
      '#FF8FA3','#A9CCE3',
    ];
  }

  init() {
    for (let i = 0; i < this.maxParticles; i++) {
      const p = this.createParticle();
      p.y = Math.random() * this.canvas.height;
      this.particles.push(p);
    }
  }

  update() {
    this.particles.forEach((p, idx) => {
      // Fade in
      if (p.fadeIn) {
        p.opacity = Math.min(1, p.opacity + 0.02);
        if (p.opacity >= 0.9) p.fadeIn = false;
      }

      // Swinging motion
      p.swingOffset += p.swing;
      p.x += p.speedX + Math.sin(p.swingOffset) * 0.5;
      p.y += p.speedY;
      p.rotation += p.rotSpeed;

      // Life decay
      if (!p.fadeIn) {
        p.life -= p.decay;
        p.opacity = p.life;
      }

      // Respawn
      if (p.life <= 0 || p.y < -60 || p.x < -60 || p.x > this.canvas.width + 60) {
        this.particles[idx] = this.createParticle();
      }
    });

    // Maintain particle count
    while (this.particles.length < this.maxParticles) {
      this.particles.push(this.createParticle());
    }
  }

  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach(p => {
      this.ctx.save();
      this.ctx.globalAlpha = p.opacity * 0.75;
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate(p.rotation);

      switch (this.type) {
        case 'heart':    this.drawHeart(p);    break;
        case 'flower':   this.drawFlower(p);   break;
        case 'star':     this.drawStar(p);     break;
        case 'confetti': this.drawConfetti(p); break;
        case 'sparkle':  this.drawSparkle(p);  break;
        default:         this.drawHeart(p);    break;
      }

      this.ctx.restore();
    });
  }

  drawHeart(p) {
    const s = p.size;
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(0, s * 0.15);
    ctx.bezierCurveTo(-s * 0.1, -s * 0.2, -s * 0.5, -s * 0.2, -s * 0.5, s * 0.15);
    ctx.bezierCurveTo(-s * 0.5, s * 0.45, 0, s * 0.65, 0, s * 0.65);
    ctx.bezierCurveTo(0, s * 0.65, s * 0.5, s * 0.45, s * 0.5, s * 0.15);
    ctx.bezierCurveTo(s * 0.5, -s * 0.2, s * 0.1, -s * 0.2, 0, s * 0.15);
    ctx.fillStyle = p.color;
    ctx.fill();

    // Glow
    ctx.shadowColor = p.color;
    ctx.shadowBlur = s * 0.5;
    ctx.fill();
  }

  drawFlower(p) {
    const s = p.size;
    const ctx = this.ctx;
    const petals = 5;
    const petalR = s * 0.45;

    for (let i = 0; i < petals; i++) {
      const angle = (i / petals) * Math.PI * 2;
      const px = Math.cos(angle) * petalR * 0.5;
      const py = Math.sin(angle) * petalR * 0.5;

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, 0, petalR * 0.4, petalR * 0.7, 0, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.globalAlpha *= 0.85;
      ctx.fill();
      ctx.restore();
    }

    // Center
    ctx.beginPath();
    ctx.arc(0, 0, s * 0.18, 0, Math.PI * 2);
    ctx.fillStyle = '#FFEAA7';
    ctx.fill();

    ctx.shadowColor = p.color;
    ctx.shadowBlur = s * 0.5;
  }

  drawStar(p) {
    const s = p.size;
    const ctx = this.ctx;
    const points = 5;
    const outerR = s * 0.55;
    const innerR = s * 0.22;

    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = p.color;
    ctx.fill();

    ctx.shadowColor = p.color;
    ctx.shadowBlur = s * 0.7;
    ctx.fill();
  }

  drawConfetti(p) {
    const ctx = this.ctx;
    ctx.fillStyle = p.color;
    ctx.fillRect(-p.width / 2, -p.height / 2, p.width, p.height);
  }

  drawSparkle(p) {
    const s = p.size;
    const ctx = this.ctx;

    // 4-pointed star / diamond sparkle
    ctx.beginPath();
    ctx.moveTo(0, -s * 0.6);
    ctx.lineTo(s * 0.12, -s * 0.12);
    ctx.lineTo(s * 0.6, 0);
    ctx.lineTo(s * 0.12, s * 0.12);
    ctx.lineTo(0, s * 0.6);
    ctx.lineTo(-s * 0.12, s * 0.12);
    ctx.lineTo(-s * 0.6, 0);
    ctx.lineTo(-s * 0.12, -s * 0.12);
    ctx.closePath();

    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, s * 0.6);
    grad.addColorStop(0, '#FFFFFF');
    grad.addColorStop(0.5, p.color);
    grad.addColorStop(1, 'transparent');

    ctx.fillStyle = grad;
    ctx.fill();

    ctx.shadowColor = p.color;
    ctx.shadowBlur = s;
    ctx.fill();
  }

  animate() {
    if (!this.running) return;
    this.update();
    this.draw();
    requestAnimationFrame(() => this.animate());
  }

  /**
   * Trigger a burst of particles from a specific location
   */
  burst(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      const p = this.createParticle(
        x + (Math.random() - 0.5) * 40,
        y + (Math.random() - 0.5) * 40
      );
      p.speedX = (Math.random() - 0.5) * 6;
      p.speedY = -(1 + Math.random() * 5);
      p.size = 8 + Math.random() * 16;
      p.decay = 0.012 + Math.random() * 0.015;
      p.opacity = 1;
      p.fadeIn = false;
      this.particles.push(p);
    }
  }

  /**
   * Update colors (for theme changes)
   */
  updateColors(colors) {
    this.colors = colors;
  }

  /**
   * Update particle type
   */
  updateType(type) {
    this.type = type;
    this.particles = [];
    this.init();
  }

  stop() { this.running = false; }
  start() { this.running = true; this.animate(); }
}
