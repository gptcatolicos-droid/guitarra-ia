import { useSEO } from '@/lib/seo';
import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function SettingsPage() {
  useSEO({
    title: 'Ajustes | Tablaturas AI',
    description: 'Configuración de la aplicación.',
    canonical: '/ajustes',
  });

  const [isDark, setIsDark] = useState(
    document.documentElement.classList.contains('dark')
  );

  const toggleTheme = () => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
      setIsDark(false);
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
      setIsDark(true);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Ajustes</h1>

      <div className="bg-card border border-border rounded-xl p-6 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-foreground font-medium">Tema de la interfaz</p>
            <p className="text-muted-foreground text-sm mt-0.5">
              {isDark ? 'Modo oscuro activo' : 'Modo claro activo'}
            </p>
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary hover:bg-secondary/80 text-foreground transition-colors text-sm font-medium"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? 'Modo claro' : 'Modo oscuro'}
          </button>
        </div>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <p className="text-muted-foreground text-sm">
          Tablaturas AI es una plataforma gratuita. Todas las funciones están
          disponibles sin costo durante el lanzamiento.
        </p>
      </div>
    </div>
  );
}