# 05 git-workflow(レビュー → 承認 → プッシュ)

「レビューして」でコードレビューのみ、「コミットして」「プッシュして」でレビュー → 承認 → コミット・プッシュまで進むスキルです。承認なしにはプッシュしません。

- 元: https://github.com/rapyutapazoo-design/claude-skills/tree/master/git-workflow
- 作成されるファイル: `SKILL.md`、`assets/review_template.md`、`references/coding_standards.md`、`scripts/analyze_diff.py`
- **`coding_standards.md` は元が別プロジェクト(星空スポット連携の Next.js / TypeScript)専用**です。以下では自分のプロジェクトの規約に差し替える前提の雛形にしています。プロンプト内の `<<ここに自分の規約>>` を書き換えるか、空のまま作ってから後で編集してください
- 元の SKILL.md の観点(型安全性、React/Next.js、命名、エラーハンドリング、パフォーマンス)も Next.js 前提です。他言語のプロジェクトでは、観点を差し替えてください
- 元リポジトリの CLAUDE.md は「git 書き込みはこのスキル経由のみ」と定めています。Gemini 側で同じ制約にしたい場合は、`GEMINI.md` に同趣旨の1節を足してください(任意)

## ▼ コピペ用プロンプト

~~~~
`~/.gemini/skills/git-workflow/` に Gemini CLI のスキルを作成してください。下記のファイルを書き、続けてスクリプトを取得します。ディレクトリが無ければ作成します。既存ファイルがある場合は、上書きせず先に私に確認してください。

========== ファイル1: ~/.gemini/skills/git-workflow/SKILL.md ==========
---
name: git-workflow
description: Use this skill for code review AND git commit/push operations. Auto-triggers on review requests like "レビューして", "コードを確認して", "変更を見て", "差分を教えて", "review my code", "check changes". Also activates when the user wants to commit or push: "コミットして", "プッシュして", "GitHubにあげて", "変更を保存して". When pushing, this skill ALWAYS runs a code review first and requires explicit user approval before executing any git write operation. This is the only permitted path for push in this project.
---

# Git Workflow Skill

コードレビューと、レビュー承認後のコミット・プッシュを一貫して担うスキル。

**2つのモード:**
- **モードA（レビューのみ）**: 差分を分析してフィードバックを提供する。プッシュはしない。
- **モードB（レビュー → 承認 → プッシュ）**: 必ずレビューを先に実施し、ユーザーの明示的な承認を得てからコミット・プッシュを実行する。

> **原則**: プッシュはこのスキル内のフローでのみ実行する。スキル外からの直接実行は禁止されている。

---

## モードの判断

ユーザーの発言から意図を読み取り、モードを選択する:

| ユーザーの発言例 | モード |
|----------------|--------|
| 「レビューして」「変更を確認して」「差分を見て」 | **A: レビューのみ** |
| 「コミットして」「プッシュして」「GitHubにあげて」 | **B: レビュー → 承認 → プッシュ** |
| 意図不明（スキル名だけの呼び出しなど） | ユーザーに「レビューだけ？それともプッシュまで？」と確認してからモードを決める |

---

## モードA: レビューのみ

### A-1. 変更内容を分析する

```
python3 ~/.gemini/skills/git-workflow/scripts/analyze_diff.py
```

結果の処理:
- `status: error` → エラー内容を伝え、`git init` を提案して終了する
- `file_count: 0` → 「レビューする変更がありません」と伝えて終了する
- `status: ok` → 次へ進む

### A-2. コーディング規約を参照する

`~/.gemini/skills/git-workflow/references/coding_standards.md` を読み込み、プロジェクトの規約を把握する。

### A-3. 差分をレビューする

差分と規約を照合し、以下の観点で評価する（プロジェクトの技術スタックに合わせて差し替えてよい）:

