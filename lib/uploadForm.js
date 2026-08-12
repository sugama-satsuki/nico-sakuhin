import {
  MAX_TITLE_LENGTH,
  MAX_DESCRIPTION_LENGTH,
  toDateString,
  validateWorkInput,
  buildIssueUrl,
} from './upload.js';

/** エラーを並べる順番（入力欄の並びと合わせる） */
const FIELD_ORDER = ['title', 'description', 'date'];

/** フォーカストラップの対象 */
const FOCUSABLE = 'button, input, textarea, select, a[href], [tabindex]:not([tabindex="-1"])';

/**
 * 作品投稿フォームを配線する。
 *
 * @param {object} [deps]
 * @param {(url: string) => void} [deps.openUrl] URL を開く処理（テストで差し替える）
 * @param {() => Date} [deps.now] 今日の日付（テストで差し替える）
 * @param {string} [deps.repo] issue を立てるリポジトリ
 * @returns {{ open: () => void, close: () => void, isOpen: () => boolean } | null}
 *          必要な要素が見つからないときは null
 */
export function initUploadForm(deps = {}) {
  const openUrl = deps.openUrl || ((url) => window.open(url, '_blank', 'noopener,noreferrer'));
  const now = deps.now || (() => new Date());

  const trigger = document.getElementById('uploadTrigger');
  const panel = document.getElementById('uploadPanel');
  const form = document.getElementById('uploadForm');
  const closeBtn = document.getElementById('uploadClose');
  const titleInput = document.getElementById('uploadTitle');
  const descInput = document.getElementById('uploadDescription');
  const dateInput = document.getElementById('uploadDate');
  const errorList = document.getElementById('uploadErrors');
  const statusEl = document.getElementById('uploadStatus');
  const titleCounter = document.getElementById('uploadTitleCounter');
  const descCounter = document.getElementById('uploadDescriptionCounter');

  const required = [trigger, panel, form, closeBtn, titleInput, descInput, dateInput, errorList, statusEl];
  if (required.some((el) => !el)) return null;

  const fields = { title: titleInput, description: descInput, date: dateInput };

  function updateCounter(input, counter, max) {
    if (counter) counter.textContent = `${input.value.length} / ${max}`;
  }

  function clearErrors() {
    errorList.textContent = '';
    errorList.hidden = true;
    Object.values(fields).forEach((el) => el.removeAttribute('aria-invalid'));
  }

  function showErrors(errors) {
    errorList.textContent = '';
    Object.values(fields).forEach((el) => el.removeAttribute('aria-invalid'));

    FIELD_ORDER.forEach((name) => {
      const message = errors[name];
      if (!message) return;
      const item = document.createElement('li');
      item.textContent = message;
      errorList.appendChild(item);
      fields[name].setAttribute('aria-invalid', 'true');
    });

    errorList.hidden = false;
    const firstInvalid = FIELD_ORDER.map((name) => (errors[name] ? fields[name] : null)).find(Boolean);
    if (firstInvalid) firstInvalid.focus();
  }

  function reset() {
    form.reset();
    clearErrors();
    statusEl.textContent = '';
    statusEl.hidden = true;

    const today = toDateString(now());
    dateInput.value = today;
    dateInput.setAttribute('max', today);

    updateCounter(titleInput, titleCounter, MAX_TITLE_LENGTH);
    updateCounter(descInput, descCounter, MAX_DESCRIPTION_LENGTH);
  }

  // Escape / Tab は document で拾うため、パネルが DOM から外れている場合は反応しない
  function isOpen() {
    return panel.isConnected && panel.classList.contains('active');
  }

  function open() {
    reset();
    panel.classList.add('active');
    panel.setAttribute('aria-hidden', 'false');
    trigger.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';

    // visibility が visible として計算されるまでフォーカスを受け取れないので、
    // レイアウトを読んでスタイル計算を確定させてから当てる
    void panel.offsetWidth;
    titleInput.focus();
  }

  function close() {
    panel.classList.remove('active');
    panel.setAttribute('aria-hidden', 'true');
    trigger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    reset();
    trigger.focus();
  }

  /** aria-modal を名乗っているので、Tab がパネルの外へ抜けないようにする */
  function trapTab(e) {
    const items = Array.from(panel.querySelectorAll(FOCUSABLE)).filter((el) => !el.disabled && !el.hidden);
    if (items.length === 0) return;

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    const outside = !panel.contains(active);

    if (e.shiftKey && (outside || active === first)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (outside || active === last)) {
      e.preventDefault();
      first.focus();
    }
  }

  function submit() {
    const input = {
      title: titleInput.value.trim(),
      description: descInput.value.trim(),
      date: dateInput.value.trim(),
    };

    const { valid, errors } = validateWorkInput(input, { today: toDateString(now()) });
    if (!valid) {
      statusEl.textContent = '';
      statusEl.hidden = true;
      showErrors(errors);
      return;
    }

    clearErrors();
    openUrl(buildIssueUrl(input, deps.repo));
    statusEl.textContent = 'GitHub のページをひらいたよ！そこにしゃしんをつけて「Create」をおしてね。';
    statusEl.hidden = false;
  }

  trigger.addEventListener('click', open);
  closeBtn.addEventListener('click', close);

  panel.addEventListener('click', (e) => {
    if (e.target === panel) close();
  });

  document.addEventListener('keydown', (e) => {
    if (!isOpen()) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') trapTab(e);
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submit();
  });

  titleInput.addEventListener('input', () => updateCounter(titleInput, titleCounter, MAX_TITLE_LENGTH));
  descInput.addEventListener('input', () => updateCounter(descInput, descCounter, MAX_DESCRIPTION_LENGTH));

  updateCounter(titleInput, titleCounter, MAX_TITLE_LENGTH);
  updateCounter(descInput, descCounter, MAX_DESCRIPTION_LENGTH);

  return { open, close, isOpen };
}
