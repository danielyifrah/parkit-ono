<div dir="rtl" align="right">

# Parkit — חניה חכמה

**Parkit** היא פלטפורמת ווב שמחברת **נהגים** שמחפשים חניה ליד היעד לבין **בעלי חניות** שמפרסמים מקומות פנויים — עם מפה, סינון חכם, תמחור שקוף ופורטל ניהול לבעלים.

**מצב נוכחי:** MVP עם ממשק עברית (RTL), מובייל ודסקטופ.  
**נתונים:** מצב כפול — **Supabase** (Auth + PostgreSQL + RLS) כשמוגדר ב־`.env.local`, אחרת **localStorage** + seed מ־`mockData.js`.

📊 **[ERD — מודל הנתונים](docs/erd.md)** · תמונה: [docs/erd.png](docs/erd.png)

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
| מפות | Google Maps JavaScript API + Places API |
| Auth | Supabase Auth (אימייל/סיסמה + Google OAuth) |
| שערי מטבע | ExchangeRate-API Open Access (`open.er-api.com`) |
| עיצוב | CSS (גלובלי + לפי קומפוננטה), Rubik, lucide-react |
| נתונים (לוקלי) | `mockData.js` (seed) + `parkingStore.js` (localStorage) |
| Backend | **Supabase** — Auth, PostgreSQL, Row Level Security |
| Lint | Oxlint |

---

## אינטגרציות חיצוניות

שלושה שירותים חיצוניים. הטבלה מסכמת **מה נמצא בצד הלקוח** ו**איך סודות מוגנים**:

