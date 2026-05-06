// ── 定数 ──────────────────────────────────────────────
const STORAGE_KEY            = "bedtime";
const STORAGE_KEY_THEME      = "themeMode";
const STORAGE_KEY_DARK_START  = "darkStart";
const STORAGE_KEY_LIGHT_START = "lightStart";

const DEFAULT_BEDTIME     = "01:00";
const DEFAULT_THEME_MODE  = "auto";
const DEFAULT_DARK_START  = "19:00"; // ライト→ダークに切り替わる時刻
const DEFAULT_LIGHT_START = "06:00"; // ダーク→ライトに切り替わる時刻

const GRACE_HOURS = 6; // 就寝時刻を過ぎてから「早く寝ましょう」を表示し続ける時間（時間単位）

// ── グローバル変数 ────────────────────────────────────
let bedtime, themeMode, darkStart, lightStart;

// ── 設定の読み書き ────────────────────────────────────

/**
 * localStorage から全設定を読み込み、グローバル変数にセットする。
 * 未設定の場合はそれぞれのデフォルト値を使う。
 */
function loadSettings() {
  bedtime    = localStorage.getItem(STORAGE_KEY)             || DEFAULT_BEDTIME;
  themeMode  = localStorage.getItem(STORAGE_KEY_THEME)       || DEFAULT_THEME_MODE;
  darkStart  = localStorage.getItem(STORAGE_KEY_DARK_START)  || DEFAULT_DARK_START;
  lightStart = localStorage.getItem(STORAGE_KEY_LIGHT_START) || DEFAULT_LIGHT_START;
}

/**
 * 設定パネルの入力値を localStorage に保存し、設定パネルを閉じる。
 * グローバル変数も即座に更新する。
 */
function saveSettings() {
  const input = document.getElementById("time-input");
  if (!input.value) return;

  // 就寝時刻を保存
  bedtime = input.value;
  localStorage.setItem(STORAGE_KEY, bedtime);

  // テーマモードを保存
  const selectedTheme = document.querySelector('input[name="theme-mode"]:checked');
  if (selectedTheme) {
    themeMode = selectedTheme.value;
    localStorage.setItem(STORAGE_KEY_THEME, themeMode);
  }

  // 自動切替時刻を保存（入力値がある場合のみ）
  const darkStartInput  = document.getElementById("dark-start-input");
  const lightStartInput = document.getElementById("light-start-input");
  if (darkStartInput.value) {
    darkStart = darkStartInput.value;
    localStorage.setItem(STORAGE_KEY_DARK_START, darkStart);
  }
  if (lightStartInput.value) {
    lightStart = lightStartInput.value;
    localStorage.setItem(STORAGE_KEY_LIGHT_START, lightStart);
  }

  toggleSettings(); // パネルを閉じる
}

// ── 時刻計算 ──────────────────────────────────────────

/**
 * 現在時刻から就寝時刻までの残り秒数を返す。
 *
 * 3つの状態を区別する：
 *   A. 就寝時刻より前          → 正の値（カウントダウン）
 *   B. 就寝時刻〜+GRACE_HOURS  → -1（「早く寝ましょう」表示）
 *   C. 就寝時刻+GRACE_HOURS 以降 → 正の値（翌日へのカウントダウン）
 *
 * @param {string} bedtime - "HH:MM" 形式の就寝時刻
 * @returns {number} 残り秒数。-1 は警告表示を意味する
 */
function calcRemaining(bedtime) {
  const now = new Date();

  // 就寝時刻を「今日の日付」で Date オブジェクト化
  const [hours, minutes] = bedtime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  // 猶予期間の終了時刻（就寝時刻 + GRACE_HOURS）
  // setHours に 24 以上を渡すと自動で翌日扱いになるため日付計算は不要
  const graceEnd = new Date(target);
  graceEnd.setHours(graceEnd.getHours() + GRACE_HOURS);

  if (now < target) {
    // A: まだ就寝時刻前 → 残り秒数を返す
    return Math.floor((target - now) / 1000);
  } else if (now < graceEnd) {
    // B: 就寝時刻を過ぎたが猶予期間中 → 警告フラグとして -1 を返す
    return -1;
  } else {
    // C: 猶予期間も終了 → 翌日の就寝時刻までカウントダウン再開
    target.setDate(target.getDate() + 1);
    return Math.floor((target - now) / 1000);
  }
}

