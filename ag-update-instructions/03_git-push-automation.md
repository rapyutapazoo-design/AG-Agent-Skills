# 03 git-push-automation の更新

## 変更の目的

- 検査結果を 🔴(プッシュ禁止) / 🟡(承認で続行) / 🟢(問題なし) の3段階に分け、判定基準を明確にする
- 除外ファイルの一覧を明記する(Kintone プラグインの秘密鍵 `*.ppk`、clasp の認証情報 `.clasprc.json` を追加)
- `references/coding_rules.md`(Kintone / GAS の独自規約)は**そのまま維持**し、🟡 の根拠として使う
- エラー対処表を追加する
- 任意でシークレット検出スクリプトを追加する(Python が使えない環境では手動チェックのまま)

## ▼ コピペ用プロンプト

~~~~
このリポジトリの `git-push-automation` スキルを更新してください。対象は次のとおりです。

- `git-push-automation/SKILL.md`（置き換え）
- `git-push-automation/references/security_rules.md`（新規）
- `git-push-automation/scripts/check_secrets.py`（任意・新規。取得できた場合のみ）

**`git-push-automation/references/coding_rules.md` と `git-push-automation/assets/commit_template.md` は変更しないでください。**

【進め方】
1. 先に `git-push-automation/SKILL.md`、`references/coding_rules.md`、`assets/commit_template.md` を読み、変更の要約（足す・変える・残す）を示す
2. 下記の内容で2ファイルを作成・更新する。**内容は一字も変えずにそのまま書く**
3. スクリプトの取得（任意）:
   - `mkdir -p git-push-automation/scripts`（Windows では同等のコマンド）の後、`curl -fsSL https://raw.githubusercontent.com/rapyutapazoo-design/claude-skills/HEAD/safe-push/scripts/check_secrets.py -o git-push-automation/scripts/check_secrets.py` で取得する
   - **実行する前に中身を全文表示し、`git` コマンドの読み取りと正規表現検査以外の処理（ネットワーク通信、ファイル書き込み・削除、外部コマンド実行）が無いことを確認した結果を報告する**。問題があれば削除して報告する
   - `python3`（Windows では `python`）が使えるか確認する。使えない、またはネットワークに接続できない場合は取得を諦め、「スクリプト無しで運用する（SKILL.md の手動チェック）」と報告する。自分でスクリプトを作り直さない
   - 取得した場合でも、ファイルは**改変しない**
4. 完了後、`git diff` と `git status` を表示する。`git add` / `git commit` / `git push` は実行しない
5. 変更点を箇条書きで報告する

========== git-push-automation/SKILL.md ==========
---
name: git-push-automation
description: ACTIVATED ONLY when the user explicitly requests to "commit and push" or "deploy" code (e.g. "プッシュして", "コミットして", "変更をレビューしてプッシュして"). This skill automates git workflows with a three-level security check (red = push blocked, yellow = needs approval, green = ok). NOT activated by review-only requests such as "レビューして" (use the code-review skill) and NOT by mere mentions of this skill.
---

# Git Deploy Assistant

このスキルは、現在作業中の未コミットの変更をレビューし、コミットメッセージを作成してリモートリポジトリへ安全にプッシュ（デプロイ）するためのアシスタントです。

## 重大度の判定

| 記号 | 意味 | プッシュへの影響 |
|------|------|----------------|
| 🔴 要修正 | 認証情報のハードコード、除外ファイルの混入（`references/security_rules.md`） | **プッシュ禁止**。修正するまで進めない |
| 🟡 注意 | `coding_rules.md` の違反、デバッグ文の残存、TODO/FIXME の新規追加など | ユーザーの承認があれば続行できる |
| 🟢 問題なし | 該当なし | そのまま最終確認へ進む |

## ワークフロー (Steps)

ユーザーから「変更をレビューしてプッシュして」「コミットを作って」などの指示を受けた場合、以下のステップを順番に必ず実行してください。

1. **ブランチとステータスの確認 (Analyze)**
   - `git branch --show-current` を実行し、現在のブランチ名を取得します。
   - `git status` を実行し、未追跡のファイルや変更されたファイルを確認します。
   - `git diff` および `git diff --cached` を実行して、具体的な変更内容を抽出します。
   - 変更が無い場合は「コミットする変更がありません」と伝えて終了します。

2. **セキュリティとコーディング規約のチェック (Security & Rule Check)**
   - `references/security_rules.md` と `references/coding_rules.md` を読み込みます。
   - `scripts/check_secrets.py` が存在し、Python が使える場合は、ステージ済みの差分に対して実行し、JSON の結果を取得します（`git add` 前の変更は、対象ファイルをステージした状態で実行する）。スクリプトが無い、または使えない場合は、抽出した差分を目視で `security_rules.md` の🔴項目に照らして**厳密にチェック**します。スクリプトの結果は参考で、🔴の最終判断は規約に照らして自分で行います。
   - 変更ファイル名を `security_rules.md` の除外ファイル一覧と照合します（スクリプトの有無に関わらず必ず行う）。
   - `coding_rules.md` の他のルール（Kintone/GAS特有の注意点やフォーマットなど）への違反は🟡として扱います。
   - 結果を🔴/🟡/🟢 に分けて一覧で提示します。
   - **🔴が1件でもある場合は、ユーザーに修正内容を提案し、プッシュ処理を中断してください。**

