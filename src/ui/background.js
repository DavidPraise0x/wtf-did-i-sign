/**
 * GPU-Accelerated, High-Performance 3D-ish Cosmic Background
 * Caches emojis and shadows on off-screen canvases at startup.
 * Uses fast drawImage blits for buttery-smooth 60 FPS, with faster velocities.
 */

const emojiCache = {};
const emojis = ['🚀', '🛸', '🛰️', '☄️', '🧑‍🚀', '✨', '👾', '🪐'];
const glowMap = {
  '🚀': '#f43f5e', // Hot coral
  '☄️': '#f59e0b', // Amber
  '🪐': '#a78bfa', // Lavender
  '🛸': '#06b6d4', // Cyan
  '🛰️': '#3b82f6', // Blue
  '🧑‍🚀': '#c4b5fd', // Soft purple
  '👾': '#10b981', // Emerald
  '✨': '#fef08a'  // Gold
};

// Pre-render emojis with shadows onto off-screen canvases for 60 FPS performance
function preRenderEmojis() {
  emojis.forEach(char => {
    const cacheCanvas = document.createElement('canvas');
    const size = 220; // Canvas dimensions
    cacheCanvas.width = size;
    cacheCanvas.height = size;
    const cctx = cacheCanvas.getContext('2d');

    const glowColor = glowMap[char] || '#8b5cf6';
    
    // Draw high-quality neon glow shadow
    cctx.shadowColor = glowColor;
    cctx.shadowBlur = 30;
    cctx.shadowOffsetX = 0;
    cctx.shadowOffsetY = 0;

    // Draw emoji in the center
    cctx.font = '110px sans-serif';
    cctx.textAlign = 'center';
    cctx.textBaseline = 'middle';
    cctx.fillText(char, size / 2, size / 2);

    emojiCache[char] = cacheCanvas;
  });
}

// Run pre-rendering immediately
preRenderEmojis();

