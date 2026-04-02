#!/usr/bin/env node
/**
 * publish.js
 * Obsidian の Markdown を Web サイトの HTML に変換して GitHub へプッシュする
 *
 * 使い方:
 *   node publish.js <mdファイルのパス>
 *   node publish.js <mdファイルのパス> --no-push   # HTMLを生成するだけ（git pushしない）
 *
 * 例:
 *   node publish.js ~/Documents/Azuna/portfolio/isgen_AIツール基礎知識.md
 *
 * ファイル名ルール（ポートフォリオフォルダ内）:
 *   {スラグ}_{記事タイトル}.md  →  notes/{スラグ}.html
 *   例: semrush_キーワードリサーチの使い方.md → notes/semrush.html
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// marked の存在確認
let marked;
try {
  marked = require('marked').marked;
} catch {
  console.error('\n❌  marked が見つかりません。先に以下を実行してください:\n');
  console.error('   npm install\n');
  process.exit(1);
}

const SITE_DIR   = path.resolve(__dirname);
const NOTES_DIR  = path.join(SITE_DIR, 'notes');

// ── フロントマターをパース ──────────────────────────────
function parseFrontmatter(raw) {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };

  const meta = {};
  m[1].split(/\r?\n/).forEach(line => {
    const idx = line.indexOf(':');
    if (idx === -1) return;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key) meta[key] = val;
  });

  return { meta, body: m[2] };
}

// ── 本文の H1 をタイトルとして取り出す ─────────────────
function extractH1(body) {
  const m = body.match(/^#[ \t]+(.+)$/m);
  if (!m) return { title: '', body };
  return {
    title: m[1].trim(),
    body:  body.replace(/^#[ \t]+.+(\r?\n)?/m, '').trimStart(),
  };
}

// ── ファイル名からスラグを取得 ──────────────────────────
function slugFromFilename(filepath) {
  const base = path.basename(filepath, '.md');
  return base.split('_')[0].toLowerCase();
}

// ── タグ文字列 → span タグ ─────────────────────────────
function renderTags(tagStr) {
  if (!tagStr) return '';
  return tagStr.split(',')
    .map(t => `      <span class="tag">${t.trim()}</span>`)
    .join('\n');
}

// ── HTML テンプレート ───────────────────────────────────
function buildHtml({ title, tags, content }) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} — 海外マーケティング KB</title>
  <link rel="stylesheet" href="../style.css">
</head>
<body>

<header>
  <div class="nav-inner">
    <a href="../index.html" class="site-title">🌍 海外マーケティング KB</a>
    <nav>
      <a href="../index.html">ホーム</a>
      <a href="../glossary.html">用語集</a>
      <a href="../tips.html">Tips</a>
      <a href="../tools.html">ツール</a>
    </nav>
  </div>
</header>

<main>
  <div class="note-header">
    <div class="breadcrumb"><a href="../tools.html">ツール</a> &rsaquo; ${title}</div>
    <h1 class="page-title">${title}</h1>
    <div class="note-meta">
${tags}
    </div>
  </div>

  <div class="note-body">
${content}
  </div>
</main>

<footer>
  <p>海外マーケティング ナレッジベース — 学びの記録</p>
</footer>

<script>
  document.querySelectorAll('nav a').forEach(a => {
    if (a.getAttribute('href') === '../tools.html') a.classList.add('active');
  });
</script>
</body>
</html>
`;
}

// ── メイン ──────────────────────────────────────────────
function main() {
  const args    = process.argv.slice(2);
  const noPush  = args.includes('--no-push');
  const mdArg   = args.find(a => !a.startsWith('--'));

  if (!mdArg) {
    console.log('\n使い方: node publish.js <mdファイルのパス> [--no-push]\n');
    console.log('例:     node publish.js ~/Documents/Azuna/portfolio/isgen_AIツール基礎知識.md\n');
    process.exit(0);
  }

  const mdPath = path.resolve(mdArg.replace(/^~/, process.env.HOME));
  if (!fs.existsSync(mdPath)) {
    console.error(`\n❌  ファイルが見つかりません: ${mdPath}\n`);
    process.exit(1);
  }

  // パース
  const raw             = fs.readFileSync(mdPath, 'utf-8');
  const { meta, body }  = parseFrontmatter(raw);
  const { title, body: mdBody } = extractH1(body);
  const slug            = meta.slug || slugFromFilename(mdPath);
  const tags            = renderTags(meta.tags);

  if (!title) {
    console.error('\n❌  Markdown の先頭に # タイトル が見つかりません。\n');
    process.exit(1);
  }

  // Markdown → HTML
  const htmlContent = marked(mdBody);
  const outputPath  = path.join(NOTES_DIR, `${slug}.html`);
  const html        = buildHtml({ title, tags, content: htmlContent });

  // 出力
  fs.writeFileSync(outputPath, html, 'utf-8');

  console.log(`\n✅  HTML を生成しました`);
  console.log(`   ソース  : ${mdPath}`);
  console.log(`   出力先  : ${outputPath}`);
  console.log(`   タイトル: ${title}`);

  if (noPush) {
    console.log('\n（--no-push のため git push はスキップしました）\n');
    return;
  }

  // git add → commit → push
  try {
    execSync(`git -C "${SITE_DIR}" add notes/${slug}.html`, { stdio: 'inherit' });
    execSync(
      `git -C "${SITE_DIR}" commit -m "feat: ${title}"`,
      { stdio: 'inherit' }
    );
    execSync(`git -C "${SITE_DIR}" push`, { stdio: 'inherit' });
    console.log(`\n🚀  公開完了！`);
    console.log(`   https://azuna-ignite.github.io/AI-/notes/${slug}.html\n`);
  } catch (e) {
    console.error('\n❌  git 操作でエラーが発生しました。手動で push してください。\n');
  }
}

main();