3. **コミットメッセージの作成 (Draft Commit)**
   - 🔴が無い場合、`assets/commit_template.md` のフォーマットを読み込みます。
   - 変更内容を要約し、テンプレートに沿ったコミットメッセージ案（タイトル・本文）を作成します。

4. **最終確認と実行 (Confirm & Execute)**
   - ユーザーに対して以下の3点を提示し、**実行の承認（許可）を求めてください。**
     1. 現在チェックアウトしている**ブランチ名**（ここにプッシュしてよいかの確認）
     2. 指摘事項のサマリー（🟡があれば一覧。🟡のまま進める承認も含む）
     3. 作成した**コミットメッセージ案**
   - ユーザーからの明確な承認（「OK」「進めて」など）が得られた場合のみ、以下のコマンドを実行します。
     - `git add <対象ファイル>`（`git add .` を使う前に `.gitignore` の内容と `git status` を確認する。除外ファイルは絶対に add しない）
     - `git commit -m "<コミットメッセージ案>"`
     - `git push origin <現在のブランチ名>`（リモートブランチが無い初回は `git push --set-upstream origin <ブランチ名>`）
   - 完了後、コミットハッシュとメッセージを表示して報告します。

> [!WARNING]
> ユーザーの承認を得るまでは、絶対に `git commit` や `git push` を実行してはいけません。機密チェックとブランチ確認は必須です。

## エラーハンドリング

| エラー | 対処法 |
|--------|--------|
| Gitリポジトリなし | `git init` を提案する（自動では実行しない） |
| リモートなし | `git remote add origin <URL>` を案内する |
| Push rejected | `git pull --rebase origin <ブランチ名>` 後に再プッシュすることを提案する |
| 認証エラー | SSH鍵の設定、または `gh auth login` を案内する |
| マージコンフリクト | `git status` でコンフリクトファイルを確認し、解消方法を説明する |

========== git-push-automation/references/security_rules.md ==========
# セキュリティチェック規約（🔴 プッシュ禁止項目）

プッシュ前に必ず確認する項目。1件でも該当すれば🔴としてプッシュを中断する。
Kintone / GAS / Web フロントエンド向けの品質規約は `coding_rules.md`（🟡）を参照する。

## 🔴 シークレット漏洩チェック（必須）

以下のパターンがコード内にハードコードされていないか確認する。

- AWS: `AKIA[0-9A-Z]{16}`
- GCP: `AIza[0-9A-Za-z\-_]{35}`
- GitHub: `ghp_` / `gho_` / `ghs_` / `ghr_` で始まるトークン
- Slack: `xox[baprs]-` で始まるトークン
- Stripe: `sk_live_` / `pk_live_` で始まるキー
- 汎用: `secret`, `api_key`, `apikey`, `password`, `passwd`, `token` などのキー名に実際の値が代入されている箇所
- Kintone: APIトークン文字列、`X-Cybozu-API-Token`・`Authorization` ヘッダーの値の直書き、サブドメイン付きURL＋認証情報
- GAS: `PropertiesService` を使わずスクリプト内に直書きされたキー、Webhook URL のシークレット部分
- 接続文字列: `postgresql://` / `mysql://` / `mongodb://` ＋認証情報、`://user:password@` 形式

## 🔴 除外ファイルチェック（必須）

以下がステージングやコミット対象に含まれていないか、変更ファイル名で確認する。

- `.env` / `.env.local` / `.env.production` など環境変数ファイル
- `node_modules/`
- `*.log`
- `.DS_Store`
- `*.pem` / `*.key` / `*.p12`（秘密鍵）
- **`*.ppk`**（Kintone プラグインの署名用秘密鍵）
- **`.clasprc.json`**（clasp の認証トークン）
- `credentials.json` / `service-account.json`

## 🟡 注意項目（承認で続行可）

- `TODO` / `FIXME` / `HACK` が新たに追加されている
- `console.log` / `Logger.log` / `debugger` などのデバッグ文が残っている（詳細は `coding_rules.md`）
- 外部API呼び出しに例外処理が無い、エラーを握りつぶしている（`catch(e) {}`）
- 内部URL・IPアドレス・`localhost` が本番コードにハードコードされている
- コメントに機密情報・社内情報、テストデータに個人情報が含まれている
- `coding_rules.md` の違反
========== 以上 ==========
~~~~
