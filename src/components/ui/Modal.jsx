import { useEffect } from 'react';
import { X } from 'lucide-react';
import Icon from './Icon';
import './Modal.css';

export default function Modal({ title, isOpen, onClose, children, className = '', closable = true }) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const onKeyDown = (e) => {
      if (e.key === 'Escape' && closable) onClose();
    };

    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose, closable]);

  if (!isOpen) return null;

  return (
    <div
      className="modal-overlay"
      onClick={closable ? onClose : undefined}
      role="presentation"
    >
      <div
        className={`modal ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="modal-title" className="modal__title">{title}</h2>
          {closable && (
            <button type="button" className="modal__close" onClick={onClose} aria-label="סגירה">
              <Icon icon={X} size={20} />
            </button>
          )}
        </div>
        <div className="modal__body">{children}</div>
      </div>
    </div>
  );
}