/**
 * 秒数を { hours, minutes, seconds } に分解する。
 *
 * @param {number} totalSeconds
 * @returns {{ hours: number, minutes: number, seconds: number }}
 */
function formatTime(totalSeconds) {
  const hours   = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return { hours, minutes, seconds };
}

/**
 * 数値を2桁ゼロ埋めの文字列に変換する（例: 3 → "03"）。
 *
 * @param {number} n
 * @returns {string}
 */
function pad(n) {
  return String(n).padStart(2, "0");
}

// ── テーマ判定 ────────────────────────────────────────

/**
 * 現在ダークモードにすべきかどうかを返す。
 *
 * - themeMode が "dark"  → 常に true
 * - themeMode が "light" → 常に false
 * - themeMode が "auto"  → darkStart/lightStart と現在時刻を分単位で比較して判定
 *
 * @returns {boolean} true = ダーク、false = ライト
 */
function getCurrentIsDark() {
  if (themeMode === "dark")  return true;
  if (themeMode === "light") return false;

  // auto: 現在時刻を分単位に変換して darkStart/lightStart と比較
  const now    = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  const [darkH,  darkM]  = darkStart.split(":").map(Number);
  const [lightH, lightM] = lightStart.split(":").map(Number);
  const darkMin  = darkH  * 60 + darkM;
  const lightMin = lightH * 60 + lightM;

  // darkMin > lightMin なら日付をまたぐ範囲（例: dark=19:00〜light=06:00）
  // darkMin < lightMin なら同日内の範囲（例: dark=06:00〜light=19:00）
  if (darkMin > lightMin) {
    return nowMin >= darkMin || nowMin < lightMin;
  } else {
    return nowMin >= darkMin && nowMin < lightMin;
  }
}

// ── 画面の更新 ────────────────────────────────────────

/**
 * カウントダウン数字と就寝予定時刻の表示を更新する。
 * 就寝時刻を過ぎていたら警告メッセージに切り替える。
 * テーマに応じてネオン緑（ダーク）か Rails 赤（ライト）かを切り替える。
 *
 * @param {string} bedtime - "HH:MM" 形式の就寝時刻
 */
function updateDisplay(bedtime) {
  const remaining    = calcRemaining(bedtime);
  const countdownEl  = document.getElementById("countdown");
  const labelEl      = document.getElementById("label-remaining");
  const targetEl     = document.getElementById("target-display");

  // 就寝時刻の表示文字列（例: "01:00" → "AM 1:00"）
  const [h, m] = bedtime.split(":").map(Number);
  const ampm   = h < 12 ? "AM" : "PM";
  const h12    = h % 12 === 0 ? 12 : h % 12;
  targetEl.textContent = `就寝予定: ${ampm} ${h12}:${pad(m)}`;

  // 現在のテーマを取得
  const isDark = getCurrentIsDark();

  if (remaining <= 0) {
    // 就寝時刻を過ぎている場合（警告はテーマに関係なくオレンジ発光のまま）
    countdownEl.className = "neon-warn font-mono font-bold select-none";
    countdownEl.innerHTML = `<span class="countdown-warn-text">早く寝ましょう🌙</span>`;
    labelEl.textContent = "";
  } else {
    // カウントダウン表示
    // ダーク: 緑ネオン（.neon）  ライト: Rails 赤（.light-countdown）
    const colorClass = isDark ? "neon" : "light-countdown";
    const { hours, minutes, seconds } = formatTime(remaining);
    countdownEl.className = `${colorClass} font-mono font-bold select-none`;
    countdownEl.innerHTML = `
      <div class="flex items-end gap-[2vw]">
        <span class="countdown-num">${pad(hours)}</span>
        <span class="countdown-unit opacity-60">時間</span>
        <span class="countdown-num">${pad(minutes)}</span>
        <span class="countdown-unit opacity-60">分</span>
        <span class="countdown-num">${pad(seconds)}</span>
        <span class="countdown-unit opacity-60">秒</span>
      </div>
    `;
    labelEl.textContent = "就寝まで残り";
  }
}

