import fs from "node:fs";

const files = ["server/index.js", "server/functions.js"];

for (const file of files) {
  if (!fs.existsSync(file)) continue;

  let code = fs.readFileSync(file, "utf8");
  const usesHmac = /\bhmac\s*\(/.test(code);
  const definesHmac = /(?:function|const|let|var)\s+hmac\b/.test(code);

  if (!usesHmac || definesHmac) {
    console.log(`[hmac-fix] ${file}: no change needed`);
    continue;
  }

  const hasCryptoImport =
    /from\s+["']node:crypto["']/.test(code) ||
    /require\(["']node:crypto["']\)/.test(code);

  if (!hasCryptoImport) {
    const importBlock = `import crypto from "node:crypto";\n`;
    const firstImport = code.match(/^import .*?;\s*$/m);
    if (firstImport) {
      const pos = firstImport.index + firstImport[0].length;
      code = code.slice(0, pos) + "\n" + importBlock + code.slice(pos);
    } else {
      code = importBlock + code;
    }
  }

  const helper = `
function hmac(secret, payload) {
  return crypto.createHmac("sha256", String(secret || ""))
    .update(String(payload || ""))
    .digest("hex");
}
`;

  const lastImport = [...code.matchAll(/^import .*?;\s*$/gm)].pop();
  if (lastImport) {
    const pos = lastImport.index + lastImport[0].length;
    code = code.slice(0, pos) + "\n" + helper + code.slice(pos);
  } else {
    code = helper + "\n" + code;
  }

  fs.writeFileSync(file, code, "utf8");
  console.log(`[hmac-fix] ${file}: helper installed`);
}
