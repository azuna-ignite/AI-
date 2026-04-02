#!/usr/bin/env node
/**
 * fetch-updates.js
 * feeds.json に設定された RSS フィードを取得し、data/updates.json を更新する
 * 英語タイトルは MyMemory API で日本語に自動翻訳する
 * GitHub Actions から毎日自動実行される
 * 手動実行: node scripts/fetch-updates.js
 */

const fs     = require('fs');
const path   = require('path');
const Parser = require('rss-parser');

const ROOT        = path.resolve(__dirname, '..');
const FEEDS_PATH  = path.join(ROOT, 'data', 'feeds.json');
const OUTPUT_PATH = path.join(ROOT, 'data', 'updates.json');
const ITEMS_PER_FEED      = 5;
const TRANSLATE_DELAY_MS  = 300; // リクエスト間のsleep（レート制限対策）

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'AI-KnowledgeBase/1.0' },
});

// ── ユーティリティ ─────────────────────────────────────

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/** ひらがな・カタカナ・漢字が含まれていれば日本語とみなす */
function isJapanese(text) {
  return /[\u3040-\u9fff]/.test(text);
}

function stripHtml(str) {
  return str.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, 200);
}

// ── 翻訳 ───────────────────────────────────────────────

/**
 * MyMemory API でテキストを英語→日本語に翻訳する
 * 失敗時は原文をそのまま返す
 */
async function translateTitle(text) {
  if (!text || isJapanese(text)) return text; // 既に日本語ならスキップ

  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|ja`;
    const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
    const data = await res.json();
    const translated = data?.responseData?.translatedText;

    // レスポンスが空・エラーコードなら原文を返す
    if (!translated || data?.responseStatus !== 200) return text;

    return translated;
  } catch {
    return text; // タイムアウト・ネットワークエラーは握りつぶす
  }
}

// ── YouTube ハンドル → RSS URL 解決 ────────────────────

/**
 * @handle 形式から YouTube チャンネル RSS フィード URL を解決する
 * YouTube チャンネルページの HTML から channelId を抽出する
 */
async function resolveYouTubeHandle(handle) {
  try {
    const url = `https://www.youtube.com/${handle}`;
    const res  = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AI-KnowledgeBase/1.0)' },
    });
    const html = await res.text();

    // channelId を探す（複数パターンに対応）
    const patterns = [
      /"channelId":"(UC[^"]{20,})"/,
      /"externalId":"(UC[^"]{20,})"/,
      /channel\/(UC[^"/?]{20,})/,
    ];

    for (const pattern of patterns) {
      const m = html.match(pattern);
      if (m) {
        const channelId = m[1];
        return `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      }
    }

    console.warn(`  ⚠️  YouTube: チャンネルID が見つかりませんでした (${handle})`);
    return null;
  } catch (err) {
    console.warn(`  ⚠️  YouTube: ハンドル解決失敗 — ${err.message}`);
    return null;
  }
}

// ── フィード取得 ────────────────────────────────────────

async function fetchFeed(feed) {
  // YouTube ハンドルから feedUrl を自動解決
  let feedUrl = feed.feedUrl;
  if (feed.type === 'youtube' && !feedUrl && feed.handle) {
    console.log(`  🔍  ${feed.tool}: YouTubeチャンネルIDを解決中...`);
    feedUrl = await resolveYouTubeHandle(feed.handle);
  }

  if (!feedUrl) {
    console.log(`  ⏭  ${feed.tool}: フィードURL未設定のためスキップ`);
    return { ...feed, items: [], error: 'no_url' };
  }

  try {
    const result = await parser.parseURL(feedUrl);
    const rawItems = (result.items || []).slice(0, ITEMS_PER_FEED);

    // タイトルを翻訳（順番に処理してレート制限を回避）
    const items = [];
    for (const item of rawItems) {
      const originalTitle = item.title || '（タイトルなし）';
      const title = await translateTitle(originalTitle);
      if (!isJapanese(originalTitle)) await sleep(TRANSLATE_DELAY_MS);

      items.push({
        title,
        titleOrig: isJapanese(originalTitle) ? undefined : originalTitle,
        link:    item.link    || item.guid || '',
        date:    item.pubDate || item.isoDate || '',
        summary: stripHtml(item.contentSnippet || item.summary || ''),
      });
    }

    console.log(`  ✅  ${feed.tool}: ${items.length} 件取得・翻訳`);
    return { ...feed, items, error: null };
  } catch (err) {
    console.warn(`  ⚠️  ${feed.tool}: 取得失敗 — ${err.message}`);
    return { ...feed, items: [], error: err.message };
  }
}

// ── メイン ──────────────────────────────────────────────

async function main() {
  const feeds = JSON.parse(fs.readFileSync(FEEDS_PATH, 'utf-8'));

  console.log(`\nRSSフィードを取得・翻訳中... (${feeds.length} ツール)\n`);

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
