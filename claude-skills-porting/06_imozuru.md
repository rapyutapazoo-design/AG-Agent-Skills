# 06 imozuru(芋づる式リサーチ)

「芋づる式に検索してください」を**文字どおり含む発話のときだけ**起動するリサーチスキルです。引用・リンク・著者をたどり、原文を要約せずに `~/research/<話題>/` へ保存します。「（見張り：<話題>）」を付けると新着確認(watch)モードになります。

- 元: https://github.com/rapyutapazoo-design/claude-skills/tree/master/imozuru
- 出典の元: [MaryCache/imozuru](https://github.com/MaryCache/imozuru)(MIT)。`LICENSE` を必ず残してください
- 方式: SKILL.md は約35KB、Python スクリプト4本とテストが付くため、**公開リポジトリを取得して変換する方式**にしています。シェルとネット接続のあるエージェント(Gemini CLI など)向けです
- 必要なもの: Python 3.10 以上、git。任意で `pdftotext`、`pdftoppm`+`tesseract`、`yt-dlp`
- 外部に出る情報: 検索語として問いの中身が外に出ます。機密・個人データが絡む調べものには使わないでください
- チャット専用の AI の場合: [`00_universal-converter.md`](./00_universal-converter.md) で SKILL.md だけを変換できます。ただしスクリプトが無いため、保存・照合・引用たどりの機能は使えません

## ▼ コピペ用プロンプト

~~~~
公開リポジトリ https://github.com/rapyutapazoo-design/claude-skills の `imozuru/` を取得し、Gemini CLI のスキルとして `~/.gemini/skills/imozuru/` に作成してください。次の手順を順に実行し、各手順の結果を報告してください。

【手順1: 取得】
1. 空の一時ディレクトリを新規に作る（例: `mktemp -d`）。そこでだけ作業し、取得物をカレントディレクトリや既存のプロジェクトに展開しない
2. `git clone --depth 1 https://github.com/rapyutapazoo-design/claude-skills <一時ディレクトリ>/src` を実行する
3. 取得に失敗したら、そこで止めて理由を報告する。自分で内容を作り直さない

【手順2: 配置】
1. `~/.gemini/skills/imozuru/` が既に存在する場合は、上書きせずに私に確認する
2. 存在しなければ `<一時ディレクトリ>/src/imozuru/` を `~/.gemini/skills/imozuru/` にコピーする（SKILL.md、LICENSE、README.md、references/、scripts/、tests/ のすべて）

【手順3: SKILL.md の変換】
`~/.gemini/skills/imozuru/SKILL.md` を次のルールだけで書き換える。それ以外の文面（手順、境界、map.md の書式、出力形式、日本語の文言）は一字も変えない。
1. frontmatter から `model: haiku` の行を削除する（`name` と `description` は残す。description の起動条件は変えない）
2. 本文中の `~/.claude/skills/imozuru/` をすべて `~/.gemini/skills/imozuru/` に置換する（sed で一括: `sed -i.bak 's#~/\.claude/skills/imozuru#~/.gemini/skills/imozuru#g'`、確認後 `.bak` を削除）
3. 「## モデル方針（このリポジトリでの追加）」の節を、次の内容に置き換える:
   - 検索役は、サブエージェント機能が使えるなら軽量モデル(例: Flash-Lite または Flash)で起動する。同時起動は最大2本。ツールは読み取りと Web 検索だけ（ファイルを書かせない）
   - 検索役の頼み方には、必ず「ファイルの書き込み・シェル実行・curl などのダウンロードはしない。使うのは google_web_search・web_fetch・読み取りだけ」と書く。サブエージェントの型を選べない環境でも同じ文を書く
   - サブエージェントが使えない環境では、親が自分で同じ頼み方の中身を順に検索する
   - 標準モデルへの昇格: 元の条件1〜5（照合失敗が2回連続／0周目で用語・人・場のいずれかが0件、または報告の半分以上が「探していない」／2周続けて新規資料がなく原文の付いていない主張が残る／英日以外の原文または30ページ超の PDF／1箇所が複数の主張にまたがり割り当てが決まらない）をそのまま使い、昇格先を「標準モデル（例: Pro）」とする。昇格は1回の調査で最大3回まで、昇格のたびに条件番号・理由・対象を `log.md` に記録する。3回に達したあとは軽量モデルで続け、最終報告の「届かなかったもの」に残った作業を書く。最高性能のモデルは使わない
   - watch モードは軽量モデルのみで動かし、昇格しない
4. 「進捗表示」の節の `⬆️ Sonnet へ昇格（条件N）` を `⬆️ 標準モデルへ昇格（条件N）` に置換する
5. 本文中の「Haiku」「Sonnet」「Opus」「WebSearch」「WebFetch」「Agent ツール」「Explore」「Claude Code」を、それぞれ「軽量モデル」「標準モデル」「最高性能のモデル」「google_web_search」「web_fetch」「サブエージェント」「読み取り専用の型」「Gemini CLI」に置換する（置換した行を列挙して報告する）

【手順4: 検証】
1. `grep -n "claude\|Claude\|Haiku\|Sonnet\|Opus" ~/.gemini/skills/imozuru/SKILL.md` を実行し、残りがあれば出典の説明（MaryCache/imozuru への言及など）として妥当なものか判断して報告する
2. Python 3.10 以上があることを `python3 --version` で確認する
3. `cd ~/.gemini/skills/imozuru && python3 -I -m unittest discover -s tests` を実行し、結果を報告する。失敗したテストがあれば、直さずに失敗内容をそのまま報告する
4. テスト後に `find ~/.gemini/skills/imozuru -name __pycache__ -prune -exec rm -rf {} +` を実行する

【手順5: 後片付けと報告】
- 一時ディレクトリを削除する
- 最終報告に、配置したファイル一覧、手順3で置換した行の一覧、テスト結果、任意コマンド（pdftotext、pdftoppm、tesseract、yt-dlp）の有無を含める
- 動作確認のための調査は、私が頼むまで実行しない
~~~~
