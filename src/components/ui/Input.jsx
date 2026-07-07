import './Input.css';

export default function Input({
  label,
  error,
  icon,
  iconEnd,
  className = '',
  ...props
}) {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-field-wrap">
        {icon && <span className="input-icon input-icon--start">{icon}</span>}
        <input
          className={`input-field ${icon ? 'input-field--with-icon-start' : ''} ${iconEnd ? 'input-field--with-icon-end' : ''}`}
          {...props}
        />
        {iconEnd && <span className="input-icon input-icon--end">{iconEnd}</span>}
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}

export function Textarea({ label, error, className = '', ...props }) {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <textarea className="input-field input-textarea" {...props} />
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}

export function Select({ label, error, children, className = '', ...props }) {
  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className="input-select-wrap">
        <select className="input-field input-select" {...props}>
          {children}
        </select>
      </div>
      {error && <span className="input-error">{error}</span>}
    </div>
  );
}
