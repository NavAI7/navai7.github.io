const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// Scroll reveal
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('in'), i * 60);
      io.unobserve(entry.target);
    }
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
  document.querySelectorAll('a, button, .project-card, .case-card').forEach(el => {
    el.addEventListener('mouseenter', () => cursor.classList.add('hover'));
    el.addEventListener('mouseleave', () => cursor.classList.remove('hover'));
  });
}

// Hero parallax on scroll
const heroBgText = document.querySelector('.hero-bg-text');
const heroPhoto = document.querySelector('.hero-photo');
// The photo only parallaxes while the hero is two columns. Below 960px the hero
// stacks and the photo sits under the buttons, so shifting it up overlapped them.
const wideHero = window.matchMedia('(min-width: 961px)');
function updateParallax() {
  const y = window.scrollY;
  if (heroBgText) heroBgText.style.transform = `translate(-50%, ${y * 0.18}px)`;
  if (heroPhoto) heroPhoto.style.transform = wideHero.matches ? `translateY(${y * -0.06}px)` : '';
}
if (!prefersReducedMotion) {
  window.addEventListener('scroll', updateParallax, { passive: true });
  wideHero.addEventListener('change', updateParallax);
  updateParallax();
}

// Highlight the nav link for the section currently in view
const spyLinks = Array.from(document.querySelectorAll('.nav-links a[href^="#"]'));
const spyTargets = spyLinks
  .map(a => document.getElementById(a.getAttribute('href').slice(1)))
  .filter(Boolean);
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
