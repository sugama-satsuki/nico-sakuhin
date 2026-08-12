/**
 * 作品の投稿依頼を GitHub の issue として組み立てるロジック。
 *
 * このサイトは GitHub Pages の静的サイトなので、画像を受け取るサーバーがない。
 * そのため「アップロード」は、入力内容を issue にプリフィルして開き、
 * しゃしんは投稿者が issue に添付する、という流れにしている。
 */

export const GITHUB_REPO = 'sugama-satsuki/nico-sakuhin';
export const MAX_TITLE_LENGTH = 30;
export const MAX_DESCRIPTION_LENGTH = 200;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Date を（ローカル時刻基準で）「YYYY-MM-DD」にする */
export function toDateString(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 「YYYY-MM-DD」が実在する日付かどうか（2026-02-30 のような値をはじく） */
function isRealDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/**
 * 入力チェック。エラーは項目名をキーに、こどもにも読める文言で返す。
 * @returns {{ valid: boolean, errors: Record<string, string> }}
 */
export function validateWorkInput({ title = '', description = '', date = '' } = {}, options = {}) {
  const today = options.today || toDateString(new Date());
  const errors = {};

  const trimmedTitle = title.trim();
  if (!trimmedTitle) {
    errors.title = 'タイトルをいれてね';
  } else if (trimmedTitle.length > MAX_TITLE_LENGTH) {
    errors.title = `タイトルは${MAX_TITLE_LENGTH}もじまでにしてね`;
  }

  if (description.trim().length > MAX_DESCRIPTION_LENGTH) {
    errors.description = `せつめいは${MAX_DESCRIPTION_LENGTH}もじまでにしてね`;
  }

  const trimmedDate = date.trim();
  if (!trimmedDate) {
    errors.date = 'つくったひをえらんでね';
  } else if (!isRealDate(trimmedDate)) {
    errors.date = 'つくったひのかたちがちがうみたい';
  } else if (trimmedDate > today) {
    errors.date = 'つくったひは きょうまでの ひづけにしてね';
  }

  return { valid: Object.keys(errors).length === 0, errors };
}

/** issue のタイトル */
export function buildIssueTitle(title) {
  return `[さくひん] ${title.trim()}`;
}

/** issue の本文 */
export function buildIssueBody({ title = '', description = '', date = '' } = {}) {
  const desc = description.trim() || 'なし';
  return [
    '## タイトル',
    title.trim(),
    '',
    '## せつめい',
    desc,
    '',
    '## つくったひ',
    date.trim(),
    '',
    '---',
    '',
    '### しゃしんのつけかた',
    'この下のコメントらんに、さくひんのしゃしんをドラッグ＆ドロップしてね！',
    '',
    '<!-- この本文は「にこのさくひん」の投稿フォームから作られました -->',
    '',
  ].join('\n');
}

/** プリフィル済みの「新しい issue を作る」ページの URL */
export function buildIssueUrl(input, repo = GITHUB_REPO) {
  const params = new URLSearchParams({
    title: buildIssueTitle(input.title || ''),
    body: buildIssueBody(input),
  });
  return `https://github.com/${repo}/issues/new?${params.toString()}`;
}
