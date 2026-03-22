import { describe, it, expect } from 'vitest';
import { formatDate, getPlaceholder, PLACEHOLDERS } from '../lib/helpers.js';

describe('formatDate', () => {
  it('日付文字列を「YYYY年M月D日」形式にフォーマットする', () => {
    expect(formatDate('2026-03-22')).toBe('2026年3月22日');
  });

  it('1桁の月と日もそのまま表示する', () => {
    expect(formatDate('2026-01-05')).toBe('2026年1月5日');
  });

  it('12月31日を正しくフォーマットする', () => {
    expect(formatDate('2025-12-31')).toBe('2025年12月31日');
  });
});

describe('getPlaceholder', () => {
  it('インデックスに対応するプレースホルダーを返す', () => {
    expect(getPlaceholder(0)).toBe(PLACEHOLDERS[0]);
    expect(getPlaceholder(1)).toBe(PLACEHOLDERS[1]);
  });

  it('配列の長さを超えるインデックスはループする', () => {
    const len = PLACEHOLDERS.length;
    expect(getPlaceholder(len)).toBe(PLACEHOLDERS[0]);
    expect(getPlaceholder(len + 1)).toBe(PLACEHOLDERS[1]);
  });

  it('PLACEHOLDERSは空でない', () => {
    expect(PLACEHOLDERS.length).toBeGreaterThan(0);
  });
});
