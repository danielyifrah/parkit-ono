import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MapPin,
  Shield,
  Clock,
  Star,
  Users,
  Building2,
  ChevronDown,
  ChevronLeft,
  Search,
  CalendarCheck,
  Car,
  TrendingUp,
  Globe,
  Sparkles,
} from 'lucide-react';
import Button from '../components/ui/Button';
import Icon from '../components/ui/Icon';
import { useCurrency } from '../context/CurrencyContext';
import { faqItems } from '../data/supportFaq';
import './Landing.css';

const FEATURES = [
  {
    icon: MapPin,
    title: 'מפה חכמה במרכז',
    text: 'חפשו לפי כתובת או אזור וראו חניות זמינות עם מחיר שקוף — ישירות על המפה.',
  },
  {
    icon: Shield,
    title: 'הזמנה מאובטחת',
    text: 'הזמינו מראש לפי שעה, עקבו אחרי חניה שמורה או פעילה, ושלמו בצורה בטוחה.',
  },
  {
    icon: Star,
    title: 'דירוגים ואמינות',
    text: 'בחרו חניה לפי דירוג, סוג מקום ומחיר — עם מידע מלא לפני שמגיעים.',
  },
  {
    icon: TrendingUp,
    title: 'תמחור שקוף',
    text: 'מחיר לשעה על כל סיכה, כולל הנחות אוטומטיות לשהייה ארוכה — בלי הפתעות.',
  },
];

const STEPS = [
  {
    icon: Search,
    title: 'חפשו יעד',
    text: 'הזינו כתובת או בחרו אזור על המפה — Parkit מציגה חניות פנויות בקרבת מקום.',
  },
  {
    icon: CalendarCheck,
    title: 'הזמינו בשעה',
    text: 'בחרו תאריך, שעת התחלה ומשך מוערך. המחיר מוצג מראש, לפני האישור.',
  },
  {
    icon: Car,
    title: 'חנו בראש שקט',
    text: 'הגיעו לחניה שמורה, התחילו את החניה באפליקציה ועקבו אחרי הזמן והתשלום.',
  },
];

const AUDIENCES = [
  {
    icon: Users,
    title: 'לנהגים',
    items: [
      'חיפוש חניה ליד היעד — לא סיבובים מיותרים',
      'מחיר ברור לפני ההזמנה',
      'הזמנה לפי שעה ומעקב בזמן אמת',
      'היסטוריית חניות ותמיכה בעברית',
    ],
  },
  {
    icon: Building2,
    title: 'לבעלי חניות',
    items: [
      'הפכו מקום ריק להכנסה נוספת',
      'פרסום פשוט דרך פורטל השותפים',
      'ניהול זמינות שבועית ומחיר',
      'מעקב אחרי הזמנות והכנסות',
    ],
  },
];

const DIFFERENTIATORS = [
  {
    icon: Globe,
    title: 'מותאם לישראל',
    text: 'עברית, RTL ומפות ממוקדות — בנוי לשוק המקומי מהיסוד.',
  },
  {
    icon: Sparkles,
    title: 'שוק דו-צדדי',
    text: 'לא רק תשלום ברחוב ולא רק מפה — חיבור אמיתי בין נהג לבעל חניה.',
  },
  {
    icon: Clock,
    title: 'חיסכון בזמן',
    text: 'פחות סיבובים, פחות לחץ — יודעים מראש איפה חונים וכמה זה עולה.',
  },
];

const LANDING_FAQ = faqItems.slice(0, 5);

