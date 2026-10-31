# AG-Agent-Skills 更新指示書

Gemini CLI / Antigravity に読み込ませて、このリポジトリのスキルを Claude 版との差分に基づいて更新させるための指示書です。各ファイルのコードブロックを AI に貼って実行します。

## 前提(決定済みの方針)

- 方針は「段階導入」です。まず品質面の更新(01〜05)を行い、auto-flow は PR 止め固定の版から始め、検証を経てから安全機構を移植します
- `imozuru` は対象外です
- 未回答だった設計判断は、次の既定値を置いています。変えたい場合は該当ファイルの該当箇所を書き換えてください
  - auto-flow は**全ゲート合格でも PR 止め**(自動マージしない)
  - G2(テスト・ビルド)は**記録のみで判定に使わない**(テストが無いプロジェクトが多いため)
  - 実行環境(Gemini CLI か Antigravity か)と OS は**未確定**。07 の検証で確定します
- 更新対象は**このリポジトリ内のファイル**です。AI にはこのリポジトリを開いた状態で実行させてください。更新後、`~/.gemini/skills/`(または各環境の配置先)へコピーして反映します

## ファイル一覧と実行順

| 順 | ファイル | 内容 | 種別 |
|---|---|---|---|
| 1 | [`01_system-design-consultant.md`](./01_system-design-consultant.md) | 起動条件の拡張、モード継続・解除、採用案の保存(handoff) | 既存を更新 |
| 2 | [`02_implementation-planner.md`](./02_implementation-planner.md) | 完了条件・リスク分離・採用案の特定・計画書の保存 | 既存を更新 |
| 3 | [`03_git-push-automation.md`](./03_git-push-automation.md) | 重大度(🔴🟡🟢)、除外ファイル、エラー対処表 | 既存を更新 |
| 4 | [`04_researcher.md`](./04_researcher.md) | 1回完結の調査スキル | 新規 |
| 5 | [`05_code-review.md`](./05_code-review.md) | プッシュなしのレビュー専用スキル | 新規 |
| 6 | [`06_auto-flow-stage1.md`](./06_auto-flow-stage1.md) | auto-flow(PR 止め固定版)とサブエージェント定義 | 新規 |
| 7 | [`07_auto-flow-stage2-verification.md`](./07_auto-flow-stage2-verification.md) | フック・サブエージェント仕様の検証(小実験) | 検証 |
| 8 | [`08_auto-flow-stage3-guards.md`](./08_auto-flow-stage3-guards.md) | ガードの移植(検証結果が前提) | 条件付き |

- 1〜5 は上から順に実行してください。6 は 1〜5 の完成が前提です(consultant / planner / researcher / git-push-automation を呼ぶため)
- 7 は 6 のあとに実行します。結果は私(Claude)に貼っていただければ、8 を検証結果に合わせて調整します
- 8 は 7 の結果を確認してから実行してください。**それ以前には実行しないでください**
- `code-reading-tutor` は変更しません

## 各指示書の共通の安全策

- 変更前に対象ファイルを読み、変更内容の要約を示させます
- `git commit` / `git push` はさせません(差分を `git diff` で確認するところまで)
- 既存ファイルの削除・大幅な書き直しは、先に確認を求めさせます
- ツール名は環境で異なります(Antigravity は `view_file` / `write_to_file` / `replace_file_content` / `run_command` 系、Gemini CLI は `read_file` / `write_file` / `replace` / `run_shell_command` 系)。指示書では「ファイル読み取りツール」のように一般化しています

## 更新後の確認(私から)

更新が終わったら、`git diff` の出力を貼っていただければ、Claude 側で意図どおりかレビューします。
