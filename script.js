// ── 定数 ──────────────────────────────────────────────
const STORAGE_KEY = "bedtime";
const DEFAULT_BEDTIME = "01:00";

// ── 設定の読み書き ────────────────────────────────────

/**
 * localStorageから就寝時刻を読み込む。
 * 未設定の場合はデフォルト値 "01:00" を返す。
 */
function loadSettings() {
  return localStorage.getItem(STORAGE_KEY) || DEFAULT_BEDTIME;
}

/**
 * timeInputの値をlocalStorageに保存し、設定パネルを閉じる。
 * グローバル変数 bedtime も即座に更新する。
 */
function saveSettings() {
  const input = document.getElementById("time-input");
  if (!input.value) return;

  bedtime = input.value;
  localStorage.setItem(STORAGE_KEY, bedtime);
  toggleSettings(); // パネルを閉じる
}

// ── 時刻計算 ──────────────────────────────────────────

/**
 * 現在時刻から就寝時刻までの残り秒数を返す。
 *
 * ポイント：就寝時刻が「次に来るタイミング」を計算する。
 *   例）現在 23:30、就寝 01:00 → 翌日 01:00 まで 90分
 *   例）現在 00:30、就寝 01:00 → 今日の 01:00 まで 30分
 *
 * @param {string} bedtime - "HH:MM" 形式の就寝時刻
 * @returns {number} 残り秒数（負の値 = 就寝時刻を過ぎている）
 */
function calcRemaining(bedtime) {
  const now = new Date();

  // 就寝時刻を「今日の日付」で Date オブジェクト化
  const [hours, minutes] = bedtime.split(":").map(Number);
  const target = new Date(now);
  target.setHours(hours, minutes, 0, 0);

  // 就寝時刻が現在より過去なら「翌日」にずらす
  if (target <= now) {
    target.setDate(target.getDate() + 1);
  }

  return Math.floor((target - now) / 1000);
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

// ── 画面の更新 ────────────────────────────────────────

/**
 * カウントダウン数字と就寝予定時刻の表示を更新する。
 * 就寝時刻を過ぎていたら警告メッセージに切り替える。
 *
 * @param {string} bedtime - "HH:MM" 形式の就寝時刻
 */
function updateDisplay(bedtime) {
  const remaining = calcRemaining(bedtime);
  const countdownEl = document.getElementById("countdown");
  const labelEl     = document.getElementById("label-remaining");
  const targetEl    = document.getElementById("target-display");

  // 就寝時刻の表示文字列（例: "01:00" → "AM 1:00"）
  const [h, m] = bedtime.split(":").map(Number);
  const ampm   = h < 12 ? "AM" : "PM";
  const h12    = h % 12 === 0 ? 12 : h % 12;
  targetEl.textContent = `就寝予定: ${ampm} ${h12}:${pad(m)}`;

  if (remaining <= 0) {
    // 就寝時刻を過ぎている場合
    countdownEl.className = "neon-warn font-mono font-bold leading-none select-none text-4xl sm:text-5xl";
    countdownEl.textContent = "早く寝ましょう🌙";
    labelEl.textContent = "";
  } else {
    // カウントダウン表示
    const { hours, minutes, seconds } = formatTime(remaining);
    countdownEl.className = "neon font-mono font-bold select-none";
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
 * 現在時刻が19時以降かどうかでbodyの背景色とテキスト色を切り替える。
 * Tailwind のクラスを付け替えるだけなのでシンプル。
 */
function applyTheme() {
  const hour = new Date().getHours();
  const body = document.getElementById("app");

  if (hour >= 19 || hour < 6) {
    // 夜〜深夜: ダークモード
    body.className = body.className
      .replace(/bg-\S+/, "")
      .replace(/text-\S+/, "")
      .trim();
    body.classList.add(
      "bg-gray-950", "text-white",
      "min-h-screen", "flex", "flex-col", "items-center", "justify-center", "transition-colors", "duration-1000"
    );
  } else {
    // 朝〜夕方: ライトモード
    body.className = body.className
      .replace(/bg-\S+/, "")
      .replace(/text-\S+/, "")
      .trim();
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
  const panel = document.getElementById("settings-panel");
  const isHidden = panel.classList.contains("hidden");

  if (isHidden) {
    // 表示するとき: hidden を外して visible を付ける
    panel.classList.remove("hidden");
    panel.classList.add("visible");
    // input に現在の就寝時刻をセット
    document.getElementById("time-input").value = bedtime;
  } else {
    // 非表示にするとき: visible を外して hidden を付ける
    panel.classList.remove("visible");
    panel.classList.add("hidden");
  }
}

// ── メインループ ──────────────────────────────────────

// アプリ全体で使う就寝時刻（起動時に localStorage から読み込む）
let bedtime = loadSettings();

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
