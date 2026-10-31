# 04 safe-push(セキュリティチェック付きプッシュ)

「安全確認してプッシュ」「セキュリティチェックしてプッシュ」「safe-push」で起動します。プッシュ前にシークレット漏洩・除外ファイル混入・デバッグ文残留を検出し、問題がなければコミット・プッシュまで進みます。🔴 が1件でもあればプッシュしません。

- 元: https://github.com/rapyutapazoo-design/claude-skills/tree/master/safe-push
- 作成されるファイル: `SKILL.md`、`references/security_rules.md`、`assets/review_template.md`、`scripts/check_secrets.py`
- `check_secrets.py` は公開リポジトリから取得します(取得できない環境では、スクリプト無しで `git diff --cached` を手動チェックする元のフォールバックに従います)
- このリポジトリの [`git-push-automation`](../git-push-automation/) と役割が重なります。どちらか一方だけ入れてください

## ▼ コピペ用プロンプト

~~~~
`~/.gemini/skills/safe-push/` に Gemini CLI のスキルを作成してください。下記の3ファイルを、内容を変えずにそのまま書き、続けてスクリプトを取得します。ディレクトリが無ければ作成します。既存ファイルがある場合は、上書きせず先に私に確認してください。

========== ファイル1: ~/.gemini/skills/safe-push/SKILL.md ==========
---
name: safe-push
description: 「安全確認してプッシュ」「セキュリティチェックしてプッシュ」「レビューしてプッシュ」「safe-push」をトリガーに起動するセキュリティレビュー付きプッシュスキル。プッシュ前にシークレット漏洩・除外ファイル混入・デバッグ文残留を自動検出し、問題がなければそのままコミット・プッシュまで完結する。APIキーや.envファイルの混入リスクが心配な場合、GitHubへのプッシュ前に安全確認したい場合にも使う。
---

# セキュリティレビュー & プッシュスキル (Safe Push)

プッシュ前にセキュリティ・品質チェックを自動実行し、問題がなければそのままコミット・プッシュまで完結するスキル。

---

## フロー概要

```
差分取得 → 自動チェック → レビュー結果出力 → 承認ゲート → コミット・プッシュ
```

---

## ステップ 1: ステージ状態の確認

```
git diff --cached --name-only
```

変更がない場合は「ステージされた変更がありません。`git add` してから再実行してください。」と伝えて終了。

---

## ステップ 2: 自動セキュリティチェックの実行

以下のスクリプトを実行し、結果のJSONを取得する（プロジェクト内の `.gemini/skills/safe-push/scripts/` にあればそちらを優先）:

```
python3 ~/.gemini/skills/safe-push/scripts/check_secrets.py
```

スクリプトが利用できない場合は、`references/security_rules.md` を読み込み、`git diff --cached` の内容を手動でチェックする。

---

## ステップ 3: レビュー結果の出力

`assets/review_template.md` のフォーマットに従い、チェック結果を出力する。

### 重要度の判定基準

| 記号 | 意味 | プッシュへの影響 |
|------|------|----------------|
| 🔴 要修正 | シークレット漏洩・除外ファイル混入 | **プッシュ禁止** |
| 🟡 注意 | デバッグ文残留・TODOコメントなど | ユーザー承認で続行可 |
| 🟢 問題なし | 該当なし | そのまま続行 |

---

## ステップ 4: 承認ゲート

レビュー結果を提示した後、必ずユーザーに確認する:

> 「レビュー結果を確認しました。このままコミット・プッシュを進めてよいですか？」

| 状況 | 動作 |
|------|------|
| 🔴 が1件でもある | 「🔴 の問題を修正するまでプッシュできません。」と伝えて**終了** |
| 🟡 のみ・ユーザーが「はい」 | ステップ 5 へ進む |
| 🟢 のみ | 自動的にステップ 5 へ進む |
| ユーザーが「いいえ」「修正する」 | **終了**。修正のサポートを申し出る |

---

## ステップ 5: コミット対象の確認

> 「どのファイルをコミットしますか？」
> - 「全部」または `all` → 変更ファイルをすべてステージング
> - ファイルパス指定 → 指定ファイルのみ

---

## ステップ 6: コミットメッセージの生成

差分の内容から **Conventional Commits** 形式のメッセージを提案する:

```
<type>(<scope>): <日本語サマリー（50文字以内）>
```

ユーザーに確認し、承認を得てから次へ進む。

---

## ステップ 7: コミット・プッシュの実行

```bash
git add <対象ファイルまたは .>
git commit -m "<承認されたコミットメッセージ>"
git push origin <現在のブランチ名>
```

