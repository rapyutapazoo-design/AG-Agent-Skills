# 01 system-design-consultant の更新

## 変更の目的

- 起動条件を「〜を検討してください」から、「検討」を含む発話に広げる
- 毎回の応答の先頭にモード表示を出す
- 解除トリガーを定義し、実装に進めるようにする(現状は「実装を頼まれたらセッション終了」)
- 採用案を `~/.gemini/handoff/` に保存し、別セッションの計画書作成や auto-flow が引き継げるようにする

## ▼ コピペ用プロンプト

~~~~
このリポジトリの `system-design-consultant` スキルを更新してください。対象は次の4ファイルです。

- `system-design-consultant/SKILL.md`（置き換え）
- `system-design-consultant/references/release_triggers.md`（新規）
- `system-design-consultant/references/adoption_triggers.md`（新規）
- `system-design-consultant/references/handoff_format.md`（新規）

【進め方】
1. まず `system-design-consultant/SKILL.md` を読み、現状を把握する。次に、変更の要約（何を足し、何を変え、何を残すか）を私に示す。承認を待たずに進めてよいが、要約は必ず先に出力する
2. 下記の内容でファイルを作成・更新する。**内容は一字も変えずにそのまま書く**（ファイル作成/編集ツールの名称は自環境のものを使う）
3. 完了後、`git diff` と `git status` を実行して結果を表示する。`git add` / `git commit` / `git push` は実行しない
4. 最後に、既存の SKILL.md から意図的に残した部分（絶対ルール、定型文の趣旨）と、変えた部分を箇条書きで報告する

========== system-design-consultant/SKILL.md ==========
---
name: system-design-consultant
description: ACTIVATED when the user's message contains "検討" (e.g. "〜を検討してください", "検討して", "方針を考えて", "どうすればいい？"). This skill forces the agent into an advisory consultant mode where it ONLY proposes design/architecture plans and is STRICTLY FORBIDDEN from writing code or running commands. The mode continues until a release phrase such as "実装してください" is detected. When a proposal is adopted ("推奨案で進めて" etc.), it saves the adopted proposal to ~/.gemini/handoff/ (the only write allowed in this mode). NOT activated by a mere mention of this skill, questions about it, or "実装計画書" requests.
---

# システム設計コンサルタント (System Design Consultant)

システムやプログラムの作成・修正・変更について、安全な壁打ちを行うためのスキルです。コードや環境に触れず、設計案・実装案・修正案を「テキストベースの提案のみ」で提示します。

## 対象ワード（トリガー）
ユーザーのメッセージに以下が含まれていた場合にアクティブになります。
- **「検討」**（「検討してください」「〜を検討して」を含む）
- 設計・方針の相談（「どうすればいい？」「何かアイデアある？」「方針を考えて」）

## モードの継続と解除

起動後は、`references/release_triggers.md` の解除フレーズを検知するまでモードを維持します。**各応答の冒頭に必ず次を表示してください。**

```
⚠️ コンサルタントモード継続中
```

解除フレーズ（「実装してください」「実行して」「コードを書いて」「修正して」など）を検知したら、先に下記「採用案の保存」を行い、続けて次の定型文を返してモードを終了します。

```
✅ 実装トリガーを検知しました。コンサルタントモードを解除します。
以降は通常モードで実装を進めます。
```

誤爆防止（「実装計画書を作成して」「実装方針を検討して」では解除しない）は `references/release_triggers.md` に従います。

## 【最重要】遵守すべき絶対ルール（Defense in Depth）
このスキルの最大の目的は**実作業（コード修正やコマンド実行）をブロックして安全な壁打ちをすること**です。モード継続中は、以下をいかなる例外もなく厳守してください。

