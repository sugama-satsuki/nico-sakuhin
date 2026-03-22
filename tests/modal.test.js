import { describe, it, expect, beforeEach } from 'vitest';
import { openModal, closeModal, getModalDOM, setGalleryElement } from '../lib/modal.js';

const SAMPLE_WORK = {
  id: 'modal-test-1',
  title: 'モーダルテスト',
  description: 'モーダル表示のテスト',
  image: '',
  date: '2026-06-15',
};

const SAMPLE_WORK_WITH_IMAGE = {
  id: 'modal-test-2',
  title: '画像モーダルテスト',
  description: '画像付きモーダルのテスト',
  image: 'images/modal-test.jpg',
  date: '2026-02-10',
};

function createModalHTML() {
  document.body.innerHTML = `
    <div class="gallery-grid" id="gallery"></div>
    <div class="modal-overlay" id="modal" aria-hidden="true">
      <div class="modal-content">
        <button class="modal-close" id="modalClose"></button>
        <div class="modal-image-wrapper">
          <img src="" alt="" id="modalImage" class="modal-image">
          <div class="modal-placeholder-bg" id="modalPlaceholder"></div>
        </div>
        <div class="modal-info">
          <h2 class="modal-title" id="modalTitle"></h2>
          <p class="modal-description" id="modalDescription"></p>
          <p class="modal-date" id="modalDate"></p>
          <div class="modal-stats">
            <div class="stat-badge views-badge">
              <span class="stat-icon">👀</span>
              <span id="modalViews">0</span>
            </div>
            <button class="like-btn-fancy" id="modalLike">
              <span class="like-icon" id="modalLikeIcon">🤍</span>
              <span class="like-count" id="modalLikeCount">0</span>
              <span class="like-ripple"></span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `;
}

describe('modal', () => {
  beforeEach(() => {
    localStorage.clear();
    createModalHTML();
    const dom = getModalDOM();
    setGalleryElement(document.getElementById('gallery'));
  });

  describe('openModal', () => {
    it('モーダルにactiveクラスが付与される', () => {
      openModal(SAMPLE_WORK, 0);
      const modal = document.getElementById('modal');
      expect(modal.classList.contains('active')).toBe(true);
    });

    it('aria-hiddenがfalseになる', () => {
      openModal(SAMPLE_WORK, 0);
      const modal = document.getElementById('modal');
      expect(modal.getAttribute('aria-hidden')).toBe('false');
    });

    it('タイトルが設定される', () => {
      openModal(SAMPLE_WORK, 0);
      expect(document.getElementById('modalTitle').textContent).toBe('モーダルテスト');
    });

    it('説明が設定される', () => {
      openModal(SAMPLE_WORK, 0);
      expect(document.getElementById('modalDescription').textContent).toBe('モーダル表示のテスト');
    });

    it('日付がフォーマットされて設定される', () => {
      openModal(SAMPLE_WORK, 0);
      expect(document.getElementById('modalDate').textContent).toBe('2026年6月15日');
    });

    it('閲覧数が1増加する', () => {
      openModal(SAMPLE_WORK, 0);
      expect(document.getElementById('modalViews').textContent).toBe('1');
      openModal(SAMPLE_WORK, 0);
      expect(document.getElementById('modalViews').textContent).toBe('2');
    });

    it('画像がない場合はimg非表示でプレースホルダー表示', () => {
      openModal(SAMPLE_WORK, 0);
      const img = document.getElementById('modalImage');
      const placeholder = document.getElementById('modalPlaceholder');
      expect(img.style.display).toBe('none');
      expect(placeholder.textContent).not.toBe('');
    });

    it('画像がある場合はimgが表示される', () => {
      openModal(SAMPLE_WORK_WITH_IMAGE, 0);
      const img = document.getElementById('modalImage');
      const placeholder = document.getElementById('modalPlaceholder');
      expect(img.style.display).toBe('block');
      expect(img.src).toContain('images/modal-test.jpg');
      expect(placeholder.textContent).toBe('');
    });

    it('bodyのoverflowがhiddenになる', () => {
      openModal(SAMPLE_WORK, 0);
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('いいね状態が反映される', () => {
      localStorage.setItem('liked_modal-test-1', '1');
      localStorage.setItem('likes_modal-test-1', '5');
      openModal(SAMPLE_WORK, 0);

      const likeBtn = document.getElementById('modalLike');
      expect(likeBtn.classList.contains('liked')).toBe(true);
      expect(document.getElementById('modalLikeCount').textContent).toBe('5');
      expect(document.getElementById('modalLikeIcon').textContent).toBe('❤️');
    });
  });

  describe('closeModal', () => {
    it('activeクラスが削除される', () => {
      openModal(SAMPLE_WORK, 0);
      closeModal();
      const modal = document.getElementById('modal');
      expect(modal.classList.contains('active')).toBe(false);
    });

    it('aria-hiddenがtrueになる', () => {
      openModal(SAMPLE_WORK, 0);
      closeModal();
      const modal = document.getElementById('modal');
      expect(modal.getAttribute('aria-hidden')).toBe('true');
    });

    it('bodyのoverflowが解除される', () => {
      openModal(SAMPLE_WORK, 0);
      closeModal();
      expect(document.body.style.overflow).toBe('');
    });
  });
});
