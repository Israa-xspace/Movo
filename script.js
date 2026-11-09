// ── Scroll Progress + Navbar + Active link (one passive, rAF-throttled handler)
const bar = document.getElementById('scroll-progress');
const nav = document.getElementById('navbar');
const sections = document.querySelectorAll('section[id]');
const navAs = document.querySelectorAll('.nav-links a');

function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + '%';

  nav.classList.toggle('scrolled', window.scrollY > 60);

  // A section becomes active when it enters the top third of the viewport
  const scrollPos = window.scrollY + (window.innerHeight / 3);
  let cur = '';
  sections.forEach(s => {
    if (scrollPos >= s.offsetTop && scrollPos < s.offsetTop + s.offsetHeight) cur = s.id;
  });

  navAs.forEach(a => a.classList.toggle('active', !!cur && a.getAttribute('href') === '#' + cur));
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { onScroll(); ticking = false; });
}, { passive: true });
onScroll();

// ── Mobile Menu
const hbg = document.getElementById('hamburger');
const mob = document.getElementById('mobileMenu');
const mcl = document.getElementById('mobileClose');

function setMenu(open) {
  hbg.classList.toggle('open', open);
  mob.classList.toggle('open', open);
  hbg.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
}
hbg.addEventListener('click', () => setMenu(!mob.classList.contains('open')));
mcl.addEventListener('click', () => setMenu(false));
mob.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
document.addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

// ── Reveal
const ro = new IntersectionObserver(es => es.forEach(e => e.isIntersecting && e.target.classList.add('visible')), { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
document.querySelectorAll('.reveal').forEach(el => ro.observe(el));

// ── Counters
function animCounter(el) {
  const target = parseFloat(el.dataset.target);
  const suffix = el.dataset.suffix || '';
  const prefix = el.dataset.prefix || '';
  const dur = 2000;
  const start = performance.now();
  const isF = target % 1 !== 0;
  function tick(now) {
    const p = Math.min((now - start) / dur, 1);
    const e = 1 - Math.pow(1 - p, 3);
    el.textContent = prefix + (isF ? (target * e).toFixed(1) : Math.floor(target * e)) + suffix;
    if (p < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const co = new IntersectionObserver(es => es.forEach(e => {
  if (e.isIntersecting && !e.target.dataset.counted) {
    e.target.dataset.counted = '1';
    animCounter(e.target);
  }
}), { threshold: 0.5 });
document.querySelectorAll('.stat-num').forEach(el => co.observe(el));

// ── FAQ Accordion (buttons with aria-expanded; one item open at a time)
const faqQs = document.querySelectorAll('.faq-q');
faqQs.forEach(q => {
  q.addEventListener('click', () => {
    const item = q.closest('.faq-item');
    const wasOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    faqQs.forEach(b => b.setAttribute('aria-expanded', 'false'));
    if (!wasOpen) {
      item.classList.add('open');
      q.setAttribute('aria-expanded', 'true');
    }
  });
});
