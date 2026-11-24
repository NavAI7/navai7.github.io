// Scrollspy: highlight the active TOC entry and update the progress bar
const tocLinks = document.querySelectorAll('.doc-toc a');
const sections = [...tocLinks].map(a => document.querySelector(a.getAttribute('href')));
const progressBar = document.querySelector('.doc-toc-progress-bar');

function updateActive() {
  const y = window.scrollY + 140;
  const atBottom = Math.ceil(window.scrollY + window.innerHeight) >= document.documentElement.scrollHeight - 8;
  let activeIndex = 0;
  sections.forEach((sec, i) => {
    if (sec && sec.offsetTop <= y) activeIndex = i;
  });
  if (atBottom) activeIndex = sections.length - 1;
  tocLinks.forEach((a, i) => {
    a.parentElement.classList.toggle('active', i === activeIndex);
  });

  const first = sections[0];
  const last = sections[sections.length - 1];
  if (first && last && progressBar) {
    if (atBottom) {
      progressBar.style.width = '100%';
    } else {
      const total = (last.offsetTop + last.offsetHeight) - first.offsetTop;
      const done = Math.min(Math.max(y - first.offsetTop, 0), total);
      progressBar.style.width = (total > 0 ? (done / total) * 100 : 0) + '%';
    }
  }
}
window.addEventListener('scroll', updateActive, { passive: true });
updateActive();

// Scroll reveal (matches the main site's one-shot fade-up)
document.documentElement.classList.add('js-reveal');
const revealEls = document.querySelectorAll('.reveal');
const io = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -60px 0px' });
revealEls.forEach(el => io.observe(el));

// Animated diagrams: assemble once, then run the flow only while on screen.
const diagrams = document.querySelectorAll('.dia');
if (diagrams.length && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const diagramObserver = new IntersectionObserver((entries) => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting && target.classList.contains('is-waiting')) {
        target.classList.replace('is-waiting', 'is-built');
      }
      target.classList.toggle('is-live', isIntersecting);
    });
  }, { threshold: 0.15 });

  diagrams.forEach((fig) => {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'dia-toggle';
    toggle.textContent = 'Pause';
    toggle.setAttribute('aria-label', 'Pause diagram animation');
    toggle.addEventListener('click', () => {
      const paused = fig.classList.toggle('is-paused');
      toggle.textContent = paused ? 'Play' : 'Pause';
      toggle.setAttribute('aria-label', paused ? 'Play diagram animation' : 'Pause diagram animation');
    });
    fig.appendChild(toggle);
    fig.classList.add('is-waiting');
    diagramObserver.observe(fig);
  });
}

// Collapse the contents list on phones. Stacked inline it pushed the article
// more than two screens down; the head becomes a toggle instead. Everything is
// torn down again above the breakpoint so no dead button is left in the
// accessibility tree on desktop.
const toc = document.querySelector('.doc-toc');
const tocHead = document.querySelector('.doc-toc-head');
if (toc && tocHead) {
  const narrow = window.matchMedia('(max-width: 900px)');

  function collapse(on) {
    toc.classList.toggle('is-collapsed', on);
    tocHead.setAttribute('aria-expanded', String(!on));
  }
  function toggle() {
    collapse(!toc.classList.contains('is-collapsed'));
  }
  function onKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggle();
    }
  }

  function applyNarrow() {
    if (narrow.matches) {
      tocHead.setAttribute('role', 'button');
      tocHead.setAttribute('tabindex', '0');
      tocHead.addEventListener('click', toggle);
      tocHead.addEventListener('keydown', onKey);
      collapse(true);
    } else {
      tocHead.removeEventListener('click', toggle);
      tocHead.removeEventListener('keydown', onKey);
      tocHead.removeAttribute('role');
      tocHead.removeAttribute('tabindex');
      tocHead.removeAttribute('aria-expanded');
      toc.classList.remove('is-collapsed');
    }
  }

  applyNarrow();
  narrow.addEventListener('change', applyNarrow);
  window.addEventListener('resize', applyNarrow, { passive: true });
}
