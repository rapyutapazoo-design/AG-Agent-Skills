# 09 両環境対応のための修正一覧(01〜05 への差分)

01〜05 の指示書は「Gemini CLI 単独」を前提に書かれていました。実際の運用環境は **Antigravity と Gemini CLI の両方** のため、01〜05 の原案に以下の修正(P1〜P9)を当てて実装しています。01〜05 のファイル自体は書き換えていません。レビュー時は「原案 + この一覧」と実装結果を照合してください。

## 決定事項(2026-11-01)

| 項目 | 決定 |
|---|---|
| 対象環境 | Antigravity と Gemini CLI の両方 |
| 原本 | このリポジトリ。各環境の配置先からシンボリックリンクで参照する |
| 配置先 | Antigravity: `~/.gemini/config/skills/` / Gemini CLI: `~/.gemini/skills/` |
| handoff 保存先 | リポジトリ内 `.handoff/`(git グローバル除外 `core.excludesFile` に `.handoff/` を登録) |
| consultant 起動語 | 「どうすればいい？」を削除 |
| code-review 起動語 | 「差分を教えて」を残す(要約モード・除外条件・優先順位で影響を抑える) |
| consultant モード中の差分確認 | モード解除まで保留 |

## 修正一覧

### P1 ツール名を機能で書く
対象: system-design-consultant / implementation-planner / researcher / code-review / coding-guide-tutor

原案の `write_to_file` / `replace_file_content` / `run_command` は Antigravity の現行ツール名(`write_file` / `edit_file` / `run_command`)とも Gemini CLI(`write_file` / `replace` / `run_shell_command`)とも一致せず、名指しの禁止が効かないため、機能ベースの表現に置き換える。

> ファイルを作成・編集・削除するすべてのツール(例: Antigravity の `write_file` / `edit_file`、Gemini CLI の `write_file` / `replace`)と、コマンド実行ツール(例: `run_command` / `run_shell_command`)

### P2 handoff の保存先をリポジトリ内 `.handoff/` に変更
対象: system-design-consultant(SKILL.md / adoption_triggers.md / handoff_format.md) / implementation-planner

- 保存先: `<git toplevel>/.handoff/<YYYYMMDD-HHMMSS>-<slug>.md`。repo-key は廃止
- git リポジトリ外では保存しない(保存しなかった旨を1行伝える)
- 理由: ワークスペース内なので両環境とも承認なしでファイル作成ツールで書ける。`~/.gemini/handoff/` は Antigravity では承認が必要、Gemini CLI ではファイル書き込みツールがワークスペース外を拒否する
- 例外として許すコマンドは読み取り専用の `git rev-parse --show-toplevel` / `git rev-parse HEAD` / `git check-ignore`(除外設定の確認用)、および時刻取得の `date -u`(環境が現在時刻を提供している場合は不要)のみ
- 書き込みは新規作成のみ(例外: auto-flow による `status` の consumed 更新)。frontmatter・14日の有効期限は原案どおり
- コミット混入対策として P6 で git-push-automation の除外ファイルにも追加する

### P3 consultant の起動語とモード中の差分確認
対象: system-design-consultant

- 起動語: 「検討」「方針を考えて」「何かアイデアある？」。「どうすればいい？」は削除
- モード継続中に「差分を教えて」「レビューして」等を受けた場合は、git コマンドを実行せず「コンサルタントモード中のため、差分の確認はモード解除後に行います」と返して保留する

### P4 code-review の要約モードと除外条件
対象: code-review(SKILL.md / assets/review_template.md)

- 「差分を教えて」「変更を見て」→ **要約モード**(変更ファイル一覧+2〜3行の要約。規約照合は行わず、🔴に当たりそうなもの(シークレット・除外ファイル)だけは目視で確認して注記)
- 「レビューして」「コードを確認して」→ **フルレビュー**(🔴🟡🟢)
- 起動しない条件: git の差分以外の比較(指定した2つの対象・バージョン間・文書の比較)/ コンサルタントモード中 / コミット・プッシュを伴う依頼(git-push-automation を使う)

### P5 coding-guide-tutor との優先順位
対象: coding-guide-tutor

- 「差分を教えて」「レビューして」は code-review が優先し、coding-guide-tutor は起動しない旨を description と起動語の節に追記
- coding-guide-tutor は配置先にしか無かったため、このリポジトリに取り込んで管理する

### P6 git-push-automation の除外ファイルとスクリプトのパス
対象: git-push-automation(SKILL.md / references/security_rules.md)

- `security_rules.md` の🔴除外ファイルに `.handoff/` を追加
- `scripts/check_secrets.py` は「このスキルのディレクトリからの相対パス」で解決する旨を明記
- スクリプト取得はネットワークが必要。Antigravity では承認を得て実行する

### P7 researcher のツール名の例示
対象: researcher

- Web 検索・URL 取得のツール名を環境ごとに例示(Antigravity: `search_web` など / Gemini CLI: `google_web_search` / `web_fetch`)

### P8 README
- 収録スキル一覧に researcher / code-review / coding-guide-tutor を追加
- 両環境への配置(シンボリックリンク)と、git グローバル除外への `.handoff/` 追加手順を記載

### P9 スキル間参照
対象: implementation-planner / code-review

- `system-design-consultant/references/...` や `git-push-automation/references/...` は「このスキルと同じ配置先(スキルの親ディレクトリ)にある `<skill>/...`」として参照する。両配置先に全スキルが揃うことを前提とする

## 実装時の補足

- 01〜05 の原案のうち、上記で触れていない部分は原案の文言を維持している
- `check_secrets.py`(03 の任意項目)の取得は、ネットワーク承認が必要なため別途実施とし、未取得でも SKILL.md の手動チェックで運用できる
