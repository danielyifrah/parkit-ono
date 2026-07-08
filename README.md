# Parkit — חניה חכמה

**Parkit** היא פלטפורמת ווב שמחברת **נהגים** שמחפשים חניה ליד היעד לבין **בעלי חניות** שמפרסמים מקומות פנויים — עם מפה, סינון חכם, תמחור שקוף ופורטל ניהול לבעלים.

**מצב נוכחי:** MVP עם נתוני Mock, שמירה ב־`localStorage`, ממשק עברית (RTL), מובייל ודסקטופ.  
**השלב הבא:** חיבור ל־Supabase (Auth, Database, Storage).

---

## הבעיה

באזורים עמוסים — ובמיוחד בתל אביב — מציאת חניה היא כאב יומיומי:

| צד | כאב |
|----|-----|
| **נהג** | סיבובים ברחוב, חוסר ודאות במחיר ובזמינות, חניונים עמוסים, חניות פרטיות שלא נגישות |
| **בעל חניה** | מקום שעומד ריק שעות ארוכות — ללא ערוץ פשוט להפוך אותו להכנסה |

הבעיה אינה "אין אפליקציות חניה", אלא **פיצול**: תשלום ברחוב נפרד מחיפוש חניון, חניות פרטיות לא במפה, ואין פלטפורמה אחת שמחברת בין הצדדים עם הזמנה שקופה.

---

## קהל היעד

**נהגים** — תושבי עיר, מבקרים זמניים (אירועים, מסעדות), עובדים שמחפשים חניה זולה וקרובה. צריכים: מפה, מחיר ברור לפני ההזמנה, הזמנה לפי שעה, דירוגים.

**בעלי חניות** — דיירים עם חניה פנויה, משרדים עם מקומות ריקים מחוץ לשעות הפעילות, חניונים קטנים. צריכים: פרסום פשוט, ניהול זמינות, מעקב הכנסות.

**לא בפוקוס (MVP):** חניה עירונית (Pango/Cellopark), חניונים גדולים עם מערכות ייעודיות, חניה חודשית/שנתית.

---

## הפתרון והבידול

Parkit היא **שוק דו-צדדי** לחניות — לא אפליקציית תשלום ולא רק מפה.

| עמוד | מה Parkit נותנת |
|------|-----------------|
| **נהג** | מפת Google עם סיכות מחיר, סינון (זמן/מחיר/דירוג/סוג), הזמנה לפי שעה, מעקב חניה שמורה/פעילה, היסטוריה |
| **בעל חניה** | פורטל שותפים: דשבורד, ניהול חניות, הגדרת זמינות שבועית |

**למה דווקא ככה?**
1. **מפה כמרכז** — בישראל "כמה קרוב" חשוב לפני "כמה זול"
2. **תמחור שקוף** — מחיר על הסיכה במפה; הנחות אוטומטיות ל־6–8 שעות וליום שלם
3. **פלטפורמה אחת** — נהג ובעל חניה באותו מוצר, תפקיד שונה
4. **עברית ו־RTL מהיסוד** — מותאם לשוק הישראלי (Places API מוגבל לישראל)
5. **מיקוד גאוגרפי** — תל אביב כנקודת פתיחה

> **Pango משלם על חניה ברחוב. Waze מראה חניון. Parkit מחבר בין נהג לבעל חניה פרטית — עם מפה, הזמנה ותמחור שקוף — בעברית.**

---

## ניתוח מתחרים

