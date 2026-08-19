import { readFile, writeFile, readdir } from 'node:fs/promises';
import { resolve, join } from 'node:path';

const root = resolve(process.cwd());
const dist = join(root, 'dist');
const assets = join(dist, 'assets');
const files = await readdir(assets);
const cssName = files.find(name => name.endsWith('.css'));
const jsName = files.find(name => name.endsWith('.js'));
if (!cssName || !jsName) throw new Error('Built CSS or JS asset is missing. Run npm run build first.');

let html = await readFile(join(dist, 'index.html'), 'utf8');
let css = await readFile(join(assets, cssName), 'utf8');
let js = await readFile(join(assets, jsName), 'utf8');
const logo = await readFile(join(root, 'assets/brand/original/zakaria-mansour-logo-original.png'));
const logoData = `data:image/png;base64,${logo.toString('base64')}`;
js = js.replace('/assets/brand/original/zakaria-mansour-logo-original.png', logoData);
// Literal closing script tags inside bundled framework strings terminate an inline script in HTML.
js = js.replaceAll('</script', '<\\/script');
css = css.replace(/@import url\([^;]+;/, '');
html = html.replace(/\s*<script type="module"[^>]+><\/script>/, '');
html = html.replace(/\s*<link rel="stylesheet"[^>]+>/, '');
// Use replacement callbacks so `$` sequences inside bundled code remain literal.
html = html.replace('</head>', () => `<style>${css}</style>\n<!-- Self-contained offline preview. -->\n</head>`);
html = html.replace('</body>', () => `<script id="standalone-app">${js}</script>\n</body>`);
const rootPosition = html.indexOf('<div id="root"></div>');
const scriptPosition = html.lastIndexOf('<script id="standalone-app">');
if (rootPosition < 0 || scriptPosition <= rootPosition) throw new Error('Standalone structural test failed: script must follow #root.');
if (!html.includes('data:image/png;base64,')) throw new Error('Standalone logo embedding failed.');
const output = join(root, 'ZAKARIA_MANSOUR_STORE_PREVIEW.html');
await writeFile(output, html);
console.log(`Standalone preview built: ${output}`);
