/* ============================================
   PHILIP / 13 — interactions
   ============================================ */
(function () {
  'use strict';

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isMobile = !window.matchMedia('(pointer: fine)').matches;

  /* ============================================
     PARTICLE FIELD (canvas)
     ============================================ */
  function initParticles() {
    const canvas = document.getElementById('particle-canvas');
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    let DPR = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0, H = 0;
    let particles = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let audioLevel = 0;

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.scale(DPR, DPR);
      spawn();
    }

    function spawn() {
      const target = isMobile ? 50 : Math.floor((W * H) / 14000);
      particles = [];
      for (let i = 0; i < target; i++) {
        particles.push({
          x: Math.random() * W,
          y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 0.5 + Math.random() * 1.6,
          baseR: 0.5 + Math.random() * 1.6
        });
      }
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      const linkDist = 130 + audioLevel * 60;
      const linkDist2 = linkDist * linkDist;

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0) p.x = W; else if (p.x > W) p.x = 0;
        if (p.y < 0) p.y = H; else if (p.y > H) p.y = 0;

        if (mouse.active) {
          const mdx = p.x - mouse.x;
          const mdy = p.y - mouse.y;
          const md2 = mdx * mdx + mdy * mdy;
          if (md2 < 22500) {
            const f = (1 - md2 / 22500) * 0.6;
            p.x += (mdx / Math.sqrt(md2)) * f;
            p.y += (mdy / Math.sqrt(md2)) * f;
          }
        }

        p.r = p.baseR * (1 + audioLevel * 1.2);
        ctx.beginPath();
        ctx.fillStyle = `rgba(0, 255, 170, ${0.35 + audioLevel * 0.4})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x;
          const dy = p.y - q.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist2) {
            const a = (1 - d2 / linkDist2) * (0.18 + audioLevel * 0.25);
            ctx.strokeStyle = `rgba(74, 127, 255, ${a})`;
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }
      requestAnimationFrame(tick);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', e => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    });
    window.addEventListener('mouseleave', () => mouse.active = false);

    resize();
    if (!reduceMotion) tick();

    return {
      setAudio: lvl => audioLevel = lvl
    };
  }

  /* ============================================
     AUDIO — ambient pad + amplitude analyser
     ============================================ */
  function initAudio(onLevel) {
    let ctx = null;
    let masterGain = null;
    let analyser = null;
    let buffer = null;
    let voices = [];
    let on = false;

    function build() {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0;
      analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      buffer = new Uint8Array(analyser.frequencyBinCount);
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 900;
      lpf.Q.value = 0.7;
      lpf.connect(masterGain);

      const notes = [55, 82.5, 110, 165, 220];
      voices = notes.map((freq, i) => {
        const o = ctx.createOscillator();
        const og = ctx.createGain();
        o.type = i === 0 ? 'sine' : (i % 2 === 0 ? 'triangle' : 'sine');
        o.frequency.value = freq;
        og.gain.value = 0.15 / (i + 1);
        o.connect(og).connect(lpf);
        o.start();
        return { o, og };
      });

      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.07;
      lfoGain.gain.value = 300;
      lfo.connect(lfoGain).connect(lpf.frequency);
      lfo.start();
    }

    function poll() {
      if (!analyser || !on) {
        onLevel(0);
      } else {
        analyser.getByteFrequencyData(buffer);
        let sum = 0;
        for (let i = 0; i < buffer.length; i++) sum += buffer[i];
        const avg = (sum / buffer.length) / 255;
        onLevel(avg);
      }
      requestAnimationFrame(poll);
    }
    poll();

    return {
      toggle() {
        if (!ctx) build();
        if (!ctx) return false;
        if (ctx.state === 'suspended') ctx.resume();
        on = !on;
        const target = on ? 0.35 : 0;
        masterGain.gain.cancelScheduledValues(ctx.currentTime);
        masterGain.gain.linearRampToValueAtTime(target, ctx.currentTime + 1.2);
        return on;
      }
    };
  }

  /* ============================================
     INTRO
     ============================================ */
  function initIntro() {
    const intro = document.getElementById('intro');
    const num = document.getElementById('intro-count');
    const fill = document.querySelector('.intro-bar-fill');
    const start = document.getElementById('intro-start');
    if (!intro) return;

    let count = 0;
    const tick = () => {
      count = Math.min(count + (1 + Math.random() * 3), 100);
      num.textContent = String(Math.floor(count)).padStart(3, '0');
      fill.style.width = count + '%';
      if (count < 100) {
        setTimeout(tick, 30 + Math.random() * 40);
      } else {
        start.classList.add('ready');
      }
    };
    setTimeout(tick, 200);

    const go = () => {
      intro.classList.add('gone');
      setTimeout(() => intro.remove(), 1000);
    };
    start.addEventListener('click', go);
  }

  /* ============================================
     CLOCK / HUD
     ============================================ */
  function initClock() {
    const t = document.getElementById('hud-time');
    if (!t) return;
    const tick = () => {
      const d = new Date();
      t.textContent =
        String(d.getHours()).padStart(2, '0') + ':' +
        String(d.getMinutes()).padStart(2, '0') + ':' +
        String(d.getSeconds()).padStart(2, '0');
    };
    tick();
    setInterval(tick, 1000);
  }

  /* ============================================
     HERO COUNTDOWN
     ============================================ */
  function initCountdown() {
    const el = document.getElementById('hero-countdown');
    if (!el) return;
    const target = new Date('2026-05-12T00:00:00');
    const update = () => {
      const now = new Date();
      const diff = target - now;
      const days = Math.ceil(diff / 86400000);
      if (days > 1) {
        el.textContent = `T-${days} TAGE`;
      } else if (days === 1) {
        const hrs = Math.max(0, Math.floor(diff / 3600000));
        el.textContent = `T-${hrs}H · MORGEN`;
      } else if (days === 0) {
        el.textContent = 'LIVE · HEUTE';
      } else {
        el.textContent = 'CELEBRATED · 12.05.26';
      }
    };
    update();
    setInterval(update, 30000);
  }

  /* ============================================
     SCROLL RAIL + COORDINATES
     ============================================ */
  function initScroll() {
    const fill = document.querySelector('.scroll-fill');
    const coord = document.getElementById('scroll-coord');
    if (!fill) return;
    window.addEventListener('scroll', () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? (window.scrollY / max) * 100 : 0;
      fill.style.height = p + '%';
      if (coord) coord.textContent = String(Math.floor(p)).padStart(3, '0');
    }, { passive: true });
  }

  /* ============================================
     3D PLAYER CARD
     ============================================ */
  function init3DCard() {
    const card = document.getElementById('player-card');
    if (!card) return;
    const stage = card.parentElement;
    let targetRX = 0, targetRY = 0;
    let curRX = 0, curRY = 0;
    let bgX = 50, bgY = 50;
    let active = false;

    function update(e) {
      const r = card.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const x = e.clientX - cx;
      const y = e.clientY - cy;
      targetRY = (x / (r.width / 2)) * 18;
      targetRX = -(y / (r.height / 2)) * 18;

      const lx = ((e.clientX - r.left) / r.width) * 100;
      const ly = ((e.clientY - r.top) / r.height) * 100;
      bgX = lx;
      bgY = ly;
      // Drive holo + shine via CSS custom properties
      card.style.setProperty('--mx', lx + '%');
      card.style.setProperty('--my', ly + '%');
    }

    function reset() {
      targetRX = 0;
      targetRY = 0;
    }

    // Hover behavior
    stage.addEventListener('mousemove', e => { active = true; update(e); });
    stage.addEventListener('mouseleave', reset);

    // Touch drag (mobile)
    card.addEventListener('touchmove', e => {
      const t = e.touches[0];
      update({ clientX: t.clientX, clientY: t.clientY });
    }, { passive: true });
    card.addEventListener('touchend', reset);

    // Idle wobble when no interaction
    let idleT = 0;
    function tick() {
      curRX += (targetRX - curRX) * 0.12;
      curRY += (targetRY - curRY) * 0.12;
      idleT += 0.012;
      const idleRX = !active ? Math.sin(idleT) * 4 : 0;
      const idleRY = !active ? Math.cos(idleT * 0.7) * 5 : 0;
      card.style.transform = `rotateX(${curRX + idleRX}deg) rotateY(${curRY + idleRY}deg)`;
      requestAnimationFrame(tick);
    }
    tick();

    setTimeout(() => { active = false; }, 3000);
  }

  /* ============================================
     COUNT-UP STATS
     ============================================ */
  function initCountUps() {
    const els = document.querySelectorAll('[data-count-to]');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting || entry.target.dataset.counted) return;
        entry.target.dataset.counted = '1';
        const target = parseInt(entry.target.dataset.countTo, 10);
        const dur = 1800;
        const start = performance.now();
        const tick = now => {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = Math.floor(target * eased);
          entry.target.textContent = val.toLocaleString('de-DE');
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    els.forEach(el => obs.observe(el));
  }

  /* ============================================
     SECTION REVEAL
     ============================================ */
  function initReveal() {
    const sections = document.querySelectorAll('section');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in');
      });
    }, { threshold: 0.1 });
    sections.forEach(s => obs.observe(s));
  }

  /* ============================================
     TERMINAL TYPE
     ============================================ */
  function initTerminal() {
    const lines = document.querySelectorAll('[data-typeline]');
    if (!lines.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        obs.disconnect();
        lines.forEach((line, i) => {
          setTimeout(() => line.classList.add('shown'), i * 250);
        });
      });
    }, { threshold: 0.35 });
    obs.observe(document.querySelector('.terminal'));
  }

  /* ============================================
     HERO GLITCH (occasional)
     ============================================ */
  function initGlitch() {
    const name = document.querySelector('[data-glitch]');
    if (!name || reduceMotion) return;
    const fire = () => {
      name.classList.add('glitch');
      setTimeout(() => name.classList.remove('glitch'), 400);
    };
    setTimeout(fire, 2500);
    setInterval(() => {
      if (Math.random() < 0.4) fire();
    }, 5500);
    name.addEventListener('click', fire);
  }

  /* ============================================
     FINALE NUMBER
     ============================================ */
  function initFinaleNum() {
    const el = document.querySelector('[data-finale-num]');
    if (!el) return;
    const target = parseInt(el.textContent, 10);
    let triggered = false;
    const obs = new IntersectionObserver(entries => {
      if (triggered || !entries[0].isIntersecting) return;
      triggered = true;
      let n = 0;
      const tick = () => {
        n++;
        el.textContent = n;
        if (n < target) setTimeout(tick, 70);
      };
      tick();
    }, { threshold: 0.5 });
    obs.observe(el);

    el.addEventListener('click', () => {
      const popup = document.createElement('div');
      popup.className = 'found-popup';
      popup.textContent = 'Happy Birthday';
      popup.style.left = (window.innerWidth / 2) + 'px';
      popup.style.top = (window.innerHeight / 2) + 'px';
      document.body.appendChild(popup);
      setTimeout(() => popup.remove(), 1800);
    });
  }

  /* ============================================
     GAME TILE TILT
     ============================================ */
  function initTilt() {
    if (isMobile) return;
    document.querySelectorAll('[data-tilt]').forEach(el => {
      let rafId = null;
      let tx = 0, ty = 0, cx = 0, cy = 0;
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        tx = ((y - r.height / 2) / (r.height / 2)) * 6;
        ty = ((x - r.width / 2) / (r.width / 2)) * -6;
        if (!rafId) {
          const tick = () => {
            cx += (tx - cx) * 0.15;
            cy += (ty - cy) * 0.15;
            el.style.transform = `perspective(900px) rotateX(${cx}deg) rotateY(${cy}deg) translateY(-4px)`;
            if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) {
              rafId = requestAnimationFrame(tick);
            } else { rafId = null; }
          };
          rafId = requestAnimationFrame(tick);
        }
      });
      el.addEventListener('mouseleave', () => {
        tx = 0; ty = 0;
        const lerp = () => {
          cx += (0 - cx) * 0.15;
          cy += (0 - cy) * 0.15;
          el.style.transform = `perspective(900px) rotateX(${cx}deg) rotateY(${cy}deg)`;
          if (Math.abs(cx) > 0.05 || Math.abs(cy) > 0.05) requestAnimationFrame(lerp);
          else el.style.transform = '';
        };
        requestAnimationFrame(lerp);
      });
    });
  }

  /* ============================================
     INIT
     ============================================ */
  document.addEventListener('DOMContentLoaded', () => {
    const particles = initParticles();
    const audio = initAudio(level => {
      if (particles) particles.setAudio(level);
    });

    const btn = document.getElementById('audio-toggle');
    const label = btn && btn.querySelector('.audio-label');
    btn.addEventListener('click', () => {
      const on = audio.toggle();
      btn.classList.toggle('on', on);
      if (label) label.textContent = on ? 'AUDIO ON' : 'AUDIO OFF';
    });

    initIntro();
    initClock();
    initCountdown();
    initScroll();
    init3DCard();
    initCountUps();
    initReveal();
    initTerminal();
    initGlitch();
    initFinaleNum();
    initTilt();
  });
})();
