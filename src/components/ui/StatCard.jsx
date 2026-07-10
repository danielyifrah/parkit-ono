import './StatCard.css';

export default function StatCard({
  title,
  value,
  subtitle,
  variant = 'default',
  progress,
  onClick,
  active = false,
}) {
  const className = [
    'stat-card',
    `stat-card--${variant}`,
    onClick ? 'stat-card--clickable' : '',
    active ? 'stat-card--active' : '',
  ].filter(Boolean).join(' ');

  const content = (
    <>
      <span className="stat-card__title">{title}</span>
      <span className="stat-card__value">{value}</span>
      {subtitle && <span className="stat-card__subtitle">{subtitle}</span>}
      {progress !== undefined && (
        <div className="stat-card__progress">
          <div className="stat-card__progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {content}
      </button>
    );
  }

  return <div className={className}>{content}</div>;
}
