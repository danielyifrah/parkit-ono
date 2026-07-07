import './Icon.css';

/**
 * עטיפה לאייקוני Lucide — צבע אחיד, גודל עקבי
 * @param {import('lucide-react').LucideIcon} icon - קומפוננטת אייקון מ-lucide-react
 */
export default function Icon({
  icon: IconComponent,
  size = 20,
  strokeWidth = 1.75,
  className = '',
  ...props
}) {
  if (!IconComponent) return null;

  return (
    <IconComponent
      size={size}
      strokeWidth={strokeWidth}
      className={`app-icon ${className}`}
      aria-hidden="true"
      {...props}
    />
  );
}
