const assert = require('node:assert/strict');
const fs = require('node:fs');

const layout = fs.readFileSync('_layouts/default.html', 'utf8');
const config = fs.readFileSync('_config.yml', 'utf8');
const adsTxt = fs.readFileSync('ads.txt', 'utf8').trim();
const publisherId = 'ca-pub-1720709954166786';

assert.match(config, new RegExp(`^adsense_client: ${publisherId}$`, 'm'));
assert.match(
  layout,
  new RegExp(`<meta\\s+name="google-adsense-account"\\s+content="${publisherId}"\\s*>`)
);
assert.match(
  layout,
  new RegExp(`https://pagead2\\.googlesyndication\\.com/pagead/js/adsbygoogle\\.js\\?client=\\{\\{ site\\.adsense_client \\}\\}`)
);
assert.equal(adsTxt, 'google.com, pub-1720709954166786, DIRECT, f08c47fec0942fa0');

console.log('AdSense integration checks passed.');