初回プッシュの場合:
```bash
git push --set-upstream origin <ブランチ名>
```

---

## ステップ 8: 完了報告

コミットハッシュとメッセージを表示して完了を伝える。

---

## エラーハンドリング

| エラー | 対処法 |
|--------|--------|
| Gitリポジトリなし | `git init` を提案 |
| リモートなし | `git remote add origin <URL>` を案内 |
| Push rejected | `git pull --rebase origin <ブランチ名>` 後に再プッシュを提案 |
| 認証エラー | SSH鍵設定または `gh auth login` を案内 |

========== ファイル2: ~/.gemini/skills/safe-push/references/security_rules.md ==========
# セキュリティレビュールール

プッシュ前に必ず確認するセキュリティ・品質チェック項目。

---

## 🔴 シークレット漏洩チェック（必須）

以下のパターンがコード内にハードコードされていないか確認する。

### APIキー・トークン
- AWS: `AKIA[0-9A-Z]{16}` 形式のアクセスキー
- GCP: `AIza[0-9A-Za-z\-_]{35}` 形式のAPIキー
- GitHub: `ghp_[0-9a-zA-Z]{36}` / `gho_` / `ghs_` / `ghr_` 形式のトークン
- Slack: `xox[baprs]-` で始まるトークン
- Stripe: `sk_live_` / `pk_live_` で始まるキー
- 汎用パターン: `secret`, `api_key`, `apikey`, `password`, `passwd`, `token` などのキー名に値が代入されている箇所

### 接続文字列
- データベースURL: `postgresql://`, `mysql://`, `mongodb://` + 認証情報を含むもの
- `://user:password@` 形式

---

## 🔴 除外ファイルチェック（必須）

以下のファイルがステージングに含まれていないか確認する。

- `.env` / `.env.local` / `.env.production` など環境変数ファイル
- `node_modules/` ディレクトリ
- `*.log` ログファイル
- `.DS_Store`
- `*.pem` / `*.key` / `*.p12` 秘密鍵ファイル
- `credentials.json` / `service-account.json`

---

## 🟡 コード品質チェック（推奨）

- `TODO` / `FIXME` / `HACK` コメントが新たに追加されていないか
- `console.log` / `print` / `debugger` などのデバッグ文が残っていないか
- 外部API呼び出しに `try/catch` が実装されているか
- エラーが握りつぶされていないか（`except: pass` / `catch(e) {}` など）

---

## 🟡 公開リスクチェック（推奨）

- 内部URLやIPアドレスがハードコードされていないか（`192.168.`, `10.0.`, `localhost` を本番コードに含む場合）
- コメントに機密情報・社内情報が含まれていないか
- 個人情報（メールアドレス・電話番号・氏名）がテストデータとして残っていないか

========== ファイル3: ~/.gemini/skills/safe-push/assets/review_template.md ==========
# セキュリティレビュー結果

## 対象ファイル
{{staged_files}}

---

## チェック結果

### 🔴 シークレット漏洩
{{secrets_result}}

### 🔴 除外ファイル
{{excluded_files_result}}

### 🟡 デバッグ文の残留
{{debug_result}}

---

## 総合判定

{{overall_judgment}}

---

> ⚠️ 🔴 項目が1件でもある場合、プッシュは実行しません。修正後に再度お試しください。
> このままプッシュを続ける場合は「承認してプッシュ」とお伝えください（🟡のみの場合）。

========== スクリプトの取得 ==========
次のスクリプトを `~/.gemini/skills/safe-push/scripts/check_secrets.py` に保存してください（`git diff --cached` を解析し、シークレットと除外ファイルを JSON で出力するスクリプト）。

1. `curl -fsSL https://raw.githubusercontent.com/rapyutapazoo-design/claude-skills/HEAD/safe-push/scripts/check_secrets.py -o ~/.gemini/skills/safe-push/scripts/check_secrets.py` で取得する（先に `mkdir -p ~/.gemini/skills/safe-push/scripts`）
2. 取得後、**実行する前に中身を表示して私に見せ、`git`・正規表現検査以外の処理（ネットワーク通信、ファイル削除、外部コマンド実行）が無いことを確認した結果を報告する**
3. ネットワークに接続できない場合は取得を諦め、「スクリプト無しで運用する（SKILL.md のフォールバック）」と報告する。自分でスクリプトを作り直さない

========== 完了確認 ==========
`ls -R ~/.gemini/skills/safe-push` を実行し、結果を報告してください。
~~~~
