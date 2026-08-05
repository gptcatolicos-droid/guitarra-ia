import fs from 'node:fs';

const file = 'src/pages/AdminPage.jsx';
let source = fs.readFileSync(file, 'utf8');

if (!source.includes("NavigationSettingsManager")) {
  source = source.replace(
    "import YouTubePracticeDiagnostics from '@/components/admin/YouTubePracticeDiagnostics';",
    "import YouTubePracticeDiagnostics from '@/components/admin/YouTubePracticeDiagnostics';\nimport NavigationSettingsManager from '@/components/admin/NavigationSettingsManager';"
  );
}

if (!source.includes("{ id: 'menu', label: 'Menú' }")) {
  source = source.replace(
    "{ id: 'facebook', label: 'Facebook' }, { id: 'practice', label: 'Práctica IA' }, { id: 'repair', label: 'Reparar canciones' }, { id: 'theme', label: 'Tema' },",
    "{ id: 'facebook', label: 'Facebook' }, { id: 'practice', label: 'Práctica IA' }, { id: 'repair', label: 'Reparar canciones' }, { id: 'menu', label: 'Menú' }, { id: 'theme', label: 'Tema' },"
  );
}

if (!source.includes("tab === 'menu'")) {
  source = source.replace(
    "      {tab === 'theme' && <ThemeSettings />}",
    "      {tab === 'menu' && <NavigationSettingsManager />}\n\n      {tab === 'theme' && <ThemeSettings />}"
  );
}

fs.writeFileSync(file, source, 'utf8');
console.log('Admin navigation tab installed.');
