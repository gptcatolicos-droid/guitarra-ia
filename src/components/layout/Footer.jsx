import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="max-w-6xl mx-auto px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Tablaturas AI · Solo para uso educativo</p>
        <div className="flex items-center gap-4">
          <Link to="/terminos" className="hover:text-foreground transition-colors">
            Términos y Condiciones
          </Link>
          <Link to="/terminos#uso" className="hover:text-foreground transition-colors">
            Uso educativo
          </Link>
        </div>
      </div>
    </footer>
  );
}