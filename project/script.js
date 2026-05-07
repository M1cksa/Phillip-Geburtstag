/* ============================================
   PHILIP — HAPPY BIRTHDAY
   Interactions, sound, easter eggs
   ============================================ */

(function () {
  'use strict';

  // ============ Audio ============
  let audioCtx = null, masterGain = null, ambientNodes = null, soundOn = false;

  function initAudio() {
    if (audioCtx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
      masterGain = audioCtx.createGain();
      masterGain.gain.value = 0;
      masterGain.connect(audioCtx.destination);
    } catch (e) {}
  }

  function startAmbient() {
    if (!audioCtx || ambientNodes) return;
    const now = audioCtx.currentTime;

    const osc1 = audioCtx.createOscillator(); osc1.type = 'sine'; osc1.frequency.value = 55;
    const osc2 = audioCtx.createOscillator(); osc2.type = 'sine'; osc2.frequency.value = 82.4;
    const oscGain = audioCtx.createGain(); oscGain.gain.value = 0.12;

    const lfo = audioCtx.createOscillator(); lfo.frequency.value = 0.08;
    const lfoG = audioCtx.createGain(); lfoG.gain.value = 0.06;
    lfo.connect(lfoG).connect(oscGain.gain);

    const bufSize = 2 * audioCtx.sampleRate;
    const buf = audioCtx.createBuffer(1, bufSize, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const noise = audioCtx.createBufferSource(); noise.buffer = buf; noise.loop = true;
    const nf = audioCtx.createBiquadFilter(); nf.type = 'lowpass'; nf.frequency.value = 350;
    const ng = audioCtx.createGain(); ng.gain.value = 0.025;
    noise.connect(nf).connect(ng).connect(masterGain);

    osc1.connect(oscGain); osc2.connect(oscGain); oscGain.connect(masterGain);
    [osc1, osc2, lfo, noise].forEach(n => n.start(now));
    ambientNodes = { osc1, osc2, lfo, noise };
  }

  function stopAmbient() {
    if (!ambientNodes || !audioCtx) return;
    const now = audioCtx.currentTime;
    try { Object.values(ambientNodes).forEach(n => n.stop(now + 0.05)); } catch (e) {}
    ambientNodes = null;
  }

  function sfxClick(freq = 440, dur = 0.08, vol = 0.1) {
    if (!audioCtx || !soundOn) return;
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator(); o.type = 'triangle'; o.frequency.value = freq;
    const g = audioCtx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(vol, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(masterGain); o.start(t); o.stop(t + dur + 0.02);
  }

  function sfxBum() {
    if (!audioCtx || !soundOn) return;
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.35);
    const g = audioCtx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.38, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.connect(g).connect(masterGain); o.start(t); o.stop(t + 0.6);
  }

  function sfxWhoosh() {
    if (!audioCtx || !soundOn) return;
    const t = audioCtx.currentTime;
    const size = audioCtx.sampleRate * 0.5;
    const buf = audioCtx.createBuffer(1, size, audioCtx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < size; i++) d[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource(); src.buffer = buf;
    const filt = audioCtx.createBiquadFilter(); filt.type = 'bandpass'; filt.Q.value = 1.5;
    filt.frequency.setValueAtTime(150, t);
    filt.frequency.exponentialRampToValueAtTime(3500, t + 0.35);
    const g = audioCtx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.18, t + 0.04);
    g.gain.linearRampToValueAtTime(0, t + 0.45);
    src.connect(filt).connect(g).connect(masterGain); src.start(t); src.stop(t + 0.5);
  }

  function sfxPop() {
    if (!audioCtx || !soundOn) return;
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(600, t);
    o.frequency.exponentialRampToValueAtTime(200, t + 0.12);
    const g = audioCtx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.2, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
    o.connect(g).connect(masterGain); o.start(t); o.stop(t + 0.18);
  }

  function toggleSound() {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    soundOn = !soundOn;
    const target = soundOn ? 0.45 : 0;
    masterGain.gain.cancelScheduledValues(audioCtx.currentTime);
    masterGain.gain.setTargetAtTime(target, audioCtx.currentTime, 0.4);
    const btn = document.querySelector('.sound-toggle');
    if (btn) {
      btn.classList.toggle('on', soundOn);
      btn.querySelector('.label').textContent = soundOn ? 'SOUND ON' : 'SOUND OFF';
    }
    if (soundOn) startAmbient(); else setTimeout(stopAmbient, 700);
  }

  // ============ BUM BUM ============
  let bumbumCount = 0;
  let bumbumCooldown = false;
  const COLORS = ['#1d4eff', '#ffd84d', '#ff6b35', '#39d98a', '#ff4d9e', '#4d78ff'];

  function showBumBum(x, y) {
    if (bumbumCooldown) return;
    bumbumCooldown = true;
    setTimeout(() => bumbumCooldown = false, 1100);

    const el = document.createElement('div');
    el.className = 'bumbum-pop';
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    el.style.color = color;
    el.style.textShadow = `0 0 40px ${color}88`;
    el.textContent = 'Bum Bum';
    const tilt = (Math.random() * 20 - 10).toFixed(1);
    const cx = x !== undefined ? x : window.innerWidth * (0.2 + Math.random() * 0.6);
    const cy = y !== undefined ? y : window.innerHeight * (0.2 + Math.random() * 0.6);
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    el.style.transform = `translate(-50%,-50%) scale(0.5) rotate(${tilt}deg)`;
    document.body.appendChild(el);
    sfxBum();

    bumbumCount++;
    const badge = document.getElementById('bumbum-count');
    if (badge) badge.textContent = String(bumbumCount).padStart(3, '0');
    setTimeout(() => el.remove(), 1500);

    // Mini confetti burst at position
    spawnConfettiBurst(cx, cy, 8, color);
  }

  function spawnConfettiBurst(cx, cy, count, color) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size = 4 + Math.random() * 6;
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 40 + Math.random() * 80;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      p.style.cssText = `
        position:fixed;
        left:${cx}px; top:${cy}px;
        width:${size}px; height:${size}px;
        background:${Math.random() > 0.5 ? color : '#fff'};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        pointer-events:none; z-index:8999;
        transform: translate(-50%,-50%);
        animation: burst 0.7s ease-out forwards;
      `;
      document.body.appendChild(p);
      const kf = p.animate([
        { transform: `translate(-50%,-50%)`, opacity: 1 },
        { transform: `translate(calc(-50% + ${tx}px), calc(-50% + ${ty}px)) rotate(${Math.random()*360}deg)`, opacity: 0 }
      ], { duration: 500 + Math.random() * 300, easing: 'ease-out', fill: 'forwards' });
      kf.onfinish = () => p.remove();
    }
  }

  // ============ Floating confetti (hero background) ============
  function setupFloatingConfetti() {
    const hero = document.getElementById('hero');
    if (!hero) return;
    const colors = ['#1d4eff', '#ffd84d', '#ff6b35', '#39d98a', '#ff4d9e'];
    for (let i = 0; i < 18; i++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      const size = 4 + Math.random() * 10;
      el.style.cssText = `
        width:${size}px; height:${size}px;
        background:${colors[i % colors.length]};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        left:${Math.random() * 100}%;
        top:${80 + Math.random() * 50}%;
        animation-duration:${6 + Math.random() * 10}s;
        animation-delay:${Math.random() * -12}s;
      `;
      hero.appendChild(el);
    }
  }

  // ============ Intro ============
  function setupIntro() {
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) return;
    const btn = overlay.querySelector('.intro-btn');
    const go = () => {
      initAudio();
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      if (!soundOn) toggleSound();
      sfxWhoosh();
      overlay.classList.add('gone');
      setTimeout(() => overlay.remove(), 1100);
    };
    btn.addEventListener('click', (e) => { e.stopPropagation(); go(); });
  }

  // ============ Scroll reveals ============
  function setupReveals() {
    const els = document.querySelectorAll('.reveal, .reveal-up, .reveal-scale');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('in'); sfxPop(); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    els.forEach(el => obs.observe(el));
  }

  // ============ Scroll progress ============
  function setupScrollProgress() {
    const fill = document.querySelector('.scroll-progress .fill');
    if (!fill) return;
    window.addEventListener('scroll', () => {
      const s = window.scrollY;
      const total = document.documentElement.scrollHeight - window.innerHeight;
      fill.style.width = Math.min(100, (s / total) * 100) + '%';
    }, { passive: true });
  }

  // ============ Countdown ============
  function setupCountdown() {
    const el = document.getElementById('days-left');
    if (!el) return;
    const target = new Date('2026-05-12T00:00:00');
    const update = () => {
      const now = new Date();
      const diff = target - now;
      const days = Math.ceil(diff / 86400000);
      if (days > 0) el.textContent = `Noch ${days} Tage`;
      else if (days === 0) el.textContent = 'HEUTE! 🎉';
      else el.textContent = '12.05.2026';
    };
    update();
    setInterval(update, 60000);
  }

  // ============ BumBum triggers ============
  function setupBumBum() {
    // Random on scroll
    let lastScrollBum = 0, lastY = window.scrollY;
    window.addEventListener('scroll', () => {
      const dy = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      const now = Date.now();
      if (now - lastScrollBum > 5000 && Math.random() < 0.05 && dy > 100) {
        lastScrollBum = now;
        showBumBum();
      }
    }, { passive: true });

    // Click triggers
    document.addEventListener('click', (e) => {
      if (e.target.closest('.bum-trigger')) { showBumBum(e.clientX, e.clientY); return; }
      if (e.target.closest('button, a, .sound-toggle, .intro-btn')) return;
      if (Math.random() < 0.15) showBumBum(e.clientX, e.clientY);
    });
  }

  // ============ Keyboard eggs ============
  function setupKeyEggs() {
    const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let buf = [];
    document.addEventListener('keydown', e => {
      buf.push(e.key); if (buf.length > 12) buf.shift();
      if (buf.slice(-10).join(',').toLowerCase() === konami.join(',').toLowerCase()) {
        for (let i = 0; i < 14; i++) setTimeout(() => showBumBum(), i * 120);
        buf = [];
      }
      const last6 = buf.slice(-6).join('').toLowerCase();
      if (last6 === 'philip') {
        for (let i = 0; i < 8; i++) setTimeout(() => showBumBum(), i * 150);
        buf = [];
      }
    });
  }

  // ============ Hover SFX ============
  function setupHoverSFX() {
    document.querySelectorAll('.hobby-card, .game-card').forEach((el, i) => {
      el.addEventListener('mouseenter', () => sfxClick(400 + i * 40, 0.05, 0.04));
    });
  }

  // ============ Init ============
  document.addEventListener('DOMContentLoaded', () => {
    setupIntro();
    setupFloatingConfetti();
    setupReveals();
    setupScrollProgress();
    setupCountdown();
    setupBumBum();
    setupKeyEggs();
    setupHoverSFX();

    // Sound toggle button
    const btn = document.querySelector('.sound-toggle');
    if (btn) btn.addEventListener('click', () => { toggleSound(); sfxClick(660); });
  });

})();
