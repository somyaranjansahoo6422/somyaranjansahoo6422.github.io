// Run before committing a change to any .css or .js file: `node build.js`
// Needs esbuild (npm i -g esbuild, with NODE_PATH pointing at it). It does three things:
//   1. Minifies styles.css and the scripts into *.min.* files, which are what the pages load.
//   2. Inlines critical.css (the first screen on a phone) into index.html.
//   3. Versions every file by its content, so a new page never pairs with an old cached file,
//      and refreshes the hashes the Content-Security-Policy needs for the inline style and script.
// If the top of the page changes, regenerate critical.css first: `node tools/make-critical.js <url>`.
const fs = require('fs');
const crypto = require('crypto');
const esbuild = require('esbuild');

const sha = (text, enc) => crypto.createHash(enc === 'hex' ? 'sha1' : 'sha256').update(text).digest(enc || 'base64');
const version = (text) => sha(text, 'hex').slice(0, 8);
const read = (f) => fs.readFileSync(f, 'utf8');
const js = (code) => esbuild.transformSync(code, { minify: true, target: 'esnext', legalComments: 'none', charset: 'utf8' }).code;
const css = (code) => esbuild.transformSync(code, { loader: 'css', minify: true, target: 'esnext', legalComments: 'none', charset: 'utf8' }).code;

// Lazy scripts first, because script.js has to know their versions.
const lazy = {};
for (const name of ['ask', 'data-lab', 'hand3d']) {
  const out = js(read(`${name}.js`));
  fs.writeFileSync(`${name}.min.js`, out);
  lazy[name] = `${name}.min.js?v=${version(out)}`;
}

let main = read('script.js');
for (const [name, url] of Object.entries(lazy)) main = main.split(`'/${name}.js'`).join(`'/${url}'`).split(`'${name}.js'`).join(`'${url}'`);
const scriptOut = js(main);
fs.writeFileSync('script.min.js', scriptOut);

const styleOut = css(read('styles.css'));
fs.writeFileSync('styles.min.css', styleOut);

const v = { css: version(styleOut), js: version(scriptOut) };

// Fonts stay outside the phone-only block because @font-face cannot sit inside @media.
// Anton (7 KB) travels inside the page itself: the first paint then has the poster font with no wait, and
// nothing moves when it arrives. A font fetched before the first paint would hold the whole screen back.
const anton = fs.readFileSync('assets/fonts/anton.woff2').toString('base64');
const critical = css(read('critical.css')).replace('url(assets/fonts/anton.woff2)', `url(data:font/woff2;base64,${anton})`);
if (!critical.includes('base64,')) throw new Error('Anton was not inlined: check the @font-face rule in critical.css');

// Every page that loads the shared files: the homepage, the privacy and 404 pages, and each project page.
const pages = ['index.html', 'privacy.html', '404.html'].concat(
  fs.existsSync('projects') ? fs.readdirSync('projects').map((d) => `projects/${d}/index.html`).filter((f) => fs.existsSync(f)) : []
);

const headScript = (html) => (html.match(/<script>([\s\S]*?)<\/script>/) || [])[1];
const otherHash = sha(headScript(read('privacy.html')));

for (const page of pages) {
  let html = read(page);
  html = html.replace(/((?:href|src)="(?:\.\.\/)*)styles(?:\.min)?\.css(?:\?v=[0-9a-f]+)?(")/g, `$1styles.min.css?v=${v.css}$2`);
  html = html.replace(/((?:href|src)="(?:\.\.\/)*)script(?:\.min)?\.js(?:\?v=[0-9a-f]+)?(")/g, `$1script.min.js?v=${v.js}$2`);
  if (page === 'index.html') {
    html = html.replace(/(<style id="critical">)[\s\S]*?(<\/style>)/, (m, a, b) => a + critical + b);
    html = html.replace(/style-src 'self'( 'sha256-[^']+')?/, `style-src 'self' 'sha256-${sha(critical)}'`);
    html = html.replace(/font-src 'self'( data:)?/, "font-src 'self' data:");
    // Wider screens preload the hand script from the head; it must be the exact versioned file script.js loads, or it downloads twice.
    html = html.replace(/\['hand3d(?:\.min)?\.js(?:\?v=[0-9a-f]+)?','script'\]/, `['${lazy.hand3d}','script']`);
  }
  fs.writeFileSync(page, html);
}

// The hash of index.html's head script is listed on every page.
const indexHash = sha(headScript(read('index.html')));
for (const page of pages) {
  const html = read(page).replace(/(script-src [^;]*?)'sha256-([^']+)'( 'sha256-([^']+)')?/, (m, start, a, _b, b) => {
    const keep = [a, b].includes(otherHash) ? otherHash : otherHash;
    return `${start}'sha256-${indexHash}' 'sha256-${keep}'`;
  });
  fs.writeFileSync(page, html);
}

console.log({ styles: styleOut.length, script: scriptOut.length, critical: critical.length, ...v });
