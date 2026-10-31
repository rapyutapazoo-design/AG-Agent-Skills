# Claude スキルの Gemini 移植プロンプト集

[rapyutapazoo-design/claude-skills](https://github.com/rapyutapazoo-design/claude-skills) と [rapyutapazoo-design/claude-auto-flow](https://github.com/rapyutapazoo-design/claude-auto-flow) のスキルを、Gemini CLI などほかの AI エージェントで再現するための、コピペ用プロンプトです。各ファイルのコードブロックを AI に貼ると、スキルのファイル一式を作らせられます。

> `claude-auto-flow` は `claude-skills/auto-flow` の旧版(単体リポジトリ)です。hooks は同一で、SKILL.md は `claude-skills` 側のほうが新しい(引き継ぎ・`--quality`・`--fresh` 対応、Fable 廃止)ため、本集は `claude-skills` 側を基準にしています。

## 使い方

1. 使いたいスキルのファイルを開く
2. 「▼ コピペ用プロンプト」のコードブロックを丸ごとコピーする
3. Gemini CLI(またはファイル作成ができるエージェント)に貼って実行する
4. 作成後、`~/.gemini/skills/<スキル名>/SKILL.md` ができていることを確認する

チャット専用の AI(ファイルを作れない)の場合は [`00_universal-converter.md`](./00_universal-converter.md) を使います。元の SKILL.md を貼ると、その AI 向けの形に書き換えてくれます。

## ファイル一覧

| ファイル | 元スキル | 方式 | 備考 |
|---|---|---|---|
| [`00_universal-converter.md`](./00_universal-converter.md) | 全スキル共通 | 変換 | 元 SKILL.md を貼って変換させる |
| [`01_consultant-mode.md`](./01_consultant-mode.md) | consultant-mode | 自己完結 | 「検討」で起動する壁打ちモード |
| [`02_plan-creator.md`](./02_plan-creator.md) | plan-creator | 自己完結 | 採用案から実装計画書を作る |
| [`03_researcher.md`](./03_researcher.md) | researcher | 自己完結 | 「調査して」で起動する1回完結のリサーチ |
| [`04_safe-push.md`](./04_safe-push.md) | safe-push | 自己完結 | シークレット検査つきプッシュ |
| [`05_git-workflow.md`](./05_git-workflow.md) | git-workflow | 自己完結 | レビュー → 承認 → プッシュ |
| [`06_imozuru.md`](./06_imozuru.md) | imozuru | リポジトリ取得+変換 | Python スクリプトが必要(シェルとネット接続が要る) |
| [`07_auto-flow.md`](./07_auto-flow.md) | auto-flow | リポジトリ取得+変換 | 他スキルに依存。Gemini 版は常に PR 止め |

- **自己完結**: プロンプトの中に仕様の全文が入っています。リポジトリにアクセスできなくても使えます
- **リポジトリ取得+変換**: 元が大きい(imozuru は SKILL.md だけで約35KB、スクリプトも同梱)ため、AI に公開リポジトリを取得させ、変換ルールを適用させます。シェルとネット接続のあるエージェント向けです

## 推奨する作成順

依存関係があるため、次の順で作ってください。

```
01 consultant-mode ─┐
02 plan-creator ────┤
03 researcher ──────┼─→ 07 auto-flow
04 safe-push ───────┘
05 git-workflow(単体利用。auto-flow は使わない)
06 imozuru(独立)
```

`01` の `references/handoff_format.md` は `02` と `07` が読むので、`01` を先に作ります。

## Claude Code → Gemini CLI 読み替え表

各プロンプトには、この表を要約した「共通ルール」が入っています。

| Claude Code | Gemini CLI での読み替え |
|---|---|
| `~/.claude/skills/<名前>/` | `~/.gemini/skills/<名前>/`(プロジェクト単位は `.gemini/skills/`) |
| `~/.claude/handoff/` | `~/.gemini/handoff/` |
| `CLAUDE.md` | `GEMINI.md` |
| `Write` / `Edit` / `Read` | `write_file` / `replace` / `read_file` |
| `Bash` | `run_shell_command` |
| `WebSearch` / `WebFetch` | `google_web_search` / `web_fetch` |
| `Agent` ツール(サブエージェント) | サブエージェントが使えるならそれ。使えなければ同じセッションで役割を切り替えて順に実行 |
| `model: haiku / sonnet / opus` | 軽量 → 標準 → 高性能の3段(例: Flash-Lite または Flash → Pro)。使えるモデル名は環境に合わせる |
| frontmatter の `disable-model-invocation` / `hooks` / `model` | 削除(`name` と `description` だけ残す) |
| `settings.json` の hooks | Gemini 版では移植しない(下記) |

## 移植で変わる点・注意

- **hooks(auto-flow のガード)は移植しません**。`af_guard.py` / `git_guard.py` / `prompt_token.py` は Claude Code のフック仕様(`PreToolUse`、`UserPromptSubmit`、`CLAUDE_SESSION_ID`)に依存しています。そのため Gemini 版の auto-flow は G8(ガード認可)を不合格に固定し、**main へ自動マージせず必ず PR 止め**にします。元の設計でも、ガードがない状態は PR 止めになる安全側の挙動です
- **サブエージェントの独立性**: auto-flow の「新規コンテキストで行うレビュー」は、サブエージェントが使えない環境では独立性が弱まります。同じセッションで行う場合は、実装時の会話を参照しない約束で行います
- **起動の仕組み**: Claude 版は frontmatter の `description` で自動起動を判断します。Gemini CLI のスキルも `description` で起動を判断するため、トリガー語は `description` に残しています
- **私が検証していないこと**: Gemini CLI のツール名・スキルの配置先・モデル名は、公開情報と本リポジトリの既存 README(`~/.gemini/skills/`)に基づく読み替えです。実際の環境で動作確認してください。違いがあれば、読み替え表を直せば各プロンプトの「共通ルール」も同様に直せます
- **imozuru の出典**: 元は [MaryCache/imozuru](https://github.com/MaryCache/imozuru)(MIT)です。移植しても `LICENSE` を残してください
- **git-workflow のコーディング規約**: 元の `coding_standards.md` は別プロジェクト(Next.js)専用の内容です。移植時は自分のプロジェクトの規約に置き換えてください

## このリポジトリの既存スキルとの関係

| 既存(このリポジトリ) | 対応する Claude 版 |
|---|---|
| [`system-design-consultant`](../system-design-consultant/) | consultant-mode(handoff 保存・解除トリガーの細則は Claude 版のほうが詳しい) |
| [`implementation-planner`](../implementation-planner/) | plan-creator |
| [`git-push-automation`](../git-push-automation/) | safe-push / git-workflow |

既存スキルと同じ役割のものを `~/.gemini/skills/` に重ねて入れると、起動が競合します。置き換えるか、片方だけを使ってください。
