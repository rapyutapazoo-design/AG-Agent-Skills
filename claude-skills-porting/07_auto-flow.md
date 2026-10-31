# 07 auto-flow(自律ワークフロー・オーケストレーター)

「オートフロー」「auto-flow」「自律実行して」「自動で最後まで進めて」「全自動で進めて」で起動し、課題を **検討 → 計画 → 実装 → 独立レビュー → セキュリティチェック → マージ判定ゲート** まで確認なしで進めるスキルです。

- 元: https://github.com/rapyutapazoo-design/claude-skills/tree/master/auto-flow (旧単体版: https://github.com/rapyutapazoo-design/claude-auto-flow)
- 方式: SKILL.md は約36KBあるため、**公開リポジトリを取得して変換する方式**です。シェルとネット接続のあるエージェント向けです
- 依存: `01_consultant-mode`、`02_plan-creator`、`03_researcher`、`04_safe-push` を先に作成してください
- 必要なもの: Python 3、git。PR を作る場合は `gh`

## Gemini 版の最大の違い: 自動マージしない(常に PR 止め)

元の auto-flow は、次の2層のフックを使って「全ゲート合格時だけ main へマージ」を安全にしています。

| 元のしくみ | 依存先 |
|---|---|
| `prompt_token.py`(起動語の発話ごとに短命の起動認可を発行) | Claude Code の `UserPromptSubmit` フックと `CLAUDE_SESSION_ID` |
| `af_guard.py`(`gh pr merge` や `--no-verify` などを拒否) | Claude Code の `PreToolUse` フック |
| `git_guard.py` / `install_guards.py`(Git フックで main 更新を拒否) | 上の起動認可の記録 |

これらは Claude Code のフック仕様に依存するため、**この移植では持ち込みません**。元の設計では、ガードが無い状態は G8(ガード確認)の不合格になり、PR 止めになります。Gemini 版はそれに合わせて次のように動きます。

- G1〜G7 は元どおり判定する。**G8 は不合格に固定**する
- したがって `decision` は常に `pr`。作業ブランチを push し、PR を作って止まる
- main/master への push・merge・commit は一切行わない(`gh pr merge` も使わない)
- マージは人が PR を見て行う

Gemini CLI にも hooks 機能がある場合は、`hooks/` を参考に自前でガードを移植できますが、動作確認が必要なため本集では扱いません。

## ▼ コピペ用プロンプト

~~~~
公開リポジトリ https://github.com/rapyutapazoo-design/claude-skills の `auto-flow/SKILL.md` を取得し、Gemini CLI のスキルとして `~/.gemini/skills/auto-flow/SKILL.md` に作成してください。次の手順を順に実行し、各手順の結果を報告してください。

【手順0: 前提確認】
次の4つのスキルが存在するか確認する: `~/.gemini/skills/consultant-mode/SKILL.md`、`~/.gemini/skills/plan-creator/SKILL.md`、`~/.gemini/skills/researcher/SKILL.md`、`~/.gemini/skills/safe-push/SKILL.md`。無いものがあれば、名前を挙げて報告し、先に作成するよう私に伝えて止まる（auto-flow だけ作らない）。

【手順1: 取得】
1. 空の一時ディレクトリを新規に作り（例: `mktemp -d`）、そこでだけ作業する
2. `git clone --depth 1 https://github.com/rapyutapazoo-design/claude-skills <一時ディレクトリ>/src` を実行する
3. 取得に失敗したら、そこで止めて理由を報告する。自分で内容を作り直さない

【手順2: 配置】
1. `~/.gemini/skills/auto-flow/` が既に存在する場合は、上書きせずに私に確認する
2. 存在しなければ `<一時ディレクトリ>/src/auto-flow/SKILL.md` だけを `~/.gemini/skills/auto-flow/SKILL.md` にコピーする。**`hooks/` ディレクトリはコピーしない**（Claude Code のフックに依存し、この環境では使わないため）

【手順3: SKILL.md の変換】
次のルールだけで書き換える。ルールに無い箇所（フェーズの手順、プロンプト雛形、日本語の文言、停止条件、gate.json / state.json のスキーマ）は一字も変えない。

A. frontmatter
- `disable-model-invocation` の行と `hooks:` ブロック全体を削除する（`name` と `description` は残す。description の起動語と「起動しない条件」は変えない）。`description` 内の「Haiku/Sonnet/Opus」は「軽量/標準/高性能モデル」に置換する

B. パス・名称
- `~/.claude/skills/` → `~/.gemini/skills/`、`~/.claude/handoff/` → `~/.gemini/handoff/`、`CLAUDE.md` → `GEMINI.md`
- `${CLAUDE_SESSION_ID}` は使わない（C-3 で該当手順を置き換える）