- **型安全性**: `any` 使用・型の明示不足・非nullアサーション (`!`) の誤用
- **React/Next.js パターン**: Server/Client Components の使い分け、hooksのルール、コンポーネント設計
- **命名・構成**: 命名規則・ファイル配置・インポート順序
- **エラーハンドリング**: 外部API呼び出しの `try/catch`、エラー境界
- **パフォーマンス**: 不要な再レンダリング、クライアントで動くべきでない重い処理

### A-4. レビュー結果を出力する

`~/.gemini/skills/git-workflow/assets/review_template.md` のフォーマットで結果を出力する。

重要度の表記:
- 🔴 **要修正**: バグ・規約違反など必ず直すべき問題
- 🟡 **推奨**: 品質向上のための提案
- 🟢 **良い点**: 良い実装を積極的に評価する（省略しないこと）

### A-5. 次のアクションを提案する

- 🔴 要修正がある場合 → 具体的な修正コードを示す
- 問題なし or 🟡のみ → 「問題なければ git-workflow でプッシュまで進められます」と案内する

---

## モードB: レビュー → 承認 → プッシュ

**プッシュは必ずレビューの後。承認なしには絶対に実行しない。**

### B-1〜B-4. レビューを実施する

モードAの **A-1〜A-4 と同じ手順** でレビューを実施し、結果を出力する。

### B-5. 承認を求める（ゲート）

レビュー結果を提示した後、**必ずユーザーに確認する**:

> 「レビュー結果を確認しました。このままコミット・プッシュを進めてよいですか？」

応答に応じた分岐:

| ユーザーの応答 | 動作 |
|--------------|------|
| 「はい」「OK」「問題ない」「進めて」 | B-6 へ進む |
| 「いいえ」「修正する」「待って」 | **ここで終了。プッシュしない。** 修正のサポートを申し出る |
| 🔴 要修正がある状態で「進めて」 | 「要修正の問題が残っています。修正してからプッシュすることを推奨します。それでも続けますか？」と再確認する |

### B-6. コミット対象を確認する

> 「どのファイルをコミットしますか？」
> - 「全部」または `all` → 変更ファイルをすべてステージング
> - ファイルパス指定 → 指定ファイルのみ

以下は **絶対にコミットしない**:
- `node_modules/`、`.next/`、`.env`、`.env.local`、`*.log`、`.DS_Store`

`git add .` を使う前に `.gitignore` の内容を確認すること。

### B-7. コミットメッセージを生成する

差分の内容から変更の本質を読み取り、**Conventional Commits** 形式のメッセージを提案する:

```
<type>(<scope>): <日本語サマリー（50文字以内）>

[任意: 変更の詳細・背景]
```

**type の選択基準:**

| type | 使い所 |
|------|--------|
| `feat` | 新機能追加 |
| `fix` | バグ修正 |
| `refactor` | リファクタリング（動作変更なし） |
| `style` | フォーマット変更（ロジック変更なし） |
| `docs` | ドキュメント・コメントの変更 |
| `chore` | ビルド設定・依存関係 |
| `perf` | パフォーマンス改善 |
| `test` | テストの追加・修正 |

**scope** はモジュール名（例: `spots`, `scoring`, `weather`, `ui`）。省略可。

ユーザーに確認: 「このメッセージでよいですか？」修正を求められたら直して再確認する。

### B-8. ステージング・コミット・プッシュを実行する

```bash
git add <対象ファイルまたは .>
git commit -m "<承認されたコミットメッセージ>"
git push origin <現在のブランチ名>
```

初回プッシュ（リモートブランチが存在しない場合）:
```bash
git push --set-upstream origin <ブランチ名>
```

### B-9. 完了を報告する

コミットハッシュとメッセージを表示して完了を伝える。

必要に応じて提案する:
- PR作成が必要な場合 → `gh pr create` を案内する
- CI/CDが設定されている場合 → GitHub Actions の確認を促す

---

## エラーハンドリング

