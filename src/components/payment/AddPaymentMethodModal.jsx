import { useState } from 'react';
import { CreditCard, Smartphone } from 'lucide-react';
import Modal from '../ui/Modal';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Icon from '../ui/Icon';
import { usePaymentMethods } from '../../context/PaymentMethodsContext';
import './AddPaymentMethodModal.css';

const WALLET_OPTIONS = [
  { type: 'apple_pay', label: 'Apple Pay', icon: Smartphone },
  { type: 'google_pay', label: 'Google Pay', icon: Smartphone },
];

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
}

function formatExpiry(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2)}`;
}

export default function AddPaymentMethodModal({ isOpen, onClose }) {
  const { addPaymentMethod, detectCardBrand } = usePaymentMethods();
  const [mode, setMode] = useState('card');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [holderName, setHolderName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setMode('card');
    setCardNumber('');
    setExpiry('');
    setCvv('');
    setHolderName('');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCardSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 13) {
      setError('מספר כרטיס לא תקין');
      return;
    }

    const [month, year] = expiry.split('/');
    if (!month || !year || month.length !== 2 || year.length !== 2) {
      setError('תוקף הכרטיס לא תקין');
      return;
    }

    if (cvv.length < 3) {
      setError('קוד אבטחה לא תקין');
      return;
    }

    if (!holderName.trim()) {
      setError('יש להזין שם בעל הכרטיס');
      return;
    }

    setSaving(true);
    try {
      await addPaymentMethod({
        category: 'payment',
        type: 'credit_card',
        label: 'כרטיס אשראי',
        brand: detectCardBrand(digits),
        lastFour: digits.slice(-4),
      });
      handleClose();
    } catch {
      setError('הוספת אמצעי התשלום נכשלה');
    } finally {
      setSaving(false);
    }
  };

  const handleWalletAdd = async (wallet) => {
    setSaving(true);
    setError('');
    try {
      await addPaymentMethod({
        category: 'payment',
        type: wallet.type,
        label: wallet.label,
      });
      handleClose();
    } catch {
      setError('הוספת אמצעי התשלום נכשלה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="הוספת אמצעי תשלום" isOpen={isOpen} onClose={handleClose} className="modal--wide">
      <div className="add-payment-modal">
        <div className="add-payment-modal__tabs">
          <button
            type="button"
            className={`add-payment-modal__tab ${mode === 'card' ? 'add-payment-modal__tab--active' : ''}`}
            onClick={() => setMode('card')}
          >
            <Icon icon={CreditCard} size={16} />
            כרטיס אשראי
          </button>
          <button
            type="button"
            className={`add-payment-modal__tab ${mode === 'wallet' ? 'add-payment-modal__tab--active' : ''}`}
            onClick={() => setMode('wallet')}
          >
            <Icon icon={Smartphone} size={16} />
            ארנק דיגיטלי
          </button>
        </div>

        {mode === 'card' ? (
          <form className="add-payment-modal__form" onSubmit={handleCardSubmit}>
            <Input
              label="מספר כרטיס"
              inputMode="numeric"
              autoComplete="cc-number"
              placeholder="0000 0000 0000 0000"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              required
            />
            <div className="add-payment-modal__row">
              <Input
                label="תוקף"
                placeholder="MM/YY"
                inputMode="numeric"
                autoComplete="cc-exp"
                value={expiry}
                onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                required
              />
              <Input
                label="CVV"
                type="password"
                inputMode="numeric"
                autoComplete="cc-csc"
                placeholder="•••"
                maxLength={4}
                value={cvv}
                onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                required
              />
            </div>
            <Input
              label="שם בעל הכרטיס"
              autoComplete="cc-name"
              value={holderName}
              onChange={(e) => setHolderName(e.target.value)}
              required
            />

            {error && <p className="add-payment-modal__error">{error}</p>}

            <Button type="submit" fullWidth disabled={saving}>
              {saving ? 'שומר...' : 'הוספת כרטיס'}
            </Button>
          </form>
        ) : (
          <div className="add-payment-modal__wallets">
            <p className="add-payment-modal__wallet-hint">
              חברו ארנק דיגיטלי לתשלום מהיר ומאובטח בהזמנות חניה.
            </p>
            {WALLET_OPTIONS.map((wallet) => (
              <Button
                key={wallet.type}
                variant="secondary"
                fullWidth
                disabled={saving}
                onClick={() => handleWalletAdd(wallet)}
              >
                <Icon icon={wallet.icon} size={18} />
                חיבור {wallet.label}
              </Button>
            ))}
            {error && <p className="add-payment-modal__error">{error}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}
