import './StatCard.css';

export default function StatCard({ title, value, subtitle, variant = 'default', progress }) {
  return (
    <div className={`stat-card stat-card--${variant}`}>
      <span className="stat-card__title">{title}</span>
      <span className="stat-card__value">{value}</span>
      {subtitle && <span className="stat-card__subtitle">{subtitle}</span>}
      {progress !== undefined && (
        <div className="stat-card__progress">
          <div className="stat-card__progress-bar" style={{ width: `${progress}%` }} />
        </div>
      )}
    </div>
  );
}