| エラー | 対処法 |
|------|--------|
| Gitリポジトリなし | `git init` を提案し、その後 `git remote add origin <URL>` を案内する |
| リモートなし | `git remote add origin <GitHub URL>` の設定を促す |
| Push rejected | `git pull --rebase origin <ブランチ名>` 後に再プッシュを提案する |
| 認証エラー | SSH鍵の設定または `gh auth login` を案内する |
| マージコンフリクト | `git status` でコンフリクトファイルを確認し、解消方法を説明する |

========== ファイル2: ~/.gemini/skills/git-workflow/assets/review_template.md ==========
# コードレビュー結果

**ブランチ**: `{branch}`
**最終コミット**: {last_commit}
**レビュー日時**: {datetime}

---

## 概要

{変更の目的・背景を1〜2文で要約}

---

## 変更ファイル

| ファイル | 変更種別 | 主な変更内容 |
|---------|---------|------------|
| {path} | {追加/修正/削除} | {一言説明} |

---

## レビュー結果

### 🔴 要修正

{必ず直すべき問題。バグ・型エラー・規約違反など。なければ「なし」}

---

### 🟡 推奨改善

{できれば改善したい点。コード品質・可読性・パフォーマンスなど。なければ「なし」}

---

### 🟢 良い点

{良い実装、改善されている点を積極的に書く。省略しないこと}

---

## 総評

{全体評価と次のアクション提案}

---

**👉 プッシュを続ける場合**: 「このままコミット・プッシュしてよいですか？」に「はい」と答えてください。
**👉 修正してからプッシュする場合**: 「修正する」と答えてください。

========== ファイル3: ~/.gemini/skills/git-workflow/references/coding_standards.md ==========
# コーディング規約

レビュー時はこの規約と照合すること。

<<ここに自分のプロジェクトの規約を書く。空のままなら、下の「雛形」をそのまま作成する>>

## 雛形（元スキルの規約を一般化したもの）
### TypeScript
- `any` 禁止（型不明は `unknown` + 型ガード）
- 関数の引数・戻り値に型を付ける（推論できる場合は省略可）
- 非nullアサーション (`!`) 禁止。`as` キャストは最小限
- 基本は `type`。継承・拡張が必要なときだけ `interface`

### React / Next.js
- デフォルトは Server Component。`"use client"` は末端の小さなコンポーネントだけに付ける
- データ取得は Server Component 側で行う
- コンポーネントは PascalCase、ファイル名はコンポーネント名と一致、1ファイル1コンポーネント
- hooks は `use` プレフィックス。条件分岐・ループ内で呼ばない。`useEffect` の依存配列を正確に指定する

### 構成
- `lib/` に UI コードを書かない。`components/` に API 呼び出し・複雑なロジックを書かない
- インポート順: React → Next.js → 外部ライブラリ → 内部 lib → 内部 components → スタイル

### その他
- `console.log` を本番コードに残さない
- 外部 API 呼び出しは `try/catch` で囲む
- 意図が分かりにくい箇所には日本語コメント。型定義・関数名は英語
- マジックナンバーは定数に切り出して命名する

========== スクリプトの取得 ==========
次のスクリプトを `~/.gemini/skills/git-workflow/scripts/analyze_diff.py` に保存してください（`git diff` を構造化 JSON で出力するスクリプト）。

1. `mkdir -p ~/.gemini/skills/git-workflow/scripts` のあと、`curl -fsSL https://raw.githubusercontent.com/rapyutapazoo-design/claude-skills/HEAD/git-workflow/scripts/analyze_diff.py -o ~/.gemini/skills/git-workflow/scripts/analyze_diff.py` で取得する
2. **実行する前に中身を表示して私に見せ、`git` コマンドの読み取り以外の処理（書き込み、ネットワーク通信、ファイル削除）が無いことを確認した結果を報告する**
3. ネットワークに接続できない場合は取得を諦め、「スクリプト無しで運用する（`git status` / `git diff` を直接使う）」と報告する。自分でスクリプトを作り直さない

========== 完了確認 ==========
`ls -R ~/.gemini/skills/git-workflow` を実行し、結果を報告してください。
~~~~
