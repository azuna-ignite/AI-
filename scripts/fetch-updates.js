#!/usr/bin/env node
/**
 * fetch-updates.js
 * feeds.json に設定された RSS フィードを取得し、data/updates.json を更新する
 * GitHub Actions から毎日自動実行される
 * 手動実行: node scripts/fetch-updates.js
 */

const fs   = require('fs');
const path = require('path');
const Parser = require('rss-parser');

const ROOT        = path.resolve(__dirname, '..');
const FEEDS_PATH  = path.join(ROOT, 'data', 'feeds.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'updates.json');
const ITEMS_PER_FEED = 5; // 各ツールの最新件数

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'AI-KnowledgeBase/1.0' },
});

async function fetchFeed(feed) {
  if (!feed.feedUrl) {
    console.log(`  ⏭  ${feed.tool}: フィードURL未設定のためスキップ`);
    return { ...feed, items: [], error: 'no_url' };
  }

  try {
    const result = await parser.parseURL(feed.feedUrl);
    const items = (result.items || []).slice(0, ITEMS_PER_FEED).map(item => ({
      title:   item.title   || '（タイトルなし）',
      link:    item.link    || item.guid || '',
      date:    item.pubDate || item.isoDate || '',
      summary: stripHtml(item.contentSnippet || item.summary || ''),
    }));
    console.log(`  ✅  ${feed.tool}: ${items.length} 件取得`);
    return { ...feed, items, error: null };
  } catch (err) {
    console.warn(`  ⚠️  ${feed.tool}: 取得失敗 — ${err.message}`);
    return { ...feed, items: [], error: err.message };
  }
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

async function main() {
  const feeds = JSON.parse(fs.readFileSync(FEEDS_PATH, 'utf-8'));

  console.log(`\nRSSフィードを取得中... (${feeds.length} ツール)\n`);

  const results = [];
  for (const feed of feeds) {
    results.push(await fetchFeed(feed));
  }

  const successCount = results.filter(r => r.items.length > 0).length;
  const output = {
    fetchedAt: new Date().toISOString(),
    tools:     results,
  };

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(output, null, 2), 'utf-8');

  console.log(`\n✅ 完了: ${successCount}/${feeds.length} ツール成功`);
  console.log(`   出力: ${OUTPUT_PATH}\n`);
}

main().catch(err => {
  console.error('❌ 予期しないエラー:', err);
  process.exit(1);
});
