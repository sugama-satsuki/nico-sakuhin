import { describe, it, expect, beforeEach, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { initUploadForm } from '../lib/uploadForm.js';
import { buildIssueUrl } from '../lib/upload.js';

const FIXTURE = `
  <button id="uploadTrigger" class="upload-trigger" aria-expanded="false" aria-controls="uploadPanel">さくひんをおくる</button>
  <div id="uploadPanel" class="modal-overlay upload-overlay" role="dialog" aria-modal="true" aria-hidden="true">
    <div class="modal-content upload-content">
      <button id="uploadClose" class="modal-close" aria-label="閉じる">×</button>
      <form id="uploadForm" class="upload-form" novalidate>
        <input id="uploadTitle" name="title" type="text" maxlength="30">
        <p id="uploadTitleCounter"></p>
        <textarea id="uploadDescription" name="description" maxlength="200"></textarea>
        <p id="uploadDescriptionCounter"></p>
        <input id="uploadDate" name="date" type="date">
        <ul id="uploadErrors" role="alert" hidden></ul>
        <button id="uploadSubmit" type="submit">GitHub にすすむ</button>
      </form>
      <p id="uploadStatus" role="status" hidden></p>
    </div>
  </div>
`;

const TODAY = new Date(2026, 2, 22);

function setup() {
  document.body.innerHTML = FIXTURE;
  const openUrl = vi.fn();
  const api = initUploadForm({ openUrl, now: () => TODAY });
  return {
    api,
    openUrl,
    trigger: document.getElementById('uploadTrigger'),
    panel: document.getElementById('uploadPanel'),
    form: document.getElementById('uploadForm'),
    titleInput: document.getElementById('uploadTitle'),
    descInput: document.getElementById('uploadDescription'),
    dateInput: document.getElementById('uploadDate'),
    errors: document.getElementById('uploadErrors'),
    status: document.getElementById('uploadStatus'),
    closeBtn: document.getElementById('uploadClose'),
  };
}

function fillValid({ titleInput, descInput, dateInput }) {
  titleInput.value = 'おひさまとおはな';
  descInput.value = 'おひさまがにこにこ';
  dateInput.value = '2026-03-22';
}

describe('initUploadForm - 初期状態', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('パネルは閉じた状態で始まる', () => {
    const { panel, trigger } = setup();
    expect(panel.classList.contains('active')).toBe(false);
    expect(panel.getAttribute('aria-hidden')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
  });

  it('必要な要素がない場合はnullを返し、例外を投げない', () => {
    document.body.innerHTML = '<div></div>';
    expect(() => initUploadForm({ openUrl: vi.fn(), now: () => TODAY })).not.toThrow();
    expect(initUploadForm({ openUrl: vi.fn(), now: () => TODAY })).toBeNull();
  });
});

describe('initUploadForm - 開閉', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('「さくひんをおくる」を押すとパネルが開く', () => {
    const { trigger, panel } = setup();
    trigger.click();
    expect(panel.classList.contains('active')).toBe(true);
    expect(panel.getAttribute('aria-hidden')).toBe('false');
    expect(trigger.getAttribute('aria-expanded')).toBe('true');
  });

  it('開くとつくったひに今日の日付が入る', () => {
    const { trigger, dateInput } = setup();
    trigger.click();
    expect(dateInput.value).toBe('2026-03-22');
  });

  it('開くとつくったひの上限が今日になる（未来を選べない）', () => {
    const { trigger, dateInput } = setup();
    trigger.click();
    expect(dateInput.getAttribute('max')).toBe('2026-03-22');
  });

  it('開くとタイトル入力にフォーカスが移る', () => {
    const { trigger, titleInput } = setup();
    trigger.click();
    expect(document.activeElement).toBe(titleInput);
  });

  it('閉じるボタンで閉じる', () => {
    const { trigger, closeBtn, panel } = setup();
    trigger.click();
    closeBtn.click();
    expect(panel.classList.contains('active')).toBe(false);
    expect(panel.getAttribute('aria-hidden')).toBe('true');
  });

  it('背景（オーバーレイ）のクリックで閉じる', () => {
    const { trigger, panel } = setup();
    trigger.click();
    panel.click();
    expect(panel.classList.contains('active')).toBe(false);
  });

  it('パネル内側のクリックでは閉じない', () => {
    const { trigger, panel } = setup();
    trigger.click();
    panel.querySelector('.upload-content').click();
    expect(panel.classList.contains('active')).toBe(true);
  });

  it('Escapeキーで閉じる', () => {
    const { trigger, panel } = setup();
    trigger.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(panel.classList.contains('active')).toBe(false);
  });

  it('最後の要素からTabでパネルの先頭に戻る（背景に抜けない）', () => {
    const { trigger, panel } = setup();
    trigger.click();
    const submit = document.getElementById('uploadSubmit');
    submit.focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(panel.querySelector('#uploadClose'));
  });

  it('先頭の要素からShift+Tabでパネルの末尾に戻る', () => {
    const { trigger } = setup();
    trigger.click();
    document.getElementById('uploadClose').focus();
    const event = new KeyboardEvent('keydown', { key: 'Tab', shiftKey: true, bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement).toBe(document.getElementById('uploadSubmit'));
  });

  it('閉じているときはTabを妨げない', () => {
    setup();
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    document.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('閉じたときフォーカスがトリガーに戻る', () => {
    const { trigger, closeBtn } = setup();
    trigger.click();
    closeBtn.click();
    expect(document.activeElement).toBe(trigger);
  });

  it('閉じると入力内容とエラー表示がリセットされる', () => {
    const s = setup();
    s.trigger.click();
    s.titleInput.value = 'のこるかな';
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    s.closeBtn.click();
    s.trigger.click();
    expect(s.titleInput.value).toBe('');
    expect(s.descInput.value).toBe('');
    expect(s.errors.hidden).toBe(true);
    expect(s.status.hidden).toBe(true);
  });
});

describe('initUploadForm - 入力チェック', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('タイトルが空のまま送るとエラーが表示され、GitHubは開かない', () => {
    const s = setup();
    s.trigger.click();
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(s.openUrl).not.toHaveBeenCalled();
    expect(s.errors.hidden).toBe(false);
    expect(s.errors.textContent).toContain('タイトル');
  });

  it('エラー時はパネルが開いたままになる', () => {
    const s = setup();
    s.trigger.click();
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(s.panel.classList.contains('active')).toBe(true);
  });

  it('エラー時にタイトル入力へ aria-invalid が付く', () => {
    const s = setup();
    s.trigger.click();
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(s.titleInput.getAttribute('aria-invalid')).toBe('true');
  });

  it('エラーを直して送り直すとエラー表示が消える', () => {
    const s = setup();
    s.trigger.click();
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    fillValid(s);
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(s.errors.hidden).toBe(true);
    expect(s.titleInput.hasAttribute('aria-invalid')).toBe(false);
  });

  it('未来の日付を送るとエラーになる', () => {
    const s = setup();
    s.trigger.click();
    fillValid(s);
    s.dateInput.value = '2026-03-23';
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(s.openUrl).not.toHaveBeenCalled();
    expect(s.errors.hidden).toBe(false);
  });

  it('複数エラーはリスト項目として並ぶ', () => {
    const s = setup();
    s.trigger.click();
    s.dateInput.value = '';
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(s.errors.querySelectorAll('li').length).toBe(2);
  });

  it('エラー文はテキストとして入る（HTMLとして解釈されない）', () => {
    const s = setup();
    s.trigger.click();
    s.titleInput.value = '<img src=x onerror=alert(1)>'.repeat(3);
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(s.errors.querySelector('img')).toBeNull();
  });
});

describe('initUploadForm - 送信', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('正しく入力して送るとGitHubのissue作成URLを開く', () => {
    const s = setup();
    s.trigger.click();
    fillValid(s);
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(s.openUrl).toHaveBeenCalledTimes(1);
    expect(s.openUrl).toHaveBeenCalledWith(
      buildIssueUrl({
        title: 'おひさまとおはな',
        description: 'おひさまがにこにこ',
        date: '2026-03-22',
      })
    );
  });

  it('送信後に案内メッセージが表示される', () => {
    const s = setup();
    s.trigger.click();
    fillValid(s);
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(s.status.hidden).toBe(false);
    expect(s.status.textContent).toContain('GitHub');
  });

  it('送信でページ遷移（デフォルト動作）は起きない', () => {
    const s = setup();
    s.trigger.click();
    fillValid(s);
    const event = new Event('submit', { bubbles: true, cancelable: true });
    s.form.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });

  it('前後の空白は取り除いて送られる', () => {
    const s = setup();
    s.trigger.click();
    s.titleInput.value = '  おはな  ';
    s.descInput.value = '  すき  ';
    s.dateInput.value = '2026-03-22';
    s.form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(s.openUrl).toHaveBeenCalledWith(
      buildIssueUrl({ title: 'おはな', description: 'すき', date: '2026-03-22' })
    );
  });
});

describe('initUploadForm - 文字数カウンター', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
  });

  it('タイトル入力で残り文字数が更新される', () => {
    const s = setup();
    s.trigger.click();
    s.titleInput.value = 'あいう';
    s.titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.getElementById('uploadTitleCounter').textContent).toBe('3 / 30');
  });

  it('せつめい入力で残り文字数が更新される', () => {
    const s = setup();
    s.trigger.click();
    s.descInput.value = 'あい';
    s.descInput.dispatchEvent(new Event('input', { bubbles: true }));
    expect(document.getElementById('uploadDescriptionCounter').textContent).toBe('2 / 200');
  });

  it('開いたときカウンターが0に戻る', () => {
    const s = setup();
    s.trigger.click();
    s.titleInput.value = 'あいう';
    s.titleInput.dispatchEvent(new Event('input', { bubbles: true }));
    s.closeBtn.click();
    s.trigger.click();
    expect(document.getElementById('uploadTitleCounter').textContent).toBe('0 / 30');
  });
});