| שירות | תפקיד באפליקציה | מה בצד הלקוח | סוד / מפתח פרטי | הערות אבטחה |
|--------|------------------|---------------|-----------------|-------------|
| **[Google Maps Platform](https://maps.google.com/)** | מפה, סיכות מחיר, חיפוש כתובות (Places) | `VITE_GOOGLE_MAPS_API_KEY` | אין — מפתח דפדפן בלבד | מפתח Maps **חייב** להיטען בדפדפן (JS API). הגנה: הגבלות HTTP referrer + APIs ב-Google Cloud (לא Edge Function) |
| **[Google OAuth](https://developers.google.com/identity)** דרך Supabase | כניסה עם Google | רק `signInWithOAuth({ provider: 'google' })` — בלי Client ID/Secret בקוד | **Client Secret** נשמר רק ב-Supabase Dashboard → Auth → Providers → Google | לעולם לא `VITE_GOOGLE_CLIENT_SECRET`. בלי Supabase — כניסת דמו מקומית |
| **[ExchangeRate-API](https://www.exchangerate-api.com/docs/free)** | שערי ILS→USD/EUR לתצוגה | קריאה ל־`https://open.er-api.com/v6/latest/ILS` | **אין מפתח** בתוכנית החינמית | אם בעתיד יוחלף ב-API בתשלום עם מפתח — חובה Edge Function / שרת; לא `VITE_*` |

### Google Maps

| פרט | ערך |
|-----|-----|
| APIs נדרשים | Maps JavaScript API, Places API |
| משתנה | `VITE_GOOGLE_MAPS_API_KEY` ב־`.env.local` |
| קוד | `src/lib/googleMapsConfig.js`, `src/context/GoogleMapsContext.jsx` |
| למה לא Edge Function? | `@react-google-maps/api` טוען את הסקריפט של Google בדפדפן — המפתח חייב להיות זמין ללקוח. הסתרה בשרת לא מונעת חשיפה |

**הגדרה ב-Google Cloud (חובה בפרודקשן):**
1. צור מפתח API והפעל Maps JavaScript API + Places API
2. הגבל **Application restrictions** ל־HTTP referrers (`http://localhost:5173/*`, דומיין הפרודקשן)
3. הגבל **API restrictions** לשני ה־APIs בלבד
4. הגדר תקציב / התראות חיוב

### Google Auth (OAuth)

| פרט | ערך |
|-----|-----|
| זרימה | לקוח → Supabase Auth → Google → redirect חזרה לאפליקציה |
| קוד | `loginWithGoogle()` ב־`src/context/AuthContext.jsx` |
| Client ID / Secret | מוגדרים ב-Supabase Dashboard בלבד — **לא** ב־`.env` של Vite ולא ב-repo |
| Redirect | `${origin}/` — יש להוסיף את ה-URL ב-Supabase → Authentication → URL Configuration |

**הגדרה (עם Supabase):**
1. Google Cloud Console → OAuth 2.0 Client (Web) — העתק Client ID + Client Secret
2. Supabase → Authentication → Providers → Google — הדבק את הערכים והפעל
3. ב-Google: Authorized redirect URI = ה-URL שמוצג ב-Supabase (callback של Supabase)
4. בפרויקט: ודא `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` ב־`.env.local`

בלי Supabase מוגדר — הכפתור יוצר משתמש דמו מקומי (לא OAuth אמיתי).

### שערי מטבע (ExchangeRate-API)

| פרט | ערך |
|-----|-----|
| מקור | Open Access — `https://open.er-api.com/v6/latest/ILS` |
| מפתח | לא נדרש |
| למה לא Frankfurter? | ECB / Frankfurter לא מפרסמים ILS |
| קוד | `src/lib/currency.js`, `src/context/CurrencyContext.jsx` |
| Cache | `localStorage` (`parkit_fx_rates_v1`), TTL 12 שעות + `FALLBACK_RATES` |

פירוט מלא: [מטבעות ושערי חליפין](#מטבעות-ושערי-חליפין).

### מפתחות וסודות — כללים

| סוג | דוגמה | איפה | כלל |
|-----|--------|------|-----|
| ציבורי (דפדפן) | `VITE_GOOGLE_MAPS_API_KEY`, `VITE_SUPABASE_ANON_KEY`, `VITE_SUPABASE_URL` | `.env.local` → נארז ב-build | מותר בצד לקוח; הגן עם הגבלות מפתח / RLS |
| סודי (שרת בלבד) | Google OAuth Client Secret, Supabase `service_role`, סיסמת DB | Dashboard / CI secrets / לא `VITE_*` | לעולם לא בקוד הלקוח ולא ב-Git |
| ללא מפתח | FX open endpoint | URL קבוע ב־`currency.js` | אם יוחלף ב-API עם מפתח → Edge Function |

> `.env.local` ב־`.gitignore`. אין `service_role` ב־`src/`. אין Edge Functions כרגע — אין סוד שדורש פרוקסי לשרת.

---

## התקנה והפעלה

**דרישות:** Node.js 18+, מפתח Google Maps (Maps JavaScript API + Places API).  
**אופציונלי:** פרויקט Supabase + מפתחות ב־`.env.local` (ראו [אינטגרציות](#אינטגרציות-חיצוניות) ו־[הגדרת Supabase](#supabase--הגדרה)).

<div dir="ltr" align="left">

```bash
git clone <repository-url>
cd Parkit-Project
npm install
# צור .env.local עם לפחות:
#   VITE_GOOGLE_MAPS_API_KEY=...
# אופציונלי: VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (+ Google OAuth ב-Dashboard)
npm run dev                  # http://localhost:5173
```

</div>

<div dir="ltr" align="left">

```bash
npm run build    # בנייה לפרודקשן
npm run preview  # תצוגה מקומית של ה-build
npm run lint     # Oxlint
```

</div>

> `.env.local` ב־`.gitignore` — אל תעלה מפתחות ל-Git.

---

## משתמשי דמו

**מצב Supabase:** סיסמה `demo1234` לכל חשבונות הדמו (נוצרים במיגרציה).  
**מצב לוקלי (ללא Supabase):** כל סיסמה מתקבלת; סיסמאות חדשות נשמרות ב־`parkit_credentials`.

| תפקיד | אימייל | גישה |
|--------|--------|------|
| נהג | `israel@example.com` | אפליקציית נהג |
| בעל חניה | `danny@example.com` | נהג + פורטל שותפים (`/partner`) |
| מנהל | `admin@parkit.com` | נהג בלבד (דשבורד ניהול — בקרוב) |

הרשמה ב־`/register` יוצרת תמיד `driver`.

---

## מבנה הפרויקט

<div dir="ltr" align="left">

```
Parkit-Project/
├── docs/
│   ├── erd.md              # ERD — דיאגרמה + תיעוד מודל הנתונים
│   ├── erd.mmd             # מקור Mermaid לייצוא
│   ├── erd.png             # תמונת ERD להגשה
│   └── supabase-setup.md   # מדריך הגדרת Supabase + מיגרציות
├── supabase/
│   ├── migrations/      # סכמת DB + RLS + seed
│   └── config.toml
├── scripts/
│   └── setup-database.mjs
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
│   │   ├── profile/     # EditProfileModal, SecurityModal, CurrencyModal
│   │   ├── support/     # ChatModal
│   │   ├── ui/          # Button, Input, Modal, Icon…
│   │   ├── ProtectedRoute.jsx
│   │   ├── RoleRoute.jsx
│   │   └── BookingSessionGuard.jsx
│   ├── context/         # Auth, Currency, Parking, GoogleMaps, Header
│   ├── data/            # mockData.js (seed), supportFaq.js
│   ├── lib/             # parkingStore, currency, supabaseClient, filters, pricing…
│   ├── hooks/           # useScreenLock
│   └── styles/          # desktop-layouts.css
├── index.html           # lang=he, dir=rtl
├── vite.config.js
├── package.json
└── .env.local           # מקומי, ב-.gitignore
```

</div>

| תיקייה | תפקיד |
|--------|--------|
| `pages/` | מסך שלם לכל Route |
| `components/` | רכיבים לפי תחום (parking, booking, ui…) |
| `lib/` | לוגיקה ללא UI — `parkingStore.js` (לוקלי + סנכרון Supabase) |
| `data/` | seed לוקלי |
| `context/` | state גלובלי (Auth, Currency, Parking, Maps) |
| `supabase/migrations/` | סכמת PostgreSQL + RLS |
| `docs/` | ERD ותיעוד מודל נתונים |

**קבצים מרכזיים:** `parkingStore.js`, `currency.js`, `AuthContext.jsx`, `CurrencyContext.jsx`, `supabaseClient.js`, `supabaseMappers.js`, `availability.js`.

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

**localStorage (מצב לוקלי):** `parkit_user`, `parkit_credentials`, `parkit_store_v1`, `parkit_currency`, `parkit_fx_rates_v1`.

---

## מטבעות ושערי חליפין

האפליקציה תומכת בתצוגת מחירים ב־**ILS**, **USD** ו־**EUR**. הסכומים במערכת נשמרים תמיד בשקלים (מטבע בסיס); ההמרה היא **לתצוגה בלבד**.

### API

| פרט | ערך |
|-----|-----|
| מקור | [ExchangeRate-API Open Access](https://www.exchangerate-api.com/docs/free) — `https://open.er-api.com/v6/latest/ILS` |
| מפתח API | **לא נדרש** |
| למה לא Frankfurter? | Frankfurter מבוסס על שערי ECB ואינו מפרסם ILS. נבחר מקור חינמי דומה שתומך בשקל |

### מטבעות נתמכים

| קוד | סימן | שם |
|-----|------|-----|
| `ILS` | ₪ | שקל חדש (ברירת מחדל) |
| `USD` | $ | דולר אמריקאי |
| `EUR` | € | אירו |

### איך ההמרה עובדת

1. כל `pricePerHour` / `totalPrice` / עמלות במסד וב־store הם **מספרים ב־ILS**.
2. `formatPrice(amountIls)` ממיר לפי השער הנוכחי ומחזיר מחרוזת עם הסימן המתאים (`₪15`, `$4.05`, `€3.75`).
3. בחירת מטבע: **פרופיל → מטבע** (`CurrencyModal`).
4. סינון מחיר נשאר לפי ספי ILS בלוגיקה; התוויות בלבד מומרות לתצוגה.
5. שדות הזנת מחיר לבעל חניה נשארים ב־₪ (המחיר נשמר תמיד בשקלים).

### Cache ו־Fallback

| שלב | התנהגות |
|-----|----------|
| טעינה | קריאת cache מ־`localStorage` (`parkit_fx_rates_v1`) |
| רענון | אם ה־cache בן פחות מ־**12 שעות** — אין קריאת רשת |
| API זמין | עדכון שערים + שמירה ל־localStorage |
| API נכשל + יש cache | שימוש בשער האחרון שנשמר (גם אם ישן) |
| API נכשל + אין cache | `FALLBACK_RATES` קבועים בקוד — האפליקציה לא קורסת |
| העדפת מטבע | נשמרת ב־`parkit_currency` ולא מתאפסת ברענון |

### הגדרות סביבה

**אין.** לא נדרש משתנה ב־`.env` לשערי מטבע (ראו גם [אינטגרציות — שערי מטבע](#שערי-מטבע-exchangerate-api)).

### היכן בקוד

| קובץ | תפקיד |
|------|--------|
| `src/lib/currency.js` | API, cache, המרה, `formatPrice`, מטבעות נתמכים |
| `src/context/CurrencyContext.jsx` | Provider + `useCurrency()` |
| `src/components/profile/CurrencyModal.jsx` | בחירת מטבע בפרופיל |
| `src/pages/Profile.jsx` | פתיחת מודל המטבע |
| מסכי תצוגת מחיר | קוראים ל־`formatPrice` מ־`useCurrency()` |

### הוספת מטבע נוסף

1. הוסיפו ערך ל־`CURRENCIES` ב־`src/lib/currency.js` (קוד, סימן, תווית).
2. הוסיפו שער ל־`FALLBACK_RATES`.
3. ב־`fetchExchangeRates` / `getEffectiveRates` — קראו את הקוד החדש מ־`data.rates`.
4. המודל בפרופיל יציג אותו אוטומטית דרך `SUPPORTED_CURRENCIES`.

---

## שכבת הנתונים

### מצב כפול (Dual Mode)

| מצב | תנאי | אחסון |
|-----|------|--------|
| **Supabase** | `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` ב־`.env.local` | PostgreSQL + Auth |
| **לוקלי** | ללא מפתחות Supabase | `localStorage` + seed |

### לוקלי

1. **`mockData.js`** — seed: 3 משתמשי דמו, 5 חניות, היסטוריית הזמנות.
2. **`parkingStore.js`** — CRUD חניות והזמנות, נשמר ב־`parkit_store_v1`.

### Supabase (מיושם)

**טבלאות:**

| טבלה | תפקיד | קשרים |
|------|--------|--------|
| `profiles` | פרופיל משתמש (תפקיד, פרטים) | 1:1 עם `auth.users` |
| `parkings` | חניות שמפורסמות | `owner_id` → `profiles` |
| `bookings` | הזמנות חניה | `user_id` → `profiles`, `parking_id` → `parkings` |

**ERD מלא:** [docs/erd.md](docs/erd.md) · [docs/erd.png](docs/erd.png)

**מחזור הזמנה:** `scheduled` → `pending_arrival` / `saved` → `active` → `completed`

`ParkingContext` + `AuthContext` מסנכרנים עם Supabase דרך `parkingStore.js` ו־`supabaseMappers.js`.

---

## Supabase — הגדרה

> 📖 **מדריך מפורט (מומלץ לקרוא):** [docs/supabase-setup.md](docs/supabase-setup.md)  
> מסביר מה זה מיגרציות, על מה זה משפיע, ואיך להריץ שלב-אחר-שלב.

### מה זה מיגרציות? (בקצרה)

**מיגרציה** = קובץ SQL שבונה את מסד הנתונים ב-Supabase:
- יוצר את הטבלאות (`profiles`, `parkings`, `bookings`)
- מגדיר הרשאות (RLS)
- מכניס נתוני דמו

**בלי מיגרציות:** יש מפתחות Supabase אבל אין טבלאות → האפליקציה מציגה שגיאת טעינה.  
**אחרי מיגרציות:** Backend אמיתי — התחברות, חניות והזמנות נשמרים בענן.

### 1. משתני סביבה

הוסף ל־`.env.local` (מ-Supabase → Project Settings → API):

<div dir="ltr" align="left">

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

</div>

### 2. הרצת מיגרציות (חובה, פעם אחת)

**דרך א — Dashboard (הכי פשוט):**  
Supabase → **SQL Editor** → העתק והרץ לפי סדר:
1. `supabase/migrations/20260708180000_initial_schema.sql`
2. `supabase/migrations/20260708200000_public_parkings_rls.sql`
3. `supabase/migrations/20260709120000_tighten_rls.sql`

**דרך ב — טרמינל:**

<div dir="ltr" align="left">

```bash
SUPABASE_DB_PASSWORD=your_db_password \
SUPABASE_PROJECT_REF=your-project-ref \
npm run db:setup
```

</div>

הסקריפט מריץ את **כל** קבצי ה-SQL מתיקיית `supabase/migrations/`.

### 3. אימות

- **Dashboard → Table Editor:** `profiles` (3), `parkings` (5), `bookings` (8)
- **באפליקציה:** התחבר `israel@example.com` / `demo1234` — חניות במפה, בלי שגיאת טעינה

---

## מגבלות נוכחיות

| תחום | מגבלה |
|------|--------|
| תשלום | אין סליקה — שיטת תשלום מוצגת בלבד |
| Google OAuth | אמיתי כש-Supabase + Provider מוגדרים; בלי Supabase — משתמש דמו מקומי |
| תמונות | Pexels / base64; Supabase Storage — בעתיד |
| סטטיסטיקות בעלים | נוסחאות מ-seed, לא מצבירת bookings אמיתית |
| סנכרון לוקלי | ללא Supabase — נתונים רק בדפדפן הנוכחי |

---

## תכנון עתידי

- Supabase Storage לתמונות חניה
- `CHECK` על `bookings.status`

---

## פתרון בעיות

| בעיה | פתרון |
|------|--------|
| מפה לא נטענת | בדוק `VITE_GOOGLE_MAPS_API_KEY` ב־`.env.local`, הפעל Maps + Places API, הפעל מחדש `npm run dev` |
| חיפוש כתובת נכשל | ודא Places API פעיל (מוגבל לישראל) |
| Google OAuth נכשל | ודא Provider ב-Supabase, Client ID/Secret, Redirect URLs, ו־`VITE_SUPABASE_*` |
| שערי מטבע לא מתעדכנים | בדוק רשת ל־`open.er-api.com`; האפליקציה תשתמש ב-cache / fallback |
| שגיאה בטעינת נתונים מ-Supabase | בדוק מיגרציות, מפתחות ב־`.env.local`, לחץ "נסו שוב" באפליקציה |
| תמונות לא מוצגות | בדוק אינטרנט וכתובות Pexels ב־`mockData.js` |
| נתונים ישנים (לוקלי) | מחק `parkit_store_v1` מ-localStorage; התנתק והתחבר מחדש |

---

פרויקט לימודי / דמו · תמונות: [Pexels](https://www.pexels.com/) · מפות: [Google Maps Platform](https://maps.google.com/) · Auth: [Google Identity](https://developers.google.com/identity) via Supabase · FX: [ExchangeRate-API](https://www.exchangerate-api.com/)

**גרסה:** 0.0.0 (MVP) · **שפה:** עברית (RTL) · **אזור:** תל אביב

</div>
