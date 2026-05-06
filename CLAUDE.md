# CLAUDE.md — 就寝カウントダウン

## プロジェクト概要

就寝予定時刻までのカウントダウンを表示する、ブラウザで動くタイマーアプリ。
GitHub Pages で公開中: https://miz0ken.github.io/bedtime-countdown/

**学習目的のプロジェクト**。開発者はプログラミング学習中であり、コードの意図を理解しながら進めることを重視している。実装の説明は日本語で、なぜそのロジックにしたかを丁寧に伝えること。

---

## 技術スタック

- **JavaScript**: バニラJS（フレームワーク・ライブラリなし）
- **CSS**: Tailwind CSS CDN版 + カスタム CSS（`<style>` タグ内）
- **データ保存**: localStorage のみ
- **ホスティング**: GitHub Pages

---

## ファイル構成

```
bedtime-countdown/
├── index.html   # HTML構造 + Tailwind CDN読み込み + カスタムCSS
└── script.js    # 全ロジック（時刻計算・表示更新・localStorage・設定UI）
```

### script.js の関数一覧

| 関数 | 役割 |
|------|------|
| `loadSettings()` | localStorage から全設定（bedtime / themeMode / darkStart / lightStart）を読み込み、グローバル変数にセット |
| `saveSettings()` | 設定パネルの全入力値を localStorage に保存 |
| `calcRemaining(bedtime)` | 現在時刻から就寝時刻までの残り秒数を返す |
| `formatTime(totalSeconds)` | 秒数を { hours, minutes, seconds } に分解 |
| `pad(n)` | 数値を2桁ゼロ埋め文字列に変換 |
| `getCurrentIsDark()` | themeMode に応じて現在ダークモードかどうかを boolean で返す |
| `updateDisplay(bedtime)` | カウントダウン表示を更新。テーマに応じてネオン緑／Rails 赤を切り替え |
| `applyTheme()` | `getCurrentIsDark()` の結果で body の背景色・テキスト色を切り替え |
| `toggleSettings()` | 設定パネルの表示/非表示を切り替え。開くとき全設定値をフォームに反映 |
| `updateThemeInputsState()` | ラジオボタンの選択に応じて切替時刻入力欄の disabled / グレーアウトを制御 |
| `tick()` | 1秒ごとに呼ばれるメイン処理 |

---

## コーディング規約

- **バニラJSを維持する**: React・Vue 等のフレームワークは導入しない。ライブラリの追加は開発者に相談してから判断する。
- **Tailwind CDN版を使う**: npm ビルドへの移行は行わない。`text-shadow` など Tailwind で対応できないスタイルのみ `<style>` タグに書く。
- **コメントは日本語**: コードの意図を学習者が読んで理解できるよう、日本語でコメントを残す。
- **定数は冒頭にまとめる**: `STORAGE_KEY`、`DEFAULT_BEDTIME`、`GRACE_HOURS`、`STORAGE_KEY_THEME`、`DEFAULT_THEME_MODE`、`DEFAULT_DARK_START`、`DEFAULT_LIGHT_START` のように、後で変更しやすい値は `script.js` の冒頭で定数定義する。

---

## デザイン方針

| 項目 | 仕様 |
|------|------|
| ダーク時カウントダウン色 | `#39ff14`（緑）、`.neon` クラスで `text-shadow` 多重発光 |
| ライト時カウントダウン色 | `#CC0000`（Rails 公式赤）、`.light-countdown` クラス、発光なし |
| 警告色 | `#ff6b35`（オレンジ）、テーマに関係なく常にこの色 |
| ダークテーマ | `bg-gray-950 text-white` |
| ライトテーマ | `bg-sky-100 text-gray-800` |
| テーマ切替 | `themeMode`（auto/light/dark）で制御。auto 時は `darkStart`/`lightStart` で判定 |
| 数字サイズ | `clamp(3.5rem, min(20vw, 28vh), 22rem)` — 画面サイズに追従 |
| 警告テキストサイズ | `clamp(1.5rem, 11vw, 14rem)` — 8文字が1行に収まるサイズ |
| 想定デバイス | PC横画面をメインに、スマホ縦画面でも崩れないレスポンシブ対応 |

---

## 主要ロジック

### calcRemaining の3段階判定

就寝時刻を境に3つの状態を返す:

```
A. now < target          → 正の値（就寝前カウントダウン）
B. target <= now < graceEnd → -1（「早く寝ましょう」警告表示）
C. now >= graceEnd       → 正の値（翌日の就寝時刻へのカウントダウン）
```

`GRACE_HOURS`（デフォルト6）で猶予期間を制御。

### テーマ切り替え

`getCurrentIsDark()` が `themeMode` に応じて3分岐で boolean を返す:

```
"dark"  → 常に true
"light" → 常に false
"auto"  → darkStart / lightStart を分単位で比較して判定
```

auto 判定のポイント: `darkStart`（例: "19:00"）と `lightStart`（例: "06:00"）をそれぞれ分単位（時 × 60 + 分）に変換して現在時刻と比較する。`darkMin > lightMin`（日付をまたぐ設定）の場合は `nowMin >= darkMin || nowMin < lightMin` でダークと判定する。

`applyTheme()` はこの結果を受けて毎秒 `body` の Tailwind クラスを付け替える。`updateDisplay()` も同じ結果を参照し、カウントダウン要素のクラスを `.neon`（緑発光）か `.light-countdown`（Rails 赤）に切り替える。

---

## localStorage 保存項目

| キー | 型 | デフォルト値 | 内容 |
|------|----|------------|------|
| `bedtime` | string | `"01:00"` | 就寝予定時刻（HH:MM 形式） |
| `themeMode` | string | `"auto"` | テーマモード（`"auto"` / `"light"` / `"dark"`） |
| `darkStart` | string | `"19:00"` | auto 時にライト→ダークへ切り替わる時刻（HH:MM 形式） |
| `lightStart` | string | `"06:00"` | auto 時にダーク→ライトへ切り替わる時刻（HH:MM 形式） |

新規項目が存在しない既存ユーザーはデフォルト値で動作するため、後方互換性は維持される。

---

## 今後の予定（v2）

Ruby on Rails によるバックエンド化を予定:
- ユーザー認証（登録・ログイン）
- 就寝記録の保存とグラフ表示
- 目標達成ストリーク機能

v2 への移行時は、現在の localStorage ロジックをサーバーサイドに置き換える。バニラJS + Rails API の構成を想定。
