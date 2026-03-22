(() => {
  const gallery = document.getElementById('gallery');
  const modal = document.getElementById('modal');
  const modalImage = document.getElementById('modalImage');
  const modalTitle = document.getElementById('modalTitle');
  const modalDescription = document.getElementById('modalDescription');
  const modalDate = document.getElementById('modalDate');
  const modalViews = document.getElementById('modalViews');
  const modalLike = document.getElementById('modalLike');
  const modalLikeCount = document.getElementById('modalLikeCount');
  const modalClose = document.getElementById('modalClose');

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

  // ---- プレースホルダー絵文字 ----
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

    const imageHTML = work.image
      ? `<img src="${work.image}" alt="${work.title}" class="card-image" loading="lazy">`
      : `<span class="card-placeholder">${getPlaceholder(index)}</span>`;

    card.innerHTML = `
      <div class="card-image-wrapper">
        ${imageHTML}
      </div>
      <div class="card-body">
        <h2 class="card-title">${work.title}</h2>
        <p class="card-date">${formatDate(work.date)}</p>
        <div class="card-stats">
          <span class="stat-views">👀 ${views}</span>
          <button class="like-button ${liked ? 'liked' : ''}" data-id="${work.id}" aria-label="いいね">
            <span class="like-icon">${liked ? '❤️' : '🤍'}</span>
            <span class="like-count">${likes}</span>
          </button>
        </div>
      </div>
    `;

    // カードクリックでモーダル表示
    card.addEventListener('click', (e) => {
      if (e.target.closest('.like-button')) return;
      openModal(work, index);
    });

    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(work, index);
      }
    });

    // カード内のいいねボタン
    const likeBtn = card.querySelector('.like-button');
    likeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      handleLike(work.id, likeBtn);
    });

    return card;
  }

  // ---- いいね処理 ----
  function handleLike(id, button) {
    const result = toggleLike(id);
    button.classList.toggle('liked', result.liked);
    button.querySelector('.like-icon').textContent = result.liked ? '❤️' : '🤍';
    button.querySelector('.like-count').textContent = result.count;

    // モーダルのいいねも同期
    if (modal.classList.contains('active') && modalLike.dataset.id === id) {
      modalLike.classList.toggle('liked', result.liked);
      modalLike.querySelector('.like-icon').textContent = result.liked ? '❤️' : '🤍';
      modalLikeCount.textContent = result.count;
    }

    // ギャラリーカードのいいねも同期
    document.querySelectorAll(`.like-button[data-id="${id}"]`).forEach((btn) => {
      btn.classList.toggle('liked', result.liked);
      btn.querySelector('.like-icon').textContent = result.liked ? '❤️' : '🤍';
      btn.querySelector('.like-count').textContent = result.count;
    });
  }

  // ---- モーダル ----
  function openModal(work, index) {
    const views = addView(work.id);

    if (work.image) {
      modalImage.src = work.image;
      modalImage.alt = work.title;
      modalImage.style.display = 'block';
    } else {
      modalImage.src = '';
      modalImage.alt = '';
      modalImage.style.display = 'none';
    }

    modalTitle.textContent = work.title;
    modalDescription.textContent = work.description;
    modalDate.textContent = formatDate(work.date);
    modalViews.textContent = `👀 ${views}`;

    const likes = getLikes(work.id);
    const liked = isLiked(work.id);
    modalLike.dataset.id = work.id;
    modalLike.classList.toggle('liked', liked);
    modalLike.querySelector('.like-icon').textContent = liked ? '❤️' : '🤍';
    modalLikeCount.textContent = likes;

    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';

    // ギャラリーのview数も更新
    const cards = gallery.querySelectorAll('.work-card');
    cards.forEach((card) => {
      const btn = card.querySelector(`.like-button[data-id="${work.id}"]`);
      if (btn) {
        const viewSpan = card.querySelector('.stat-views');
        if (viewSpan) viewSpan.textContent = `👀 ${views}`;
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

  // モーダルのいいね
  modalLike.addEventListener('click', () => {
    const id = modalLike.dataset.id;
    handleLike(id, modalLike);
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
