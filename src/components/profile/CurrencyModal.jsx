import { Check } from 'lucide-react';
import Modal from '../ui/Modal';
import Icon from '../ui/Icon';
import { useCurrency } from '../../context/CurrencyContext';
import './CurrencyModal.css';

export default function CurrencyModal({ isOpen, onClose }) {
  const { currency, setCurrency, currencies, supportedCurrencies } = useCurrency();

  const handleSelect = (code) => {
    setCurrency(code);
    onClose();
  };

  return (
    <Modal title="בחירת מטבע" isOpen={isOpen} onClose={onClose}>
      <p className="currency-modal__intro">
        המחירים באפליקציה יוצגו במטבע שבחרתם. הסכומים נשמרים בשקלים ומומרים לתצוגה לפי שער עדכני.
      </p>
      <div className="currency-modal__list" role="listbox" aria-label="מטבעות">
        {supportedCurrencies.map((code) => {
          const meta = currencies[code];
          const selected = code === currency;
          return (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={selected}
              className={`currency-modal__option ${selected ? 'currency-modal__option--selected' : ''}`}
              onClick={() => handleSelect(code)}
            >
              <span className="currency-modal__symbol" aria-hidden="true">{meta.symbol}</span>
              <span className="currency-modal__text">
                <span className="currency-modal__name">{meta.shortLabel}</span>
                <small>{meta.code}</small>
              </span>
              {selected && (
                <Icon icon={Check} size={18} className="currency-modal__check app-icon--primary" />
              )}
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
