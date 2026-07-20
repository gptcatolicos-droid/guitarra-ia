import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Apply saved theme before React renders to avoid flash
;(function () {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  const savedColor = localStorage.getItem('themeColor');
  const savedFont = localStorage.getItem('themeFont');
  if (savedColor) {
    document.documentElement.style.setProperty('--primary', savedColor);
    document.documentElement.style.setProperty('--accent', savedColor);
    document.documentElement.style.setProperty('--ring', savedColor);
  }
  if (savedFont) {
    document.documentElement.style.setProperty('--font-heading', savedFont);
    document.documentElement.style.setProperty('--font-body', savedFont);
    document.documentElement.style.setProperty('--font-display', savedFont);
  }
})();

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)