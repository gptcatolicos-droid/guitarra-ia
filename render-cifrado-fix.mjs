import fs from "node:fs";

const files = ["server/functions.js", "server/index.js"];

const helper = String.raw`
const CHORD = /\b([A-G](?:#|b)?(?:(?:maj|min|m|M|sus|add|dim|aug)?\d*)?(?:\/[A-G](?:#|b)?)?)\b/g;
const SECTION = /^\s*\[?\s*(intro|verso|coro|pre[-\s]?coro|puente|solo|outro|interludio|estrofa)\s*\]?/i;

function cifrado(song = {}) {
  const raw = String(song.content_raw || song.content || song.tablature || "");
  const chords = [];
  const sections = [];
  let lastLabel = "";

  raw.split(/\r?\n/).forEach((line) => {
    const section = line.match(SECTION)?.[1];
    if (section) lastLabel = section.charAt(0).toUpperCase() + section.slice(1).toLowerCase();

    CHORD.lastIndex = 0;
    const found = [...line.matchAll(CHORD)].map((m) => m[1]);
    if (!found.length) return;

    CHORD.lastIndex = 0;
    const remainder = line.replace(CHORD, "").replace(/[\s\d()[\]{}:;|,./xX*+\-–—]/g, "");
    CHORD.lastIndex = 0;

    if (!(Boolean(section) || remainder.length <= Math.max(1, Math.floor(line.length * 0.18)))) return;

    const before = chords.length;
    found.forEach((chord) => chords.push(chord));

    if (lastLabel && before < chords.length && !sections.some((item) => item.label === lastLabel)) {
      sections.push({ label: lastLabel, firstChord: found[0] });
    }
  });

  return { chords, sections };
}
`;

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  let code = fs.readFileSync(file, "utf8");
  const usesCifrado = /\bcifrado\s*\(/.test(code);
  const definesCifrado = /function\s+cifrado\s*\(/.test(code);

  if (!usesCifrado || definesCifrado) {
    console.log(`[cifrado-fix] ${file}: no change needed`);
    continue;
  }

  const imports = [...code.matchAll(/^import .*?;\s*$/gm)];
  if (imports.length) {
    const last = imports[imports.length - 1];
    const pos = last.index + last[0].length;
    code = code.slice(0, pos) + "\n" + helper + "\n" + code.slice(pos);
  } else {
    code = helper + "\n" + code;
  }

  fs.writeFileSync(file, code, "utf8");
  console.log(`[cifrado-fix] ${file}: helper installed`);
}
