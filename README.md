# AG-Agent-Skills

## 概要
[AG-Agent-Skills](https://github.com/rapyutapazoo-design/AG-Agent-Skills) は、**Antigravity** や **Gemini CLI**、その他の AI コーディングエージェントで共通して使用できる拡張スキル集です。
安全装置付きの設計コンサルティング、実装計画書の作成、コードレビュー、3段階セキュリティチェック付きの Git プッシュ自動化、リサーチ、学習用チューターなど、開発ワークフローを安全かつ効率的に進めるスキルを収録しています。

---

## 収録スキル一覧

各スキルの詳細はリンク先の `README.md` および `SKILL.md` をご確認ください。

| スキル | ディレクトリ | 主なトリガーワード | 概要 |
|---|---|---|---|
| **システム設計コンサルタント** | [system-design-consultant](./system-design-consultant/) | 「〜を検討してください」「検討して」「方針を考えて」「何かアイデアある？」 | コード変更・コマンド実行をブロックし、テキストベースで設計案・推奨案を提案する壁打ちスキル。採用案は `.handoff/` に保存可能 |
| **実装プランナー** | [implementation-planner](./implementation-planner/) | 「実装計画書」「計画書を作成してください」 | 採用された設計案（会話履歴または `.handoff/`）から、対象ファイル・手順・リスク・完了条件を含む計画書を作成し `.handoff/` に保存 |
| **Gitプッシュ自動化** | [git-push-automation](./git-push-automation/) | 「プッシュして」「コミットして」「変更をレビューしてプッシュして」 | 差分に対して 🔴（プッシュ禁止）/ 🟡（承認で続行）/ 🟢（問題なし）の3段階セキュリティ・規約チェックを行い、承認後にコミット＆プッシュを実行 |
| **コードレビュー** | [code-review](./code-review/) | 「レビューして」「コードを確認して」（フルレビュー）<br>「差分を教えて」「変更を見て」（要約モード） | コミット・プッシュを行わない読み取り専用のレビュースキル。依頼の表現に応じて「差分の要約」と「規約に基づくフルレビュー」を出し分け |
| **リサーチャー** | [researcher](./researcher/) | 「調査してください」「調べてください」「リサーチして」 | Web検索・URL取得・ファイル読み取りを駆使して情報を収集し、推奨案や主観を交えず出典付きで1回完結で提示 |
| **コーディング・ガイド・チューター** | [coding-guide-tutor](./coding-guide-tutor/) | 「ガイドしてください」「教えてください」「どのように修正すれば」 | AI が直接コードを書き換えず、学習者が自力で修正できるよう1ステップずつ場所と仕組みを解説するチューター |
| **コードリーディングチューター** | [code-reading-tutor](./code-reading-tutor/) | 「初心者用に解説して」「中級者用に解説して」「上級者用に解説して」 | AI生成コードや既存コードを解析し、レベルに合わせた自己学習用の解説を提供 |

---

## 基本的な適用方法（インストール）

### 1. リポジトリの取得とスキルの配置（シンボリックリンク推奨）
本リポジトリをクローンし、ご利用の環境のスキル読み込みディレクトリからシンボリックリンクを張ることで、**Antigravity** と **Gemini CLI** の両方で同じスキルを最新の状態で共有できます（フォルダごとコピーして配置することも可能です）。

- **Antigravity**: `~/.gemini/config/skills/<スキル名>`
- **Gemini CLI**: `~/.gemini/skills/<スキル名>`（Windows の場合は `C:\Users\<ユーザー名>\.gemini\skills\<スキル名>`）

```bash
git clone https://github.com/rapyutapazoo-design/AG-Agent-Skills.git
cd AG-Agent-Skills

REPO_DIR="$(pwd)"
mkdir -p ~/.gemini/config/skills ~/.gemini/skills
for s in system-design-consultant implementation-planner git-push-automation researcher code-review code-reading-tutor coding-guide-tutor; do
  ln -sfn "$REPO_DIR/$s" ~/.gemini/config/skills/"$s"
  ln -sfn "$REPO_DIR/$s" ~/.gemini/skills/"$s"
done
```

### 2. `.handoff/` の Git グローバル除外設定（推奨）
`system-design-consultant` と `implementation-planner` は、別セッションへの引き継ぎ用ファイル（採用案・計画書）を各リポジトリ直下の `.handoff/` に保存します。各リポジトリの `.gitignore` を変更せずに未追跡ファイルを無視させるため、Git のグローバル除外設定に `.handoff/` を1行追加してください。

```bash
EXCLUDES_FILE=$(git config --global core.excludesFile)
if [ -z "$EXCLUDES_FILE" ]; then
  EXCLUDES_FILE="$HOME/.config/git/ignore"
  mkdir -p "$(dirname "$EXCLUDES_FILE")"
  git config --global core.excludesFile "$EXCLUDES_FILE"
fi
grep -qxF '.handoff/' "$EXCLUDES_FILE" 2>/dev/null || echo '.handoff/' >> "$EXCLUDES_FILE"
```

---

## 関連ドキュメント

- **[claude-skills-porting](./claude-skills-porting/)**: [rapyutapazoo-design/claude-skills](https://github.com/rapyutapazoo-design/claude-skills) と [claude-auto-flow](https://github.com/rapyutapazoo-design/claude-auto-flow) のスキルを Gemini 等で再現するための移植プロンプト集
- **[ag-update-instructions](./ag-update-instructions/)**: Claude 版との差分に基づく段階的アップデート指示書および両環境対応の調整記録（`09_dual-env-adjustments.md`）

---
*Created by rapyutapazoo-design.*
