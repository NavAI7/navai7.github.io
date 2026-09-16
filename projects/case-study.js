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