describe('index.html の配線', () => {
  // jsdom 環境では import.meta.url が file スキームにならないため、プロジェクトルートから引く
  const html = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');

  it.each([
    'uploadTrigger',
    'uploadPanel',
    'uploadClose',
    'uploadForm',
    'uploadTitle',
    'uploadTitleCounter',
    'uploadDescription',
    'uploadDescriptionCounter',
    'uploadDate',
    'uploadErrors',
    'uploadStatus',
  ])('id="%s" が index.html に存在する', (id) => {
    expect(html).toContain(`id="${id}"`);
  });

  it('パネルがダイアログとしてマークアップされている', () => {
    expect(html).toMatch(/id="uploadPanel"[^>]*role="dialog"/);
    expect(html).toMatch(/id="uploadPanel"[^>]*aria-modal="true"/);
  });

  it('入力欄にラベルが紐づいている', () => {
    expect(html).toContain('for="uploadTitle"');
    expect(html).toContain('for="uploadDescription"');
    expect(html).toContain('for="uploadDate"');
  });

  it('タイトルとせつめいに maxlength が設定されている', () => {
    expect(html).toMatch(/id="uploadTitle"[^>]*maxlength="30"/);
    expect(html).toMatch(/id="uploadDescription"[^>]*maxlength="200"/);
  });
});

