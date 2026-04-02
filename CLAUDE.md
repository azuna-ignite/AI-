# 海外マーケティング ナレッジベース — プロジェクト記録

## 概要

海外マーケティングライターとして学んだ知識・ノウハウをポートフォリオとしてWebサイトにまとめるプロジェクト。

| 項目 | 内容 |
|------|------|
| 公開URL | https://azuna-ignite.github.io/AI-/ |
| GitHubリポジトリ | https://github.com/azuna-ignite/AI- |
| ローカル作業ディレクトリ | `/Users/azuna/Documents/dev/AI-/` |
| Obsidian 記事保存先 | `/Users/azuna/Documents/Azuna/portfolio/` |

## ファイル構成

```
AI-/
├── index.html            ホーム
├── glossary.html         用語集（カテゴリフィルター＋検索）
├── tips.html             実践Tips（検索付き）
├── tools.html            ツール一覧（13件・4カテゴリ）
├── style.css             共通スタイル（レスポンシブ）
├── publish.js            Obsidian→HTML変換・公開スクリプト
├── package.json          依存パッケージ（marked）
└── notes/                各ツールの記事ページ（12ファイル）
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

## 登録ツール（tools.html）

Figma、Semrush、SurferSEO、WordPress、Claude / Claude Code、
GitHub、Obsidian、NotebookLM、isgen、ラッコキーワード、Canva、
Google サーチコンソール（計13件）

## 用語集カテゴリ（glossary.html）

SEO / LLMO・AIO / 海外マーケティング / ライティング / ツール（計30語）
