# 08 auto-flow 段階3: ガードの移植(条件付き)

> **実行条件: [07 の検証報告](./07_auto-flow-stage2-verification.md)を私(Claude)に貼り、私が下記を検証結果に合わせて調整してから実行してください。** 検証前の実行は推奨しません。以下は、現時点で判明している元スクリプトの仕様に基づく**下書き**です。

## 段階の構成(各段階の終わりで止まります)

| 段階 | 内容 | 必要な検証結果 | 自動マージの解禁 |
|---|---|---|---|
| 3a | Git フック層(層1)の移植 | なし(Git の機能。ただし 5 の環境差は影響) | しない |
| 3b | `BeforeTool` ガード(層2)の移植 | 実験1・4・5 | しない |
| 3c | 起動認可(トークン)の移植 | 実験2・3 | **する場合のみ**。既定は実行しない |

## 元スクリプトの仕様(確認済み)

[`claude-skills/auto-flow/hooks`](https://github.com/rapyutapazoo-design/claude-skills/tree/master/auto-flow/hooks) を読んで確認した、移植に関わる点です。

- `af_guard.py`: 入力 JSON の `tool_name == "Bash"` と `tool_input` を見る。拒否は **終了コード2＋stderr**。プロジェクトのディレクトリは環境変数 `CLAUDE_PROJECT_DIR` から取る。**`state.json` が `running` 以外のときは常に終了コード0**(素通り)
- `git_guard.py` / `af_gate.sh` / `install_guards.py`: Git のフック(`reference-transaction` / `pre-push` / `pre-commit`)として動く。Claude Code に依存しない。`state.json` が `running` の間、ゲート合格＋起動認可が揃うまで、main/master/base の更新と機密ファイルのコミットを拒否する
- `af_common.py`: トークンの保存先が `~/.claude/auto-flow/tokens`。除外ファイルのパターンは `safe-push/scripts/check_secrets.py` のコピーに追加したもの
- `prompt_token.py`: 起動語を含む入力のときだけトークンを発行する。`session_id` は入力 JSON から取る
- `tests/`: 5ファイルの unittest。HOME と git 設定を隔離して実行する

**段階3a だけでも、Git 側で「実行中は main を更新できない」「機密ファイルをコミットできない」状態にできます**(起動認可が無い限りゲート合格でも拒否されるため、モデルが約束を破っても main は守られます)。

## ▼ コピペ用プロンプト(段階3a: Git フック層)

~~~~
auto-flow の Git ガード（層1）を、このリポジトリの `auto-flow/hooks/` に移植してください。**この指示は段階3aのみです。`BeforeTool` や `BeforeAgent` のフック、トークンの発行には手を付けないでください。**

【進め方】
1. `auto-flow/SKILL.md` が存在することを確認する。無ければ止まって報告する
2. 空の一時ディレクトリを新規に作り、`git clone --depth 1 https://github.com/rapyutapazoo-design/claude-skills <一時ディレクトリ>/src` で取得する。失敗したら止めて報告する
3. `<一時ディレクトリ>/src/auto-flow/hooks/` を、このリポジトリの `auto-flow/hooks/` にコピーする（tests/ を含む）。既に存在する場合は、上書きせずに私に確認する
4. 次の置換だけを行う。それ以外のロジックは変えない:
   - `af_common.py` の `~/.claude/auto-flow/tokens` を `~/.gemini/auto-flow/tokens` にする
   - `af_common.py` の除外ファイルのパターンに、`*.ppk` と `.clasprc.json` を追加する（既存のパターンは変えない）
   - コメントや docstring の `~/.claude/skills/` は `~/.gemini/skills/` にする
5. `grep -rn -i "claude" auto-flow/hooks` を実行し、残りを一覧にして、「出典・説明として妥当」「置換漏れ」の別を報告する。置換漏れは修正する
6. テストを実行する: `cd auto-flow/hooks/tests/.. && PYTHONDONTWRITEBYTECODE=1 python3 -I -m unittest discover -s tests -v`（Windows では `python`）。結果を全文報告する。失敗したテストがあれば、**直さずに**失敗内容を報告し、原因が移植（パス・OS 差）によるものか、元から存在するものかを切り分けて報告する。`test_prompt_token.py` と `test_auth.py` の失敗は、トークン機能（3c）に関わるため、現時点では無視してよい旨を併せて報告する
7. `auto-flow/SKILL.md` は**変更しない**。代わりに、SKILL.md の [0] 起動の手順7を「3a 版」にするための変更案（`install_guards.py install --repo .  --run-id <実行ID>` を `--session` なしで実行し、`authorized: false` でも続行する。結果を guard.json に保存し、開始宣言の🛡 ガードを config|shim|未設置の実際の値にする）を、差分として**提示するだけ**にする
8. 一時ディレクトリを削除し、`git diff --stat` と `git status` を表示する。`git add` / `git commit` / `git push` は実行しない

【報告に含めること】
- 置換した箇所の一覧
- テスト結果の全文
- 手順7の変更案
- OS／シェル／Python のバージョンと、テストで OS 差が原因と思われる失敗の有無
~~~~

## ▼ コピペ用プロンプト(段階3b: BeforeTool ガード)— 検証後に調整

> 実験1・4・5 の結果次第で内容が変わるため、現時点では骨子のみです。

~~~~
auto-flow の層2ガード（`af_guard.py`）を、Gemini CLI の `BeforeTool` フック用に移植してください。**3aが完了していることが前提です。**

【変更方針】
- 入力 JSON の `tool_name == "Bash"` を、コマンド実行ツールの名前（検証で確認した実際の名前）に変える
- `tool_input` 内のコマンド文字列の項目名は、検証で確認した名前に合わせる（Claude 版は `command`）
- プロジェクトのディレクトリは、環境変数 `CLAUDE_PROJECT_DIR` ではなく、入力 JSON の `cwd` から取る
- 拒否の方式は、検証で有効と確認できたもの（終了コード2＋stderr、または `decision: "deny"` ＋ reason）に合わせる
- `state.json` が `running` 以外のときは常に素通りする（元の仕様を維持）
- フックの登録は、検証で確認したコマンド文字列の書き方で、`settings.json` の `hooks.BeforeTool`（matcher: コマンド実行ツール）に追記するための**スニペットを提示するだけ**にする。`settings.json` 自体の編集は、私が行う
- テスト（`tests/test_af_guard.py`）の入力 JSON を、上記の変更に合わせる

【やらないこと】
`BeforeAgent` フックとトークン発行（3c）には触れない。
~~~~

## 段階3c(起動認可)について

自動マージを解禁しない限り不要です。**既定は実行しません。** 解禁する場合は、実験2・3 の結果を確認したうえで、`prompt_token.py` を `BeforeAgent` 用に移植し、`install_guards.py` に渡すセッションIDの経路(フックが書いたファイルを経由するなど)を設計します。その際は、G2 を判定に戻すか(テストが無いプロジェクトでは自動マージが通らなくなる)も、あらためて決めてください。
