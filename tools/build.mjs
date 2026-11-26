// Build the static site into dist/. GitHub Pages builds the same thing with GitHub Actions;
// the compiled bundle stays out of the repository, which holds source only.
//   node tools/build.mjs            bundle + copy (fast, for iteration)
//   node tools/build.mjs --fonts    also re-run the font subset (after the copy or the fonts change)
//   node tools/build.mjs --debug    unminified script
import { spawnSync } from 'node:child_process';
import { cp, copyFile, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { build, transform } from 'esbuild';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'src');
const args = process.argv.slice(2);
const minify = !args.includes('--debug');
// the debug flag is folded into the bundle: inspection hooks exist in debug builds only
const define = { __MM_DEBUG__: minify ? 'false' : 'true' };
const outArg = args.find((arg) => arg.startsWith('--out='))?.slice(6);
const out = path.resolve(root, outArg ?? 'dist');

const versionOf = async (name) =>
  JSON.parse(await readFile(path.join(root, 'node_modules', name, 'package.json'), 'utf8')).version;

async function totalBytes(dir) {
  let total = 0;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    total += entry.isDirectory() ? await totalBytes(file) : (await stat(file)).size;
  }
  return total;
}

if (args.includes('--fonts')) {
  const result = spawnSync(
    path.join(root, 'tools', '.venv', 'bin', 'python'),
    ['-I', path.join(root, 'tools', 'subset_fonts.py'), root, path.join(root, 'tools', 'fonts-src')],
    { stdio: 'inherit' },
  );
  if (result.status !== 0) {
    console.error('font subsetting failed');
    process.exit(result.status ?? 1);
  }
}

await rm(out, { recursive: true, force: true });
await mkdir(out, { recursive: true });

const versions = { gsap: await versionOf('gsap'), lenis: await versionOf('lenis') };
const versionsText = [
  'mingma-site | (c) 2026 麻明 Ming Ma',
  'Bundled open-source software, used under their licences (full texts in THIRD-PARTY-LICENSES.txt):',
  `  GSAP ${versions.gsap} (c) GreenSock, Standard "No Charge" Licence: https://gsap.com/standard-license`,
  `  Lenis ${versions.lenis} (c) darkroom.engineering, MIT Licence`,
].join('\n * ');

await build({
  entryPoints: [path.join(src, 'js', 'main.js')],
  bundle: true,
  minify,
  format: 'iife',
  target: ['es2020'],
  outfile: path.join(out, 'app.js'),
  define,
  legalComments: 'none',
  // a banner must be a comment in its own right, so wrap the notices in a block comment
  banner: { js: `/*! ${versionsText} */` },
});

// A bundle that cannot be parsed is a page without any behaviour, so never let one out of the build.
const check = spawnSync(process.execPath, ['--check', path.join(out, 'app.js')], { encoding: 'utf8' });
if (check.status !== 0) {
  console.error(check.stderr.trim());
  process.exit(check.status ?? 1);
}

const css = await readFile(path.join(src, 'css', 'main.css'), 'utf8');
const minified = await transform(css, { loader: 'css', minify });
await writeFile(path.join(out, 'styles.css'), minified.code);

for (const page of (await readdir(src)).filter((name) => name.endsWith('.html'))) {
  await copyFile(path.join(src, page), path.join(out, page));
}
await copyFile(path.join(src, 'favicon.svg'), path.join(out, 'favicon.svg'));

// Licence notices are taken verbatim from the packages and font folders that were installed.
const licenseFiles = [
  ['Lenis', path.join(root, 'node_modules', 'lenis', 'LICENSE')],
  ['D-DIN, D-DIN Condensed, D-DIN Exp (subsetted for this site)', path.join(root, 'tools', 'fonts-src', 'ddin', 'OFL-1.1.txt')],
  ['Noto Sans SC (subsetted for this site)', path.join(root, 'tools', 'fonts-src', 'LICENSE-NOTO.txt')],
];
// The font sources are only needed to re-run the subsetting, so their licence files may be absent
// on a machine that builds from the committed subsets. The fonts carry their own licence notice either way.
const readNotice = async (file) => {
  try {
    return (await readFile(file, 'utf8')).trim();
  } catch (error) {
    return 'Licence: SIL Open Font License 1.1 (see the font file itself).';
  }
};
const notices = await Promise.all(licenseFiles.map(async ([label, file]) => `${label}\n${await readNotice(file)}`));
notices.splice(1, 0, [
  'GSAP (bundled plugins: ScrollTrigger, SplitText)',
  'GSAP ships under the GreenSock "Standard No Charge" License.',
  'The full terms live at https://gsap.com/standard-license and are not reproduced here.',
].join('\n'));
// Unsplash asks for no attribution, but credit is given anyway; each picture was cropped and tinted.
const photographs = [
  ['p2', 'Crosby Hinze', 'photo-1643142314017-126b776f066a'],
  ['p3', 'Akram Huseyn', 'photo-1647200527435-cc6b0e91e120'],
  ['p4', 'Ivan Kazlouskij', 'photo-1653565217811-85b41bcd1edb'],
  ['p5', 'Dextar Studio', 'photo-1692863211226-cbba732754c9'],
  ['p6', 'Crosby Hinze', 'photo-1643142314913-0cf633d9bbb5'],
  ['p8', 'fabian jones', 'photo-1644749700856-a82a92828a1b'],
  ['p9', 'Morgan Edwards', 'photo-1622046120199-32f27980473d'],
];
notices.push(
  [
    'Photographs (illustrative pictures on the project sheets; cropped and duotoned)',
    'Source: Unsplash. Licence: Unsplash License, https://unsplash.com/license (free to use, attribution not required).',
    ...photographs.map(([file, artist, id]) => `  ${file}.webp  by ${artist}  https://images.unsplash.com/${id}`),
  ].join('\n'),
);
await writeFile(path.join(out, 'THIRD-PARTY-LICENSES.txt'), `${['mingma-site, third-party notices', '', ...notices].join('\n\n')}\n`);

await cp(path.join(src, 'assets'), path.join(out, 'assets'), { recursive: true });
// Pages must serve the files as they are, without running Jekyll over them
await writeFile(path.join(out, '.nojekyll'), '');

const html = await readFile(path.join(out, 'index.html'), 'utf8');
const dashes = (html.match(/[\u2014\u2013]/g) || []).length;
if (dashes) console.warn(`warning: ${dashes} em/en dash found in the copy`);
const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`;
console.log(`built dist/  ${minify ? 'minified' : 'DEBUG, unminified'}  total ${kb(await totalBytes(out))}`);
