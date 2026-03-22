import { describe, it, expect, beforeEach } from 'vitest';
import { getViews, addView, getLikes, isLiked, toggleLike } from '../lib/storage.js';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getViews', () => {
    it('未閲覧の作品は0を返す', () => {
      expect(getViews('work-1')).toBe(0);
    });

    it('保存済みの閲覧数を返す', () => {
      localStorage.setItem('views_work-1', '5');
      expect(getViews('work-1')).toBe(5);
    });

    it('不正な値は0として扱う', () => {
      localStorage.setItem('views_work-1', 'abc');
      expect(getViews('work-1')).toBe(0);
    });
  });

  describe('addView', () => {
    it('閲覧数を1増やして返す', () => {
      expect(addView('work-1')).toBe(1);
      expect(addView('work-1')).toBe(2);
      expect(addView('work-1')).toBe(3);
    });

    it('localStorageに保存される', () => {
      addView('work-1');
      expect(localStorage.getItem('views_work-1')).toBe('1');
    });
  });

  describe('getLikes', () => {
    it('いいねがない作品は0を返す', () => {
      expect(getLikes('work-1')).toBe(0);
    });

    it('保存済みのいいね数を返す', () => {
      localStorage.setItem('likes_work-1', '10');
      expect(getLikes('work-1')).toBe(10);
    });
  });

  describe('isLiked', () => {
    it('いいねしていなければfalse', () => {
      expect(isLiked('work-1')).toBe(false);
    });

    it('いいね済みならtrue', () => {
      localStorage.setItem('liked_work-1', '1');
      expect(isLiked('work-1')).toBe(true);
    });

    it('値が"1"以外ならfalse', () => {
      localStorage.setItem('liked_work-1', '0');
      expect(isLiked('work-1')).toBe(false);
    });
  });

  describe('toggleLike', () => {
    it('未いいねの作品をいいねする', () => {
      const result = toggleLike('work-1');
      expect(result).toEqual({ count: 1, liked: true });
      expect(localStorage.getItem('liked_work-1')).toBe('1');
      expect(localStorage.getItem('likes_work-1')).toBe('1');
    });

    it('いいね済みの作品のいいねを取り消す', () => {
      localStorage.setItem('liked_work-1', '1');
      localStorage.setItem('likes_work-1', '3');

      const result = toggleLike('work-1');
      expect(result).toEqual({ count: 2, liked: false });
      expect(localStorage.getItem('liked_work-1')).toBeNull();
      expect(localStorage.getItem('likes_work-1')).toBe('2');
    });

    it('いいね数は0未満にならない', () => {
      localStorage.setItem('liked_work-1', '1');
      localStorage.setItem('likes_work-1', '0');

      const result = toggleLike('work-1');
      expect(result).toEqual({ count: 0, liked: false });
    });

    it('連続トグルで元に戻る', () => {
      toggleLike('work-1');
      const result = toggleLike('work-1');
      expect(result).toEqual({ count: 0, liked: false });
    });
  });
});
