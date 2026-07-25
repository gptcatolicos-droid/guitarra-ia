import { Link } from 'react-router-dom';

export default function BrandLogo({ className = '' }) {
  return (
    <Link to="/" className={`brand-logo ${className}`} aria-label="Guitarra IA, inicio">
      <span className="brand-orbit" aria-hidden="true"><i /></span>
      <span>Guitarra <strong>IA</strong></span>
    </Link>
  );
}
