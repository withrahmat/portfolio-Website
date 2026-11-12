(() => {
  'use strict';
  const P = window.PORTFOLIO, C = window.CONTENT;
  const $ = (s, r = document) => r.querySelector(s);
  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (v == null || v === false) continue;
      if (k === 'class') n.className = v;
      else if (k === 'text') n.textContent = v;
      else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
      else n.setAttribute(k, v === true ? '' : v);
    }
    kids.flat().forEach(c => c != null && n.append(c.nodeType ? c : document.createTextNode(c)));
    return n;
  };

  /* ---------- Reusable components ---------- */

  /** Image tile that opens the lightbox. Keeps the image's own aspect ratio. */
  function GalleryItem(item, index, set, caption) {
    const ar = (item.w / item.h).toFixed(4);
    const img = el('img', { src: item.thumb, alt: item.alt, width: item.w, height: item.h, loading: 'lazy', decoding: 'async' });
    return el('button', { class: 'g-item', type: 'button', style: `--ar:${ar}`, 'aria-label': `View ${item.alt}`,
      onclick: e => Lightbox.open(set, index, caption, e.currentTarget) }, img);
  }

  function Gallery(items, caption) {
    return el('div', { class: 'gallery' }, items.map((it, i) => GalleryItem(it, i, items, caption)));
  }

  /** A titled gallery block. `set` (for the lightbox) is the items of this block only. */
  function GalleryGroup(title, items) {
    return el('section', { class: 'gal-group' },
      title ? el('h3', { class: 'gal-title', text: title }) : null,
      Gallery(items, title));
  }

  /** Pill filter bar. options: [{id,label,count}] ; calls onChange(id) */
  function Filters(host, options, active, onChange) {
    host.replaceChildren();
    options.forEach(o => {
      const b = el('button', { class: 'filter', type: 'button', role: 'tab', 'aria-selected': String(o.id === active),
        onclick: () => { [...host.children].forEach(c => c.setAttribute('aria-selected', 'false')); b.setAttribute('aria-selected', 'true'); onChange(o.id); } },
        o.label, o.count != null ? el('small', { text: o.count }) : null);
      host.append(b);
    });
  }

  const count = list => list.reduce((n, c) => n + c.items.length, 0);

  /* ---------- Static content ---------- */
  document.querySelectorAll('[data-content]').forEach(n => { n.textContent = C[n.dataset.content]; });
  $('#year').textContent = new Date().getFullYear();

  const portrait = $('#hero-portrait');
  portrait.src = P.home.cutout.full; portrait.alt = P.home.cutout.alt;
  portrait.width = P.home.cutout.w; portrait.height = P.home.cutout.h;
  const about = $('#about-photo');
  about.src = P.home.about.full; about.alt = P.home.about.alt; about.width = P.home.about.w; about.height = P.home.about.h;

  $('#about-body').append(...C.about.map(t => el('p', { text: t })));
  $('#education').append(...C.education.map(e => el('li', {}, el('b', { text: e.what }), el('span', { text: `${e.place}, ${e.when}` }))));
  $('#interests').append(...C.interests.map(t => el('li', { text: t })));
  $('#skills').append(...C.skills.map(s => el('div', {}, el('h5', { text: s.group }),
    el('ul', { class: 'chips' }, s.items.map(i => el('li', { text: i }))))));

  /* Areas: three disciplines, using real work as cover art */
  const gdCover = P.graphic.find(c => c.id === 'artworks').items[3];
  const phCover = P.photography.find(c => c.id === 'places').items[0];
  $('#areas').append(
    el('a', { class: 'area', href: '#graphic-design' }, el('img', { src: gdCover.thumb, alt: '' }),
      el('h3', { text: 'Graphic design' }), el('p', { text: 'Posters, packaging, brand and print.' })),
    el('a', { class: 'area', href: '#photography' }, el('img', { src: phCover.thumb, alt: '' }),
      el('h3', { text: 'Photography' }), el('p', { text: 'Places, sport and events.' })),
    el('a', { class: 'area area-text', href: '#about' },
      el('h3', { text: 'Software engineering' }), el('p', { text: 'Studying at Kateb University since 2025, learning C++, Java, Python, and Algorithms.' })));

  /* Experience */
  $('#timeline').append(...C.experience.map(x => el('li', { class: 'tl' },
    el('div', { class: 'when', text: x.when }),
    el('div', {}, el('h3', { text: x.role }), el('p', { class: 'org', text: x.org })),
    el('ul', {}, x.points.map(p => el('li', { text: p }))))));

  /* Cooperations */
  $('#coop-grid').append(...P.cooperations.map(c => el('li', {},
    el('img', { src: c.thumb, alt: c.alt, width: c.w, height: c.h, loading: 'lazy', decoding: 'async', style: `max-width:${c.w}px;max-height:${c.h}px` }),
    el('span', { class: 'tip', text: c.name }))));

  /* Contact */
  const k = C.contact;
  $('#mail-link').href = `mailto:${k.email}`;
  $('#contact-list').append(
    el('li', {}, el('a', { href: `mailto:${k.email}` }, el('span', { text: 'Email' }), k.email)),
    el('li', {}, el('a', { href: k.whatsapp, target: '_blank', rel: 'noopener' }, el('span', { text: 'WhatsApp' }), k.phoneDisplay)),
    ...k.socials.map(s => el('li', {}, el('a', { href: s.url, target: '_blank', rel: 'noopener' }, el('span', { text: s.label }), C.handle))));

  /* ---------- Graphic design + photography sections ---------- */
  function filteredSection({ filtersHost, galleryHost, cats, label }) {
    const render = id => {
      galleryHost.replaceChildren(...(id === 'all' ? cats : cats.filter(c => c.id === id))
        .map(c => GalleryGroup(id === 'all' ? c.title : null, c.items)));
    };
    Filters(filtersHost, [{ id: 'all', label: 'All', count: count(cats) },
      ...cats.map(c => ({ id: c.id, label: c.title, count: c.items.length }))], 'all', render);
    render('all');
  }
  filteredSection({ filtersHost: $('#gd-filters'), galleryHost: $('#gd-gallery'), cats: P.graphic });
  filteredSection({ filtersHost: $('#ph-filters'), galleryHost: $('#ph-gallery'), cats: P.photography });

  /* ---------- Clients ---------- */
  const clientTotal = c => c.categories.map(cat => ({ cat, n: cat.groups.reduce((s, g) => s + g.items.length, 0) }));
  $('#client-grid').append(...P.clients.map(c => {
    const logo = el('img', { src: c.logo.thumb, alt: c.logo.alt, width: c.logo.w, height: c.logo.h, loading: 'lazy', decoding: 'async', style: `max-width:${c.logo.w}px;max-height:${c.logo.h}px` });
    return el('button', { class: 'client-card', type: 'button', onclick: () => { location.hash = `client/${c.id}`; } },
      el('div', { class: 'logo-tile' }, logo),
      el('div', { class: 'info' },
        el('h3', { text: c.name }),
        el('p', { text: C.clientBlurbs[c.id] || '' }),
        el('ul', { class: 'counts' }, clientTotal(c).map(t => el('li', { text: `${t.cat.title}: ${t.n}` })))));
  }));

  const view = $('#client-view'), cvContent = $('#cv-content'), cvTabs = $('#cv-tabs');
  let current = null, opener = null;

  function showClient(id, catId) {
    const idx = P.clients.findIndex(c => c.id === id);
    if (idx < 0) { closeClient(); return; }
    const c = P.clients[idx];
    const first = !current;
    current = c;
    if (first) opener = document.activeElement;
    $('#cv-name').textContent = c.name;
    $('#cv-blurb').textContent = C.clientBlurbs[c.id] || '';
    const logo = $('#cv-logo'); logo.src = c.logo.full; logo.alt = c.logo.alt; logo.style.maxWidth = c.logo.w + 'px'; logo.style.maxHeight = c.logo.h + 'px';
    const active = c.categories.find(x => x.id === catId) ? catId : c.categories[0].id;
    const renderCat = cid => {
      const cat = c.categories.find(x => x.id === cid);
      cvContent.replaceChildren(el('div', { class: 'cv-section' }, cat.groups.map(g => GalleryGroup(g.title, g.items))));
      history.replaceState(null, '', `#client/${c.id}/${cid}`);
    };
    Filters(cvTabs, c.categories.map(cat => ({ id: cat.id, label: cat.title, count: cat.groups.reduce((s, g) => s + g.items.length, 0) })), active, renderCat);
    renderCat(active);
    view.hidden = false; document.body.classList.add('locked');
    $('#cv-scroll').scrollTop = 0;
    if (first) $('#cv-close').focus();
    $('#cv-prev').onclick = () => { location.hash = `client/${P.clients[(idx - 1 + P.clients.length) % P.clients.length].id}`; };
    $('#cv-next').onclick = () => { location.hash = `client/${P.clients[(idx + 1) % P.clients.length].id}`; };
  }
  function closeClient() {
    if (!current) return;
    current = null; view.hidden = true; document.body.classList.remove('locked');
    if (location.hash.startsWith('#client/')) history.replaceState(null, '', '#clients');
    document.getElementById('clients').scrollIntoView();
    if (opener && opener.focus) opener.focus();
  }
  $('#cv-close').addEventListener('click', closeClient);

  /* ---------- Lightbox ---------- */
  const Lightbox = (() => {
    const box = $('#lightbox'), img = $('#lb-img'), cap = $('#lb-cap'), cnt = $('#lb-count');
    let set = [], i = 0, label = '', from = null;
    const preload = j => { const s = set[(j + set.length) % set.length]; if (s) new Image().src = s.full; };
    function show(n) {
      i = (n + set.length) % set.length;
      const it = set[i];
      img.classList.add('loading');
      img.onload = () => img.classList.remove('loading');
      img.src = it.full; img.alt = it.alt;
      img.width = it.w; img.height = it.h;
      cap.textContent = label ? `${label}: ${it.alt}` : it.alt;
      cnt.textContent = `${i + 1} / ${set.length}`;
      preload(i + 1); preload(i - 1);
    }
    function open(items, index, caption, trigger) {
      set = items; label = caption || ''; from = trigger || document.activeElement;
      box.classList.toggle('single', set.length < 2);
      box.hidden = false; document.body.classList.add('locked');
      show(index); $('.lb-close', box).focus();
    }
    function close() {
      box.hidden = true; img.removeAttribute('src');
      if (!current) document.body.classList.remove('locked');
      if (from && from.focus) from.focus();
    }
    $('.lb-close', box).onclick = close;
    $('.lb-prev', box).onclick = () => show(i - 1);
    $('.lb-next', box).onclick = () => show(i + 1);
    box.addEventListener('click', e => { if (e.target === box || e.target.classList.contains('lb-stage')) close(); });
    let x0 = null;
    box.addEventListener('touchstart', e => { x0 = e.touches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', e => {
      if (x0 == null) return; const dx = e.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) show(i + (dx < 0 ? 1 : -1));
    });
    document.addEventListener('keydown', e => {
      if (box.hidden) return;
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      else if (e.key === 'ArrowRight') show(i + 1);
      else if (e.key === 'ArrowLeft') show(i - 1);
      else if (e.key === 'Tab') {
        const f = [...box.querySelectorAll('button')].filter(b => b.offsetParent !== null);
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    }, true);
    return { open };
  })();

  /* ---------- Router (client view lives in the hash) ---------- */
  function route() {
    const m = location.hash.match(/^#client\/([a-z0-9-]+)(?:\/([a-z0-9-]+))?$/);
    if (m) showClient(m[1], m[2]);
    else if (current) { current = null; view.hidden = true; document.body.classList.remove('locked'); }
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && current && $('#lightbox').hidden) closeClient();
    if (current && $('#lightbox').hidden && e.key === 'Tab') {
      const f = [...view.querySelectorAll('button')].filter(b => b.offsetParent !== null);
      const a = f[0], z = f[f.length - 1];
      if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
      else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
    }
  });

  /* ---------- Header, mobile nav, active link ---------- */
  const header = $('.site-header'), nav = $('#nav'), toggle = $('.nav-toggle');
  const onScroll = () => header.classList.toggle('solid', scrollY > 40);
  addEventListener('scroll', onScroll, { passive: true }); onScroll();
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
    document.body.classList.toggle('locked', open);
  });
  nav.addEventListener('click', e => {
    if (e.target.closest('a')) { nav.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); document.body.classList.remove('locked'); }
  });
  const links = new Map([...nav.querySelectorAll('a')].map(a => [a.getAttribute('href').slice(1), a]));
  const io = new IntersectionObserver(es => es.forEach(en => {
    if (en.isIntersecting) { links.forEach(a => a.classList.remove('active')); links.get(en.target.id)?.classList.add('active'); }
  }), { rootMargin: '-45% 0px -50% 0px' });
  links.forEach((_, id) => { const s = document.getElementById(id); if (s) io.observe(s); });

  route();
})();
