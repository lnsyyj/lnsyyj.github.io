const assert = require('node:assert/strict');
const fs = require('node:fs');

const goldPostPath = '_posts/2026-09-13-gold-why-is-gold-valuable.md';
const goldPost = fs.readFileSync(goldPostPath, 'utf8');
const postsPage = fs.readFileSync('posts.md', 'utf8');
const postLayout = fs.readFileSync('_layouts/post.html', 'utf8');
const indexPage = fs.readFileSync('index.md', 'utf8');
const styles = fs.readFileSync('assets/css/style.css', 'utf8');

assert.match(goldPost, /^---\r?\nlayout: post\r?\ntitle: 黄金为什么值钱？从古代货币到2026/m);
assert.match(goldPost, /^date: 2026-09-13/m);
assert.match(goldPost, /^categories: \[金融\]/m);
assert.match(postsPage, /post\.categories \| first/);
assert.match(postLayout, /page\.categories \| first/);
assert.match(indexPage, /class="home-panel tools-panel"/);
assert.match(styles, /\.home-highlights \{ display:contents; \}/);
assert.match(styles, /\.tools-panel \{ grid-column:1; grid-row:1 \/ span 3; order:0; \}/);

console.log('Blog organization checks passed.');
