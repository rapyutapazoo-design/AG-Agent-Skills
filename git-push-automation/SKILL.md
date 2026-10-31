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

ユーザーから「変更をレビューしてプッシュして」「コミットを作って」などの指示を受けた場合、以下のステップを順番に必ず実行してください。なお、`references/`・`assets/`・`scripts/` のパスはすべて**このスキルのディレクトリからの相対パス**として解決します。

1. **ブランチとステータスの確認 (Analyze)**
   - `git branch --show-current` を実行し、現在のブランチ名を取得します。
   - `git status` を実行し、未追跡のファイルや変更されたファイルを確認します。
   - `git diff` および `git diff --cached` を実行して、具体的な変更内容を抽出します。
   - 変更が無い場合は「コミットする変更がありません」と伝えて終了します。

2. **セキュリティとコーディング規約のチェック (Security & Rule Check)**
   - `references/security_rules.md` と `references/coding_rules.md` を読み込みます。
   - このスキルのディレクトリ内に `scripts/check_secrets.py` が存在し、Python が使える場合は、ステージ済みの差分に対して実行し、JSON の結果を取得します（`git add` 前の変更は、対象ファイルをステージした状態で実行する）。スクリプトが無い、または使えない場合は、抽出した差分を目視で `security_rules.md` の🔴項目に照らして**厳密にチェック**します。スクリプトの結果は参考で、🔴の最終判断は規約に照らして自分で行います。
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
