# 06 auto-flow 段階1(PR 止め固定版)

## 目的

課題を **検討 → 計画 → 実装 → 独立レビュー → セキュリティチェック → ゲート判定** まで確認なしで進め、**作業ブランチを push して PR を作るところで止まる**スキル `auto-flow` を追加します。main へのマージは人が行います(全ゲートに合格しても自動マージしません)。

元になるのは Claude 版 [`claude-skills/auto-flow`](https://github.com/rapyutapazoo-design/claude-skills/tree/master/auto-flow) です。AI にこれを取得させ、下記ルールで変換させます。

## この段階1で決めている方針

| 項目 | 方針 | 理由 |
|---|---|---|
| マージ | 常に PR 止め。`gh pr merge` も使わない | フック(ガード)は段階3で検討するため。ガードが無い状態は元の設計でも PR 止め |
| G8(ガード) | 不合格に固定 | 同上 |
| G2(テスト・ビルド) | 実行して記録するが、**判定には使わない** | Kintone / GAS はテストが無いことが多い |
| モデル | 軽量 / 標準 / 高性能の3段階。Gemini では**サブエージェント定義に固定**されるため、役割ごとに別定義を作る | 呼び出しごとのモデル指定ができない |
| 計画フェーズの昇格 | しない(標準固定。`--quality` のときだけ高性能) | 昇格用の定義を増やさないため |
| レビュー | 読み取り専用のサブエージェント。`coding_rules.md` と `security_rules.md` を入力に加える | Claude 版には無い、このリポジトリ固有の強化 |
| G5(重要パス) | Kintone / GAS の項目を追加 | 後述 |

前提: 01〜05 を実行済み(`system-design-consultant`、`implementation-planner`、`researcher`、`git-push-automation`、`code-review` が存在する)。

## ▼ コピペ用プロンプト

~~~~
公開リポジトリ https://github.com/rapyutapazoo-design/claude-skills の `auto-flow/SKILL.md` を取得し、このリポジトリに新しいスキル `auto-flow` として追加してください。あわせてサブエージェント定義8本を `auto-flow/agents/` に作成します。次の手順を順に実行し、各手順の結果を報告してください。

【手順0: 前提確認】
次が存在するか確認する: `system-design-consultant/SKILL.md`、`system-design-consultant/references/handoff_format.md`、`implementation-planner/SKILL.md`、`researcher/SKILL.md`、`git-push-automation/SKILL.md`、`git-push-automation/references/security_rules.md`。無いものがあれば名前を挙げて報告し、そこで止まる。`auto-flow/` が既に存在する場合は、上書きせずに私に確認する。

【手順1: 取得】
1. 空の一時ディレクトリを新規に作り（例: `mktemp -d`、Windows では同等のコマンド）、そこでだけ作業する。取得物をこのリポジトリのディレクトリに展開しない
2. `git clone --depth 1 https://github.com/rapyutapazoo-design/claude-skills <一時ディレクトリ>/src` を実行する。失敗したら止めて理由を報告する。自分で内容を作り直さない
3. `<一時ディレクトリ>/src/auto-flow/SKILL.md` だけを、このリポジトリの `auto-flow/SKILL.md` にコピーする。**`hooks/` はコピーしない**

【手順2: SKILL.md の変換】
次のルールだけで書き換える。ルールに無い箇所（フェーズの手順、停止条件、gate.json / state.json のスキーマ、日本語の文言、絵文字の表示）は一字も変えない。

A. frontmatter
- `disable-model-invocation` の行と `hooks:` ブロック全体を削除する。`name` と `description` は残し、description の起動語と「起動しない条件」は変えない。description の `--research / --economy / --quality ...` の記述も残す。description 内の「Haiku/Sonnet/Opus」は「軽量/標準/高性能モデル」にし、末尾に「（PR止め固定版: 全ゲート合格でも自動マージせず、PRを作成して止まる）」を追記する

B. 他スキルの名前とパス
- `consultant-mode` → `system-design-consultant`、`plan-creator` → `implementation-planner`、`safe-push` → `git-push-automation`、`researcher` はそのまま、`git-workflow` → `code-review`（auto-flow 内では使わない旨の記述は残す）
- `~/.claude/skills/<スキル名>/SKILL.md` の形のパスは、スキル名の読み替えをしたうえで、環境のスキル配置先（例: `~/.gemini/skills/<スキル名>/SKILL.md`）にする
- `~/.claude/handoff/` → `~/.gemini/handoff/`、`CLAUDE.md` → `GEMINI.md`
- handoff 形式への参照は `system-design-consultant/references/handoff_format.md` にする
- 引き継ぎファイルの `source` は `system-design-consultant` / `implementation-planner`（`consultant-mode` / `plan-creator` ではなく）として扱う旨を、[0] の引き継ぎ探索の節に1行追記する

C. ガード・マージ（重要）
1. 「大原則」の「7. フック関所（2層）」を、次の文に置き換える:
   「7. **ガード非対応（段階1）**: この版にはフックによる関所が無い。そのため G8 は常に不合格とし、**main/master への push・merge・commit は一切行わず、必ず PR 止めにする**。`gh pr merge`・`--no-verify`・フック設定の変更・remote の追加や変更はしない。」
2. 大原則の6を、「main/master への push・merge・commit はオーケストレーターを含め行わない（PR 止めのみ）」に置き換える。サブエージェント向けの「main/master への push・merge・commit 禁止」の文言は残す
3. [0] 起動の手順7（`install_guards.py install ...`）は実行しない。「ガードは設置しない。`guard` は `{"mode": null, "ok": false}`、`auth_id` は null」に置き換える。開始宣言の「🛡 ガード」は「未設置」、「認可」は「なし（PR 止め）」と固定で表示する
4. [7] ゲート表の G8 は「ガード非対応のため不合格に固定。evidence に『段階1: ガード未移植』と書く」とする
5. [7] の「全合格 → マージ手順」を削除し、「decision は常に pr。リモートと gh があれば `gh pr create --base <base> --head <work>`（本文に G1〜G8 の合否と根拠、G8 が固定不合格であること、G2 は記録のみであること、『人がレビューしてマージしてよい』ことを書く）。無ければブランチ push まで」にする。不合格時の PR 作成の記述と統合してよい
6. 再開の手順4の `install_guards.py install` の記述は削除し、「status を running に戻し、`resumed_at` を設定する」だけにする
7. 「設計上の注記」の「ガードの既知の限界」「ガードの撤去」は削除し、代わりに「段階1ではフックを移植していない。ゲート判定は記録のみで、マージは人が行う」の1項目を置く。「引き継ぎの既知の限界」は残す
8. CLAUDE.md の「git 書き込みは git-workflow 経由のみ」への言及は、「GEMINI.md に同様の制約がある場合、[6] の git-push-automation フローとブランチ push、PR 作成が正規の書き込み経路となる」に置き換える

D. ゲートの調整（このリポジトリ固有）
1. G2: 「impl.md 記載のテスト・ビルドコマンドを実行して出力を test.log に保存する。コマンドが存在しない場合は『存在しない』と記録する。**G2 は記録のみで、`passed` と `decision` の判定には使わない**（evidence には結果を書き、`pass` は実行成功なら true、失敗・不存在なら false とし、`informational: true` を付ける）」に書き換える。gate.json スキーマの `passed` の説明も「G2 を除く全 check が pass のときだけ true」にする
2. G5 の重要パス例に次を追加する: `appsscript.json`、`.clasp.json`、`*.ppk`、Kintone プラグインの `manifest.json`、`.github/workflows/**`（既存）
3. G6（変更ファイル15以内・削除なし）はそのまま
4. [5] レビューの入力に、`git-push-automation/references/coding_rules.md` と `git-push-automation/references/security_rules.md` の全文を追加する。重要度基準の「重大」に、`security_rules.md` の🔴項目（シークレット・除外ファイル）と `coding_rules.md` の「セキュリティ（最重要）」の違反を含める。`coding_rules.md` のその他の違反は「軽微」とする

E. [6] の読み替え
- [6] のプロンプトは、元の safe-push のステップ番号を前提にしている。`git-push-automation` のワークフロー（1 Analyze／2 Security & Rule Check／3 Draft Commit／4 Confirm & Execute）に合わせて、次の内容に書き換える:
  「`git-push-automation/SKILL.md` を読み、そのフローに従ってコミット・プッシュまで完結せよ。【自律モード】承認ゲートを次のとおり自動化する: ステップ1で未ステージの変更は、除外ファイル（.env / *.pem / *.key / *.ppk / .clasprc.json / node_modules / *.log / .DS_Store / .auto-flow）以外を `git add` する（個別に指定して add する。`git add .` は使わない）。ステップ2はスクリプトが無い、または Python が使えない場合は手動チェックでよい。🔴が1件でもあれば【プッシュせず終了】し、検出内容を報告する。🟡のみ・🟢は自動承認で続行する（🟡は G4 不合格になる）。ステップ3のコミットメッセージは `commit_template.md` に従い自分で確定する。ステップ4の承認は自動承認とし、push 先は作業ブランチのみ（`git push -u origin auto-flow/<slug>`）。main/master への push・merge・commit 禁止。リモートがない場合はコミットまで行い、push はスキップして報告。出力（security.md に保存される）: チェック結果（🔴/🟡/🟢）、コミットハッシュ、push 結果。」
- G4 の条件は「git-push-automation の判定が🟢のみ（🟡は不合格）」にする

F. サブエージェントの呼び出し方
1. 「Agent ツール（subagent_type: general-purpose）で起動」「`model` を必ず指定する」「haiku / sonnet / opus の3つだけ」の記述を、次の方針に置き換える:
   - 各フェーズは `auto-flow/agents/` に定義したサブエージェントに委譲する（利用時は `~/.gemini/agents/` などの配置先に置かれている前提）。対応: [1]=`af-researcher`／[2] 通常の検討=`af-designer`／[2] 検証モード=`af-verifier`（`--quality` なら `af-designer`）／[3]=`af-planner`（`--quality` なら `af-designer`）／[4]=`af-implementer`／[5]=`af-reviewer`（差分が300行超または10ファイル超、または `--quality` なら `af-reviewer-pro`）／[5']=`af-implementer`／[6]=`af-security`
   - 委譲は、サブエージェント名を明示して依頼する（例: `@af-reviewer`）。委譲されず本体が実行した場合は、同じセッションで役割を切り替えて実行し、完了報告に「委譲されなかったフェーズ」を記録する。レビューは実装時の会話を参照しない約束で行い、独立性が弱まったことを完了報告に書く
   - 昇格判定（[3] の4基準）は削除し、計画は `af-planner`（`--quality` のときだけ `af-designer`）で固定する。[2] の「常に高性能」、[5] のレビューの昇格条件、リトライ昇格（軽量→標準→高性能）は残す。リトライ昇格で別定義の呼び出しが必要な場合は、「軽量→標準→高性能」の順に別のサブエージェントへ振り替える
2. [2] 検証モード（引き継ぎあり）のプロンプトが `git log` や `git diff --stat` を参照する指示は、「オーケストレーターが実行した出力をプロンプトに貼って渡す。`af-verifier` は読み取り専用で、コマンドを実行しない」に置き換える
3. [3] 計画のプロンプトが指す「計画書フォーマット（採用案サマリー／実装ステップ／考慮事項／完了条件）」は、`implementation-planner` のフォーマット（1 実装のゴール／2 対象となるファイル／3 ステップバイステップの実装手順／4 リスク・依存関係・注意点／5 完了条件／6 懸念事項・ユーザーへの確認事項）に置き換える。自律モードでは「6」の確認は行わず、前提を明記して進める旨を足す

G. ツール名
- Bash→コマンド実行ツール、Write/Edit→ファイル作成・編集ツール、Read→ファイル読み取りツール、WebSearch→Web検索ツール、WebFetch→URL取得ツール（具体名は環境のものを使う）

H. 完了報告
- 完了報告の末尾に1行追記する: 「ℹ️ 段階1（PR止め固定版）: マージは人が行います。G8 は固定不合格、G2 は記録のみ。」

【手順3: サブエージェント定義の作成】
`auto-flow/agents/` に次の8ファイルを作る。各ファイルは YAML frontmatter（`name`、`description`、`kind: local`、`tools`、`model`、`max_turns`、`timeout_mins`）と本文（システムプロンプト）で構成する。

事前に、次を自分の環境で確認し、結果を報告する:
- 使用できるツール名（読み取り／書き込み／コマンド実行／Web検索／URL取得）。以下の `READ`／`WRITE`／`SHELL`／`WEB` を実際のツール名の配列に置き換える
- 使用できるモデル名。`FLASH_LITE`／`FLASH`／`PRO` を実際のモデル名に置き換える。確認できない場合は `model` の行を省略する（親のモデルを継承する）
- サブエージェント定義ファイルの置き場所と形式が、ここで想定するもの（Markdown＋YAML frontmatter、`.gemini/agents/` または `~/.gemini/agents/`）と違う場合は、報告して私に確認してから進める

| ファイル | tools | model | max_turns | 役割 |
|---|---|---|---|---|
| `af-researcher.md` | READ, WEB | FLASH_LITE | 30 | researcher スキルの調査。書き込み・コマンド実行なし |
| `af-designer.md` | READ | PRO | 30 | 検討（system-design-consultant の4セクション）。計画の `--quality` 時にも使う |
| `af-verifier.md` | READ | FLASH | 20 | 引き継ぎ案の検証（VERDICT 行を出力） |
| `af-planner.md` | READ | FLASH | 30 | 実装計画書の作成 |
| `af-implementer.md` | READ, WRITE, SHELL | FLASH | 50 | 計画に従って実装、テスト・ビルド実行、軽微指摘の自動修正。git commit はしない |
| `af-reviewer.md` | READ | FLASH | 30 | 新規コンテキストのレビュー。読み取り専用 |
| `af-reviewer-pro.md` | READ | PRO | 30 | 大きな差分・`--quality` 時のレビュー |
| `af-security.md` | READ, SHELL | FLASH_LITE | 30 | git-push-automation のフローでコミット・ブランチ push |

全ファイルの本文の共通部分（各ファイルの役割に合わせて冒頭の1文を変える）:

```
あなたは auto-flow の「<役割名>」です。呼び出し元のプロンプトの指示だけに従ってください。
- 【自律モード】ユーザーへの質問・確認待ちは禁止。情報が不足する箇所は前提を明記して進める
- 出力は呼び出し元が .auto-flow/<ID>/<ファイル> に保存する前提で、全文を返す
- main / master への push・merge・commit は禁止
- 許可されたツール以外は使わない。読み取り専用の役割では、ファイルを変更するコマンドを実行しない
```

`af-reviewer.md` と `af-reviewer-pro.md` の本文には、上記に加えて次を入れる: 「実装時の会話は渡されない。入力は計画書（または課題文）、`git diff` の出力、コーディング規約、セキュリティ規約のみ。指摘は `[軽微|重大] ファイル:行 — 内容 — 修正案` の形式で書く。判定に迷うものは重大とする」

`af-implementer.md` の本文には、上記に加えて次を入れる: 「git commit はしない。作業ブランチ上で作業ツリーの変更のみを行う。テスト・ビルドのコマンドを実行した場合は、コマンドと結果を報告に含める。コマンドが存在しない場合は『存在しない』と報告する」

`af-security.md` の本文には、上記に加えて次を入れる: 「除外ファイルは add しない。🔴があれば push せず終了し、検出内容を報告する」

【手順4: 検証】
1. `grep -n -i "claude\|install_guards\|af_guard\|git_guard\|prompt_token\|SESSION_ID\|gh pr merge\|haiku\|sonnet\|opus\|safe-push\|consultant-mode\|plan-creator" auto-flow/SKILL.md` を実行する。残った行は一覧にして、「出典・説明として妥当」「置換漏れ」のどちらかを判定して報告する。置換漏れは修正する
2. frontmatter が `---` で始まり、`name` と `description` だけが残っていることを確認する
3. 「全ゲート合格でも main へマージしない」ことを示す記述の行番号を報告する。マージ手順の記述が残っていれば削除する
4. `auto-flow/agents/` の8ファイルの frontmatter の `tools` が、役割の表と一致していることを確認する（特に `af-reviewer`／`af-designer`／`af-verifier`／`af-planner` に書き込みとコマンド実行が含まれていないこと）

【手順5: 後片付けと報告】
- 一時ディレクトリを削除する
- リポジトリ直下の `README.md` の「収録スキル一覧」に `- [オートフロー](./auto-flow/)` の1行を追記する（他の行は変えない）
- `git diff` と `git status` を表示する。`git add` / `git commit` / `git push` は実行しない
- 最終報告に、配置したファイル、変換した箇所の一覧（A〜H ごと）、手順4の検証結果、手順3で確認した環境情報（ツール名・モデル名・サブエージェントの置き場所）を含める
- **auto-flow の動作確認のための実行は、私が頼むまでしない**
~~~~

## 配置と最初の試運転(私が行う手順)

1. 更新結果を確認し、`auto-flow/` を環境のスキル配置先へ、`auto-flow/agents/*.md` をサブエージェントの配置先へコピーする
2. **テスト用の別リポジトリ**(重要なデータが無いもの)で、小さな課題を1つ流して試す。例: `オートフロー：README に使い方の1行を追記して`
3. 作業ツリーがクリーンで、リモートと `gh` が使える状態で行う。完了したら、PR とブランチが作られ、main が変わっていないことを確認する