describe('style.css の配線', () => {
  const css = readFileSync(resolve(process.cwd(), 'style.css'), 'utf8');

  /** セレクタに対応する宣言ブロックの中身を取り出す */
  function ruleBody(selector) {
    const start = css.indexOf(`\n${selector} {`);
    expect(start, `${selector} のルールが見つからない`).toBeGreaterThan(-1);
    const from = css.indexOf('{', start);
    return css.slice(from + 1, css.indexOf('}', from));
  }

  // jsdom はフォーカス時に visibility を見ないため、この規約はテストで固定しておく。
  // visibility をトランジションさせると、開いた直後にフォーカスを当てられなくなる。
  it('開いているパネルは visibility を遅延なしで切り替える（開いた直後にフォーカスできる）', () => {
    expect(ruleBody('.upload-overlay.active')).toMatch(/visibility\s+0s\s+linear\s+0s/);
  });

  it('閉じるときは visibility の切り替えを遅らせてフェードアウトを見せる', () => {
    expect(ruleBody('.upload-overlay')).toMatch(/visibility\s+0s\s+linear\s+0\.4s/);
  });

  // display 指定は hidden 属性の既定スタイルより強いため、打ち消さないと
  // エラーが1件もないときに空の枠が残ってしまう
  it('エラー欄は hidden 属性のときに消える', () => {
    expect(ruleBody('.upload-errors')).toMatch(/display:\s*flex/);
    expect(ruleBody('.upload-errors[hidden]')).toMatch(/display:\s*none/);
  });
});
