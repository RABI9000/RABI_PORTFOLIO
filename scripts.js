/* Minimal, performant micro-interactions and scroll reveals */
(function () {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Smooth scrolling for anchor links (respect reduced motion)
  document.addEventListener('click', function (e) {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href').slice(1);
    const target = id ? document.getElementById(id) : null;
    if (!target) return;
    e.preventDefault();
    if (prefersReduced) {
      target.scrollIntoView();
    } else {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    // Mark current link
    document.querySelectorAll('.nav a[aria-current]')?.forEach(el => el.removeAttribute('aria-current'));
    if (a.closest('.nav')) a.setAttribute('aria-current', 'true');
  }, { passive: true });

  // Reveal on scroll using IntersectionObserver
  const revealEls = document.querySelectorAll('[data-reveal]');
  if (revealEls.length) {
    const obs = new IntersectionObserver((entries, o) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          o.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.08 });
    revealEls.forEach(el => obs.observe(el));
  }

  // Set current year in footer
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Defer non-critical work with requestIdleCallback fallback
  const defer = (fn) => (window.requestIdleCallback ? window.requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 300));

  defer(() => {
    // Prefetch hover links (simple micro-optimization)
    const prefetch = (url) => { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = url; document.head.appendChild(l); };
    document.querySelectorAll('a[href^="http"]').forEach(a => {
      a.addEventListener('pointerenter', () => prefetch(a.href), { passive: true, once: true });
    });
  });

  // Loader sequence (0.2s per phrase, total 1.4s)
  (function loader() {
    const el = document.getElementById('loader');
    if (!el) return;
    const t = el.querySelector('.loader-text');
    let phrases = [];
    try { phrases = JSON.parse(t.dataset.phrases || '[]'); } catch {}
    if (!Array.isArray(phrases) || phrases.length === 0) phrases = ['Hi'];
    phrases = phrases.slice(0, 7); // 7 phrases * 0.2s = 1.4s
    let i = 0;
    const STEP = 200, DURATION = 1400; let done = false;
    const tick = () => { t.textContent = phrases[i % phrases.length]; i++; };
    tick();
    const langTimer = setInterval(tick, STEP);
    const hide = () => { if (done) return; done = true; clearInterval(langTimer); el.setAttribute('hidden',''); };
    setTimeout(hide, DURATION);
    window.addEventListener('load', () => { if (!done) setTimeout(hide, Math.max(0, DURATION)); });
  })();

  // Mark sections visible for accent sweep once revealed
  const sections = document.querySelectorAll('.section');
  if (sections.length) {
    const obs = new IntersectionObserver((ents,o)=>{
      ents.forEach(ent=>{ if(ent.isIntersecting){ ent.target.classList.add('is-visible'); o.unobserve(ent.target);} });
    },{rootMargin:'0px 0px -10% 0px',threshold:0.1});
    sections.forEach(s=>obs.observe(s));
  }

  // Staggered reveal for project grids
  const cardsContainers = document.querySelectorAll('.cards');
  if (cardsContainers.length) {
    const cardsObs = new IntersectionObserver((entries, o) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          o.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    cardsContainers.forEach(el => cardsObs.observe(el));
  }

  // Projects: hydrate tags + modal interactions
  const projectDataCache = { data: null };
  const getProjects = () => {
    if (projectDataCache.data) return Promise.resolve(projectDataCache.data);
    return fetch('assets/projects.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : {}))
      .then(d => (projectDataCache.data = d));
  };

  const fillProjectTags = () => {
    const cards = document.querySelectorAll('.project-card');
    if (!cards.length) return;
    getProjects().then(db => {
      cards.forEach(card => {
        const id = card.getAttribute('data-project-id');
        const proj = db[id]; if (!proj) return;
        const tags = card.querySelector('.project-tags');
        if (!tags) return;
        tags.innerHTML = '';
        (proj.tools || []).slice(0, 4).forEach(t => {
          const s = document.createElement('span'); s.textContent = t; tags.appendChild(s);
        });
      });
    });
  };
  fillProjectTags();

  const modal = document.getElementById('project-modal');
  const openModal = (proj) => {
    if (!modal || !proj) return;
    modal.querySelector('.modal-title').textContent = proj.title || '';
    modal.querySelector('.modal-desc').textContent = proj.summary || '';
    const ul = modal.querySelector('.modal-tags'); ul.innerHTML = '';
    (proj.tools || []).forEach(t => { const li = document.createElement('li'); li.textContent = t; ul.appendChild(li); });
    const bullets = modal.querySelector('.modal-bullets'); bullets.innerHTML = '';
    const list = document.createElement('ul');
    (proj.bullets || []).forEach(b => { const li = document.createElement('li'); li.textContent = b; list.appendChild(li); });
    bullets.appendChild(list);
    document.body.classList.add('modal-open');
    modal.classList.add('open');
    modal.setAttribute('aria-hidden', 'false');
    requestAnimationFrame(() => modal.querySelector('.modal-dialog')?.focus());
  };
  const closeModal = () => {
    if (!modal) return;
    modal.classList.remove('open');
    modal.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
  };
  modal?.querySelector('.modal-backdrop')?.addEventListener('click', closeModal, { passive: true });
  modal?.querySelector('.modal-close')?.addEventListener('click', closeModal, { passive: true });
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // Games modal
  const gamesModal = document.getElementById('games-modal');
  const openGames = () => { gamesModal?.classList.add('open'); gamesModal?.setAttribute('aria-hidden','false'); document.body.classList.add('modal-blur'); startGame('snake'); };
  const closeGames = () => { gamesModal?.classList.remove('open'); gamesModal?.setAttribute('aria-hidden','true'); document.body.classList.remove('modal-blur'); stopGame(); };
  document.getElementById('games-btn')?.addEventListener('click', openGames, { passive: true });
  gamesModal?.querySelector('.modal-backdrop')?.addEventListener('click', closeGames, { passive: true });
  gamesModal?.querySelector('.modal-close')?.addEventListener('click', closeGames, { passive: true });

  document.addEventListener('click', (e) => {
    const card = e.target.closest('.project-card');
    if (!card) return;
    e.preventDefault();
    getProjects().then(db => {
      const id = card.getAttribute('data-project-id');
      openModal(db[id]);
    });
  }, { passive: false });

  if (!prefersReduced) {
    // Parallax for hero visual, background grid, and hero web canvas
    const heroVisual = document.querySelector('.hero-visual');
    const bgGrid = document.querySelector('.bg-grid');
    const webCanvas = document.querySelector('.web-canvas');
    let targetY = 0, currentY = 0, rafId = null;

    const onScroll = () => {
      targetY = window.scrollY || 0;
      if (!rafId) rafId = requestAnimationFrame(loop);
    };
    const loop = () => {
      currentY += (targetY - currentY) * 0.08;
      if (heroVisual) heroVisual.style.transform = `translate3d(0, ${(currentY * 0.05).toFixed(2)}px, 0)`;
      if (bgGrid) bgGrid.style.setProperty('--bg-parallax', `${(-currentY * 0.02).toFixed(2)}px`);
      if (webCanvas) webCanvas.style.opacity = Math.min(0.6, Math.max(0, 0.6 - currentY * 0.0015));
      if (Math.abs(targetY - currentY) > 0.1) {
        rafId = requestAnimationFrame(loop);
      } else {
        rafId = null;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Ensure particles are visible site-wide (floating shapes removed)
    document.querySelectorAll('.bg-particles').forEach(el => el.classList.remove('bg-local-hidden'));

    // Scroll progress bar (GPU-accelerated via scaleX)
    const setProgress = () => {
      const h = document.documentElement;
      const max = (h.scrollHeight - h.clientHeight) || 1;
      const p = Math.min(1, (h.scrollTop || window.scrollY) / max);
      h.style.setProperty('--progress', p.toFixed(4));
    };
    window.addEventListener('scroll', () => requestAnimationFrame(setProgress), { passive: true });
    setProgress();

    // Interactive tilt + spotlight for cards and buttons + magnetic drift
    const tiltify = (el, max = 8) => {
      let rAF = null;
      const setPos = (x, y) => {
        el.style.setProperty('--mx', `${x}px`);
        el.style.setProperty('--my', `${y}px`);
      };
      const onMove = (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setPos(x, y);
        const px = (x / rect.width) - 0.5;
        const py = (y / rect.height) - 0.5;
        const rx = -py * max;
        const ry = px * max;
        const tx = px * 6, ty = py * 6; // magnetic translate
        if (rAF) cancelAnimationFrame(rAF);
        rAF = requestAnimationFrame(() => {
          el.style.transform = `translate3d(${tx.toFixed(2)}px, ${ty.toFixed(2)}px, 0) rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`;
        });
      };
      const onLeave = () => { el.style.transform = ''; };
      el.addEventListener('pointermove', onMove, { passive: true });
      el.addEventListener('pointerleave', onLeave, { passive: true });
    };

    document.querySelectorAll('.card, .btn').forEach(el => tiltify(el));

    // Auto-hide header on scroll down, show on scroll up; show to-top button
    const header = document.querySelector('.site-header');
    const toTop = document.querySelector('.to-top');
    let lastY = window.scrollY, hideTick = 0;
    const onScrollDir = () => {
      const y = window.scrollY; const dy = y - lastY; lastY = y;
      if (!header) return;
      if (y > 120 && dy > 0 && hideTick++ > 1) header.classList.add('hidden');
      else if (dy < 0) header.classList.remove('hidden');
      if (toTop) toTop.classList.toggle('show', y > 300);
      // subtle bg hue shift
      document.documentElement.style.setProperty('--bg-hue', `${(y * 0.02) % 360}deg`);
    };
    window.addEventListener('scroll', onScrollDir, { passive: true });

    // Magnetic nav links
    const nav = document.querySelector('.nav');
    if (nav) {
      let rafMag = null; let mx=0,my=0; const strength = 8;
      const onMove = (e)=>{ const r = nav.getBoundingClientRect(); mx=e.clientX-r.left; my=e.clientY-r.top; if(!rafMag) rafMag=requestAnimationFrame(tick); };
      const tick=()=>{ nav.querySelectorAll('a').forEach(a=>{ const ar=a.getBoundingClientRect(); const ax=mx-(ar.left-nav.getBoundingClientRect().left)-ar.width/2; const ay=my-(ar.top-nav.getBoundingClientRect().top)-ar.height/2; const d=Math.hypot(ax,ay); const f=Math.max(0,1-Math.min(d/160,1)); a.style.transform=`translate3d(${(ax/60)*f*strength}px, ${(ay/60)*f*strength}px,0)`; }); rafMag=null; };
      nav.addEventListener('pointermove', onMove, { passive: true });
      nav.addEventListener('pointerleave', ()=>{ nav.querySelectorAll('a').forEach(a=>a.style.transform=''); }, { passive: true });
    }

    // Cursor dot follower
    const cursorDot = document.createElement('div');
    cursorDot.className = 'cursor-dot';
    document.body.appendChild(cursorDot);
    const cursorGlow = document.querySelector('.cursor-glow');
    let cx = -100, cy = -100, tx = -100, ty = -100, rafCursor, lastT = performance.now();
    const moveCursor = (e) => { tx = e.clientX; ty = e.clientY; if (!rafCursor) rafCursor = requestAnimationFrame(cursorLoop); };
    const cursorLoop = (t=performance.now()) => {
      const dt = Math.max(16, t - lastT); lastT = t;
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cursorDot.style.transform = `translate3d(${cx}px, ${cy}px, 0) scale(1)`;
      if (cursorGlow) cursorGlow.style.transform = `translate3d(${cx-130}px, ${cy-130}px, 0)`;
      if (Math.abs(tx - cx) > 0.1 || Math.abs(ty - cy) > 0.1) rafCursor = requestAnimationFrame(cursorLoop); else rafCursor = null;
    };
    window.addEventListener('pointermove', moveCursor, { passive: true });

    // Click ripples for buttons and cards + wave confetti
    const ripple = (el, x, y) => {
      const r = document.createElement('span');
      r.style.position = 'absolute'; r.style.inset = 0; r.style.pointerEvents = 'none';
      r.style.background = `radial-gradient(200px 200px at ${x}px ${y}px, rgba(255,255,255,.18), transparent 60%)`;
      r.style.opacity = '0'; r.style.transition = 'opacity .6s var(--ease)';
      el.appendChild(r); requestAnimationFrame(()=>{ r.style.opacity = '1'; setTimeout(()=>{ r.style.opacity='0'; setTimeout(()=>r.remove(), 350); }, 120); });
    };
    document.addEventListener('click', (e) => {
      const wave = e.target.closest('.wave');
      if (wave) {
        const rect = wave.getBoundingClientRect();
        for (let i=0;i<16;i++){ const p=document.createElement('span'); p.style.position='fixed'; p.style.left=(rect.left+rect.width/2)+'px'; p.style.top=(rect.top+rect.height/2)+'px'; p.style.width='6px'; p.style.height='6px'; p.style.borderRadius='50%'; p.style.background='linear-gradient(135deg,var(--primary),var(--accent))'; p.style.pointerEvents='none'; p.style.zIndex='2'; document.body.appendChild(p); const ang = Math.random()*Math.PI*2; const sp= (Math.random()*3+1); const dx=Math.cos(ang)*sp; const dy=Math.sin(ang)*sp; let t=0; const step=()=>{ t+=1; p.style.transform=`translate3d(${dx*t}px,${dy*t}px,0)`; p.style.opacity=String(1 - t/30); if(t<30) requestAnimationFrame(step); else p.remove(); }; requestAnimationFrame(step);} }
      // ripple on buttons/cards
      const el = e.target.closest('.btn, .card');
      if (el) {
        const rect = el.getBoundingClientRect();
        ripple(el, e.clientX - rect.left, e.clientY - rect.top);
      }
      // global click ring
      const ring = document.createElement('div');
      ring.className = 'click-ring';
      ring.style.left = e.clientX + 'px';
      ring.style.top = e.clientY + 'px';
      document.body.appendChild(ring);
      setTimeout(()=> ring.remove(), 650);
    }, { passive: true });

    // Background particles
    const canvas = document.querySelector('.bg-particles');
    if (canvas) {
      const ctx = canvas.getContext('2d');
      const DPR = Math.min(2, window.devicePixelRatio || 1);
      const state = { w: 0, h: 0, pts: [] };
      const resize = () => {
        state.w = window.innerWidth; state.h = window.innerHeight;
        canvas.width = Math.floor(state.w * DPR); canvas.height = Math.floor(state.h * DPR);
        canvas.style.width = state.w + 'px'; canvas.style.height = state.h + 'px';
        ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
        const count = Math.floor((state.w * state.h) / 22000); // density
        state.pts = Array.from({ length: count }, () => ({
          x: Math.random() * state.w,
          y: Math.random() * state.h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 1.8 + 0.2,
        }));
      };
      resize();
      window.addEventListener('resize', resize);

      let rafParticles; const tick = () => {
        ctx.clearRect(0, 0, state.w, state.h);
        // draw lines first for nicer layering
        ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 1;
        for (let i = 0; i < state.pts.length; i++) {
          for (let j = i + 1; j < state.pts.length; j++) {
            const a = state.pts[i], b = state.pts[j];
            const dx = a.x - b.x, dy = a.y - b.y; const d2 = dx*dx + dy*dy; if (d2 < 12000) { // ~110px
              const alpha = Math.max(0, 1 - d2/12000) * 0.30;
              ctx.strokeStyle = `rgba(255,255,255,${alpha.toFixed(3)})`;
              ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            }
          }
        }
        ctx.fillStyle = 'rgba(255,255,255,0.16)';
        state.pts.forEach(p => {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > state.w) p.vx *= -1;
          if (p.y < 0 || p.y > state.h) p.vy *= -1;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
        });
        rafParticles = requestAnimationFrame(tick);
      };
      const visibility = () => {
        if (document.hidden) cancelAnimationFrame(rafParticles); else tick();
      };
      document.addEventListener('visibilitychange', visibility);
      tick();
    }
  }

  // Hero hover particle trails (web canvas)
  ;(function heroTrails(){
    const canvas = document.querySelector('.web-canvas');
    const host = document.querySelector('.hero-visual');
    if (!canvas || !host) return;
    const ctx = canvas.getContext('2d');
    const DPR = Math.min(2, window.devicePixelRatio||1);
    const state = { w:0, h:0, parts:[], lastMove:0 };
    const resize = ()=>{ const r=host.getBoundingClientRect(); canvas.width=Math.floor(r.width*DPR); canvas.height=Math.floor(r.height*DPR); canvas.style.width=r.width+'px'; canvas.style.height=r.height+'px'; state.w=canvas.width; state.h=canvas.height; ctx.setTransform(DPR,0,0,DPR,0,0); };
    const spawn=(x,y)=>{ state.parts.push({x,y,vx:(Math.random()-.5)*1.2,vy:(Math.random()-.5)*1.2,life:28}); };
    const move=(e)=>{ const r=host.getBoundingClientRect(); const x=(e.clientX-r.left); const y=(e.clientY-r.top); for(let i=0;i<3;i++) spawn(x,y); state.lastMove=performance.now(); canvas.classList.add('show'); };
    let raf; const tick=()=>{ ctx.clearRect(0,0,state.w,state.h); state.parts.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.life-=1; ctx.globalAlpha=Math.max(0,p.life/28); ctx.fillStyle='rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(p.x,p.y,1.8,0,Math.PI*2); ctx.fill(); }); state.parts=state.parts.filter(p=>p.life>0); if (performance.now()-state.lastMove>320 && state.parts.length===0) canvas.classList.remove('show'); raf=requestAnimationFrame(tick); };
    resize(); window.addEventListener('resize', resize); host.addEventListener('pointermove', move, {passive:true}); tick();
  })();

  // Seasonal easter eggs (limited)
  ;(function seasonal(){
    const now=new Date(); const m=now.getMonth()+1, d=now.getDate();
    const emoji = (m===10&&d===31) ? '🎃' : ((m===1&&d===1)||(m===12&&d===31)) ? '❄️' : null;
    if (!emoji) return;
    const N=18; for(let i=0;i<N;i++){ const e=document.createElement('div'); e.textContent=emoji; e.style.position='fixed'; e.style.left=(Math.random()*100)+'%'; e.style.top=(-10)+'px'; e.style.zIndex='5'; e.style.pointerEvents='none'; e.style.filter='drop-shadow(0 2px 6px rgba(0,0,0,.4))'; document.body.appendChild(e); const sp=1+Math.random()*1.2; let y=-10; const step=()=>{ y+=sp; e.style.top=y+'px'; if(y<window.innerHeight+20) requestAnimationFrame(step); else e.remove(); }; requestAnimationFrame(step);} 
  })();

  // Subtle click sound on buttons/links
  ;(function sounds(){
    const ctx = new (window.AudioContext||window.webkitAudioContext)();
    const env = (start=0.0001, peak=0.02, end=0.0001, a=0.001, d=0.08)=>{ const g=ctx.createGain(); g.gain.setValueAtTime(start, ctx.currentTime); g.gain.linearRampToValueAtTime(peak, ctx.currentTime + a); g.gain.exponentialRampToValueAtTime(end, ctx.currentTime + a + d); return g; };
    const clickSound = ()=>{ const o=ctx.createOscillator(); o.type='square'; o.frequency.setValueAtTime(2200, ctx.currentTime); const g=env(0.0001, 0.05, 0.0001, 0.005, 0.08); o.connect(g); g.connect(ctx.destination); o.start(); o.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.09); o.stop(ctx.currentTime+0.1); };
    const hoverSound = ()=>{ const o=ctx.createOscillator(); o.type='triangle'; o.frequency.value=660; const g=env(0.0001,0.02,0.0001,0.002,0.06); o.connect(g); g.connect(ctx.destination); o.start(); o.stop(ctx.currentTime+0.07); };
    const sparkle = ()=>{ const o=ctx.createOscillator(); o.type='sine'; o.frequency.value=1200; const g=env(0.0001,0.06,0.0001,0.003,0.12); o.connect(g); g.connect(ctx.destination); o.start(); o.frequency.exponentialRampToValueAtTime(3200, ctx.currentTime+0.1); o.stop(ctx.currentTime+0.12); };
    document.addEventListener('click',(e)=>{ if(e.target.closest('.btn, .nav a, .to-top, .project-card, .modal-close')) clickSound(); if(e.target.closest('.wave')) sparkle(); },{passive:true});
    document.addEventListener('pointerenter',(e)=>{ if(e.target.closest('.btn, .nav a, .project-card')) hoverSound(); },{passive:true});
  })();

  // Easter egg: Konami code → bouncing ball you can nudge with arrows
  (function easter(){
    const seq = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
    let idx=0, active=false, vx=2, vy=2; let raf=null; let ball;
    const key = (e)=>{
      const k = e.key.length===1 ? e.key.toLowerCase() : e.key;
      if (k === seq[idx]) { idx++; if (idx===seq.length) start(); }
      else idx = 0;
      if (active && ['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)) { if(e.key==='ArrowLeft') vx-=0.5; if(e.key==='ArrowRight') vx+=0.5; if(e.key==='ArrowUp') vy-=0.5; if(e.key==='ArrowDown') vy+=0.5; }
    };
    const start = () => {
      active=true; ball=document.createElement('div'); ball.className='bouncy-ball'; document.body.appendChild(ball);
      const step = ()=>{
        const r = ball.getBoundingClientRect();
        let x = r.left + r.width/2 + vx; let y = r.top + r.height/2 + vy;
        const W = window.innerWidth, H = window.innerHeight;
        if (x<12 || x>W-12) { vx*=-1; x=Math.max(12, Math.min(W-12, x)); }
        if (y<12 || y>H-12) { vy*=-1; y=Math.max(12, Math.min(H-12, y)); }
        ball.style.left = x+'px'; ball.style.top = y+'px';
        raf = requestAnimationFrame(step);
      };
      ball.style.position='fixed'; ball.style.left='50%'; ball.style.top='50%';
      if(!raf) raf=requestAnimationFrame(step);
    };
    window.addEventListener('keydown', key);
  })();

  // Lazy fade-in for images
  (function lazyImages(){
    document.querySelectorAll('img[loading="lazy"]').forEach(img=>{
      img.classList.add('lazy-img');
      if (img.complete) img.classList.add('is-loaded');
      else img.addEventListener('load', ()=> img.classList.add('is-loaded'), { once:true });
    });
  })();

  // Scroll-activated messages (toasts)
  (function scrollToasts(){
    const map = new Map([
      ['about', '👋 Welcome to About'],
      ['projects', '👀 You made it to Projects!'],
      ['tools', '🛠️ Tools & Tech ahead'],
      ['contact', '📬 Say hello!']
    ]);
    const toast = (msg) => {
      let t = document.querySelector('.toast');
      if (!t) { t = document.createElement('div'); t.className='toast'; document.body.appendChild(t); }
      t.textContent = msg; t.classList.add('show');
      clearTimeout(t._timer); t._timer = setTimeout(()=> t.classList.remove('show'), 1600);
    };
    const io = new IntersectionObserver((es)=>{
      es.forEach(e=>{ if (e.isIntersecting && e.intersectionRatio>0.5) { const id=e.target.id; if (map.has(id)) toast(map.get(id)); } });
    },{threshold:[0.6]});
    document.querySelectorAll('main .section[id]').forEach(s=>io.observe(s));

    // Random quotes on footer click
    const quotes = [
      'Talk is cheap. Show me the code.',
      'First, solve the problem. Then, write the code.',
      'Simplicity is the soul of efficiency.',
      'Minimal. Fast. Focused.',
      'Pixels + performance.'
    ];
    document.querySelector('.site-footer')?.addEventListener('click', ()=>{
      const q = quotes[Math.floor(Math.random()*quotes.length)]; toast(q);
    }, { passive: true });
  })();

  // Text parallax for hero heading
  (function textParallax(){
    const h1 = document.querySelector('.hero .typed-heading');
    if (!h1) return;
    const onScroll = () => {
      const r = h1.getBoundingClientRect();
      const n = Math.max(-1, Math.min(1, (r.top - 80)/window.innerHeight));
      h1.style.transform = `translate3d(0, ${n*12}px, 0)`;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  // Typing effect for hero heading
  (function typing() {
    const root = document.querySelector('.typing');
    if (!root) return;
    const textEl = root.querySelector('.typing-text');
    const phrases = (() => { try { return JSON.parse(root.dataset.phrases || '[]'); } catch { return []; } })();
    if (!phrases.length) return;
    let i = 0, j = 0, typingDir = 1, pause = 0;
    const speed = { type: 28, erase: 18, hold: 1200 };
    const step = () => {
      const target = phrases[i];
      if (pause > 0) { pause -= 16; return requestAnimationFrame(step); }
      if (typingDir === 1) { // typing
        j++;
        textEl.textContent = target.slice(0, j);
        if (j >= target.length) { typingDir = -1; pause = speed.hold; }
      } else { // erasing
        j--;
        textEl.textContent = target.slice(0, Math.max(0, j));
        if (j <= 0) { typingDir = 1; i = (i + 1) % phrases.length; }
      }
      const delay = typingDir === 1 ? speed.type : speed.erase;
      setTimeout(() => requestAnimationFrame(step), delay);
    };
    requestAnimationFrame(step);
  })();

  // Simple micro games (Snake and Paddle)
  const game = (()=>{
    const canvas = () => document.getElementById('game-canvas');
    const scoreEl = () => document.getElementById('game-score');
    let raf=null, mode=null, ctx=null, W=0,H=0; let keys={}; let score=0;
    const setScore=(v)=>{ score=v; const el=scoreEl(); if(el) el.textContent = `Score: ${score}`; };
    // Snake (timed step)
    let grid=20, snake=[], dir={x:1,y:0}, food={x:5,y:5}, last=0, rate=160;
    const resetSnake=()=>{ setScore(0); snake=[{x:5,y:5},{x:4,y:5},{x:3,y:5}]; dir={x:1,y:0}; placeFood(); last=0; };
    const placeFood=()=>{ food={ x: Math.floor(Math.random()*(W/grid)), y: Math.floor(Math.random()*(H/grid))}; };
    const stepSnake=()=>{
      const head={x:snake[0].x+dir.x, y:snake[0].y+dir.y};
      if (head.x<0||head.y<0||head.x>=W/grid||head.y>=H/grid|| snake.some(s=>s.x===head.x&&s.y===head.y)) return resetSnake();
      snake.unshift(head);
      if (head.x===food.x&&head.y===food.y) { setScore(score+10); placeFood(); } else snake.pop();
    };
    const drawSnake=()=>{ ctx.clearRect(0,0,W,H); ctx.fillStyle='#9ae2ff'; snake.forEach(s=>ctx.fillRect(s.x*grid, s.y*grid, grid-1, grid-1)); ctx.fillStyle='#a78bfa'; ctx.fillRect(food.x*grid, food.y*grid, grid-1, grid-1); };
    // Paddle
    let px,py,pr,ball;
    const resetPaddle=()=>{ setScore(0); px=W/2-40; py=H-20; pr=80; ball={x:W/2,y:H/2,vx:2,vy:1.6}; };
    const stepPaddle=()=>{ if(keys['ArrowLeft']) px-=5; if(keys['ArrowRight']) px+=5; px=Math.max(0,Math.min(W-pr,px)); ball.x+=ball.vx; ball.y+=ball.vy; if(ball.x<5||ball.x>W-5) { ball.vx*=-1; setScore(score+1);} if(ball.y<5) { ball.vy*=-1; setScore(score+1);} if(ball.y>H-10){ if(ball.x>px&&ball.x<px+pr){ ball.vy*=-1; setScore(score+5);} else resetPaddle(); } };
    const drawPaddle=()=>{ ctx.clearRect(0,0,W,H); ctx.fillStyle='#fff'; ctx.fillRect(px,py,pr,6); ctx.beginPath(); ctx.arc(ball.x,ball.y,5,0,Math.PI*2); ctx.fill(); };

    const loop=(t=0)=>{ if(mode==='snake'){ if(!last) last=t; const dt=t-last; if(dt>=rate){ stepSnake(); last=t; } drawSnake(); } else if(mode==='pong'){ stepPaddle(); drawPaddle(); } raf=requestAnimationFrame(loop); };
    const start=(m)=>{ const c=canvas(); if(!c) return; ctx=c.getContext('2d'); W=c.width; H=c.height; mode=m; if(m==='snake'){ resetSnake(); } else if(m==='pong'){ resetPaddle(); } if(!raf) raf=requestAnimationFrame(loop); };
    const stop=()=>{ if(raf) cancelAnimationFrame(raf); raf=null; mode=null; };
    window.addEventListener('keydown',e=>{ keys[e.key]=true; if(mode==='snake'){ if(e.key==='ArrowUp'&&dir.y!==1) dir={x:0,y:-1}; if(e.key==='ArrowDown'&&dir.y!==-1) dir={x:0,y:1}; if(e.key==='ArrowLeft'&&dir.x!==1) dir={x:-1,y:0}; if(e.key==='ArrowRight'&&dir.x!==-1) dir={x:1,y:0}; } });
    window.addEventListener('keyup',e=>{ keys[e.key]=false; });
    return { start, stop };
  })();
  const startGame = (name) => game.start(name);
  const stopGame = () => game.stop();
  document.getElementById('games-modal')?.addEventListener('click',(e)=>{ const b=e.target.closest('[data-game]'); if(!b) return; const g=b.getAttribute('data-game'); if(g==='stop') stopGame(); else startGame(g); },{passive:true});

  // Tools & Tech skill bars + 3D ring layout and hydration from resume.json
  (function techRing() {
    const ring = document.querySelector('.carousel-ring');
    if (!ring) return;
    const icons = {
      'HTML': 'html', 'HTML/CSS': 'html', 'CSS': 'css', 'JavaScript': 'js', 'JS': 'js',
      'React': 'react', 'Figma': 'figma', 'Git': 'git', 'Node': 'node', 'Node.js': 'node',
      'Python': 'python', 'TensorFlow': 'tensorflow', 'AWS': 'aws', 'MongoDB': 'mongodb',
      'Bootstrap': 'bootstrap', 'Flask': 'flask', 'Streamlit': 'streamlit', 'Power BI': 'powerbi',
      'Unix/Linux': 'linux', 'Linux': 'linux', 'SQL': 'sql', 'VS Code': 'vscode'
    };
    const makeItem = (name) => {
      const li = document.createElement('li'); li.className = 'tech-card';
      const iconWrap = document.createElement('span'); iconWrap.className = 'tech-icon';
      const key = icons[name] ? icons[name] : null;
      if (key) {
        const img = document.createElement('img'); img.width = 28; img.height = 28; img.loading = 'lazy'; img.alt = name;
        img.src = `assets/icons/${key}.svg`;
        iconWrap.appendChild(img);
      } else {
        iconWrap.textContent = name[0] || '?';
      }
      const label = document.createElement('span'); label.className = 'name'; label.textContent = name;
      li.appendChild(iconWrap); li.appendChild(label);
      return li;
    };
    const layout = () => {
      const items = [...ring.children];
      const n = items.length || 1; const radius = 240;
      items.forEach((li, idx) => {
        const angle = (idx / n) * 360;
        li.style.transform = `rotateY(${angle}deg) translateZ(${radius}px) translate(-50%, -50%)`;
      });
    };

    // skill bars removed per request

    const hydrate = () => {
      fetch('assets/resume.json', { cache: 'no-store' })
        .then(r => (r.ok ? r.json() : Promise.reject()))
        .then(data => {
          const skills = Array.isArray(data.skills) ? data.skills : [];
          ring.innerHTML = '';
          const order = [
            'HTML', 'CSS', 'JavaScript', 'React', 'Python', 'TensorFlow', 'AWS', 'MongoDB', 'Git', 'Node', 'Bootstrap', 'Flask', 'Streamlit', 'Power BI', 'Figma', 'SQL', 'Unix/Linux', 'VS Code'
          ];
          const seen = new Set();
          const normalized = (s) => String(s).trim();
          [...order, ...skills.map(normalized)].forEach(s => { if (!seen.has(s)) { seen.add(s); ring.appendChild(makeItem(s)); } });
          layout();
        })
        .catch(() => { // fallback basic set
          const fallback = ['HTML','CSS','JavaScript','React','Git','Node','Figma'];
          fallback.forEach(s => ring.appendChild(makeItem(s)));
          layout();
        });
    };
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) { hydrate(); io.disconnect(); } });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.1 });
    io.observe(ring);

    // Wheel/keyboard interactivity
    let offset = 0; let pauseTimer;
    const setOffset = (deg) => { ring.style.setProperty('--offset', `${deg}deg`); };
    const pauseSpin = () => { ring.style.animationPlayState = 'paused'; clearTimeout(pauseTimer); pauseTimer = setTimeout(() => ring.style.animationPlayState = 'running', 1800); };
    ring.addEventListener('wheel', (e) => { e.preventDefault(); offset += (e.deltaY > 0 ? 20 : -20); setOffset(offset); pauseSpin(); }, { passive: false });
    window.addEventListener('keydown', (e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { offset += (e.key === 'ArrowRight' ? 20 : -20); setOffset(offset); pauseSpin(); } });
  })();

  // About section hydration from resume.json + nav sync to active section
  (function hydrateAbout() {
    const about = document.querySelector('#about .about-copy');
    if (!about) return;
    const render = (payload) => {
      about.replaceChildren();
      const h2 = document.createElement('h2');
      h2.className = 'section-title is-visible';
      h2.dataset.reveal = 'zoom-in';
      h2.textContent = 'About';
      const p1 = document.createElement('p');
      p1.className = 'is-visible';
      p1.dataset.reveal = 'fade-right';
      const p2 = document.createElement('p');
      p2.className = 'is-visible';
      p2.dataset.reveal = 'fade-left';
      const chips = document.createElement('ul'); chips.className = 'skills-chips is-visible'; chips.dataset.reveal = 'zoom-in';
      const { name='—', contact={}, education=[], skills=[] } = payload || {};
      const loc = contact.location || '';
      const edu = Array.isArray(education) ? education[0] : null;
      const school = (edu && edu.school) ? `${edu.school}` : '';
      const period = (edu && edu.period) ? ` (${edu.period})` : '';
      const topSkills = (skills || []).slice(0, 8);
      p1.textContent = `Rabi Shaikh — engineer based in Mumbai, India. Studying at Veermata Jijabai Technological Institute (VJTI) (2022 – 2026). I love building things that matter, working with people who inspire me, and turning challenges into opportunities. I enjoy leading projects, sharing ideas, and communicating clearly, all while learning something new every day and making an impact with technology.`;
      p2.textContent = `Recent work spans real-time systems, analytics dashboards, and ML projects.`;
      topSkills.forEach(s => { const li = document.createElement('li'); li.textContent = s; chips.appendChild(li); });
      about.append(h2, p1, p2, chips);
    };
    fetch('assets/resume.json', { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(data => render(data))
      .catch(() => render(undefined));
  })();

  // Scroll 3D tilt per section
  (function section3DTilt(){
    const secs = document.querySelectorAll('.section');
    if (!secs.length) return;
    const onScroll = () => {
      const h = window.innerHeight;
      secs.forEach(s => {
        const r = s.getBoundingClientRect();
        const c = (r.top + r.bottom)/2 - h/2; // center offset
        const n = Math.max(-1, Math.min(1, c/(h/2)));
        s.style.setProperty('--tiltX', `${(-n*2).toFixed(2)}deg`);
        s.style.setProperty('--tiltY', `${(n*0.4).toFixed(2)}deg`);
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  })();

  // About orb parallax/glisten
  (function aboutOrbFX(){
    const orb = document.querySelector('#about .about-visual .orb');
    if (!orb) return;
    let raf=null; let target={x:0,y:0}, state={x:0,y:0};
    const onMove=(e)=>{
      const r=orb.getBoundingClientRect(); const x=(e.clientX - (r.left + r.width/2))/r.width; const y=(e.clientY - (r.top + r.height/2))/r.height; target.x = x*8; target.y = y*8; if(!raf) raf=requestAnimationFrame(loop);
    };
    const loop=()=>{ state.x += (target.x - state.x)*0.12; state.y += (target.y - state.y)*0.12; orb.style.transform = `translate3d(0,0,0) rotateX(${(-state.y).toFixed(2)}deg) rotateY(${(state.x).toFixed(2)}deg)`; if (Math.abs(state.x-target.x)>0.1 || Math.abs(state.y-target.y)>0.1) raf=requestAnimationFrame(loop); else raf=null; };
    orb.addEventListener('pointermove', onMove, { passive: true });
    orb.addEventListener('pointerleave', ()=>{ target.x=0; target.y=0; if(!raf) raf=requestAnimationFrame(loop); }, { passive: true });
  })();

  (function activeSection() {
    const secs = document.querySelectorAll('main .section[id]');
    const navLinks = document.querySelectorAll('.nav a[href^="#"]');
    if (!secs.length) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(a => a.removeAttribute('aria-current'));
          const current = document.querySelector(`.nav a[href="#${id}"]`);
          if (current) current.setAttribute('aria-current', 'true');
        }
      });
    }, { threshold: [0.5] });
    secs.forEach(s => io.observe(s));
  })();


  // Ensure Resume download works (shows message if missing)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[data-resume][download]');
    if (!a) return;
    e.preventDefault();
    fetch(a.getAttribute('href'), { method: 'HEAD' })
      .then(r => {
        if (r.ok) {
          const tmp = document.createElement('a');
          tmp.href = a.href; tmp.setAttribute('download', 'Rabi_Shaikh_Resume.pdf');
          document.body.appendChild(tmp); tmp.click(); tmp.remove();
        } else {
          alert('Resume PDF not found in assets/Resume.pdf. Please add your PDF to assets and try again.');
        }
      })
      .catch(() => alert('Unable to access resume. Please ensure assets/Resume.pdf exists.'));
  }, { passive: false });
})();
