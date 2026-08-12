import { addView, getLikes, isLiked } from './storage.js';
import { formatDate, getPlaceholder } from './helpers.js';

let modal, modalImage, modalPlaceholder, modalTitle, modalDescription;
let modalDate, modalViews, modalLike, modalLikeIcon, modalLikeCount;
let galleryEl;

export function getModalDOM() {
  modal = document.getElementById('modal');
  modalImage = document.getElementById('modalImage');
  modalPlaceholder = document.getElementById('modalPlaceholder');
  modalTitle = document.getElementById('modalTitle');
  modalDescription = document.getElementById('modalDescription');
  modalDate = document.getElementById('modalDate');
  modalViews = document.getElementById('modalViews');
  modalLike = document.getElementById('modalLike');
  modalLikeIcon = document.getElementById('modalLikeIcon');
  modalLikeCount = document.getElementById('modalLikeCount');
  return { modal, modalImage, modalPlaceholder, modalTitle, modalDescription, modalDate, modalViews, modalLike, modalLikeIcon, modalLikeCount };
}

export function setGalleryElement(el) {
  galleryEl = el;
}

export function openModal(work, index) {
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

  if (galleryEl) {
    galleryEl.querySelectorAll(`.like-btn-fancy[data-id="${work.id}"]`).forEach((btn) => {
      const card = btn.closest('.work-card');
      if (card) {
        const viewSpan = card.querySelector('.views-badge span:last-child');
        if (viewSpan) viewSpan.textContent = views;
      }
    });
  }
}

export function closeModal() {
  modal.classList.remove('active');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
