/* ============================================
   PHILIP — HAPPY BIRTHDAY
   Interactions, sound, easter eggs
   ============================================ */

(function () {
  'use strict';

  // ============ Audio (nur Bum Bum) ============
  let audioCtx = null;

  function initAudio() {
    if (audioCtx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      audioCtx = new AC();
    } catch (e) {}
  }

  function sfxBum() {
    if (!audioCtx) return;
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const t = audioCtx.currentTime;
    const o = audioCtx.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.35);
    const g = audioCtx.createGain(); g.gain.value = 0;
    g.gain.linearRampToValueAtTime(0.3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
    o.connect(g).connect(audioCtx.destination);
    o.start(t); o.stop(t + 0.6);
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
    const cx = x !== undefined ? x : window.innerWidth * (0.2 + Math.random() * 0.6);
    const cy = y !== undefined ? y : window.innerHeight * (0.2 + Math.random() * 0.6);
    el.style.left = cx + 'px';
    el.style.top = cy + 'px';
    document.body.appendChild(el);
    sfxBum();

    bumbumCount++;
    const badge = document.getElementById('bumbum-count');
    if (badge) badge.textContent = String(bumbumCount).padStart(3, '0');
    setTimeout(() => el.remove(), 1500);

    spawnConfettiBurst(cx, cy, 10, color);
  }

  function spawnConfettiBurst(cx, cy, count, color) {
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      const size = 4 + Math.random() * 7;
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
      const dist = 40 + Math.random() * 90;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      p.style.cssText = `
        position:fixed; left:${cx}px; top:${cy}px;
        width:${size}px; height:${size}px;
        background:${Math.random() > 0.5 ? color : '#fff'};
        border-radius:${Math.random() > 0.5 ? '50%' : '2px'};
        pointer-events:none; z-index:8999;
        transform: translate(-50%,-50%);
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
    for (let i = 0; i < 20; i++) {
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

  // ============ Custom cursor ============
  function setupCursor() {
    if (!window.matchMedia('(pointer: fine)').matches) return;

    const dot = document.querySelector('.cursor-dot');
    const ring = document.querySelector('.cursor-ring');
    if (!dot || !ring) return;

    document.body.classList.add('has-cursor');

    let mx = window.innerWidth / 2, my = window.innerHeight / 2;
    let rx = mx, ry = my;

    document.addEventListener('mousemove', e => {
      mx = e.clientX;
      my = e.clientY;
      dot.style.left = mx + 'px';
      dot.style.top = my + 'px';
    });

    function animateRing() {
      rx += (mx - rx) * 0.1;
      ry += (my - ry) * 0.1;
      ring.style.left = rx + 'px';
      ring.style.top = ry + 'px';
      requestAnimationFrame(animateRing);
    }
    animateRing();

    const interactives = 'button, a, .hobby-card, .game-card, .bum-trigger, .discord-bubble';
    document.querySelectorAll(interactives).forEach(el => {
      el.addEventListener('mouseenter', () => {
        dot.classList.add('hover');
        ring.classList.add('hover');
      });
      el.addEventListener('mouseleave', () => {
        dot.classList.remove('hover');
        ring.classList.remove('hover');
      });
    });
  }

  // ============ 3D Tilt on cards ============
  function setupTilt() {
    document.querySelectorAll('[data-tilt]').forEach(el => {
      let rafId = null;
      let targetRx = 0, targetRy = 0;
      let currentRx = 0, currentRy = 0;

      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const cx = rect.width / 2;
        const cy = rect.height / 2;
        targetRx = ((y - cy) / cy) * 10;
        targetRy = ((x - cx) / cx) * -10;

        const shine = el.querySelector('.card-shine');
        if (shine) {
          const px = (x / rect.width) * 100;
          const py = (y / rect.height) * 100;
          shine.style.background = `radial-gradient(circle at ${px}% ${py}%, rgba(255,255,255,0.12) 0%, transparent 55%)`;
          shine.style.opacity = '1';
        }

        if (!rafId) {
          const tick = () => {
            currentRx += (targetRx - currentRx) * 0.15;
            currentRy += (targetRy - currentRy) * 0.15;
            el.style.transform = `perspective(900px) rotateX(${currentRx}deg) rotateY(${currentRy}deg) translateZ(8px)`;
            if (Math.abs(targetRx - currentRx) > 0.05 || Math.abs(targetRy - currentRy) > 0.05) {
              rafId = requestAnimationFrame(tick);
            } else {
              rafId = null;
            }
          };
          rafId = requestAnimationFrame(tick);
        }
      });

      el.addEventListener('mouseleave', () => {
        targetRx = 0;
        targetRy = 0;
        const lerp = () => {
          currentRx += (0 - currentRx) * 0.12;
          currentRy += (0 - currentRy) * 0.12;
          el.style.transform = `perspective(900px) rotateX(${currentRx}deg) rotateY(${currentRy}deg) translateZ(0px)`;
          if (Math.abs(currentRx) > 0.05 || Math.abs(currentRy) > 0.05) {
            requestAnimationFrame(lerp);
          } else {
            el.style.transform = '';
          }
        };
        requestAnimationFrame(lerp);

        const shine = el.querySelector('.card-shine');
        if (shine) shine.style.opacity = '0';
      });
    });
  }

  // ============ Hero parallax ============
  function setupHeroParallax() {
    const hero = document.getElementById('hero');
    const glow = hero && hero.querySelector('.hero-bg-glow');
    if (!glow) return;

    let tx = 0, ty = 0;
    document.addEventListener('mousemove', e => {
      tx = (e.clientX / window.innerWidth - 0.5) * 60;
      ty = (e.clientY / window.innerHeight - 0.5) * 40;
    });

    let cx = 0, cy = 0;
    const tick = () => {
      cx += (tx - cx) * 0.06;
      cy += (ty - cy) * 0.06;
      glow.style.transform = `translate(calc(-50% + ${cx}px), calc(-50% + ${cy}px))`;
      requestAnimationFrame(tick);
    };
    tick();
  }

  // ============ Finale number count-up ============
  function setupFinaleNum() {
    const el = document.querySelector('[data-finale-num]');
    if (!el) return;

    const target = parseInt(el.textContent, 10);
    let triggered = false;

    const obs = new IntersectionObserver(entries => {
      if (triggered || !entries[0].isIntersecting) return;
      triggered = true;
      let count = 0;
      const tick = () => {
        count++;
        el.textContent = count;
        if (count < target) setTimeout(tick, 80);
      };
      tick();
    }, { threshold: 0.4 });

    obs.observe(el);
  }

  // ============ Intro ============
  function setupIntro() {
    const overlay = document.getElementById('intro-overlay');
    if (!overlay) return;
    const btn = overlay.querySelector('.intro-btn');
    const go = () => {
      initAudio();
      overlay.classList.add('gone');
      setTimeout(() => overlay.remove(), 1100);
    };
    btn.addEventListener('click', e => { e.stopPropagation(); go(); });
  }

  // ============ Scroll reveals ============
  function setupReveals() {
    const els = document.querySelectorAll('.reveal, .reveal-up, .reveal-scale');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) e.target.classList.add('in');
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

  // ============ Achievement System ============
  let achTimer = null;
  function showAchievement(icon, title, desc) {
    const el = document.getElementById('achievement');
    if (!el) return;
    document.getElementById('ach-icon').textContent = icon;
    document.getElementById('ach-title').textContent = title;
    document.getElementById('ach-desc').textContent = desc;
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(achTimer);
    achTimer = setTimeout(() => el.classList.remove('show'), 3600);
  }

  // ============ Screen flash ============
  function screenFlash(color = 'rgba(255,216,77,0.22)') {
    const el = document.createElement('div');
    el.className = 'screen-flash';
    el.style.background = color;
    document.body.appendChild(el);
    el.animate(
      [{ opacity: 1 }, { opacity: 0 }],
      { duration: 700, easing: 'ease-out', fill: 'forwards' }
    ).onfinish = () => el.remove();
  }

  // ============ Big confetti drop ============
  function bigConfettiDrop() {
    const colors = ['#1d4eff','#ffd84d','#ff6b35','#39d98a','#ff4d9e','#4d78ff'];
    for (let i = 0; i < 70; i++) {
      setTimeout(() => {
        const p = document.createElement('div');
        const size = 6 + Math.random() * 10;
        const color = colors[Math.floor(Math.random() * colors.length)];
        p.style.cssText = `
          position:fixed; left:${Math.random()*100}%; top:-20px;
          width:${size}px; height:${size}px; background:${color};
          border-radius:${Math.random()>.5?'50%':'3px'};
          pointer-events:none; z-index:8998;
        `;
        document.body.appendChild(p);
        const tx = (Math.random() - 0.5) * 300;
        p.animate([
          { transform: 'translateY(0) rotate(0deg)', opacity: 1 },
          { transform: `translateY(${window.innerHeight+60}px) translateX(${tx}px) rotate(${720*(Math.random()>.5?1:-1)}deg)`, opacity: 0 }
        ], { duration: 2000 + Math.random()*1200, easing: 'ease-in', fill: 'forwards' }).onfinish = () => p.remove();
      }, Math.random() * 500);
    }
  }

  // ============ Hero sparkles ============
  function setupHeroSparkles() {
    const hero = document.querySelector('.hero-name');
    if (!hero || !window.matchMedia('(pointer: fine)').matches) return;
    let lastSpark = 0;
    hero.addEventListener('mousemove', e => {
      const now = performance.now();
      if (now - lastSpark < 70) return;
      lastSpark = now;
      const sp = document.createElement('div');
      const size = 3 + Math.random() * 7;
      sp.className = 'sparkle';
      sp.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;width:${size}px;height:${size}px;`;
      const colors = ['var(--yellow)','var(--blue-light)','#fff','var(--orange)'];
      sp.style.background = colors[Math.floor(Math.random()*colors.length)];
      document.body.appendChild(sp);
      sp.animate([
        { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' },
        { opacity: 0, transform: `translate(calc(-50% + ${(Math.random()-.5)*70}px),calc(-50% - ${20+Math.random()*50}px)) scale(0)` }
      ], { duration: 600 + Math.random()*300, easing: 'ease-out', fill: 'forwards' }).onfinish = () => sp.remove();
    });
  }

  // ============ Easter Eggs ============
  function setupEasterEggs() {
    const found = new Set();
    let eggCount = 0;
    const TOTAL = 7;

    function unlock(id, icon, title, desc, cb) {
      if (found.has(id)) return;
      found.add(id);
      eggCount++;
      showAchievement(icon, title, desc);
      const counter = document.getElementById('egg-found');
      if (counter) counter.textContent = eggCount;
      if (eggCount >= TOTAL) {
        const wrap = document.getElementById('egg-counter');
        if (wrap) { wrap.classList.add('found-all'); wrap.title = 'Alle Easter Eggs gefunden!'; }
        setTimeout(() => showAchievement('🏆', 'Alle gefunden!', 'Du hast alle 7 Easter Eggs entdeckt.'), 4000);
      }
      if (cb) cb();
    }

    // 1. Chat bubble click → Bum Bum (hidden easter egg)
    document.addEventListener('click', e => {
      if (e.target.closest('.bum-trigger')) {
        showBumBum(e.clientX, e.clientY);
        unlock('bumbum', '💬', 'Bum Bum', 'Das versteckte Easter Egg im Chat.', null);
      }
    });

    // 2. Double-click hero name
    const heroName = document.querySelector('.hero-name');
    if (heroName) {
      heroName.addEventListener('dblclick', () => {
        unlock('philip', '🎂', 'Birthday Boy', 'Philip — höchstpersönlich.', () => {
          screenFlash('rgba(29,78,255,0.2)');
          bigConfettiDrop();
          sfxBum();
        });
      });
    }

    // 3. Click the "13" in finale
    const finaleNum = document.querySelector('[data-finale-num]');
    if (finaleNum) {
      finaleNum.addEventListener('click', () => {
        unlock('thirteen', '🎉', 'Dreizehn', 'Die Zahl des Jahres.', () => {
          screenFlash('rgba(255,216,77,0.25)');
          bigConfettiDrop();
          sfxBum();
          let n = 1;
          const tick = () => { finaleNum.textContent = n; if (n < 13) { n++; setTimeout(tick, 65); } };
          tick();
        });
      });
    }

    // 4. Click the date pill
    const datePill = document.querySelector('.hero-date-pill');
    if (datePill) {
      datePill.style.cursor = 'pointer';
      datePill.addEventListener('click', () => {
        unlock('date', '📅', '12. Mai', 'Heute ist dein Tag.', () => {
          screenFlash('rgba(57,217,138,0.18)');
          spawnConfettiBurst(window.innerWidth/2, window.innerHeight/2, 30, '#39d98a');
          sfxBum();
        });
      });
    }

    // 5. Right-click anywhere
    document.addEventListener('contextmenu', e => {
      e.preventDefault();
      unlock('rightclick', '👀', 'Inspector', 'Neugierig? Gut so.', null);
    });

    // 6. Card sequence: ⚽ → 🎾 → 💬
    let cardSeq = [];
    document.querySelectorAll('.hobby-card').forEach((el, i) => {
      el.addEventListener('click', () => {
        cardSeq.push(i);
        if (cardSeq.length > 3) cardSeq.shift();
        if (cardSeq.join(',') === '0,1,2') {
          unlock('sequence', '🏆', 'Sport Mode', 'Fußball → Tennis → Discord. In der richtigen Reihenfolge.', () => {
            screenFlash('rgba(29,78,255,0.2)');
            bigConfettiDrop();
          });
          cardSeq = [];
        }
      });
    });

    // 7. Keyboard: type "philip", "micksa", or Konami code
    const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let buf = [];
    document.addEventListener('keydown', e => {
      buf.push(e.key); if (buf.length > 12) buf.shift();

      // Konami
      if (buf.slice(-10).join(',').toLowerCase() === konami.join(',').toLowerCase()) {
        unlock('konami', '🎮', 'Konami Veteran', '↑↑↓↓←→←→BA — ein Klassiker.', () => {
          screenFlash('rgba(255,77,158,0.2)');
          bigConfettiDrop();
          sfxBum();
        });
        buf = []; return;
      }
      // "philip"
      const last6 = buf.slice(-6).join('').toLowerCase();
      if (last6 === 'philip') {
        showAchievement('👦', 'Hey Philip', 'Du tippst deinen eigenen Namen ein. Nice.');
        for (let i = 0; i < 3; i++) setTimeout(() => showBumBum(), i * 200);
        buf = []; return;
      }
      // "micksa"
      if (last6 === 'micksa') {
        unlock('micksa', '👋', 'Hey Micksa', 'Der Macher höchstpersönlich.', () => {
          screenFlash('rgba(255,107,53,0.18)');
        });
        buf = [];
      }
    });
  }

  // ============ Cursor trail ============
  function setupCursorTrail() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    const container = document.querySelector('.cursor-trail');
    if (!container) return;
    let last = 0;
    document.addEventListener('mousemove', e => {
      const now = performance.now();
      if (now - last < 28) return;
      last = now;
      const dot = document.createElement('div');
      dot.className = 'trail-dot';
      dot.style.left = e.clientX + 'px';
      dot.style.top = e.clientY + 'px';
      const hue = ['#1d4eff', '#4d78ff', '#ffd84d', '#ff6b35'][Math.floor(Math.random() * 4)];
      dot.style.background = hue;
      dot.style.boxShadow = `0 0 12px ${hue}88`;
      container.appendChild(dot);
      setTimeout(() => dot.remove(), 720);
    });
  }

  // ============ Magnetic hover ============
  function setupMagnetic() {
    if (!window.matchMedia('(pointer: fine)').matches) return;
    document.querySelectorAll('[data-magnetic]').forEach(el => {
      const strength = 0.35;
      el.addEventListener('mousemove', e => {
        const rect = el.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * strength;
        const dy = (e.clientY - cy) * strength;
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener('mouseleave', () => {
        el.style.transform = '';
      });
    });
  }

  // ============ Text scramble ============
  function scrambleText(el, finalText, duration = 900) {
    const chars = '!<>-_\\/[]{}—=+*^?#·•◆◇';
    const start = performance.now();
    const tick = now => {
      const p = Math.min((now - start) / duration, 1);
      const reveal = Math.floor(p * finalText.length);
      let out = '';
      for (let i = 0; i < finalText.length; i++) {
        if (i < reveal) out += finalText[i];
        else if (finalText[i] === ' ') out += ' ';
        else out += chars[Math.floor(Math.random() * chars.length)];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(tick);
      else el.textContent = finalText;
    };
    requestAnimationFrame(tick);
  }

  function setupScramble() {
    const els = document.querySelectorAll('[data-scramble]');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting && !entry.target.dataset.scrambled) {
          entry.target.dataset.scrambled = '1';
          const text = entry.target.textContent;
          scrambleText(entry.target, text);
        }
      });
    }, { threshold: 0.3 });
    els.forEach(el => obs.observe(el));
  }

  // ============ Init ============
  document.addEventListener('DOMContentLoaded', () => {
    setupIntro();
    setupFloatingConfetti();
    setupCursor();
    setupCursorTrail();
    setupMagnetic();
    setupScramble();
    setupTilt();
    setupHeroParallax();
    setupReveals();
    setupScrollProgress();
    setupCountdown();
    setupEasterEggs();
    setupHeroSparkles();
    setupFinaleNum();

  });

})();
