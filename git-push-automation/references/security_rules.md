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
- **`.handoff/`**（コンサルタント・プランナーの引き継ぎファイル。git 管理対象外）

## 🟡 注意項目（承認で続行可）

- `TODO` / `FIXME` / `HACK` が新たに追加されている
- `console.log` / `Logger.log` / `debugger` などのデバッグ文が残っている（詳細は `coding_rules.md`）
- 外部API呼び出しに例外処理が無い、エラーを握りつぶしている（`catch(e) {}`）
- 内部URL・IPアドレス・`localhost` が本番コードにハードコードされている
- コメントに機密情報・社内情報、テストデータに個人情報が含まれている
- `coding_rules.md` の違反