C. フック・ガードの扱い（重要）
1. 「大原則」の「7. フック関所（2層）」を、次の文に置き換える:
   「7. **ガード非対応**: この環境にはフックによる関所（af_guard.py / git_guard.py / prompt_token.py）が無い。そのため G8 は常に不合格とし、**main/master への push・merge・commit は一切行わず、必ず PR 止めにする**。`gh pr merge`・`--no-verify`・フック設定の変更・remote の追加や変更はしない。」
2. 大原則の6（「main/master への push・マージはオーケストレーター本人だけが [7] で行う」）を、「main/master への push・merge・commit はオーケストレーターを含め行わない（PR 止めのみ）」に置き換える。サブエージェント向けの「main/master への push・merge・commit 禁止」の文言はそのまま残す
3. [0] 起動の手順7（`install_guards.py install ...`）は実行しない。「ガードは設置しない。`guard` は `{"mode": null, "ok": false}`、`auth_id` は null にする」に置き換える。手順9の state.json でも同じ値にする。開始宣言の「🛡 ガード」は「未設置」、「認可」は「なし（PR 止め）」と固定で表示する
4. [7] のゲート表: G8 は「ガード非対応環境のため不合格に固定。evidence に『ガード未対応環境（フック非移植）』と書く」とする。G1〜G7 の条件はそのまま残す
5. [7] の「全合格 → マージ手順」の節（`gh pr merge`、ff マージ、`--no-ff` の説明）を削除し、「decision は常に pr。リモートと gh があれば `gh pr create --base <base> --head <work>`（本文に G 番号ごとの合否と根拠、G8 が固定不合格であること、全ゲート合格なら『人がレビューしてマージしてよい』ことを書く）。無ければブランチ push まで」に置き換える。不合格時の PR 作成の記述と統合してよい
6. 再開の手順4の `install_guards.py install` の記述は削除し、「status を running に戻し、`resumed_at` を設定する」だけにする
7. 「設計上の注記」の「ガードの既知の限界」「ガードの撤去」の項目は削除し、代わりに次の1項目を置く:「この版はフックを移植していないため、自動マージ機能は無効。ゲート判定は記録のみで、マージは人が行う」。「引き継ぎの既知の限界」は残す
8. CLAUDE.md の「git 書き込みは git-workflow 経由のみ」への言及は、「GEMINI.md に同様の制約がある場合、[6] safe-push フローとブランチ push、PR 作成が正規の書き込み経路となる」に置き換える

D. モデル・サブエージェント
1. 「Agent ツール（subagent_type: general-purpose）で起動」は、「サブエージェント機能が使えるならそれで起動する。使えない環境では、同じセッションで役割ごとに順に実行する（レビューは実装時の会話を参照しない約束で行う。独立性が弱まることを完了報告に1行書く）」に置き換える
2. 「model を必ず指定する」「haiku / sonnet / opus の3つだけ」は、軽量（例: Flash-Lite または Flash）・標準（例: Flash または Pro）・高性能（例: Pro）の3段階に置き換える。具体的なモデル名は、私が使える設定に合わせて開始時に1行で確認する。モデルを選べない環境では、全フェーズを同じモデルで実行し、完了報告に書く
3. 本文中の `haiku`→軽量、`sonnet`→標準、`opus`→高性能、`Haiku`→軽量、`Sonnet`→標準、`Opus`→高性能 を置換する。昇格判定・リトライ昇格・オーバーライド（--economy / --quality）のロジックは段階の名前だけ置き換えて残す
4. 「--fable は廃止」の記述は元のまま残す

E. ツール名
- Bash→run_shell_command、Write→write_file、Edit→replace、Read→read_file、WebSearch→google_web_search、WebFetch→web_fetch

【手順4: 検証】
1. `grep -n -i "claude\|install_guards\|af_guard\|git_guard\|prompt_token\|SESSION_ID\|gh pr merge\|haiku\|sonnet\|opus" ~/.gemini/skills/auto-flow/SKILL.md` を実行する。残った行は一覧にして、それぞれ「出典の説明として妥当」「置換漏れ」のどちらかを判定して報告する。置換漏れは修正する
2. frontmatter が `---` で始まり、`name` と `description` だけが残っていることを確認する
3. 「全ゲート合格でも main へマージしない」ことを SKILL.md の記述から確認し、確認した行番号を報告する（マージ手順の記述が残っていれば削除する）

【手順5: 後片付けと報告】
- 一時ディレクトリを削除する
- 最終報告に、配置したファイル、変換した箇所の一覧（A〜E ごと）、手順4の検証結果、Gemini 版で元と挙動が変わる点（常に PR 止め／サブエージェントの有無で独立レビューが弱まる点）を含める
- 動作確認のための auto-flow の実行は、私が頼むまでしない
~~~~

## 使い始めるとき

1. 対象の Git リポジトリで作業ツリーをクリーンにする(未コミットの変更があると停止します)
2. 例: `オートフロー：README の誤字を直して` のように、起動語を含めて依頼する
3. 成果物は `.auto-flow/<実行ID>/` に保存されます(自動で `.git/info/exclude` に追加されます)。結果の PR を人がレビューしてマージします
