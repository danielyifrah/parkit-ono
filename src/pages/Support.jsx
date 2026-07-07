import { useState } from 'react';
import { ChevronLeft, ChevronDown, MessageCircle, Mail } from 'lucide-react';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import ChatModal from '../components/support/ChatModal';
import { faqItems, SUPPORT_EMAIL } from '../data/supportFaq';
import './Support.css';

export default function Support() {
  const [openId, setOpenId] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);

  const toggleFaq = (id) => {
    setOpenId((current) => (current === id ? null : id));
  };

  const handleEmail = () => {
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('פנייה לתמיכת Parkit')}`;
  };

  return (
    <div className="page">
      <div className="support-layout">
        <div className="card support-card">
          <h2 className="support-card__title">שאלות נפוצות</h2>
          <div className="support-faq-list">
            {faqItems.map((item) => {
              const isOpen = openId === item.id;
              return (
                <div key={item.id} className={`support-faq ${isOpen ? 'support-faq--open' : ''}`}>
                  <button
                    type="button"
                    className="support-faq-item"
                    onClick={() => toggleFaq(item.id)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <Icon
                      icon={isOpen ? ChevronDown : ChevronLeft}
                      size={18}
                      className="app-icon--muted support-faq__icon"
                    />
                  </button>
                  {isOpen && (
                    <p className="support-faq__answer">{item.answer}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="card support-card">
          <h2 className="support-card__title">צור קשר</h2>
          <p className="support-card__text">
            לא מצאתם תשובה? צוות התמיכה שלנו זמין 24/7
          </p>
          <Button fullWidth variant="secondary" onClick={() => setChatOpen(true)}>
            <Icon icon={MessageCircle} size={18} />
            צ&apos;אט עם נציג
          </Button>
          <Button fullWidth variant="ghost" onClick={handleEmail}>
            <Icon icon={Mail} size={18} />
            שליחת אימייל
          </Button>
        </div>
      </div>

      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}
