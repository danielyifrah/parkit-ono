import { useState } from 'react';
import Modal from '../ui/Modal';
import Input, { Select } from '../ui/Input';
import Button from '../ui/Button';
import { usePaymentMethods } from '../../context/PaymentMethodsContext';
import './AddBankAccountModal.css';

const ISRAELI_BANKS = [
  'בנק לאומי',
  'בנק הפועלים',
  'בנק דיסקונט',
  'בנק מזרחי טפחות',
  'בנק יהב',
  'בנק הבינלאומי',
  'בנק מרכנתיל',
  'בנק ירושלים',
  'בנק אוצר החייל',
  'בנק ערבי ישראלי',
];

export default function AddBankAccountModal({ isOpen, onClose, existingAccount = null }) {
  const { addPaymentMethod } = usePaymentMethods();
  const [bankName, setBankName] = useState(existingAccount?.bankName || ISRAELI_BANKS[0]);
  const [bankBranch, setBankBranch] = useState(existingAccount?.bankBranch || '');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolderName, setAccountHolderName] = useState(existingAccount?.accountHolderName || '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const resetForm = () => {
    setBankName(existingAccount?.bankName || ISRAELI_BANKS[0]);
    setBankBranch(existingAccount?.bankBranch || '');
    setAccountNumber('');
    setAccountHolderName(existingAccount?.accountHolderName || '');
    setError('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    const branch = bankBranch.replace(/\D/g, '');
    const account = accountNumber.replace(/\D/g, '');

    if (!branch || branch.length < 2) {
      setError('יש להזין מספר סניף תקין');
      return;
    }

    if (!account || account.length < 4) {
      setError('יש להזין מספר חשבון תקין');
      return;
    }

    if (!accountHolderName.trim()) {
      setError('יש להזין שם בעל החשבון');
      return;
    }

    setSaving(true);
    try {
      await addPaymentMethod({
        category: 'payout',
        type: 'bank_account',
        label: 'חשבון בנק',
        bankName,
        bankBranch: branch,
        lastFour: account.slice(-4),
        accountHolderName: accountHolderName.trim(),
        isDefault: true,
      });
      handleClose();
    } catch {
      setError('שמירת פרטי החשבון נכשלה');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={existingAccount ? 'עדכון חשבון בנק' : 'הוספת חשבון בנק'}
      isOpen={isOpen}
      onClose={handleClose}
      className="modal--wide"
    >
      <form className="add-bank-modal" onSubmit={handleSubmit}>
        <p className="add-bank-modal__intro">
          הכסף מהחניות שאתם משכירים יועבר לחשבון הבנק שתגדירו כאן.
        </p>

        <Select
          label="שם הבנק"
          value={bankName}
          onChange={(e) => setBankName(e.target.value)}
        >
          {ISRAELI_BANKS.map((bank) => (
            <option key={bank} value={bank}>{bank}</option>
          ))}
        </Select>

        <Input
          label="מספר סניף"
          inputMode="numeric"
          placeholder="לדוגמה: 800"
          value={bankBranch}
          onChange={(e) => setBankBranch(e.target.value.replace(/\D/g, '').slice(0, 4))}
          required
        />

        <Input
          label="מספר חשבון"
          inputMode="numeric"
          placeholder="מספר חשבון מלא"
          value={accountNumber}
          onChange={(e) => setAccountNumber(e.target.value.replace(/\D/g, '').slice(0, 10))}
          required
        />

        <Input
          label="שם בעל החשבון"
          placeholder="כפי שמופיע בבנק"
          value={accountHolderName}
          onChange={(e) => setAccountHolderName(e.target.value)}
          required
        />

        {error && <p className="add-bank-modal__error">{error}</p>}

        <Button type="submit" fullWidth disabled={saving}>
          {saving ? 'שומר...' : existingAccount ? 'עדכון חשבון' : 'שמירת חשבון'}
        </Button>
      </form>
    </Modal>
  );
}
