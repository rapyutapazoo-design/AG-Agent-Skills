---
name: code-review
description: ACTIVATED when the user asks for a git diff review or summary only, e.g. "レビューして", "コードを確認して", "変更を見て", "差分を教えて", "差分を教えてください", "review my code". Takes precedence over coding-guide-tutor on "差分を教えて(ください)". Reads the git diff and outputs either a diff summary ("差分を教えて" / "変更を見て") or a full review report against the project's coding rules ("レビューして" / "コードを確認して"). This skill NEVER commits or pushes. NOT activated when: (1) comparing non-git targets such as two specified files, versions or documents ("v1とv2の差分", "AとBの差分"), (2) system-design-consultant mode is active, (3) the user also asks to commit/push (use git-push-automation), or (4) merely mentioning this skill.
---

# コードレビュー (Code Review)

現在の変更（git の差分）を、プロジェクトの規約に照らして確認・レビューします。**結果を出すだけで、コミットもプッシュもしません。**

## モードの出し分け（要約モード／フルレビュー）

依頼の表現に応じて、出力の重さを切り替えます。

| モード | トリガー例 | 内容 |
|---|---|---|
| **要約モード** | 「差分を教えて」「差分を教えてください」「変更を見て」 | 変更ファイルの一覧と、変更内容の2〜3行要約のみを返す。規約との詳細照合は行わない（ただしシークレット直書きや除外ファイル混入など🔴に該当しそうな点が見えた場合のみ1行注記する） |
| **フルレビュー** | 「レビューして」「コードを確認して」「review my code」 | `coding_rules.md`・`security_rules.md` に照らして🔴🟡🟢のフルレビュー結果を返す |

## 起動しない条件（誤爆防止）

以下の場合はこのスキルを起動しません。
- **git の差分以外の比較**: 2つの指定されたファイル・バージョン・仕様書などの比較（例: 「v1 と v2 の差分を教えて」「A.js と B.js の差分」）
- **コンサルタントモード継続中**: `system-design-consultant` が有効な間は git コマンドを実行せず、モード解除まで保留する
- **コミット・プッシュを伴う依頼**: 「レビューしてプッシュして」などは `git-push-automation` を使うよう案内する

## 【最重要】遵守すべき絶対ルール

1. **読み取り専用**: ファイルを作成・編集・削除するすべてのツール（例: Antigravity の `write_file` / `edit_file`、Gemini CLI の `write_file` / `replace`）と、git の書き込み系コマンド（`git add` / `git commit` / `git push` / `git reset` など）は**呼び出さない**。使ってよいのは `git branch --show-current` / `git status` / `git diff` / `git log` などの読み取り専用コマンドとファイル読み取りツールだけ。
2. **修正はしない**: 指摘と修正案の提示までで止める。実際の修正は、ユーザーが別途依頼したときに行う。
3. **プッシュ依頼が混ざっている場合**（「レビューしてプッシュして」）: このスキルでは実行せず、`git-push-automation` を使うよう案内する。

## 参照ファイル

規約ファイルは、このスキルと同じ配置先（このスキルの親ディレクトリ）にある `git-push-automation/references/coding_rules.md` と `git-push-automation/references/security_rules.md` を参照します。テンプレートは、このスキルのディレクトリ内の `assets/review_template.md` を参照します。

## フロー

### 1. 変更内容を取得する
- `git branch --show-current`、`git status`、`git diff`、`git diff --cached` を実行する。
- 未追跡の新規ファイル（`.handoff/` を除く）がある場合は、ファイル名を一覧にし、内容を読み取って対象に含める。
- 変更が無い場合は「レビューする変更がありません」と伝えて終了する。
- **要約モードの場合**は、ステップ2・3を省略し、`assets/review_template.md` の「要約モード用フォーマット」で出力して終了する（🔴の懸念が見えた場合のみ注記を添える）。

### 2. 規約を読み込む（フルレビューのみ）
- 同じ配置先の `git-push-automation/references/coding_rules.md`（品質規約）と `git-push-automation/references/security_rules.md`（セキュリティ規約）を読み込む。

### 3. 差分をレビューする（フルレビューのみ）
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

### 5. 次のアクションを案内する（フルレビューのみ）
- 🔴がある場合: 具体的な修正案を示す
- 🔴が無い場合: 「問題なければ、プッシュまで進めるときは git-push-automation をご利用ください」と案内する
