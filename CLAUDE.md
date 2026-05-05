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
| `loadSettings()` | localStorage から就寝時刻を読み込む（デフォルト: 01:00） |
| `saveSettings()` | 設定パネルの入力値を localStorage に保存 |
| `calcRemaining(bedtime)` | 現在時刻から就寝時刻までの残り秒数を返す |
| `formatTime(totalSeconds)` | 秒数を { hours, minutes, seconds } に分解 |
| `pad(n)` | 数値を2桁ゼロ埋め文字列に変換 |
| `updateDisplay(bedtime)` | カウントダウン表示を更新 |
| `applyTheme()` | 時間帯でダーク/ライトテーマを切り替え |
| `toggleSettings()` | 設定パネルの表示/非表示を切り替え |
| `tick()` | 1秒ごとに呼ばれるメイン処理 |

---

## コーディング規約

- **バニラJSを維持する**: React・Vue 等のフレームワークは導入しない。ライブラリの追加は開発者に相談してから判断する。
- **Tailwind CDN版を使う**: npm ビルドへの移行は行わない。`text-shadow` など Tailwind で対応できないスタイルのみ `<style>` タグに書く。
- **コメントは日本語**: コードの意図を学習者が読んで理解できるよう、日本語でコメントを残す。
- **定数は冒頭にまとめる**: `STORAGE_KEY`、`DEFAULT_BEDTIME`、`GRACE_HOURS` のように、後で変更しやすい値は `script.js` の冒頭で定数定義する。

---

## デザイン方針

| 項目 | 仕様 |
|------|------|
| ネオン発光色 | `#39ff14`（緑）、`text-shadow` で多重発光 |
| 警告色 | `#ff6b35`（オレンジ） |
| ダークテーマ | 19時〜翌6時: `bg-gray-950 text-white` |
| ライトテーマ | 6時〜19時: `bg-sky-100 text-gray-800` |
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

`applyTheme()` が毎秒 `body` の Tailwind クラスを付け替える。`setHours` の24時間以上オーバーフローは JavaScript が自動処理するため、日付またぎの特別処理は不要。

---

## 今後の予定（v2）

Ruby on Rails によるバックエンド化を予定:
- ユーザー認証（登録・ログイン）
- 就寝記録の保存とグラフ表示
- 目標達成ストリーク機能

v2 への移行時は、現在の localStorage ロジックをサーバーサイドに置き換える。バニラJS + Rails API の構成を想定。
