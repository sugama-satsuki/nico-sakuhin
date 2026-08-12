import { describe, it, expect } from 'vitest';
import {
  GITHUB_REPO,
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  toDateString,
  validateWorkInput,
  buildIssueTitle,
  buildIssueBody,
  buildIssueUrl,
} from '../lib/upload.js';

const VALID_INPUT = {
  title: 'おひさまとおはな',
  description: 'おひさまがにこにこわらっているよ！',
  date: '2026-03-22',
};

const TODAY = '2026-03-22';

describe('toDateString', () => {
  it('Dateを「YYYY-MM-DD」形式にする', () => {
    expect(toDateString(new Date(2026, 2, 22))).toBe('2026-03-22');
  });

  it('1桁の月日をゼロ埋めする', () => {
    expect(toDateString(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  it('ローカル日付で変換する（UTCずれで前日にならない）', () => {
    // 日本時間の 0:30 は UTC ではまだ前日
    expect(toDateString(new Date(2026, 7, 12, 0, 30))).toBe('2026-08-12');
  });
});

describe('validateWorkInput', () => {
  it('正しい入力は valid になる', () => {
    const result = validateWorkInput(VALID_INPUT, { today: TODAY });
    expect(result.valid).toBe(true);
    expect(result.errors).toEqual({});
  });

  it('せつめいが空でも valid になる（任意項目）', () => {
    const result = validateWorkInput({ ...VALID_INPUT, description: '' }, { today: TODAY });
    expect(result.valid).toBe(true);
  });

  it('タイトルが空だとエラーになる', () => {
    const result = validateWorkInput({ ...VALID_INPUT, title: '' }, { today: TODAY });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeTruthy();
  });

  it('タイトルが空白だけだとエラーになる', () => {
    const result = validateWorkInput({ ...VALID_INPUT, title: '　  ' }, { today: TODAY });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeTruthy();
  });

  it(`タイトルが${MAX_TITLE_LENGTH}文字までなら valid`, () => {
    const title = 'あ'.repeat(MAX_TITLE_LENGTH);
    const result = validateWorkInput({ ...VALID_INPUT, title }, { today: TODAY });
    expect(result.valid).toBe(true);
  });

  it(`タイトルが${MAX_TITLE_LENGTH}文字を超えるとエラーになる`, () => {
    const title = 'あ'.repeat(MAX_TITLE_LENGTH + 1);
    const result = validateWorkInput({ ...VALID_INPUT, title }, { today: TODAY });
    expect(result.valid).toBe(false);
    expect(result.errors.title).toBeTruthy();
  });

  it(`せつめいが${MAX_DESCRIPTION_LENGTH}文字を超えるとエラーになる`, () => {
    const description = 'あ'.repeat(MAX_DESCRIPTION_LENGTH + 1);
    const result = validateWorkInput({ ...VALID_INPUT, description }, { today: TODAY });
    expect(result.valid).toBe(false);
    expect(result.errors.description).toBeTruthy();
  });

  it('つくったひが空だとエラーになる', () => {
    const result = validateWorkInput({ ...VALID_INPUT, date: '' }, { today: TODAY });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBeTruthy();
  });

  it('つくったひの形式が違うとエラーになる', () => {
    const result = validateWorkInput({ ...VALID_INPUT, date: '2026/03/22' }, { today: TODAY });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBeTruthy();
  });

  it('存在しない日付はエラーになる', () => {
    const result = validateWorkInput({ ...VALID_INPUT, date: '2026-02-30' }, { today: TODAY });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBeTruthy();
  });

  it('未来の日付はエラーになる', () => {
    const result = validateWorkInput({ ...VALID_INPUT, date: '2026-03-23' }, { today: TODAY });
    expect(result.valid).toBe(false);
    expect(result.errors.date).toBeTruthy();
  });

  it('今日の日付は valid', () => {
    const result = validateWorkInput({ ...VALID_INPUT, date: TODAY }, { today: TODAY });
    expect(result.valid).toBe(true);
  });

  it('複数のエラーをまとめて返す', () => {
    const result = validateWorkInput({ title: '', description: '', date: '' }, { today: TODAY });
    expect(Object.keys(result.errors).sort()).toEqual(['date', 'title']);
  });
});

describe('buildIssueTitle', () => {
  it('作品タイトルに接頭辞を付ける', () => {
    expect(buildIssueTitle('おひさまとおはな')).toBe('[さくひん] おひさまとおはな');
  });

  it('前後の空白を取り除く', () => {
    expect(buildIssueTitle('  おはな  ')).toBe('[さくひん] おはな');
  });
});

describe('buildIssueBody', () => {
  it('タイトル・せつめい・つくったひを含む', () => {
    const body = buildIssueBody(VALID_INPUT);
    expect(body).toContain('おひさまとおはな');
    expect(body).toContain('おひさまがにこにこわらっているよ！');
    expect(body).toContain('2026-03-22');
  });

  it('しゃしんの添付方法を案内する', () => {
    const body = buildIssueBody(VALID_INPUT);
    expect(body).toContain('しゃしん');
  });

  it('せつめいが空のときは「なし」と書く', () => {
    const body = buildIssueBody({ ...VALID_INPUT, description: '' });
    expect(body).toContain('なし');
  });

  it('前後の空白を取り除いて埋め込む', () => {
    const body = buildIssueBody({ title: '  おはな  ', description: '  すき  ', date: '2026-03-22' });
    expect(body).toContain('\nおはな\n');
    expect(body).toContain('\nすき\n');
  });
});

describe('buildIssueUrl', () => {
  it('リポジトリの新規issue作成URLになる', () => {
    const url = buildIssueUrl(VALID_INPUT);
    expect(url.startsWith(`https://github.com/${GITHUB_REPO}/issues/new?`)).toBe(true);
  });

  it('タイトルと本文がクエリに入る', () => {
    const url = new URL(buildIssueUrl(VALID_INPUT));
    expect(url.searchParams.get('title')).toBe(buildIssueTitle(VALID_INPUT.title));
    expect(url.searchParams.get('body')).toBe(buildIssueBody(VALID_INPUT));
  });

  it('日本語や記号がURLエンコードされる（生のスペースや#が残らない）', () => {
    const url = buildIssueUrl({ title: 'あ い #1', description: 'a&b=c', date: '2026-03-22' });
    const query = url.slice(url.indexOf('?') + 1);
    expect(query).not.toContain(' ');
    expect(query).not.toContain('#');
    // エンコード後もパースして元に戻せる
    expect(new URL(url).searchParams.get('title')).toBe('[さくひん] あ い #1');
  });

  it('リポジトリを差し替えられる', () => {
    const url = buildIssueUrl(VALID_INPUT, 'someone/other-repo');
    expect(url.startsWith('https://github.com/someone/other-repo/issues/new?')).toBe(true);
  });
});
