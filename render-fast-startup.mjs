import fs from 'node:fs';

const indexPath = 'server/index.js';
let source = fs.readFileSync(indexPath, 'utf8');
const portIndex = source.indexOf('const port = Number(process.env.PORT');
if (portIndex < 0) throw new Error('Render port anchor not found');

const beforePort = source.slice(0, portIndex);
const afterPort = source.slice(portIndex);
const deferred = [];

const kept = beforePort
  .split('\n')
  .filter((line) => {
    const trimmed = line.trim();
    // Only move genuine top-level startup awaits. Database schema initialization
    // must remain blocking; all catalog/editorial jobs can run after health is up.
    if (line === trimmed && /^await\s+.+;\s*$/.test(trimmed) && trimmed !== 'await initDatabase();') {
      deferred.push(trimmed.replace(/^await\s+/, '').replace(/;\s*$/, ''));
      return false;
    }
    return true;
  })
  .join('\n');

// Remove the previous Spotify timer so it is scheduled once by this final patch.
let cleaned = kept.replace(
  /setTimeout\(\(\) => ensureStrictSpotifyCatalog\(\)\.catch\([^\n]+\),\s*5000\);\s*\n?/g,
  ''
);

const uniqueDeferred = [...new Set(deferred)].filter((job) => !job.startsWith('ensureStrictSpotifyCatalog('));
const scheduler = `
const runBackgroundJob = (name, task) => {
  Promise.resolve()
    .then(task)
    .then(() => console.log('BACKGROUND_JOB_COMPLETE', name))
    .catch((error) => console.error('BACKGROUND_JOB_FAILED', name, error?.message || error));
};

setTimeout(() => {
  console.log('BACKGROUND_CATALOG_JOBS_STARTED', { count: ${uniqueDeferred.length} });
${uniqueDeferred.map((job, index) => `  setTimeout(() => runBackgroundJob(${JSON.stringify(job)}, async () => { await ${job}; }), ${index * 750});`).join('\n')}
}, 2500);

setTimeout(() => {
  runBackgroundJob('ensureStrictSpotifyCatalog', () => ensureStrictSpotifyCatalog());
}, 5000);

`;

source = cleaned + '\n' + scheduler + afterPort;
fs.writeFileSync(indexPath, source);
console.log('Fast startup and deferred catalog jobs installed.', { deferred: uniqueDeferred.length });