/**
 * themeMode と darkStart/lightStart にもとづいて
 * body の背景色とテキスト色を切り替える。
 */
function applyTheme() {
  const isDark = getCurrentIsDark();
  const body   = document.getElementById("app");

  // 既存の bg-* / text-* クラスをいったん除去してから付け直す
  body.className = body.className
    .replace(/bg-\S+/g, "")
    .replace(/text-\S+/g, "")
    .trim();

  if (isDark) {
    // ダークモード: 黒背景・白テキスト
    body.classList.add(
      "bg-gray-950", "text-white",
      "min-h-screen", "flex", "flex-col", "items-center", "justify-center", "transition-colors", "duration-1000"
    );
  } else {
    // ライトモード: 水色背景・濃いグレーテキスト
    body.classList.add(
      "bg-sky-100", "text-gray-800",
      "min-h-screen", "flex", "flex-col", "items-center", "justify-center", "transition-colors", "duration-1000"
    );
  }
}

// ── 設定パネルの開閉 ──────────────────────────────────

/**
 * 設定パネルの表示/非表示を切り替える。
 * CSS の hidden / visible クラスを付け替えてアニメーションさせる。
 */
function toggleSettings() {
  const panel    = document.getElementById("settings-panel");
  const isHidden = panel.classList.contains("hidden");

  if (isHidden) {
    // 表示するとき: hidden を外して visible を付ける
    panel.classList.remove("hidden");
    panel.classList.add("visible");

    // 各入力欄に現在の設定値をセット
    document.getElementById("time-input").value        = bedtime;
    document.getElementById("dark-start-input").value  = darkStart;
    document.getElementById("light-start-input").value = lightStart;
    const radio = document.querySelector(`input[name="theme-mode"][value="${themeMode}"]`);
    if (radio) radio.checked = true;

    // 切替時刻欄の有効/無効を反映
    updateThemeInputsState();
  } else {
    // 非表示にするとき: visible を外して hidden を付ける
    panel.classList.remove("visible");
    panel.classList.add("hidden");
  }
}

/**
 * テーマモードのラジオボタン選択に応じて、
 * 切替時刻入力欄の有効/無効を切り替える。
 * 自動モード以外では入力欄を disabled にしてグレーアウトする。
 */
function updateThemeInputsState() {
  const isAuto = document.querySelector('input[name="theme-mode"][value="auto"]').checked;
  const wrapper = document.getElementById("auto-time-wrapper");

  document.getElementById("dark-start-input").disabled  = !isAuto;
  document.getElementById("light-start-input").disabled = !isAuto;

  // auto 時は通常表示、それ以外は半透明でグレーアウト
  if (isAuto) {
    wrapper.classList.remove("opacity-40");
  } else {
    wrapper.classList.add("opacity-40");
  }
}

// ── メインループ ──────────────────────────────────────

// 起動時に localStorage から全設定を読み込む
loadSettings();

/**
 * 1秒ごとに呼ばれるメイン処理。
 * 表示更新とテーマ切り替えをまとめて行う。
 */
function tick() {
  applyTheme();
  updateDisplay(bedtime);
}

// 起動時に即時実行（setInterval だと最初の1秒は何も表示されないため）
tick();

// 以降は1秒ごとに繰り返す
setInterval(tick, 1000);
