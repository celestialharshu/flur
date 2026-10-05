// Run from the frontend folder:  node fix-tauri-csp.mjs
// Turns off the app's content security policy in src-tauri/tauri.conf.json,
// which is the usual reason songs are silent in the built exe.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const f = 'src-tauri/tauri.conf.json';
if (!existsSync(f)) {
  console.log('src-tauri/tauri.conf.json not found. Run this inside the frontend folder.');
  process.exit(1);
}

const t = readFileSync(f, 'utf8');
let j;
try {
  j = JSON.parse(t);
} catch {
  console.log('Could not read tauri.conf.json (comments in it?). Set "csp": null by hand under "security".');
  process.exit(1);
}

const sec = j.app ? (j.app.security ||= {}) : ((j.tauri ||= {}).security ||= {});
console.log('csp was:', sec.csp ?? '(not set)');
sec.csp = null;

writeFileSync(f + '.bak', t);
writeFileSync(f, JSON.stringify(j, null, 2) + '\n');
console.log('csp is now null. Backup: ' + f + '.bak');
console.log('Now run: npx tauri build');
