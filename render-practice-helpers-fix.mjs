import fs from "node:fs";

const files = ["server/functions.js"];

const helper = String.raw`
function recentTimestamp(value) {
  const n = Number(value);
  return Number.isFinite(n) && Math.abs(Date.now() - n) <= CALLBACK_WINDOW_MS;
}

function safeEqual(a, b) {
  const aa = Buffer.from(String(a || ""));
  const bb = Buffer.from(String(b || ""));
  return aa.length === bb.length && crypto.timingSafeEqual(aa, bb);
}

function fingerprint(secret) {
  return secret
    ? crypto.createHash("sha256").update(String(secret)).digest("hex").slice(0, 16)
    : "missing";
}

function videoId(value = "") {
  const match = String(value).match(
    /(?:youtu\.be\/|youtube(?:-nocookie)?\.com\/(?:watch\?[^#]*v=|embed\/|shorts\/))([\w-]{11})/i
  );
  return match?.[1] || "";
}
`;

for (const file of files) {
  if (!fs.existsSync(file)) continue;
  let code = fs.readFileSync(file, "utf8");

  const missing = [
    ["recentTimestamp", /function\s+recentTimestamp\s*\(/],
    ["safeEqual", /function\s+safeEqual\s*\(/],
    ["fingerprint", /function\s+fingerprint\s*\(/],
    ["videoId", /function\s+videoId\s*\(/],
  ].filter(([, rx]) => !rx.test(code));

  if (!missing.length) {
    console.log(`[practice-helpers-fix] ${file}: no change needed`);
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
  console.log(`[practice-helpers-fix] ${file}: installed ${missing.map(x => x[0]).join(", ")}`);
}
