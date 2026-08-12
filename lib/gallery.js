import { getViews, getLikes, isLiked } from './storage.js';
import { formatDate, getPlaceholder } from './helpers.js';

export function createCard(work, index) {
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

  return card;
}
