const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll reveal
document.documentElement.classList.add('js-reveal');
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  // Stagger only what is on screen. Counting every observed element made
  // blocks far down the page (where back links land) wait seconds to appear.
  entries.filter(entry => entry.isIntersecting).forEach((entry, i) => {
    setTimeout(() => entry.target.classList.add('in'), Math.min(i, 4) * 60);
    io.unobserve(entry.target);
  });
}, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach(el => io.observe(el));

// Scroll progress bar
const progress = document.getElementById('scrollProgress');
function updateProgress() {
  const scrollTop = window.scrollY;
  const docHeight = document.documentElement.scrollHeight - window.innerHeight;
  const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
  progress.style.width = pct + '%';
}
window.addEventListener('scroll', updateProgress, { passive: true });
updateProgress();

// Custom cursor (desktop / fine pointer only)
const cursor = document.getElementById('cursorDot');
if (!prefersReducedMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  window.addEventListener('mousemove', (e) => {
    cursor.classList.add('active');
    cursor.style.left = e.clientX + 'px';
    cursor.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button, summary').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// Count the headline results up once. The markup already holds the final numbers.
if (!prefersReducedMotion && document.visibilityState === 'visible') {
  document.querySelectorAll('[data-count]').forEach((el) => {
    const target = Number(el.dataset.count);
    const begun = performance.now();
    const tick = (now) => {
      const t = Math.max(0, Math.min(1, (now - begun) / 1100));
      el.textContent = String(Math.round(target * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
    };
    el.textContent = '0';
    requestAnimationFrame(tick);
    // Never leave a wrong number up if frames stop arriving.
    setTimeout(() => { el.textContent = String(target); }, 1300);
  });
}

// Timeline: the line follows the reader and lights each checkpoint on the way
const timeline = document.getElementById('timeline');
if (timeline && !prefersReducedMotion) {
  const fill = timeline.querySelector('.tl-fill');
  let waiting = Array.from(timeline.querySelectorAll('.era, .cp'));
  const updateTimeline = () => {
    const box = timeline.getBoundingClientRect();
    const reached = Math.max(0, Math.min(box.height, window.innerHeight * 0.65 - box.top));
    fill.style.height = reached + 'px';
    const line = window.innerHeight * 0.88;
    waiting = waiting.filter((el) => {
      if (el.getBoundingClientRect().top + 30 > line) return true;
      el.classList.add('lit');
      return false;
    });
  };
  timeline.classList.add('is-anim');
  // A card reached by keyboard must be visible even if scrolling hasn't got to it.
  timeline.addEventListener('focusin', (e) => {
    const cp = e.target.closest('.cp');
    if (cp) cp.classList.add('lit');
  });
  timeline.addEventListener('toggle', updateTimeline, true);
  window.addEventListener('scroll', updateTimeline, { passive: true });
  window.addEventListener('resize', updateTimeline);
  updateTimeline();
}

// A link to a checkpoint, such as "Back to the timeline" on a case study, opens it
function openLinkedCheckpoint() {
  const id = location.hash.slice(1);
  if (!id.startsWith('work-')) return;
  const card = document.getElementById(id);
  if (!card) return;
  card.open = true;
  card.parentElement.classList.add('lit');
  card.scrollIntoView({ behavior: 'instant' });
}
window.addEventListener('hashchange', openLinkedCheckpoint);
openLinkedCheckpoint();
// Fonts and images move things, so line up again once they have loaded.
window.addEventListener('load', openLinkedCheckpoint, { once: true });

// Highlight the nav link for the section currently in view
const spyLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
// Every section counts, so a section with no nav link of its own highlights nothing.
const spyTargets = Array.from(document.querySelectorAll('main section[id]'));
function updateActiveNav() {
  const line = window.innerHeight * 0.35;
  let current = null;
  spyTargets.forEach(sec => {
    if (sec.getBoundingClientRect().top <= line) current = sec;
  });
  spyLinks.forEach(a => {
    a.classList.toggle('active', !!current && a.getAttribute('href') === '#' + current.id);
  });
}
window.addEventListener('scroll', updateActiveNav, { passive: true });
window.addEventListener('resize', updateActiveNav);
updateActiveNav();

// System diagram: reveal the three layers in turn while it's on screen
const sys = document.querySelector('.sys');
if (sys) {
  const steps = Array.from(sys.querySelectorAll('.sys-step'));
  const playBtn = document.getElementById('sysPlay');
  const durations = [4800, 7200, 6400];
  let step = 3;
  let playing = !prefersReducedMotion;
  let visible = false;
  let started = false;
  let timer = null;

  const show = (n) => {
    step = n;
    sys.dataset.step = String(n);
    steps.forEach((b, i) => {
      if (i + 1 === n) b.setAttribute('aria-current', 'true');
      else b.removeAttribute('aria-current');
    });
    sys.style.setProperty('--dur', durations[n - 1] + 'ms');
  };
  const schedule = () => {
    clearTimeout(timer);
    if (!playing || !visible) return;
    timer = setTimeout(() => { show(step % 3 + 1); schedule(); }, durations[step - 1]);
  };
  const setPlaying = (p) => {
    playing = p;
    sys.dataset.playing = String(p);
    playBtn.textContent = p ? 'Pause' : 'Play';
    playBtn.setAttribute('aria-label', p ? 'Pause animation' : 'Play animation');
    schedule();
  };

  steps.forEach(b => b.addEventListener('click', () => {
    setPlaying(false);
    show(Number(b.dataset.go));
  }));
  playBtn.addEventListener('click', () => {
    if (!playing && step === 3) show(1);
    setPlaying(!playing);
  });

  if (prefersReducedMotion) {
    setPlaying(false);
  } else {
    // Hidden until it scrolls into view, so the first layer animates in front of the reader.
    sys.dataset.step = '0';
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible && !started) { started = true; show(1); setPlaying(true); }
      else schedule();
    }, { threshold: 0.35 }).observe(sys);
  }
}

// Knowledge stack: run the flow only while it's on screen
const stack = document.querySelector('.stack');
if (stack && !prefersReducedMotion) {
  new IntersectionObserver(([entry]) => {
    stack.classList.toggle('is-live', entry.isIntersecting);
  }, { rootMargin: '0px 0px -20% 0px' }).observe(stack);
}

// Product scenes: animate only while on screen. SMIL motion is paused with them.
const scenes = document.querySelectorAll('.scene');
if (scenes.length) {
  if (prefersReducedMotion) {
    scenes.forEach((s) => s.pauseAnimations && s.pauseAnimations());
  } else {
    const sceneIO = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        target.classList.toggle('is-live', isIntersecting);
        if (target.pauseAnimations) (isIntersecting ? target.unpauseAnimations() : target.pauseAnimations());
      });
    }, { threshold: 0.3 });
    scenes.forEach((s) => sceneIO.observe(s));
  }
}

// Mobile nav toggle
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
function setNavOpen(open) {
  navLinks.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  document.body.classList.toggle('nav-open', open);
}
navToggle.addEventListener('click', () => {
  setNavOpen(!navLinks.classList.contains('open'));
});
navLinks.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', () => setNavOpen(false));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') setNavOpen(false);
});
