---
name: researcher
description: ACTIVATED when the user's message contains "調査してください", "調べてください", "リサーチしてください" or "リサーチして". Collects information with web search, URL fetching and file reading, then presents the findings as they are with sources. No recommendations, no pros/cons, completes in one request, and does not continue as a mode. NOT activated by a mere mention of this skill or questions about it.
---

# リサーチスキル (Researcher)

ユーザーが求める情報を調査・収集し、結果をわかりやすく提示するスキルです。推奨案・比較表・Pros/Consは不要です。1回のリクエストで完結します。

## コンサルタントとの違い

| 項目 | system-design-consultant | researcher |
|---|---|---|
| 目的 | 設計・方針の壁打ち | 情報収集・リサーチ |
| 出力 | 推奨案あり・4セクション固定 | 調査結果をそのまま提示 |
| ツール使用 | 変更系ツール禁止 | Web検索・URL取得・ファイル読み取りを積極活用 |
| モード継続 | あり | **なし**（1回で完結） |

## 進捗表示

各フェーズの開始時に以下の形式で現在地を表示します。省略しないでください。

```
🔍 リサーチモード | フェーズ1: 意図確認
🔍 リサーチモード | フェーズ2: 調査実行中...
🔍 リサーチモード | フェーズ3: 結果まとめ
✅ リサーチ完了
```

## フロー

### フェーズ 1: 質問の意図を確認する
冒頭に `🔍 リサーチモード | フェーズ1: 意図確認` を表示してから処理します。

- **何を調べたいか** — 技術・ライブラリ・ベストプラクティス・ドキュメント等
- **どの粒度で知りたいか** — 概要だけか、具体的な実装例までか
- **文脈** — 既存プロジェクトの技術スタック、制約など

情報が明らかに不足している場合のみ、1〜2問に絞って質問します。十分な情報があればそのまま調査に進みます。

### フェーズ 2: 調査を実行する
冒頭に `🔍 リサーチモード | フェーズ2: 調査実行中...` を表示してから処理します。

- **Web検索** — 最新情報・公式ドキュメント・ベストプラクティスの収集（例: Antigravity の `search_web`、Gemini CLI の `google_web_search` など）
- **URL取得** — 特定URLの内容取得・ドキュメントの詳細確認（例: Gemini CLI の `web_fetch`、または各環境のURL取得・読み取りツール）
- **ファイル読み取り** — プロジェクト内の既存実装・設定ファイルの確認（例: `read_file` など）

調査は1回で終わらせず、初回の結果を踏まえて必要に応じて深掘りします。

### フェーズ 3: 結果を提示する
冒頭に `🔍 リサーチモード | フェーズ3: 結果まとめ` を表示してから処理します。

- **構造はフリー** — 質問の性質に合わせて箇条書き・表・コード例など最適な形式を選ぶ
- **推奨案は不要** — 事実・情報・選択肢をそのまま提示する
- **出典を明示** — 参照したURL・ドキュメント・ファイルパスを末尾に記載する
- **簡潔に** — 不要な前置きや結論づけはしない

結果の末尾に `✅ リサーチ完了` を表示して終了します。

## 禁止事項

- ファイルを作成・編集・削除するすべてのツール（例: Antigravity の `write_file` / `edit_file`、Gemini CLI の `write_file` / `replace`）の使用
- コマンド実行ツール（例: `run_command` / `run_shell_command`）でのシステム変更操作
- 推奨案・Pros/Cons・比較表の作成（求められた場合を除く）
