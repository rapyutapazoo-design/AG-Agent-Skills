# 05 code-review(新規スキル)

## 目的

「レビューして」「変更を確認して」で起動する、**プッシュなしのレビュー専用**スキルを追加します。`git-push-automation` から入口を分けることで、レビューだけを頼めるようにします。`coding_rules.md` は `git-push-automation` のものを共有して使います(規約の二重管理を避ける)。

前提: [`03_git-push-automation.md`](./03_git-push-automation.md) を実行済み。

## ▼ コピペ用プロンプト

~~~~
このリポジトリに新しいスキル `code-review` を追加してください。作成するのは `code-review/SKILL.md` と `code-review/assets/review_template.md` の2ファイルです。

【進め方】
1. `code-review/` が既に存在する場合は、上書きせずに私に確認する
2. `git-push-automation/references/coding_rules.md` と `git-push-automation/references/security_rules.md` が存在することを確認する。無ければ「先に 03 の更新を実行してください」と報告して止まる
3. 下記の内容で2ファイルを作成する。**内容は一字も変えずにそのまま書く**
4. リポジトリ直下の `README.md` の「収録スキル一覧」に `- [コードレビュー](./code-review/)` の1行を追記する（他の行は変えない）
5. `git diff` と `git status` を表示する。`git add` / `git commit` / `git push` は実行しない

========== code-review/SKILL.md ==========
---
name: code-review
description: ACTIVATED when the user asks for a review only, e.g. "レビューして", "コードを確認して", "変更を見て", "差分を教えて", "review my code". Reads the git diff and reviews it against the project's coding rules, then outputs a review report. This skill NEVER commits or pushes. NOT activated when the user also asks to commit/push (use git-push-automation) and NOT by mere mentions of this skill.
---

# コードレビュー (Code Review)

現在の変更（git の差分）を、プロジェクトの規約に照らしてレビューします。**レビュー結果を出すだけで、コミットもプッシュもしません。**

## 【最重要】遵守すべき絶対ルール

1. **読み取り専用**: ファイルの書き込み・編集ツールと、git の書き込み系コマンド（`git add` / `git commit` / `git push` / `git reset` など）は**呼び出さない**。使ってよいのは `git status` / `git diff` / `git log` などの読み取りコマンドとファイル読み取りだけ。
2. **修正はしない**: 指摘と修正案の提示までで止める。実際の修正は、ユーザーが別途依頼したときに行う。
3. **プッシュ依頼が混ざっている場合**（「レビューしてプッシュして」）: このスキルでは実行せず、`git-push-automation` を使うよう案内する。

## フロー

### 1. 変更内容を取得する
- `git branch --show-current`、`git status`、`git diff`、`git diff --cached` を実行する。
- 未追跡の新規ファイルがある場合は、ファイル名を一覧にし、内容を読み取って対象に含める。
- 変更が無い場合は「レビューする変更がありません」と伝えて終了する。

### 2. 規約を読み込む
- `git-push-automation/references/coding_rules.md`（品質規約）と `git-push-automation/references/security_rules.md`（セキュリティ規約）を読み込む。

### 3. 差分をレビューする
差分と規約を照合し、以下の観点で評価する。

- **セキュリティ**: 認証情報のハードコード、除外ファイルの混入
- **規約適合**: `coding_rules.md` の項目（Kintone 標準APIの利用、非同期処理の戻り値、GAS の実行時間など）
- **正しさ**: バグ、境界条件、エラー処理の欠落
- **命名・可読性**: 命名規則、放置されたコメントアウト、デバッグ出力

### 4. レビュー結果を出力する
`assets/review_template.md` の形式で出力する。

- 🔴 **要修正**: バグ、規約違反、シークレット・除外ファイルなど必ず直すべき問題
- 🟡 **推奨**: 品質向上のための提案
- 🟢 **良い点**: 良い実装を積極的に評価する（省略しないこと）

### 5. 次のアクションを案内する
- 🔴がある場合: 具体的な修正案を示す
- 🔴が無い場合: 「問題なければ、プッシュまで進めるときは git-push-automation をご利用ください」と案内する

========== code-review/assets/review_template.md ==========
# コードレビュー結果

**ブランチ**: `{branch}`
**レビュー日時**: {datetime}

---

## 概要

{変更の目的・背景を1〜2文で要約}

---

## 変更ファイル

| ファイル | 変更種別 | 主な変更内容 |
|---------|---------|------------|
| {path} | {追加/修正/削除} | {一言説明} |

---

## レビュー結果

### 🔴 要修正

{必ず直すべき問題。ファイル:行、内容、修正案。なければ「なし」}

### 🟡 推奨改善

{できれば改善したい点。なければ「なし」}

### 🟢 良い点

{良い実装、改善されている点を積極的に書く。省略しないこと}

---

## 総評

{全体評価と次のアクション提案}
========== 以上 ==========
~~~~
