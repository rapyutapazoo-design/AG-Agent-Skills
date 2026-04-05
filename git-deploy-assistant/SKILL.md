---
name: git-deploy-assistant
description: Use this skill when the user asks to review changes, create a commit, or push code. It automates checking git status/diff, reviewing against coding rules, generating a commit message, and pushing to the remote repository.
---

# Git Deploy Assistant

このスキルは、現在作業中の未コミットの変更をレビューし、コミットメッセージを作成してリモートリポジトリへ安全にプッシュ（デプロイ）するためのアシスタントです。

## ワークフロー (Steps)

ユーザーから「変更をレビューしてプッシュして」「コミットを作って」などの指示を受けた場合、以下のステップを順番に必ず実行してください。

1. **ブランチとステータスの確認 (Analyze)**
   - `git branch --show-current` を実行し、現在のブランチ名を取得します。
   - `git status` を実行し、未追跡のファイルや変更されたファイルを確認します。
   - `git diff` および `git diff --cached` を実行して、具体的な変更内容を抽出します。

2. **セキュリティとコーディング規約のチェック (Security & Rule Check)**
   - `references/coding_rules.md` のルールを `view_file` で読み込みます。
   - 抽出した差分（diff）に対して、機密情報（APIキー、トークン、パスワード等）が直書きされていないか**厳密にチェック**してください。
   - `coding_rules.md` の他のルール（Kintone/GAS特有の注意点やフォーマットなど）に違反していないか確認します。
   - **もし問題が見つかった場合は、ユーザーに修正内容を提案し、プッシュ処理を中断してください。**

3. **コミットメッセージの作成 (Draft Commit)**
   - チェックをパスした場合、`assets/commit_template.md` のフォーマットを読み込みます。
   - 変更内容を要約し、テンプレートに沿ったコミットメッセージ案（タイトル・本文）を作成します。

4. **最終確認と実行 (Confirm & Execute)**
   - ユーザーに対して以下の3点を提示し、**実行の承認（許可）を求めてください。**
     1. 現在チェックアウトしている**ブランチ名**（ここにプッシュしてよいかの確認）
     2. 指摘事項のサマリー（あれば）
     3. 作成した**コミットメッセージ案**
   - ユーザーからの明確な承認（「OK」「進めて」など）が得られた場合のみ、以下のコマンドを実行します。
     - `git add .` (または指定されたファイル)
     - `git commit -m "<コミットメッセージ案>"`
     - `git push origin <現在のブランチ名>`

> [!WARNING]
> ユーザーの承認を得るまでは、絶対に `git commit` や `git push` を実行してはいけません。機密チェックとブランチ確認は必須です。
