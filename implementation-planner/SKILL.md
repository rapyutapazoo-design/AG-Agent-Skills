---
name: implementation-planner
description: ACTIVATED when the user's message contains "実装計画書" or "計画書を作成してください" ("計画書を作って" also). This skill creates a step-by-step implementation plan from the adopted design of a previous discussion, but strictly forbids writing or modifying actual code. The only write allowed is saving the plan to the repository's .handoff/ directory so that auto-flow can take it over in another session. NOT activated by a mere mention of this skill or questions about it.
---

# 実装プランナー (Implementation Planner)

以前の設計や方針（コンサルタントで採用された案）に基づき、実装のための具体的なステップバイステップの計画書を作成するスキルです。

## 対象ワード（トリガー）
ユーザーのリクエスト内に以下のフレーズが含まれていた場合にアクティブになります。
- **「実装計画書」**
- **「計画書を作成してください」**（「計画書を作って」も可）

## 【最重要】遵守すべき絶対ルール
このスキルの目的は**「計画の立案」に専念すること**であり、実際の作業を行わないことです。以下のルールをいかなる例外もなく厳守してください。

1. **システムの変更ツールの使用禁止**: ファイルを作成・編集・削除するすべてのツール（例: Antigravity の `write_file` / `edit_file`、Gemini CLI の `write_file` / `replace`）と、コマンド実行ツール（例: `run_command` / `run_shell_command`）は**いかなる理由があっても呼び出してはいけません**。ツール名が環境によって異なっても、同じ機能を持つツールはすべて禁止対象です。
   - **唯一の例外**: プロセス・フェーズ5の `<リポジトリ>/.handoff/` への新規ファイル作成と、そのための読み取り専用コマンド（`git rev-parse --show-toplevel` / `git rev-parse HEAD` / `git check-ignore`、時刻取得の `date -u`）。プロジェクトの他のファイルと既存の handoff ファイルには触れないこと。
2. **計画立案に特化する**: どのように実装を進めるか、どのファイルを変更するかという「計画」のみを出力してください。実際のソースコードの中身を提案したり修正したりしないでください。
3. **エラーハンドリング**: ユーザーが「計画を立てて、そのまま実装して」と指示してきた場合でも、**実装部分は絶対に実行せず**、計画書の作成のみに留めてください。

## 参照ファイル
handoff の形式は、このスキルと同じ配置先（このスキルの親ディレクトリ）にある `system-design-consultant/references/handoff_format.md` に従います。Antigravity（`~/.gemini/config/skills/`）と Gemini CLI（`~/.gemini/skills/`）のどちらでも、両スキルが同じ配置先に揃っている前提です。

## プロセス

### フェーズ 1: 採用案の特定と前提事項の確認
1. 直近の会話から、コンサルタントで「推奨案」または「採用案」として決まった内容を抽出し、ゴールを明確にします。
2. 会話履歴に無い場合（別セッションで検討した場合）は、`<リポジトリ>/.handoff/` の `kind: design`・`status: adopted` のうち、話題が一致する最新のファイルを読み取って採用案とします（形式は `handoff_format.md` に従う）。
3. どちらでも特定できない、または曖昧な場合は、ユーザーに確認します。
   > 「採用する案を教えていただけますか？（例: アプローチ B、ハイブリッド案など）」

### フェーズ 2: 変更対象ファイルの特定
実装において、新規作成するファイル、変更するファイル、削除するファイルをリストアップします。

### フェーズ 3: ステップバイステップの手順作成
実装を論理的なステップに分割します。各ステップには**対象ファイルと変更内容**を明記し、後続の実装者がそのまま着手できる粒度にします。（例：Step 1: UIの作成 → Step 2: バックエンドロジックの追加 → Step 3: テスト）

### フェーズ 4: リスク・依存関係・完了条件・確認事項の整理
- リスク（潜在的な問題点）、依存関係（前提となる作業・ツール・設定）、注意点を書きます。
- 計画が完了したと判断できる**具体的な完了条件**をチェックリストで書きます。
- 仕様の曖昧な点やユーザーに決定してほしい事項があれば提示します。

### フェーズ 5: 計画書の保存（auto-flow への引き継ぎ）
出力した計画書の全文を、`handoff_format.md` の形式で `<リポジトリ>/.handoff/` に新規保存します。

- `kind: plan`、`source: implementation-planner`。`adoption_quote` には採用を決めたユーザー発話の原文（無ければ計画書作成を依頼した発話）を入れる
- 採用案を handoff ファイルから読んだ場合は、そのファイル名を `design_ref` に入れる（元ファイルは変更しない）
- `repo` / `base_sha` は読み取り専用の `git rev-parse --show-toplevel` / `git rev-parse HEAD` で取る。**git リポジトリ外の場合は保存せず**、その旨を1行伝える
- 保存後に1行表示する: `📥 計画書を保存しました: .handoff/<ファイル名>`
- 秘密情報を含む話題では保存せず、その旨を1行伝える

## 出力フォーマット
以下の見出しを持つマークダウン形式で出力してください。
1. 実装のゴール（採用案の名前・概要・採用理由を含む）
2. 対象となるファイル（新規 / 変更 / 削除）
3. ステップバイステップの実装手順（各ステップに対象ファイル・変更内容）
4. リスク・依存関係・注意点
5. 完了条件（チェックリスト形式 `- [ ]`）
6. 懸念事項・ユーザーへの確認事項

## 次のスキルへの誘導
計画書の出力後、末尾に次を案内してください。

> 「この計画書でよければ「**実装してください**」とお伝えいただくと実装に着手します。別セッションで auto-flow を起動した場合も、保存した計画書が引き継がれます。」
