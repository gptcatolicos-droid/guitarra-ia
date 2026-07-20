import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#111315]">
      <div className="lg:hidden fixed top-0 left-0 right-0 z-30 h-14 bg-[#1a1d21] border-b border-[#2b3138] flex items-center px-4">
        <button onClick={() => setSidebarOpen(true)} className="text-[#a7afb8] hover:text-white">
          <Menu className="w-6 h-6" />
        </button>
        <span className="ml-3 text-white font-bold text-sm">Tablaturas AI</span>
      </div>

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="lg:ml-64 pt-14 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}