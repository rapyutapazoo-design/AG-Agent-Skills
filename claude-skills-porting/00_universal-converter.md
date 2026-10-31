# 00 汎用変換プロンプト

Claude Code 用の `SKILL.md` を、Gemini などほかの AI 向けに書き換えさせるプロンプトです。チャット専用の AI でも使えます。

## 使い方

1. 下のコードブロックをコピーする
2. 末尾の `<<<ここに元の SKILL.md を貼る>>>` を、元の SKILL.md の全文に置き換える(元ファイルは各リポジトリにあります)
   - https://github.com/rapyutapazoo-design/claude-skills
   - https://github.com/rapyutapazoo-design/claude-auto-flow
3. AI に送る。出力された SKILL.md を `~/.gemini/skills/<名前>/SKILL.md` に保存する

`references/` や `scripts/` を持つスキルは、それらも1ファイルずつ同じ手順で変換してください。

## ▼ コピペ用プロンプト

~~~~
あなたはエージェントスキルの移植担当です。末尾に貼る Claude Code 用の SKILL.md を、Gemini CLI などで動く SKILL.md に書き換えてください。

【目的】
元の挙動・手順・禁止事項・出力フォーマット・トリガー語を変えずに、実行環境の違いだけを読み替える。

【変換ルール】
1. frontmatter は `name` と `description` だけ残す。`disable-model-invocation`、`hooks`、`model`、`allowed-tools` などは削除する。`description` の中のトリガー語・起動条件・「起動しない条件」は一字一句残す。
2. パスの読み替え:
   - `~/.claude/skills/` → `~/.gemini/skills/`
   - `.claude/skills/` → `.gemini/skills/`
   - `~/.claude/handoff/` → `~/.gemini/handoff/`
   - `CLAUDE.md` → `GEMINI.md`
3. ツール名の読み替え:
   - Write → write_file、Edit → replace、Read → read_file
   - Bash → run_shell_command
   - WebSearch → google_web_search、WebFetch → web_fetch
   - NotebookEdit など対応のないツールは、「ファイル編集系ツール」と一般化する
4. サブエージェント(Agent ツール)の読み替え:
   - 「サブエージェントを起動する」記述には、「サブエージェント機能が使えるならそれを使う。使えなければ同じセッションで、その役割だけに集中して順に実行する」を添える
   - `model: haiku / sonnet / opus` は、軽量・標準・高性能の3段階の表現にする(例: 軽量=Flash-Lite または Flash、標準=Flash、高性能=Pro)。具体名は環境で選べるよう「例」として書く
   - 昇格条件・リトライ昇格などの判定ロジックは、段階の名前だけ置き換えて残す
5. Claude Code 固有の機能(フックによるガード、`CLAUDE_SESSION_ID`、`settings.json` の hooks、`/auto-flow` のようなスラッシュコマンド)に依存する部分は、次の扱いにする:
   - 代替できない処理は削除せず、「この環境では未対応」と明記し、安全側(実行しない・停止する)に倒す
   - 勝手に新しい機能を足さない
6. 次は変えない: 絵文字の進捗表示、定型文、禁止事項、ゲートの条件、ファイル名・ディレクトリ構成、出力テンプレート、日本語の文面。
7. 書き換えたら、変更した箇所を末尾に「## 変更点」として箇条書きで列挙する(行ごとの対応が分かるように)。

【出力】
- 書き換え後の SKILL.md 全文を1つのコードブロックで出力する
- そのあとに「変更点」と、環境依存で動作確認が必要な箇所の一覧を出す
- 元の文章を要約・省略しない

【元の SKILL.md】
<<<ここに元の SKILL.md を貼る>>>
~~~~
