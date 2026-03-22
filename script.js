(() => {
  // ---- DOM ----
  const gallery = document.getElementById('gallery');
  const modal = document.getElementById('modal');
  const modalImage = document.getElementById('modalImage');
  const modalPlaceholder = document.getElementById('modalPlaceholder');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');
  const modalDate = document.getElementById('modalDate');
  const modalViews = document.getElementById('modalViews');
  const modalLike = document.getElementById('modalLike');
  const modalLikeIcon = document.getElementById('modalLikeIcon');
  const modalLikeCount = document.getElementById('modalLikeCount');
  const modalClose = document.getElementById('modalClose');

  // ---- パーティクル背景 ----
  function initParticles() {
    const canvas = document.getElementById('particles');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
    resize();
    window.addEventListener('resize', resize);

    const shapes = [];
    const shapeCount = Math.min(35, Math.floor(window.innerWidth / 40));
    const colors = [
      'rgba(255,154,139,0.12)',
      'rgba(201,167,235,0.12)',
      'rgba(255,209,201,0.10)',
      'rgba(232,213,245,0.10)',
      'rgba(184,169,240,0.08)',
    ];

    for (let i = 0; i < shapeCount; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 30 + 10,
        speedX: (Math.random() - 0.5) * 0.3,
        speedY: (Math.random() - 0.5) * 0.3,
        color: colors[Math.floor(Math.random() * colors.length)],
        type: Math.random() > 0.5 ? 'circle' : 'star',
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.01,
      });
    }

    function drawStar(ctx, cx, cy, size, rotation) {
      const spikes = 5;
      const outerRadius = size;
      const innerRadius = size * 0.45;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotation);
      ctx.beginPath();
      for (let i = 0; i < spikes * 2; i++) {
        const r = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (Math.PI / spikes) * i - Math.PI / 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.closePath();
      ctx.restore();
    }

    function animate() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      for (const s of shapes) {
        s.x += s.speedX;
        s.y += s.speedY;
        s.rotation += s.rotationSpeed;

        if (s.x < -s.size) s.x = canvas.width + s.size;
        if (s.x > canvas.width + s.size) s.x = -s.size;
        if (s.y < -s.size) s.y = canvas.height + s.size;
        if (s.y > canvas.height + s.size) s.y = -s.size;

        ctx.fillStyle = s.color;
        if (s.type === 'circle') {
          ctx.beginPath();
          ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
          ctx.fill();
        } else {
          drawStar(ctx, s.x, s.y, s.size, s.rotation);
          ctx.fill();
        }
      }
      requestAnimationFrame(animate);
    }
    animate();
  }
  initParticles();

  // ---- カード 3D チルト ----
  function addTiltEffect(card) {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((y - centerY) / centerY) * -6;
      const rotateY = ((x - centerX) / centerX) * 6;
      card.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px)`;
    });

    card.addEventListener('mouseleave', () => {
      card.style.transform = '';
    });
  }

  // ---- スクロールアニメーション (Intersection Observer) ----
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
  );

  // ---- ストレージ ----
  function getViews(id) {
    return parseInt(localStorage.getItem(`views_${id}`) || '0', 10);
  }

  function addView(id) {
    const count = getViews(id) + 1;
    localStorage.setItem(`views_${id}`, count);
    return count;
  }

  function getLikes(id) {
    return parseInt(localStorage.getItem(`likes_${id}`) || '0', 10);
  }

  function isLiked(id) {
    return localStorage.getItem(`liked_${id}`) === '1';
  }

  function toggleLike(id) {
    const liked = isLiked(id);
    let count = getLikes(id);
    if (liked) {
      count = Math.max(0, count - 1);
      localStorage.removeItem(`liked_${id}`);
    } else {
      count += 1;
      localStorage.setItem(`liked_${id}`, '1');
    }
    localStorage.setItem(`likes_${id}`, count);
    return { count, liked: !liked };
  }

  // ---- 日付フォーマット ----
  function formatDate(dateStr) {
    const d = new Date(dateStr);
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }

  // ---- プレースホルダー ----
  const placeholders = ['🌸', '🌈', '🚀', '🐟', '🎨', '⭐', '🦋', '🌻', '🍀'];

  function getPlaceholder(index) {
    return placeholders[index % placeholders.length];
  }

  // ---- カード生成 ----
  function createCard(work, index) {
    const card = document.createElement('article');
    card.className = 'work-card';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', `${work.title}を見る`);

    const views = getViews(work.id);
    const likes = getLikes(work.id);
    const liked = isLiked(work.id);
    const placeholder = getPlaceholder(index);

    const imageHTML = work.image
      ? `<img src="${work.image}" alt="${work.title}" class="card-image" loading="lazy">`
      : `<span class="card-placeholder">${placeholder}</span>`;

    card.innerHTML = `
      <div class="card-image-wrapper">
        ${imageHTML}
      </div>
      <div class="card-body">
        <h2 class="card-title">${work.title}</h2>
        <p class="card-date">${formatDate(work.date)}</p>
        <div class="card-stats">
          <div class="stat-badge views-badge">
            <span class="stat-icon">👀</span>
            <span>${views}</span>
          </div>
          <button class="like-btn-fancy ${liked ? 'liked' : ''}" data-id="${work.id}" aria-label="いいね">
            <span class="like-icon">${liked ? '❤️' : '🤍'}</span>
            <span class="like-count">${likes}</span>
            <span class="like-ripple"></span>
          </button>
        </div>
      </div>
    `;

    // クリック
    card.addEventListener('click', (e) => {
      if (e.target.closest('.like-btn-fancy')) return;
      openModal(work, index);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(work, index);
      }
    });

    // いいね
    const likeBtn = card.querySelector('.like-btn-fancy');
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleLike(work.id, likeBtn);
    });

    // 3Dチルト
    addTiltEffect(card);

    // スクロールアニメーション
    observer.observe(card);

    return card;
  }

  // ---- いいね処理 ----
  function handleLike(id, button) {
    const result = toggleLike(id);

    // リップルエフェクト
    button.classList.remove('ripple');
    void button.offsetWidth;
    button.classList.add('ripple');

    // 全ボタン同期
    document.querySelectorAll(`.like-btn-fancy[data-id="${id}"]`).forEach((btn) => {
      btn.classList.toggle('liked', result.liked);
      btn.querySelector('.like-icon').textContent = result.liked ? '❤️' : '🤍';
      btn.querySelector('.like-count').textContent = result.count;
    });

    // モーダル同期
    if (modal.classList.contains('active') && modalLike.dataset.id === id) {
      modalLike.classList.toggle('liked', result.liked);
      modalLikeIcon.textContent = result.liked ? '❤️' : '🤍';
      modalLikeCount.textContent = result.count;
    }
  }

  // ---- モーダル ----
  function openModal(work, index) {
    const views = addView(work.id);
    const placeholder = getPlaceholder(index);

    if (work.image) {
      modalImage.src = work.image;
      modalImage.alt = work.title;
      modalImage.style.display = 'block';
      modalPlaceholder.textContent = '';
    } else {
      modalImage.src = '';
      modalImage.alt = '';
      modalImage.style.display = 'none';
      modalPlaceholder.textContent = placeholder;
    }

    modalTitle.textContent = work.title;
    modalDescription.textContent = work.description;
    modalDate.textContent = formatDate(work.date);
    modalViews.textContent = views;

    const likes = getLikes(work.id);
    const liked = isLiked(work.id);
    modalLike.dataset.id = work.id;
    modalLike.classList.toggle('liked', liked);
    modalLikeIcon.textContent = liked ? '❤️' : '🤍';
    modalLikeCount.textContent = likes;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // ギャラリー側の view 数更新
    document.querySelectorAll(`.like-btn-fancy[data-id="${work.id}"]`).forEach((btn) => {
      const card = btn.closest('.work-card');
      if (card) {
        const viewSpan = card.querySelector('.views-badge span:last-child');
        if (viewSpan) viewSpan.textContent = views;
      }
    });
  }

  function closeModal() {
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });

  modalLike.addEventListener('click', () => {
    handleLike(modalLike.dataset.id, modalLike);
  });

  // ---- 初期化 ----
  function init() {
    if (typeof WORKS === 'undefined' || !Array.isArray(WORKS)) return;
    WORKS.forEach((work, i) => {
      gallery.appendChild(createCard(work, i));
    });
  }

  init();
})();
