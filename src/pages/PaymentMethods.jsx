import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronRight,
  CreditCard,
  Smartphone,
  Landmark,
  Plus,
  Star,
  Trash2,
  ShieldCheck,
  Pencil,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { usePaymentMethods } from '../context/PaymentMethodsContext';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import AddPaymentMethodModal from '../components/payment/AddPaymentMethodModal';
import AddBankAccountModal from '../components/payment/AddBankAccountModal';
import './PaymentMethods.css';

function getMethodIcon(type) {
  if (type === 'bank_account') return Landmark;
  if (type === 'apple_pay' || type === 'google_pay') return Smartphone;
  return CreditCard;
}

function PaymentMethodItem({
  method,
  label,
  onSetDefault,
  onRemove,
  showDefaultAction = true,
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleRemove = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    onRemove(method.id);
    setConfirmDelete(false);
  };

  return (
    <div className="payment-method-item">
      <span className="payment-method-item__icon">
        <Icon icon={getMethodIcon(method.type)} size={18} className="app-icon--primary" />
      </span>
      <div className="payment-method-item__info">
        <span className="payment-method-item__label">{label}</span>
        {method.accountHolderName && (
          <small className="payment-method-item__sub">{method.accountHolderName}</small>
        )}
      </div>
      {method.isDefault && (
        <span className="payment-method-item__badge">ברירת מחדל</span>
      )}
      <div className="payment-method-item__actions">
        {showDefaultAction && !method.isDefault && (
          <button
            type="button"
            className="payment-method-item__action"
            onClick={() => onSetDefault(method.id)}
            title="הגדרה כברירת מחדל"
          >
            <Icon icon={Star} size={16} />
          </button>
        )}
        <button
          type="button"
          className={`payment-method-item__action ${confirmDelete ? 'payment-method-item__action--danger' : ''}`}
          onClick={handleRemove}
          onBlur={() => setConfirmDelete(false)}
          title={confirmDelete ? 'אישור מחיקה' : 'הסרה'}
        >
          <Icon icon={Trash2} size={16} />
        </button>
      </div>
    </div>
  );
}

function BankAccountCard({ account, label, onEdit }) {
  return (
    <div className="payment-method-item payment-method-item--bank">
      <span className="payment-method-item__icon payment-method-item__icon--bank">
        <Icon icon={Landmark} size={18} className="app-icon--primary" />
      </span>
      <div className="payment-method-item__info">
        <span className="payment-method-item__label">{label}</span>
        {account.accountHolderName && (
          <small className="payment-method-item__sub">{account.accountHolderName}</small>
        )}
      </div>
      <button
        type="button"
        className="payment-method-item__action"
        onClick={onEdit}
        title="עריכת חשבון"
      >
        <Icon icon={Pencil} size={16} />
      </button>
    </div>
  );
}

export default function PaymentMethods() {
  const navigate = useNavigate();
  const { isOwner } = useAuth();
  const {
    getPaymentMethods,
    getBankAccount,
    getPaymentMethodLabel,
    removePaymentMethod,
    setDefaultPaymentMethod,
  } = usePaymentMethods();

  const [addPaymentOpen, setAddPaymentOpen] = useState(false);
  const [bankModalOpen, setBankModalOpen] = useState(false);

  const paymentMethods = getPaymentMethods('payment');
  const bankAccount = getBankAccount();

  return (
    <div className="page payment-methods-page">
      <button type="button" className="page-back" onClick={() => navigate('/profile')}>
        <Icon icon={ChevronRight} size={18} />
        חזרה לפרופיל
      </button>

      <div className={`payment-methods-layout ${isOwner ? 'payment-methods-layout--owner' : ''}`}>
        <div className="card payment-methods-card">
          <h2 className="payment-methods-card__title">תשלום על חניות</h2>
          <p className="payment-methods-card__text">
            אמצעי התשלום שישמשו אתכם בעת הזמנת חניה.
          </p>

          {paymentMethods.length > 0 ? (
            <div className="payment-methods-list">
              {paymentMethods.map((method) => (
                <PaymentMethodItem
                  key={method.id}
                  method={method}
                  label={getPaymentMethodLabel(method)}
                  onSetDefault={setDefaultPaymentMethod}
                  onRemove={removePaymentMethod}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state payment-methods-empty">
              <p>לא הוגדרו אמצעי תשלום</p>
            </div>
          )}

          <Button variant="secondary" fullWidth onClick={() => setAddPaymentOpen(true)}>
            <Icon icon={Plus} size={18} />
            הוספת אמצעי תשלום
          </Button>
        </div>

        {isOwner && (
          <div className="card payment-methods-card">
            <h2 className="payment-methods-card__title">חשבון בנק לקבלת תשלומים</h2>
            <p className="payment-methods-card__text">
              הכסף מהחניות שאתם מעלים ומשכירים יועבר לחשבון הבנק שתגדירו כאן.
            </p>

            {bankAccount ? (
              <div className="payment-methods-list">
                <BankAccountCard
                  account={bankAccount}
                  label={getPaymentMethodLabel(bankAccount)}
                  onEdit={() => setBankModalOpen(true)}
                />
              </div>
            ) : (
              <div className="empty-state payment-methods-empty">
                <p>לא הוגדר חשבון בנק לקבלת תשלומים</p>
              </div>
            )}

            <Button variant="secondary" fullWidth onClick={() => setBankModalOpen(true)}>
              <Icon icon={bankAccount ? Pencil : Plus} size={18} />
              {bankAccount ? 'עדכון חשבון בנק' : 'הוספת חשבון בנק'}
            </Button>
          </div>
        )}
      </div>

      <div className="payment-methods-footer">
        <p>
          <Icon icon={ShieldCheck} size={16} className="app-icon--success" />
          הפרטים שלכם מוצפנים ולא משותפים עם צד שלישי
        </p>
      </div>

      <AddPaymentMethodModal
        isOpen={addPaymentOpen}
        onClose={() => setAddPaymentOpen(false)}
      />
      <AddBankAccountModal
        isOpen={bankModalOpen}
        onClose={() => setBankModalOpen(false)}
        existingAccount={bankAccount}
      />
    </div>
  );
}