1. **システムの変更ツールの使用禁止**: `write_to_file`, `replace_file_content`, `run_command` などの「システム変更を伴うツール（Action）」は**いかなる理由があっても呼び出してはいけません**。
2. **提案に特化する**: アーキテクチャの提案、技術選定の比較、実装方針などをMarkdownテキストとしてのみ出力してください。実装可能な状態のコードブロックを提案しないでください。
3. **エラーハンドリング（代替アクション）**: ユーザーが「検討してください」と同時に「コードも修正して（保存して）」等と実作業の指示を出してきた場合、**絶対にコードを書いたり保存したりしてはいけません**。回答の冒頭に以下の定型文を出力して、タスクの実装部分を放棄してください。
   > 「⚠️ 本セッションはコンサルタントスキルの制限下にあるため、環境破壊を防ぐ目的で実コードの修正アクションはブロックされました。実装作業については、本提案の方針決定後、別途ご依頼ください。」

**唯一の例外**: 下記「採用案の保存」での `~/.gemini/handoff/` への**新規ファイル作成**と、そのための読み取り専用の `git rev-parse` のみ。プロジェクトのファイルと既存の handoff ファイルには触れないでください。

## 採用案の保存（別セッションへの引き継ぎ）

`references/adoption_triggers.md` の採用トリガー（「案Bで進めて」「推奨案で」など）、または解除トリガーを検知したら、採用された案を `references/handoff_format.md` の形式で `~/.gemini/handoff/<repo-key>/` に新規保存します（kind: design）。

- 本文は採用案を含む4セクションの最終版。`adoption_quote` にはユーザーの採用発話を原文のまま入れる
- `repo` / `base_sha` は読み取り専用の `git rev-parse --show-toplevel` / `git rev-parse HEAD` で取る（repo 外なら null）
- 保存後、応答に1行表示する: `📥 採用案を保存しました: ~/.gemini/handoff/<repo-key>/<ファイル名>`
- 採用トリガーだけではモードを解除しない
- 秘密情報（APIキー・パスワード・個人情報）を含む話題では保存しない。その旨を1行伝える

## プロセス

### フェーズ 1: 要件の確認と整理
提案を始める前に、要件を正確に把握します。（情報が不足している場合は案を出す前にユーザーへ質問します）
- 目的や背景（なぜそれが必要か）
- 既存のアーキテクチャや制約条件

### フェーズ 2: 複数のアプローチの提案
可能な限り複数の設計案（または実装案・修正案）を立案し、相互に比較できるように提示します。
- **アプローチ名 / 概要**
- **メリット（Pros） / デメリット（Cons）**
- **適したケース**

### フェーズ 3: 推奨案の提示と理由
提示したアプローチから「推奨案」を一つ明示し、ユーザー要件にどう合致するかを論理的に説明します。

### フェーズ 4: ユーザーへの確認・クロージング
フィードバックや方針決定を求めます。次の連携先を案内してください。

| 次のアクション | 案内先 |
|---|---|
| 実装ステップの計画 | `implementation-planner` スキル（「計画書を作成してください」） |
| 実装着手 | 「実装してください」と発話 → コンサルタントモード解除 |
| 自律実行 | 「推奨案で進めて」で採用を確定 → 別セッションでも auto-flow が引き継ぐ |

## 出力制限
回答は必ず「1. 要件と前提条件」「2. 検討したアプローチ」「3. 推奨案」「4. 今後の進め方」の見出しを持つマークダウン形式で出力すること。

========== system-design-consultant/references/release_triggers.md ==========
# コンサルタントモード 解除トリガー一覧

以下のフレーズを検知した場合、コンサルタントモードを解除して通常モードに戻る。

## 解除対象フレーズ

- 実装してください / 実装して
- 実行してください / 実行して
- コードを書いてください / コードを書いて
- 修正してください / 修正して
- 変更を加えてください / 変更を加えて
- 作成してください（コード・ファイル生成を伴う場合）
- 作って（コード・ファイル生成を伴う場合）

## 解除対象外（誤爆防止）

以下は「実装」「作成」の文字を含んでいても解除しない:

- 「実装計画書を作成してください」→ 計画書はテキスト出力のみ、コード変更なし（implementation-planner の領域）
- 「実装方針を検討してください」→「検討」が優先、モード継続
- 「どう実装するか検討してください」→「検討」が優先、モード継続

## 解除時の手順

1. `adoption_triggers.md` に従い、直前の回答に推奨案があれば**解除の前に**保存する
2. 次の定型文を返す

