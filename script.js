import { getViews, getLikes, isLiked, toggleLike } from './lib/storage.js';
import { formatDate, getPlaceholder } from './lib/helpers.js';
import { createCard } from './lib/gallery.js';
import { openModal, closeModal, getModalDOM, setGalleryElement } from './lib/modal.js';

(() => {
  const gallery = document.getElementById('gallery');
  const { modal, modalLike, modalLikeIcon, modalLikeCount } = getModalDOM();
  const modalClose = document.getElementById('modalClose');
  setGalleryElement(gallery);

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

  // ---- スクロールアニメーション ----
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

  // ---- いいね処理 ----
  function handleLike(id, button) {
    const result = toggleLike(id);

    button.classList.remove('ripple');
    void button.offsetWidth;
    button.classList.add('ripple');

    document.querySelectorAll(`.like-btn-fancy[data-id="${id}"]`).forEach((btn) => {
      btn.classList.toggle('liked', result.liked);
      btn.querySelector('.like-icon').textContent = result.liked ? '❤️' : '🤍';
      btn.querySelector('.like-count').textContent = result.count;
    });

    if (modal.classList.contains('active') && modalLike.dataset.id === id) {
      modalLike.classList.toggle('liked', result.liked);
      modalLikeIcon.textContent = result.liked ? '❤️' : '🤍';
      modalLikeCount.textContent = result.count;
    }
  }

  // ---- モーダルイベント ----
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
      const card = createCard(work, i);

      card.addEventListener('click', (e) => {
        if (e.target.closest('.like-btn-fancy')) return;
        openModal(work, i);
      });

      card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openModal(work, i);
        }
      });

      const likeBtn = card.querySelector('.like-btn-fancy');
      likeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        handleLike(work.id, likeBtn);
      });

      addTiltEffect(card);
      observer.observe(card);
      gallery.appendChild(card);
    });
  }

  init();
})();
