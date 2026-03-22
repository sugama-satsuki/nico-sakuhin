import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createCard } from '../lib/gallery.js';

const SAMPLE_WORK = {
  id: 'test-1',
  title: 'テスト作品',
  description: 'テスト説明文',
  image: '',
  date: '2026-03-22',
};

const SAMPLE_WORK_WITH_IMAGE = {
  id: 'test-2',
  title: '画像あり作品',
  description: '画像付きの作品です',
  image: 'images/test.jpg',
  date: '2026-01-15',
};

describe('createCard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('article要素を生成する', () => {
    const card = createCard(SAMPLE_WORK, 0);
    expect(card.tagName).toBe('ARTICLE');
  });

  it('work-cardクラスを持つ', () => {
    const card = createCard(SAMPLE_WORK, 0);
    expect(card.classList.contains('work-card')).toBe(true);
  });

  it('アクセシビリティ属性が設定される', () => {
    const card = createCard(SAMPLE_WORK, 0);
    expect(card.getAttribute('role')).toBe('button');
    expect(card.getAttribute('tabindex')).toBe('0');
    expect(card.getAttribute('aria-label')).toBe('テスト作品を見る');
  });

  it('タイトルが表示される', () => {
    const card = createCard(SAMPLE_WORK, 0);
    const title = card.querySelector('.card-title');
    expect(title.textContent).toBe('テスト作品');
  });

  it('日付がフォーマットされて表示される', () => {
    const card = createCard(SAMPLE_WORK, 0);
    const date = card.querySelector('.card-date');
    expect(date.textContent).toBe('2026年3月22日');
  });

  it('画像がない場合はプレースホルダーが表示される', () => {
    const card = createCard(SAMPLE_WORK, 0);
    const placeholder = card.querySelector('.card-placeholder');
    expect(placeholder).not.toBeNull();
    expect(card.querySelector('.card-image')).toBeNull();
  });

  it('画像がある場合はimg要素が表示される', () => {
    const card = createCard(SAMPLE_WORK_WITH_IMAGE, 0);
    const img = card.querySelector('.card-image');
    expect(img).not.toBeNull();
    expect(img.getAttribute('src')).toBe('images/test.jpg');
    expect(img.getAttribute('alt')).toBe('画像あり作品');
    expect(card.querySelector('.card-placeholder')).toBeNull();
  });

  it('閲覧数が表示される', () => {
    localStorage.setItem('views_test-1', '42');
    const card = createCard(SAMPLE_WORK, 0);
    const viewsBadge = card.querySelector('.views-badge');
    expect(viewsBadge.textContent).toContain('42');
  });

  it('いいね数が表示される', () => {
    localStorage.setItem('likes_test-1', '7');
    const card = createCard(SAMPLE_WORK, 0);
    const likeCount = card.querySelector('.like-count');
    expect(likeCount.textContent).toBe('7');
  });

  it('いいね済みの場合likedクラスが付く', () => {
    localStorage.setItem('liked_test-1', '1');
    localStorage.setItem('likes_test-1', '1');
    const card = createCard(SAMPLE_WORK, 0);
    const likeBtn = card.querySelector('.like-btn-fancy');
    expect(likeBtn.classList.contains('liked')).toBe(true);
  });

  it('未いいねの場合likedクラスが付かない', () => {
    const card = createCard(SAMPLE_WORK, 0);
    const likeBtn = card.querySelector('.like-btn-fancy');
    expect(likeBtn.classList.contains('liked')).toBe(false);
  });

  it('いいねボタンにdata-idが設定される', () => {
    const card = createCard(SAMPLE_WORK, 0);
    const likeBtn = card.querySelector('.like-btn-fancy');
    expect(likeBtn.dataset.id).toBe('test-1');
  });
});
