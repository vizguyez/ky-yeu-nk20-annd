document.addEventListener('DOMContentLoaded', () => {
  const DATA = window.NK20_DATA;
  if (!DATA) {
    console.error('Missing data');
    return;
  }

  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const encPath = (p) => p.split('/').map(encodeURIComponent).join('/');
  const formatDate = (d) => d ? d : '—';

  const header = $('#siteHeader');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });

  const navToggle = $('#navToggle');
  const mainNav = $('#mainNav');
  navToggle.addEventListener('click', () => mainNav.classList.toggle('open'));
  $$('.main-nav a').forEach(a => a.addEventListener('click', () => mainNav.classList.remove('open')));

  const heroBg = $('#heroBg');
  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (heroBg && y < window.innerHeight) {
        heroBg.style.transform = `translate3d(0, ${y * 0.35}px, 0)`;
      }
      ticking = false;
    });
  });

  if (window.AOS) AOS.init({
    duration: 800,
    once: true,
    offset: 80
  });

  const statMembers = $('#statMembers');
  if (statMembers) statMembers.textContent = DATA.meta.rosterTotal || DATA.meta.totalMembers;

  const tabsEl = $('#squadTabs');
  const panelEl = $('#squadPanel');
  let activeSquad = 1;

  const roleRank = (r) => (r === 'A trưởng' ? 0 : r === 'A phó' ? 1 : 2);

  function renderTabs() {
    tabsEl.innerHTML = DATA.squads.map(s => `
      <button class="squad-tab ${s.id === activeSquad ? 'active' : ''}" data-squad="${s.id}" role="tab">
        Tiểu đội ${s.id}
      </button>
    `).join('');
    tabsEl.querySelectorAll('.squad-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        activeSquad = parseInt(btn.dataset.squad, 10);
        renderTabs();
        renderPanel();
      });
    });
  }

  function renderPanel() {
    const s = DATA.squads.find(x => x.id === activeSquad);
    if (!s) return;
    const sortedMembers = [...s.members].sort((a, b) => roleRank(a.role) - roleRank(b.role));
    panelEl.innerHTML = `
      <div class="squad-header">
        <div class="squad-image" id="squadImage"><img src="${encPath(s.image)}" alt="${s.name}" loading="lazy" /></div>
        <div class="squad-info">
          <h3>${s.name}</h3>
          <p class="squad-slogan">${s.slogan}</p>
          <p class="squad-desc">${s.description}</p>
          <p class="squad-count">${s.members.length} THÀNH VIÊN</p>
        </div>
      </div>
      <div class="member-grid">
        ${sortedMembers.map(m => `
          <article class="member-card" data-member-id="${m.id}" data-squad="${s.id}">
            ${m.role ? `<span class="member-badge">${m.role}</span>` : ''}
            <div class="member-photo"><img src="${encPath(m.image)}" alt="${m.name}" loading="lazy" /></div>
            <div class="member-info">
              <h3 class="member-name">${m.name}</h3>
              <p class="member-role">${m.role || 'Học viên'}</p>
            </div>
          </article>
        `).join('')}
      </div>
    `;
    panelEl.querySelectorAll('.member-card').forEach(card => {
      card.addEventListener('click', () => {
        const sid = parseInt(card.dataset.squad, 10);
        const mid = card.dataset.memberId;
        const squad = DATA.squads.find(x => x.id === sid);
        const member = squad.members.find(x => x.id === mid);
        openMemberModal(member);
      });
    });
    // Click vào ảnh tập thể tiểu đội -> phóng to (lightbox)
    const squadImageEl = panelEl.querySelector('#squadImage');
    if (squadImageEl) {
      squadImageEl.style.cursor = 'zoom-in';
      squadImageEl.addEventListener('click', () => {
        const img = squadImageEl.querySelector('img');
        if (img && img.src) openSquadLightbox(img.src);
      });
    }
    if (window.AOS) AOS.refresh();
  }

  renderTabs();
  renderPanel();

  const modal = $('#memberModal');
  const modalBody = $('#modalBody');

  function openDetailModal(d) {
    modalBody.innerHTML = `
      <div class="modal-photo"><img src="${encPath(d.image)}" alt="${d.name}" /></div>
      <div class="modal-details">
        <h2 class="modal-name">${d.name}</h2>
        <p class="modal-role">${d.role || ''}</p>
        <ul class="modal-meta">
          ${d.rank ? `<li><span class="label">Cấp bậc</span><span class="value">${d.rank}</span></li>` : ''}
          ${d.position ? `<li><span class="label">Chức vụ</span><span class="value">${d.position}</span></li>` : ''}
          ${d.phone ? `<li><span class="label">Số điện thoại</span><span class="value">${d.phone}</span></li>` : ''}
          ${d.dob ? `<li><span class="label">Ngày sinh</span><span class="value">${formatDate(d.dob)}</span></li>` : ''}
          ${d.hometown ? `<li><span class="label">Quê quán</span><span class="value">${formatDate(d.hometown)}</span></li>` : ''}
          ${d.noisinh ? `<li><span class="label">Nơi sinh</span><span class="value">${formatDate(d.noisinh)}</span></li>` : ''}
          ${d.unit ? `<li><span class="label">Đơn vị</span><span class="value">${formatDate(d.unit)}</span></li>` : ''}
        </ul>
        ${d.motto ? `<div class="modal-motto">“${d.motto}”</div>` : '<div class="modal-motto empty">Lời nhắn kỷ niệm đang được cập nhật.</div>'}
      </div>
    `;
    modal.classList.add('open');
    document.body.classList.add('no-scroll');
  }

  function openMemberModal(m) {
    if (!m) return;
    openDetailModal({
      name: m.name,
      role: m.role || 'Học viên',
      rank: '',
      position: m.position || '',
      phone: m.phone,
      image: m.image,
      dob: m.dob,
      hometown: m.hometown,
      noisinh: m.noisinh,
      unit: m.unit,
      motto: m.motto
    });
  }

  function closeModal() {
    modal.classList.remove('open');
    document.body.classList.remove('no-scroll');
  }
  $$('[data-close]', modal).forEach(el => el.addEventListener('click', closeModal));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeModal();
      closeLightbox();
    }
  });

  const teachersGrid = $('#teachersGrid');
  if (teachersGrid && DATA.teachers) {
    teachersGrid.innerHTML = DATA.teachers.map(t => `
      <div class="teacher-card">
        <div class="teacher-photo"><img src="${encPath(t.image)}" alt="${t.name}" loading="lazy" /></div>
        <div class="teacher-info">
          <h3 class="teacher-name">${t.name}</h3>
          <p class="teacher-role">${t.role}</p>
        </div>
      </div>
    `).join('');

    teachersGrid.querySelectorAll('.teacher-card').forEach((card, idx) => {
      card.style.cursor = 'pointer';
      card.addEventListener('click', () => {
        const t = DATA.teachers[idx];
        openDetailModal({
          name: t.name,
          role: t.role,
          rank: t.rank,
          position: t.position,
          phone: t.phone,
          image: t.image,
          motto: t.motto
        });
      });
    });
  }

  // Officers / Ban cán sự (có thể trống để sau này bổ sung)
  const officersGrid = $('#officersGrid');
  if (officersGrid) {
    const officers = DATA.officers || [];
    if (officers.length) {
      officersGrid.innerHTML = officers.map(o => `
        <div class="officer-card">
          <div class="officer-photo"><img src="${encPath(o.image)}" alt="${o.name}" loading="lazy" /></div>
          <div class="officer-info">
            <h3 class="officer-name">${o.name}</h3>
            <p class="officer-role">${o.role}</p>
          </div>
        </div>
      `).join('');

      officersGrid.querySelectorAll('.officer-card').forEach((card, idx) => {
        card.style.cursor = 'pointer';
        card.addEventListener('click', () => {
          const o = officers[idx];
          try {
            openDetailModal({
              name: o.name,
              role: o.role,
              image: o.image,
              rank: o.rank,
              dob: o.dob,
              gender: o.gender,
              hometown: o.hometown,
              noisinh: o.noisinh,
              unit: o.unit,
              phone: o.phone,
              motto: o.motto
            });
          } catch (e) {
            console.error('Lỗi mở modal officer:', e);
            alert('Không mở được chi tiết cán sự: ' + e.message);
          }
        });
      });
    } else {
      officersGrid.innerHTML = '<p style="text-align:center;color:var(--smoke);">Ban cán sự lớp sẽ được bổ sung sớm.</p>';
    }
  }

  const galleryGrid = $('#galleryGrid');
  const lb = $('#lightbox');
  const lbImg = $('#lbImg');
  let galleryIndex = 0;
  const galleryImages = (DATA.gallery || []).map(encPath);

  if (galleryGrid) {
    galleryGrid.innerHTML = galleryImages.map((src, i) => `
      <div class="gallery-item" data-idx="${i}">
        <img src="${src}" alt="Khoảnh khắc ${i + 1}" loading="lazy" />
      </div>
    `).join('');
    galleryGrid.querySelectorAll('.gallery-item').forEach(item => {
      item.addEventListener('click', () => openLightbox(parseInt(item.dataset.idx, 10)));
    });
  }

  function openLightbox(i) {
    galleryIndex = i;
    lbImg.src = galleryImages[galleryIndex];
    lb.classList.add('open');
    document.body.classList.add('no-scroll');
    const prev = lb.querySelector('[data-lb-prev]');
    const next = lb.querySelector('[data-lb-next]');
    if (prev) prev.style.display = '';
    if (next) next.style.display = '';
  }

  function openSquadLightbox(src) {
    if (!src) return;
    lbImg.src = src;
    lb.classList.add('open');
    document.body.classList.add('no-scroll');
    const prev = lb.querySelector('[data-lb-prev]');
    const next = lb.querySelector('[data-lb-next]');
    if (prev) prev.style.display = 'none';
    if (next) next.style.display = 'none';
  }

  function closeLightbox() {
    lb.classList.remove('open');
    document.body.classList.remove('no-scroll');
    const prev = lb.querySelector('[data-lb-prev]');
    const next = lb.querySelector('[data-lb-next]');
    if (prev) prev.style.display = '';
    if (next) next.style.display = '';
  }

  function navLightbox(delta) {
    galleryIndex = (galleryIndex + delta + galleryImages.length) % galleryImages.length;
    lbImg.src = galleryImages[galleryIndex];
  }
  $('[data-lb-close]', lb).addEventListener('click', closeLightbox);
  $('[data-lb-prev]', lb).addEventListener('click', () => navLightbox(-1));
  $('[data-lb-next]', lb).addEventListener('click', () => navLightbox(1));
  lb.addEventListener('click', (e) => {
    if (e.target === lb) closeLightbox();
  });

  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({
          top,
          behavior: 'smooth'
        });
      }
    });
  });

  // ==================== Activities timeline ====================
  const activities = DATA.activities || [];

  const timelineEl = $('#actTimeline');
  const searchEl = $('#actSearch');

  // per-event current slide index
  const indices = activities.map(() => 0);

  function slidesForEvent(ei) {
    const a = activities[ei];
    if (!a) return [];
    const q = (searchEl.value || '').trim().toLowerCase();
    let pool = [];
    (a.photos || []).forEach((p, i) => {
      const cap = (a.captions && a.captions[i]) || a.caption || '';
      const item = {
        src: p,
        caption: cap,
        video: false
      };
      if (!q || (a.title + ' ' + cap + ' ' + p).toLowerCase().includes(q)) pool.push(item);
    });
    (a.videos || []).forEach((p) => {
      const cap = a.caption || '';
      const item = {
        src: p,
        caption: cap,
        video: true
      };
      if (!q || (a.title + ' ' + cap + ' ' + p).toLowerCase().includes(q)) pool.push(item);
    });
    return pool;
  }

  function renderTimeline() {
    if (!timelineEl || !searchEl) return;
    const q = (searchEl.value || '').trim().toLowerCase();
    let html = '';
    activities.forEach((a, ei) => {
      const slides = slidesForEvent(ei);
      if (q && slides.length === 0) return; // hide events with no matches when filtering
      if (indices[ei] >= slides.length) indices[ei] = 0;
      if (slides.length === 0) indices[ei] = 0;
      const ci = indices[ei];
      const cur = slides[ci];
      const mediaHtml = slides.length === 0 ?
        '<div class="act-event-empty">Chưa có ảnh.</div>' :
        (cur && cur.video ?
          `<video src="${encPath(cur.src)}" controls></video>` :
          `<img src="${cur ? encPath(cur.src) : ''}" alt="" />`);
      const captionText = cur ? (cur.caption || '') : '';
      const counter = slides.length ? `${ci + 1} / ${slides.length}` : '0 / 0';
      const thumbs = slides.map((s, i) => s.video ?
        `<div class="act-thumb ${i === ci ? 'active' : ''}" data-event="${ei}" data-idx="${i}">▶</div>` :
        `<div class="act-thumb ${i === ci ? 'active' : ''}" data-event="${ei}" data-idx="${i}"><img src="${encPath(s.src)}" alt="" loading="lazy" /></div>`).join('');
      html += `
        <article class="act-event" data-event="${ei}">
          <div class="act-event-marker"></div>
          <div class="act-event-body">
            <h3 class="act-event-title">${a.title || ('Sự kiện ' + (ei + 1))}</h3>
            ${a.caption ? `<p class="act-event-caption">${a.caption}</p>` : ''}
            <div class="act-event-stage">
              <button class="act-nav act-prev" data-event="${ei}" aria-label="Ảnh trước">‹</button>
              <div class="act-event-slide">
                ${mediaHtml}
                <div class="act-caption">${captionText}</div>
              </div>
              <button class="act-nav act-next" data-event="${ei}" aria-label="Ảnh sau">›</button>
            </div>
            <div class="act-event-meta">
              <span class="act-event-counter">${counter}</span>
            </div>
            <div class="act-event-thumbs">${thumbs}</div>
          </div>
        </article>
      `;
    });
    if (!html) html = '<p class="act-event-empty">Không có sự kiện phù hợp.</p>';
    timelineEl.innerHTML = html;

    // bind
    timelineEl.querySelectorAll('.act-nav.act-prev').forEach(btn => {
      btn.addEventListener('click', () => {
        const ei = parseInt(btn.dataset.event, 10);
        const slides = slidesForEvent(ei);
        if (!slides.length) return;
        indices[ei] = (indices[ei] - 1 + slides.length) % slides.length;
        renderTimeline();
      });
    });
    timelineEl.querySelectorAll('.act-nav.act-next').forEach(btn => {
      btn.addEventListener('click', () => {
        const ei = parseInt(btn.dataset.event, 10);
        const slides = slidesForEvent(ei);
        if (!slides.length) return;
        indices[ei] = (indices[ei] + 1) % slides.length;
        renderTimeline();
      });
    });
    timelineEl.querySelectorAll('.act-thumb').forEach(t => {
      t.addEventListener('click', () => {
        const ei = parseInt(t.dataset.event, 10);
        const idx = parseInt(t.dataset.idx, 10);
        indices[ei] = idx;
        renderTimeline();
        openActLightbox(ei, idx);
      });
    });

    // click ảnh lớn -> fullscreen
    timelineEl.querySelectorAll('.act-event-slide img, .act-event-slide video').forEach(media => {
      media.style.cursor = 'zoom-in';
      media.addEventListener('click', () => {
        const article = media.closest('.act-event');
        if (!article) return;
        const ei = parseInt(article.dataset.event, 10);
        openActLightbox(ei, indices[ei]);
      });
    });
  }

  if (searchEl) {
    searchEl.addEventListener('input', () => {
      activities.forEach((_, i) => {
        indices[i] = 0;
      });
      renderTimeline();
    });
  }

  // ---------- Fullscreen lightbox for activity images ----------
  const actLb = $('#actLightbox');
  const actLbMedia = $('#actlbMedia');
  const actLbCaption = $('#actlbCaption');
  const actLbCounter = $('#actlbCounter');
  let lbEvent = 0;
  let lbIndex = 0;
  let lbSlides = [];

  function renderActLightbox() {
    const s = lbSlides[lbIndex];
    if (!s) return;
    actLbMedia.innerHTML = s.video ?
      `<video src="${encPath(s.src)}" controls autoplay></video>` :
      `<img src="${encPath(s.src)}" alt="" />`;
    actLbCaption.textContent = s.caption || '';
    actLbCounter.textContent = (lbIndex + 1) + ' / ' + lbSlides.length;
    actLb.classList.add('open');
    actLb.setAttribute('aria-hidden', 'false');
    document.body.classList.add('no-scroll');
  }

  function openActLightbox(ei, idx) {
    lbEvent = ei;
    lbSlides = slidesForEvent(ei);
    if (!lbSlides.length) return;
    lbIndex = Math.min(Math.max(idx, 0), lbSlides.length - 1);
    renderActLightbox();
  }

  function closeActLightbox() {
    actLb.classList.remove('open');
    actLb.setAttribute('aria-hidden', 'true');
    actLbMedia.innerHTML = '';
    document.body.classList.remove('no-scroll');
  }

  function navActLightbox(delta) {
    if (!lbSlides.length) return;
    lbIndex = (lbIndex + delta + lbSlides.length) % lbSlides.length;
    indices[lbEvent] = lbIndex;
    renderActLightbox();
    renderTimeline();
  }

  if (actLb) {
    actLb.querySelector('[data-actlb-close]').addEventListener('click', closeActLightbox);
    actLb.querySelector('[data-actlb-prev]').addEventListener('click', () => navActLightbox(-1));
    actLb.querySelector('[data-actlb-next]').addEventListener('click', () => navActLightbox(1));
    actLb.addEventListener('click', (e) => {
      if (e.target === actLb) closeActLightbox();
    });
    document.addEventListener('keydown', (e) => {
      if (!actLb.classList.contains('open')) return;
      if (e.key === 'Escape') closeActLightbox();
      if (e.key === 'ArrowLeft') navActLightbox(-1);
      if (e.key === 'ArrowRight') navActLightbox(1);
    });
  }

  renderTimeline();
});
  // ---------- Loader toàn trang ----------
  (function initLoader() {
    const loader = document.getElementById('loaderOverlay');
    if (!loader) return;

    const MAX_WAIT = 12000;   // tối đa chờ 12 giây (ảnh dung lượng lớn)
    const MIN_SHOW = 1200;    // hiển thị tối thiểu 1.2 giây

    let imagesDone = 0;
    const imgs = Array.from(document.images).map(i => i.src).filter(Boolean);

    function finish() {
      loader.classList.add('hidden');
      setTimeout(() => { loader.style.display = 'none'; }, 700);
    }

    // Preload từng ảnh để bắt cả ảnh lazy-load (loading="lazy")
    const loadOne = (src) => new Promise((resolve) => {
      const im = new Image();
      im.onload = im.onerror = resolve;
      im.src = src;
    });

    const t0 = Date.now();
    Promise.all(imgs.map(loadOne)).then(() => {
      imagesDone = imgs.length;
      maybeFinish();
    });

    const fontReady = document.fonts ? document.fonts.ready : Promise.resolve();

    function maybeFinish() {
      const elapsed = Date.now() - t0;
      if (imagesDone === imgs.length && elapsed >= MIN_SHOW) {
        finish();
      } else if (elapsed >= MAX_WAIT) {
        finish(); // sécurité: không để treo mãi
      } else {
        requestAnimationFrame(maybeFinish);
      }
    }

    Promise.all([fontReady]).then(() => {
      maybeFinish();
    });
  })();