export function initCosmicBackground() {
  const canvas = document.getElementById('cosmic-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width = (canvas.width = window.innerWidth);
  let height = (canvas.height = window.innerHeight);

  window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
  });

  // Track mouse position
  const mouse = { x: null, y: null, radius: 140 };
  window.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  });
  window.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  // Click particles
  const particles = [];

  class ClickSparkle {
    constructor(x, y) {
      this.x = x;
      this.y = y;
      this.size = Math.random() * 4 + 2;
      this.vx = (Math.random() - 0.5) * 7;
      this.vy = (Math.random() - 0.5) * 7;
      this.alpha = 1;
      this.color = Math.random() < 0.5 ? '#8b5cf6' : '#06b6d4';
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.alpha -= 0.025;
    }
    draw() {
      ctx.save();
      ctx.globalAlpha = this.alpha;
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Click handler to spawn sparkles and launch fast rockets
  window.addEventListener('click', (e) => {
    const clickX = e.clientX;
    const clickY = e.clientY;
    
    for (let i = 0; i < 15; i++) {
      particles.push(new ClickSparkle(clickX, clickY));
    }

    if (Math.random() < 0.5) {
      // Faster rocket speeds for energetic feel
      spaceObjects.push(new CosmicObject(clickX, height + 120, '🚀', -2 - Math.random() * 4, -6 - Math.random() * 8, 1.4));
    }
  });

  // Parallax stars
  const stars = [];
  const numStars = 80;
  for (let i = 0; i < numStars; i++) {
    stars.push({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.6 + 0.3,
      speed: Math.random() * 0.15 + 0.05,
      baseOpacity: Math.random() * 0.75 + 0.15,
      opacity: 0
    });
  }

  // Floating Cosmic Objects
  const spaceObjects = [];

  class CosmicObject {
    constructor(x, y, char, vx, vy, scale = 1.0) {
      this.x = x;
      this.y = y;
      this.char = char;
      
      this.zDepth = Math.random();
      
      // BOLDER AND BIGGER: scale range 0.7x to 1.8x (size 70px to 180px)
      this.scale = scale * (this.zDepth * 1.1 + 0.7);
      
      // Speed scales with depth for parallax effect (Faster velocities to avoid laggy look)
      this.vx = vx * (this.zDepth * 0.8 + 0.5);
      this.vy = vy * (this.zDepth * 0.8 + 0.5);
      
      this.angle = Math.atan2(vy, vx) + Math.PI / 2;
      this.rotationSpeed = (Math.random() - 0.5) * 0.012; // faster spin

      // 3D rotation pitch & yaw simulation values
      this.yaw = Math.random() * Math.PI * 2;
      this.pitch = Math.random() * Math.PI * 2;
      this.yawSpeed = (Math.random() - 0.5) * 0.035;
      this.pitchSpeed = (Math.random() - 0.5) * 0.035;

      this.opacity = this.zDepth * 0.45 + 0.45; // High opacity (0.45 - 0.90) for boldness
    }
    update() {
      this.x += this.vx;
      this.y += this.vy;
      this.angle += this.rotationSpeed;
      this.yaw += this.yawSpeed;
      this.pitch += this.pitchSpeed;
    }
    draw() {
      const cached = emojiCache[this.char];
      if (!cached) return;

      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle);
      
      // 3D rotation yaw & pitch simulation
      const squeezeX = Math.abs(Math.sin(this.yaw));
      const squeezeY = Math.abs(Math.cos(this.pitch));
      ctx.scale(squeezeX, squeezeY);

      // Render pre-rendered GPU cached image centering it
      const baseSize = 100;
      const w = baseSize * this.scale;
      const h = baseSize * this.scale;
      ctx.drawImage(cached, -w / 2, -h / 2, w, h);

      ctx.restore();
    }
    isOffScreen() {
      const margin = 200;
      return (
        this.x < -margin ||
        this.x > width + margin ||
        this.y < -margin ||
        this.y > height + margin
      );
    }
  }

  function spawnRandomObject() {
    const side = Math.random() < 0.5 ? 'bottom' : 'right';
    const char = emojis[Math.floor(Math.random() * emojis.length)];
    let x, y, vx, vy;

    if (side === 'bottom') {
      x = Math.random() * width;
      y = height + 150;
      // Faster upward speeds
      vx = (Math.random() - 0.4) * 2.5;
      vy = -2.5 - Math.random() * 3.5;
    } else {
      x = width + 150;
      y = Math.random() * height;
      // Faster leftward speeds
      vx = -3.0 - Math.random() * 4.5;
      vy = (Math.random() - 0.5) * 2.0;
    }

    spaceObjects.push(new CosmicObject(x, y, char, vx, vy));
  }

  // Initial seed
  for (let i = 0; i < 5; i++) {
    spawnRandomObject();
    spaceObjects[i].x = Math.random() * width;
    spaceObjects[i].y = Math.random() * height;
  }

  // Animation loop
  function animate() {
    ctx.fillStyle = '#06080f';
    ctx.fillRect(0, 0, width, height);

    // 1. Stars drift
    stars.forEach((star) => {
      let dx = 0, dy = 0;
      if (mouse.x !== null && mouse.y !== null) {
        const dist = Math.hypot(star.x - mouse.x, star.y - mouse.y);
        if (dist < mouse.radius) {
          const force = (mouse.radius - dist) / mouse.radius;
          dx = ((star.x - mouse.x) / dist) * force * 15;
          dy = ((star.y - mouse.y) / dist) * force * 15;
        }
      }

      star.y -= star.speed;
      if (star.y < 0) {
        star.y = height;
        star.x = Math.random() * width;
      }

      star.opacity = star.baseOpacity + Math.sin(Date.now() * 0.002 + star.x) * 0.12;

      ctx.save();
      ctx.globalAlpha = Math.max(0.1, Math.min(1, star.opacity));
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(star.x + dx, star.y + dy, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 2. Click bursts
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.update();
      p.draw();
      if (p.alpha <= 0) particles.splice(i, 1);
    }

    // 3. Floating cosmic objects (Runs at GPU-accelerated 60 FPS now)
    for (let i = spaceObjects.length - 1; i >= 0; i--) {
      const obj = spaceObjects[i];
      obj.update();
      obj.draw();
      if (obj.isOffScreen()) {
        spaceObjects.splice(i, 1);
      }
    }

    // Object count checker
    if (spaceObjects.length < 5 && Math.random() < 0.008) {
      spawnRandomObject();
    }

    // Mouse trailing
    if (mouse.x !== null && mouse.y !== null && Math.random() < 0.25) {
      particles.push(new ClickSparkle(mouse.x + (Math.random() - 0.5) * 8, mouse.y + (Math.random() - 0.5) * 8));
    }

    requestAnimationFrame(animate);
  }

  animate();
}
