# 引き継ぎファイル（handoff）形式

system-design-consultant の採用案と implementation-planner の計画書を、別セッションの auto-flow に引き継ぐための共通形式。
書き込み側（consultant・planner）と読み取り側（auto-flow）は、すべてこのファイルの定義に従う。
Antigravity と Gemini CLI のどちらから書いても、同じ場所・同じ形式になる。

## 保存先

```
<git toplevel>/.handoff/<YYYYMMDD-HHMMSS>-<slug>.md
```

- `<git toplevel>` は読み取り専用の `git rev-parse --show-toplevel` で取る。**git リポジトリ外では保存しない**（保存しなかった旨を1行伝える）
- ワークスペース内に置くことで、両環境ともファイル作成ツールで承認なしに書ける
- `.handoff/` は **git のグローバル除外設定（`core.excludesFile`）で無視させる**前提。コミット混入を防ぐため、git-push-automation の除外ファイル（🔴）にも登録されている
- `.handoff/` ディレクトリが無ければ、ファイル作成と同時に作られてよい
- **書き込みは新規作成のみ**。既存ファイルの上書き・削除はしない（例外: auto-flow による `status` の consumed 更新）
- 日時は UTC。環境が現在時刻を提供している場合はそれを UTC に換算して使い、無ければ `date -u +%Y%m%d-%H%M%S`（Windows の PowerShell では `(Get-Date).ToUniversalTime().ToString("yyyyMMdd-HHmmss")`）。slug は話題由来の英小文字・数字・ハイフン、最大30文字
- 同名ファイルが既にあれば slug 末尾に `-2`, `-3` … を付ける

### 除外設定の確認（ユーザーが一度だけ行う）

```
git config --global core.excludesFile   # 未設定なら ~/.config/git/ignore が既定
```

上記ファイルに `.handoff/` の1行を追加する。保存前に `git check-ignore -q .handoff/x` が失敗する（無視されていない）場合は、保存はしてよいが「`.handoff/` が git で無視されていません」と1行警告する。

## ファイル形式

```markdown
---
kind: design            # design = 採用案（consultant） / plan = 計画書（planner）
status: adopted         # adopted = 未使用 / consumed = auto-flow で使用済み
topic: <話題の1行要約>
repo: <git toplevel の絶対パス>
base_sha: <保存時の HEAD または null（コミットが無い場合）>
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
- `git clean -fdx` を実行すると削除される。git worktree ごとに別の `.handoff/` になる
- 不要になったファイルはユーザーが手動で削除してよい
