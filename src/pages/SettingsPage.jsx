import { useSEO } from '@/lib/seo';

export default function SettingsPage() {
  useSEO({
    title: 'Ajustes | Tablaturas AI',
    description: 'Configuración de la aplicación.',
    canonical: '/ajustes',
  });

  return (
    <div className="max-w-2xl mx-auto p-4 lg:p-8">
      <h1 className="text-2xl font-bold text-white mb-6">Ajustes</h1>
      <div className="bg-[#20242a] border border-[#2b3138] rounded-xl p-6">
        <p className="text-[#a7afb8] text-sm">
          Tablaturas AI es una plataforma gratuita. Todas las funciones están
          disponibles sin costo durante el lanzamiento.
        </p>
      </div>
    </div>
  );
}