export default function Landing() {
  const [openFaqId, setOpenFaqId] = useState(null);
  const { formatPrice } = useCurrency();

  const toggleFaq = (id) => {
    setOpenFaqId((current) => (current === id ? null : id));
  };

  return (
    <div className="landing">
      <header className="landing-header">
        <div className="landing-header__inner container">
          <Link to="/" className="landing-logo" aria-label="Parkit — דף הבית">
            <span className="landing-logo__icon">P</span>
            <span className="landing-logo__text">Parkit</span>
          </Link>
          <nav className="landing-header__nav" aria-label="פעולות משתמש">
            <Link to="/login" className="landing-header__link">התחברות</Link>
            <Link to="/register" className="landing-header__cta">
              <Button size="sm">הרשמה</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero__bg" aria-hidden="true" />
        <div className="landing-hero__inner container">
          <div className="landing-hero__content">
            <span className="landing-hero__badge">חניה חכמה בתל אביב ובישראל</span>
            <h1 className="landing-hero__title">
              מצאו חניה ליד היעד —
              <span className="landing-hero__title-accent"> בלי סיבובים, בלי הפתעות</span>
            </h1>
            <p className="landing-hero__subtitle">
              Parkit מחברת בין נהגים שמחפשים חניה לבין בעלי חניות פנויות —
              עם מפה, הזמנה לפי שעה ותמחור שקוף, בעברית ומותאם לשוק הישראלי.
            </p>
            <div className="landing-hero__actions">
              <Link to="/register">
                <Button size="lg">התחילו בחינם</Button>
              </Link>
              <Link to="/login">
                <Button variant="secondary" size="lg">התחברות</Button>
              </Link>
            </div>
            <div className="landing-hero__stats">
              <div className="landing-stat">
                <strong>מפה</strong>
                <span>חיפוש לפי מיקום</span>
              </div>
              <div className="landing-stat">
                <strong>שקוף</strong>
                <span>מחיר לפני ההזמנה</span>
              </div>
              <div className="landing-stat">
                <strong>24/7</strong>
                <span>תמיכה בעברית</span>
              </div>
            </div>
          </div>

          <div className="landing-hero__visual" aria-hidden="true">
            <div className="landing-map-preview">
              <div className="landing-map-preview__header">
                <span className="landing-map-preview__dot" />
                <span className="landing-map-preview__dot" />
                <span className="landing-map-preview__dot" />
              </div>
              <div className="landing-map-preview__body">
                <div className="landing-map-preview__search">חיפוש: דיזנגוף 100, תל אביב</div>
                <div className="landing-map-preview__pins">
                  <span className="landing-pin landing-pin--1">{formatPrice(12, { compact: true })}/שעה</span>
                  <span className="landing-pin landing-pin--2">{formatPrice(8, { compact: true })}/שעה</span>
                  <span className="landing-pin landing-pin--3">{formatPrice(15, { compact: true })}/שעה</span>
                </div>
                <div className="landing-map-preview__card">
                  <strong>חניה פרטית — פלורנטין</strong>
                  <span>★ 4.8 · 3 דק׳ הליכה</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="about">
        <div className="container">
          <div className="landing-section__header">
            <span className="landing-section__eyebrow">מהות האפליקציה</span>
            <h2 className="landing-section__title">שוק חכם לחניות — לא עוד סיבוב ברחוב</h2>
            <p className="landing-section__desc">
              באזורים עמוסים מציאת חניה היא כאב יומיומי. Parkit פותרת את זה בפלטפורמה אחת:
              מפה עם חניות פרטיות זמינות, הזמנה לפי שעה, ופורטל לבעלי חניות שרוצים להפוך מקום ריק להכנסה.
            </p>
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--alt">
        <div className="container">
          <div className="landing-section__header">
            <span className="landing-section__eyebrow">יתרונות</span>
            <h2 className="landing-section__title">למה Parkit?</h2>
          </div>
          <div className="landing-features">
            {FEATURES.map((feature) => (
              <article key={feature.title} className="landing-feature card">
                <div className="landing-feature__icon">
                  <Icon icon={feature.icon} size={24} />
                </div>
                <h3 className="landing-feature__title">{feature.title}</h3>
                <p className="landing-feature__text">{feature.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" id="how-it-works">
        <div className="container">
          <div className="landing-section__header">
            <span className="landing-section__eyebrow">איך זה עובד</span>
            <h2 className="landing-section__title">שלושה צעדים לחניה רגועה</h2>
          </div>
          <div className="landing-steps">
            {STEPS.map((step, index) => (
              <article key={step.title} className="landing-step">
                <div className="landing-step__number">{index + 1}</div>
                <div className="landing-step__icon">
                  <Icon icon={step.icon} size={22} />
                </div>
                <h3 className="landing-step__title">{step.title}</h3>
                <p className="landing-step__text">{step.text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--alt">
        <div className="container">
          <div className="landing-section__header">
            <span className="landing-section__eyebrow">למי זה מתאים</span>
            <h2 className="landing-section__title">פלטפורמה אחת — שני צדדים</h2>
          </div>
          <div className="landing-audiences">
            {AUDIENCES.map((audience) => (
              <article key={audience.title} className="landing-audience card">
                <div className="landing-audience__head">
                  <Icon icon={audience.icon} size={24} />
                  <h3>{audience.title}</h3>
                </div>
                <ul className="landing-audience__list">
                  {audience.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="container">
          <div className="landing-section__header">
            <span className="landing-section__eyebrow">בידול</span>
            <h2 className="landing-section__title">מה מבדיל אותנו</h2>
            <p className="landing-section__desc landing-section__desc--quote">
              Pango משלם על חניה ברחוב. Waze מראה חניון. Parkit מחברת בין נהג לבעל חניה פרטית —
              עם מפה, הזמנה ותמחור שקוף — בעברית.
            </p>
          </div>
          <div className="landing-diff">
            {DIFFERENTIATORS.map((item) => (
              <article key={item.title} className="landing-diff__item">
                <Icon icon={item.icon} size={22} className="landing-diff__icon" />
                <div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section--alt" id="faq">
        <div className="container">
          <div className="landing-section__header">
            <span className="landing-section__eyebrow">שאלות נפוצות</span>
            <h2 className="landing-section__title">יש לכם שאלות? יש לנו תשובות</h2>
          </div>
          <div className="landing-faq card">
            {LANDING_FAQ.map((item) => {
              const isOpen = openFaqId === item.id;
              return (
                <div key={item.id} className={`landing-faq__item ${isOpen ? 'landing-faq__item--open' : ''}`}>
                  <button
                    type="button"
                    className="landing-faq__question"
                    onClick={() => toggleFaq(item.id)}
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <Icon
                      icon={isOpen ? ChevronDown : ChevronLeft}
                      size={18}
                      className="landing-faq__chevron"
                    />
                  </button>
                  {isOpen && <p className="landing-faq__answer">{item.answer}</p>}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="landing-cta">
        <div className="container landing-cta__inner">
          <h2 className="landing-cta__title">מוכנים לחנות בראש שקט?</h2>
          <p className="landing-cta__text">
            הצטרפו ל-Parkit — חפשו חניה, הזמינו בשעה, וחסכו זמן בכל יום.
          </p>
          <div className="landing-cta__actions">
            <Link to="/register">
              <Button size="lg">הרשמה חינם</Button>
            </Link>
            <Link to="/login">
              <Button variant="secondary" size="lg">יש לי כבר חשבון</Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="container landing-footer__inner">
          <div className="landing-logo landing-logo--footer">
            <span className="landing-logo__icon">P</span>
            <span className="landing-logo__text">Parkit</span>
          </div>
          <p className="landing-footer__tagline">חניה חכמה — מחברים נהגים לחניות פנויות</p>
          <div className="landing-footer__links">
            <Link to="/login">התחברות</Link>
            <Link to="/register">הרשמה</Link>
          </div>
          <p className="landing-footer__copy">© {new Date().getFullYear()} Parkit. כל הזכויות שמורות.</p>
        </div>
      </footer>
    </div>
  );
}