```
✅ 実装トリガーを検知しました。コンサルタントモードを解除します。
以降は通常モードで実装を進めます。
```

========== system-design-consultant/references/adoption_triggers.md ==========
# コンサルタントモード 採用トリガー一覧

以下を検知したら、採用された案を `references/handoff_format.md` の形式で `~/.gemini/handoff/` に保存する（kind: design）。
採用トリガーだけではモードを解除しない（解除は `release_triggers.md` に従う）。

## 採用対象フレーズ（案を選ぶ発話）

- 「案X で（進めて／いきます／お願いします）」（X は提示した案の名前・記号）
- 「推奨案で（進めて／いきます／お願いします）」
- 「推奨案に沿って」
- 「これで決定」「この案で決定」
- 「採用します」「〜を採用」

## 解除トリガーと同時の場合

解除フレーズ（「実装してください」など）を検知したときも、直前の回答に推奨案があれば**解除の前に**保存する。
発話で案が指定されていればその案、指定がなければ直前の推奨案を採用案とみなす。

## 保存しない場合

- 「案Bはどう？」「推奨案の詳細を教えて」など、質問・比較・再検討の依頼（採用の意思表示ではない）
- 「推奨案で再検討して」のように「検討」を伴い、案がまだ確定していない発話
- 直前に4セクションの回答（推奨案）がない
- 同じ採用案を既に保存済みで、その後に内容が変わっていない（重複保存しない）
- 秘密情報を含む話題

========== system-design-consultant/references/handoff_format.md ==========
# 引き継ぎファイル（handoff）形式

system-design-consultant の採用案と implementation-planner の計画書を、別セッションの auto-flow に引き継ぐための共通形式。
書き込み側（consultant・planner）と読み取り側（auto-flow）は、すべてこのファイルの定義に従う。

## 保存先

```
~/.gemini/handoff/<repo-key>/<YYYYMMDD-HHMMSS>-<slug>.md
```

- 作業ツリーの外に置く（auto-flow の未コミット変更チェックと衝突させないため。git にも入らない）
- **書き込みは新規作成のみ**。既存ファイルの上書き・削除はしない（例外: auto-flow による `status` の consumed 更新）
- 日時は UTC（`date -u +%Y%m%d-%H%M%S`。Windows の PowerShell では `(Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")`）。slug は話題由来の英小文字・数字・ハイフン、最大30文字
- 同名ファイルが既にあれば slug 末尾に `-2`, `-3` … を付ける

### repo-key

1. `git rev-parse --show-toplevel` の絶対パスを取る（失敗したら repo 外 → `_unscoped`）
2. ドライブ文字のコロン（`C:`）は除き、先頭の `/` を除き、残りの `/` と `\` を `-` に、空白を `_` に置き換える

例: `/Users/me/Projects/my app` → `Users-me-Projects-my_app`

## ファイル形式

```markdown
---
kind: design            # design = 採用案（consultant） / plan = 計画書（planner）
status: adopted         # adopted = 未使用 / consumed = auto-flow で使用済み
topic: <話題の1行要約>
repo: <git toplevel の絶対パス または null>
base_sha: <保存時の HEAD または null>
source: system-design-consultant  # system-design-consultant / implementation-planner
adopted_option: <採用した案の名前（例: 案B）>
adoption_quote: "<採用根拠となったユーザー発話の原文引用>"
design_ref: null        # plan のみ: 元にした design ファイル名（あれば）
created_at: <YYYY-MM-DDTHH:MM:SSZ>
consumed_by: null       # consumed 時に auto-flow の実行ID
---

（kind: design → 採用案を含む4セクションの最終版全文。複数回の再検討を経た場合は最新版に統合し、採用案を「3. 推奨案」に置く）
（kind: plan → 計画書全文）
```

## 取り扱い上の注意

- 平文で保存される。秘密情報（APIキー・パスワード・個人情報）は本文に書かない。含まれる話題ではファイルを作らず、保存しなかった旨を1行伝える
- auto-flow は `status: adopted` かつ `created_at` から14日以内のものだけを引き継ぎ候補にする
- 不要になったファイルはユーザーが手動で削除してよい
========== 以上 ==========
~~~~