| מתחרה | מה עושה | חולשה ביחס ל-Parkit |
|--------|---------|---------------------|
| **[Pango](https://www.pango.co.il/) / [Cellopark](https://www.cellopark.co.il/)** | תשלום חניה ברחוב | לא marketplace — אין חניות פרטיות, הזמנה מראש, או צד בעלים |
| **Waze / Google Maps** | ניווט + חניונים ציבוריים | אין הזמנה, תמחור מובטח, או חניות פרטיות |
| **[SpotHero](https://spothero.com/) / [JustPark](https://www.justpark.com/)** | Marketplace בינלאומי | לא מותאם לישראל — אין RTL, עברית, Places IL |
| **חניונים ישירים** | אפליקציה לחניון בודד | לא אגרגטור — אפליקציה נפרדת לכל מקום |
| **פייסבוק / יד2** | פרסום ידני | ללא מפה, הזמנה, תשלום מאובטח, דירוגים |

---

## טכנולוגיות

| רכיב | טכנולוגיה |
|------|-----------|
| Frontend | React 19, Vite 8, React Router 7 |
| מפות | Google Maps + Places API |
| עיצוב | CSS (גלובלי + לפי קומפוננטה), Rubik, lucide-react |
| נתונים | `mockData.js` (seed) + `parkingStore.js` (localStorage) |
| Backend (מתוכנן) | Supabase — Auth, PostgreSQL, Storage |
| Lint | Oxlint |

---

## התקנה והפעלה

**דרישות:** Node.js 18+, מפתח Google Maps (Maps JavaScript API + Places API).

```bash
git clone <repository-url>
cd Parkit-Project
npm install
cp .env.example .env.local   # הוסף VITE_GOOGLE_MAPS_API_KEY
npm run dev                  # http://localhost:5173
```

```bash
npm run build    # בנייה לפרודקשן
npm run preview  # תצוגה מקומית של ה-build
npm run lint     # Oxlint
```

> `.env.local` ב־`.gitignore` — אל תעלה מפתחות ל-Git.

---

## משתמשי דמו

כל חשבונות הדמו מתקבלים עם **כל סיסמה**.

| תפקיד | אימייל | גישה |
|--------|--------|------|
| נהג | `israel@example.com` | אפליקציית נהג |
| בעל חניה | `danny@example.com` | נהג + פורטל שותפים (`/partner`) |
| מנהל | `admin@parkit.com` | נהג בלבד (דשבורד ניהול — בקרוב) |

הרשמה ב־`/register` יוצרת תמיד `driver`. סיסמאות נשמרות ב־`parkit_credentials`.

---

## מבנה הפרויקט

```
Parkit-Project/
├── public/              # favicon.svg, icons.svg
├── src/
│   ├── main.jsx         # נקודת כניסה
│   ├── App.jsx          # ניתוב + Providers
│   ├── index.css        # משתני עיצוב גלובליים
│   ├── pages/           # מסכים (Home, Booking, Profile, OwnerDashboard…)
│   ├── components/
│   │   ├── layout/      # Layout, Header, BottomNav
│   │   ├── parking/     # ParkingMap, FilterBar, ParkingCard…
│   │   ├── booking/     # DateSelector, DurationWheel
│   │   ├── profile/     # EditProfileModal, SecurityModal
│   │   ├── support/     # ChatModal
│   │   ├── ui/          # Button, Input, Modal, Icon…
│   │   ├── ProtectedRoute.jsx
│   │   ├── RoleRoute.jsx
│   │   └── BookingSessionGuard.jsx
│   ├── context/         # Auth, Parking, GoogleMaps, Header
│   ├── data/            # mockData.js (seed), supportFaq.js
│   ├── lib/             # לוגיקה עסקית — parkingStore, filters, pricing…
│   ├── hooks/           # useScreenLock
│   └── styles/          # desktop-layouts.css
├── index.html           # lang=he, dir=rtl
├── vite.config.js
├── package.json
└── .env.example
```

| תיקייה | תפקיד |
|--------|--------|
| `pages/` | מסך שלם לכל Route |
| `components/` | רכיבים לפי תחום (parking, booking, ui…) |
| `lib/` | לוגיקה ללא UI — `parkingStore.js` יוחלף ב-Supabase |
| `data/` | seed בלבד |
| `context/` | state גלובלי (Auth, Parking, Maps) |

**קבצים מרכזיים:** `Home.jsx` (מפה + מסננים), `parkingStore.js` (מצב האפליקציה), `ParkingMap.jsx`, `parkingFilters.js`, `bookingPricing.js`, `availability.js`, `supabaseClient.js` (stub).

---

## ניתוב והרשאות

| נתיב | מסך | הגנה |
|------|-----|------|
| `/login`, `/register`, `/forgot-password` | Auth | ציבורי |
| `/` | מפה + חיפוש | מחובר |
| `/parking/:id`, `/parking/:id/book` | פרטים + הזמנה | מחובר |
| `/saved`, `/active` | חניה שמורה/פעילה | מחובר + נעילת ניווט |
| `/history`, `/history/:id` | היסטוריה | מחובר |
| `/profile`, `/support` | פרופיל, תמיכה | מחובר |
| `/partner`, `/partner/add` | פורטל בעלים | מחובר + `owner` |

**תפקידים:** `driver` (נהג), `owner` (פורטל שותפים), `admin` (ניהול — בקרוב).

**רכיבי הגנה:** `ProtectedRoute` (התחברות), `RoleRoute` (תפקיד), `BookingSessionGuard` (נעילה ל־`/saved` או `/active` בזמן הזמנה).

**localStorage:** `parkit_user` (משתמש), `parkit_credentials` (סיסמאות), `parkit_store_v1` (חניות והזמנות).

---

## שכבת הנתונים

1. **`mockData.js`** — seed: 3 משתמשי דמו, 5 חניות בתל אביב, היסטוריית הזמנות.
2. **`parkingStore.js`** — מצב בזמן ריצה: CRUD חניות והזמנות, נשמר ב־`parkit_store_v1`. מחזור הזמנה: `scheduled` → `saved` → `active` → `completed`.

`ParkingContext` חושף את ה-store לכל הקומפוננטות.

---

## מגבלות נוכחיות

| תחום | מגבלה |
|------|--------|
| Backend | אין שרת — `localStorage` בדפדפן בלבד |
| Auth | דמו: כל סיסמה מתקבלת; Google Login → נהג דמו; שכחתי סיסמה — UI בלבד |
| תשלום | אין סליקה |
| סנכרון | לא בין מכשירים/משתמשים |
| תמונות | Pexels (אינטרנט); בפרודקשן — Supabase Storage |

---

## תכנון Supabase

1. `npm install @supabase/supabase-js`
2. הפעלת `supabaseClient.js` עם `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`
3. Auth → החלפת `AuthContext`
4. DB → טבלאות `parkings`, `bookings`, `users` + RLS
5. החלפת `parkingStore.js` בקריאות `supabase.from(...)`
6. Storage → bucket `parking-images`

---

## פתרון בעיות

| בעיה | פתרון |
|------|--------|
| מפה לא נטענת | בדוק `VITE_GOOGLE_MAPS_API_KEY` ב־`.env.local`, הפעל Maps + Places API, הפעל מחדש `npm run dev` |
| חיפוש כתובת נכשל | ודא Places API פעיל (מוגבל לישראל) |
| תמונות לא מוצגות | בדוק אינטרנט וכתובות Pexels ב־`mockData.js` |
| נתונים ישנים | מחק `parkit_store_v1` מ-localStorage; התנתק והתחבר מחדש |

---

פרויקט לימודי / דמו · תמונות: [Pexels](https://www.pexels.com/) · מפות: [Google Maps Platform](https://maps.google.com/)

**גרסה:** 0.0.0 (MVP) · **שפה:** עברית (RTL) · **אזור:** תל אביב
