# Writing KB — プロジェクト記録

## 概要

ライティング・SEO・コンテンツライティング・コピーライティング・セールスライティングの知識をまとめた個人ナレッジベース。

| 項目 | 内容 |
|------|------|
| 公開URL | https://azuna-ignite.github.io/AI-/ |
| GitHubリポジトリ | https://github.com/azuna-ignite/AI- |
| ローカル作業ディレクトリ | `/Users/azuna/Documents/dev/AI-/` |
| Obsidian 記事保存先 | `/Users/azuna/Documents/Azuna/portfolio/` |

## ファイル構成

```
AI-/
├── index.html            ホーム（スライダー・基礎知識ボタン）
├── glossary.html         用語集（16ライティングカテゴリ＋SEO/LLMO・AIO/ツール）
├── tips.html             実践Tips（検索付き）
├── basics.html           基礎知識（16ライティングジャンル・タブ切り替え）
├── tools.html            ツール一覧（13件・4カテゴリ）
├── updates.html          更新情報（ツール公式/メディア記事/YouTube の3セクション）
├── style.css             共通スタイル（レスポンシブ）
├── publish.js            Obsidian→HTML変換・公開スクリプト
├── package.json          依存パッケージ（rss-parser, marked）
├── data/
│   ├── feeds.json        RSSフィード設定（sourceType: tool/media/youtube）
│   └── updates.json      GitHub Actionsが自動生成するフィードデータ
├── scripts/
│   └── fetch-updates.js  RSSフィード取得・翻訳スクリプト（毎日JST 9:00自動実行）
├── .github/workflows/
│   └── update-feeds.yml  GitHub Actions設定
└── notes/                各ツールの記事ページ（13ファイル）
```

## 記事の公開ワークフロー

Obsidian の `portfolio/` フォルダに `{スラグ}_{タイトル}.md` で記事を書き、
以下のコマンドを実行するだけで公開まで完結する。

```bash
node publish.js ~/Documents/Azuna/portfolio/{ファイル名}.md
```

## フロントマター形式（Obsidianファイル）

```markdown
---
tags: SEO, Semrush, キーワード調査
modified: 2026-04-02
---

# 記事タイトル（H1）
```

## デザイン方針

- 外部ライブラリ不使用（HTML / CSS / JS のみ）
- CSS変数でカラー管理
- モバイルファースト・レスポンシブ
- 検索はリアルタイム絞り込み（JS）

## ナビゲーション構成

ホーム → 用語集 → Tips → 基礎知識 → ツール → 更新情報

## 登録ツール（tools.html）

Figma、Semrush、SurferSEO、WordPress、Claude / Claude Code、
GitHub、Obsidian、NotebookLM、isgen、ラッコキーワード、Canva、
Google サーチコンソール、Ahrefs（計13件）

## 用語集カテゴリ（glossary.html）

ライティング16ジャンル（Copy / Sales / Content / UX Writing / SEO Writing /
Press Release / Whitepaper / Case Study / Script / Essay / Interview /
Newsletter / SNS / Podcast / YouTube / L10n）
＋ SEO / LLMO・AIO / ツール

## 基礎知識（basics.html）

16ジャンルのタブ切り替えページ。各ジャンルに目的・重要な要素・手法などのカード。
SEO Writing のみ ButtonDock パターン（ボタンを押してトピック内容を表示）。

## RSSフィード自動取得（GitHub Actions）

- 毎日 UTC 0:00（JST 9:00）に `scripts/fetch-updates.js` を実行
- 英語タイトルは MyMemory API で日本語に自動翻訳
- YouTube チャンネルはHTMLからchannelIdを自動解決
- `data/feeds.json` の `sourceType` フィールドで分類：
  - `tool` … ツール公式ブログ・更新情報
  - `media` … 外部メディア（マインドファクトリー、Empathy Writing など）
  - `youtube` … YouTubeチャンネル（ミエルカ）
- 新しいソースを追加するには `data/feeds.json` にエントリを追加してプッシュ

## 更新情報ページ（updates.html）

3セクション縦並び構成：
1. 🛠️ ツール公式
2. 📰 メディア記事
3. ▶️ YouTube
