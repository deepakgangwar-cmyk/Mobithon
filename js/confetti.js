/**
 * confetti.js — Canvas-based confetti particle system for final reveal
 */

const Confetti = {
  _canvas: null,
  _ctx: null,
  _particles: [],
  _animId: null,
  _running: false,

  init() {
    this._canvas = document.getElementById('confetti-canvas');
    if (!this._canvas) return;
    this._ctx = this._canvas.getContext('2d');
    this.resize();
    window.addEventListener('resize', () => this.resize());
  },

  resize() {
    if (!this._canvas) return;
    this._canvas.width = window.innerWidth;
    this._canvas.height = window.innerHeight;
  },

  start() {
    this._running = true;
    this._particles = [];
    
    const colors = ['#00f0ff', '#b060ff', '#ff3e8e', '#00ff88', '#ffd700', '#ff8c00'];

    // Create particles
    for (let i = 0; i < 150; i++) {
      this._particles.push({
        x: Math.random() * this._canvas.width,
        y: Math.random() * this._canvas.height - this._canvas.height,
        w: Math.random() * 10 + 5,
        h: Math.random() * 6 + 3,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 4,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        opacity: 1
      });
    }

    this.animate();
  },

  animate() {
    if (!this._running) return;

    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);

    let aliveCount = 0;

    this._particles.forEach(p => {
      if (p.opacity <= 0) return;
      aliveCount++;

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05; // gravity
      p.rotation += p.rotationSpeed;

      // Fade out near bottom
      if (p.y > this._canvas.height * 0.8) {
        p.opacity -= 0.02;
      }

      this._ctx.save();
      this._ctx.translate(p.x, p.y);
      this._ctx.rotate((p.rotation * Math.PI) / 180);
      this._ctx.globalAlpha = Math.max(0, p.opacity);
      this._ctx.fillStyle = p.color;
      this._ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      this._ctx.restore();
    });

    if (aliveCount > 0) {
      this._animId = requestAnimationFrame(() => this.animate());
    } else {
      this._running = false;
    }
  },

  stop() {
    this._running = false;
    if (this._animId) {
      cancelAnimationFrame(this._animId);
    }
    if (this._ctx) {
      this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
    }
  }
};
