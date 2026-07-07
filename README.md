# Parkit — חניה חכמה

**Parkit** היא אפליקציית ווב לחיפוש, הזמנה וניהול חניות פרטיות וציבוריות.  
הפרויקט בנוי כ־**MVP / דמו** עם נתוני Mock מקומיים, ממשק בעברית (RTL), ותמיכה במובייל ובדסקטופ.

---

## תוכן עניינים

1. [מהות ומטרות האפליקציה](#מהות-ומטרות-האפליקציה)
2. [יכולות עיקריות](#יכולות-עיקריות)
3. [טכנולוגיות](#טכנולוגיות)
4. [דרישות מקדימות](#דרישות-מקדימות)
5. [התקנה והפעלה](#התקנה-והפעלה)
6. [משתמשי דמו](#משתמשי-דמו)
7. [מבנה הפרויקט](#מבנה-הפרויקט)
8. [ניתוב (Routes)](#ניתוב-routes)
9. [מערכת משתמשים והרשאות](#מערכת-משתמשים-והרשאות)
10. [נתונים (Mock Data)](#נתונים-mock-data)
11. [קבצים חשובים](#קבצים-חשובים)
12. [הוראות לשינוי והרחבה](#הוראות-לשינוי-והרחבה)
13. [עיצוב ו־UI](#עיצוב-ו-ui)
14. [אינטגרציות חיצוניות](#אינטגרציות-חיצוניות)
15. [מגבלות נוכחיות וחריגים](#מגבלות-נוכחיות-וחריגים)
16. [תכנון עתידי (Backend)](#תכנון-עתידי-backend)
17. [פקודות npm](#פקודות-npm)
18. [פתרון בעיות נפוצות](#פתרון-בעיות-נפוצות)

---

## מהות ומטרות האפליקציה

### הבעיה
מציאת חניה זמינה, במחיר הוגן ובקרבת יעד — במיוחד באזורים עמוסים — היא אתגר יומיומי לנהגים. מצד שני, בעלי חניות פרטיות/משרדיות רבות פעמים לא מנצלים את המקום בשעות שאינן בשימוש.

### הפתרון
Parkit מחברת בין **נהגים** שמחפשים חניה לבין **בעלי חניות** שמפרסמים מקומות פנויים, עם מפה אינטראקטיבית, סינון חכם, הזמנה ותמחור שקוף.

### מטרות הפרויקט (בשלב הנוכחי)
- להציג חוויית משתמש מלאה מקצה לקצה (UI/UX) **ללא תלות בשרת**
- לאפשר חיפוש חניות על גבי מפת Google אמיתית
- לדמות תהליך הזמנה, פרופיל, היסטוריה ופורטל שותפים
- להכין תשתית קוד נקייה לחיבור עתידי ל־Supabase / Backend

---

## יכולות עיקריות

### לנהג
| תכונה | תיאור |
|--------|--------|
| **מפת חניות** | מפת Google עם סיכות מחיר, בחירת חניה וכרטיס פרטים |
| **חיפוש מיקום** | Google Places Autocomplete (ישראל בלבד) + סינון ברדיוס 5 ק"מ |
| **מיקום נוכחי** | כפתור מטרה (crosshair) למרכוז המפה על המשתמש |
| **מסננים** | זמן הגעה, משך, מחיר מקסימלי, דירוג, סוג חניה |
| **פרטי חניה** | תמונות, תיאור, זמינות להיום ומחר, דירוג |
| **הזמנה** | בחירת תאריך, שעה ומשך (גלגל זמן) + חישוב מחיר והנחות |
| **היסטוריה** | הזמנות שהסתיימו (Mock) |
| **פרופיל** | עריכת פרטים, שינוי סיסמה, הגדרות |
| **תמיכה** | שאלות נפוצות, צ'אט דמו, שליחת מייל |

### לבעל חניה (פורטל שותפים)
| תכונה | תיאור |
|--------|--------|
| **דשבורד** | סקירת הכנסות, הזמנות, חניות פעילות |
| **רשימת חניות** | כל החניות בבעלות המשתמש המחובר |
| **הוספת חניה** | טופס UI (שמירה ל־Backend — עדיין לא מחובר) |

### למנהל מערכת
- גישה לאפליקציית הנהג
- **אין** גישה לפורטל שותפים
- דשבורד ניהול ייעודי — **בקרוב** (מוצג בפרופיל)

---

## טכנולוגיות

| רכיב | טכנולוגיה |
|------|-----------|
| Build | [Vite](https://vitejs.dev/) 8 |
| Framework | [React](https://react.dev/) 19 |
| ניתוב | [React Router](https://reactrouter.com/) 7 |
| מפות | [@react-google-maps/api](https://www.npmjs.com/package/@react-google-maps/api) |
| אייקונים | [lucide-react](https://lucide.dev/) |
| עיצוב | CSS גלובלי + CSS Modules (לפי קומפוננטה) |
| פונט | Rubik (Google Fonts) |
| Lint | Oxlint |
| שפה | JavaScript (JSX) — ללא TypeScript |
| Backend | **אין** — Mock + localStorage (Supabase מתוכנן) |

---

## דרישות מקדימות

- **Node.js** 18+ (מומלץ 20+)
- **npm** (או yarn/pnpm)
- **מפתח Google Maps API** עם:
  - Maps JavaScript API
  - Places API

---

## התקנה והפעלה

### 1. שכפול והתקנת תלויות

```bash
git clone <repository-url>
cd Parkit-Project
npm install
```

### 2. הגדרת משתני סביבה

צור קובץ `.env.local` בשורש הפרויקט:

```env
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

> **חשוב:** הקובץ `.env.local` נמצא ב־`.gitignore` ולא נשמר ב־Git.  
> אל תעלה מפתחות API ל-repository.

#### הגדרת Google Cloud
1. היכנס ל־[Google Cloud Console](https://console.cloud.google.com/)
2. צור פרויקט (או בחר קיים)
3. הפעל **Maps JavaScript API** ו־**Places API**
4. צור מפתח API (API Key)
5. (מומלץ) הגבל את המפתח לדומיין/localhost

### 3. הפעלת שרת פיתוח

```bash
npm run dev
```

האפליקציה תיפתח בדרך כלל ב־`http://localhost:5173`

### 4. בנייה לפרודקשן

```bash
npm run build
npm run preview   # תצוגה מקומית של ה-build
```

---

## משתמשי דמו

כל חשבונות הדמו מתקבלים עם **כל סיסמה** (אין סיסמה קבועה מראש).

| תפקיד | אימייל | גישה |
|--------|--------|------|
| **נהג** | `israel@example.com` | אפליקציית נהג בלבד |
| **בעל חניה** | `danny@example.com` | אפליקציית נהג + פורטל שותפים (`/partner`) |
| **מנהל** | `admin@parkit.com` | אפליקציית נהג בלבד (דשבורד ניהול — בקרוב) |

משתמש שנרשם דרך `/register` מקבל תמיד תפקיד `driver`.  
סיסמאות של משתמשים שנרשמו נשמרות ב־`localStorage` תחת המפתח `parkit_credentials`.

---

## מבנה הפרויקט

```
Parkit-Project/
├── public/                    # קבצים סטטיים (מוגשים כמו שהם)
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── main.jsx               # נקודת כניסה — React root
│   ├── App.jsx                # ניתוב ראשי + AuthProvider
│   ├── index.css              # משתני CSS גלובליים, עיצוב בסיסי, דפי auth
│   ├── styles/
│   │   └── desktop-layouts.css  # פריסות רספונסיביות לדסקטופ
│   │
│   ├── pages/                 # מסכים (Route → Page)
│   │   ├── Home.jsx           # דף הבית — מפה + מסננים
│   │   ├── ParkingDetails.jsx # פרטי חניה
│   │   ├── Booking.jsx        # הזמנת חניה
│   │   ├── SavedParking.jsx   # חניה שמורה (ממתינה להתחלה)
│   │   ├── ActiveParking.jsx  # חניה פעילה בזמן אמת
│   │   ├── History.jsx        # היסטוריית הזמנות
│   │   ├── Profile.jsx        # פרופיל והגדרות
│   │   ├── Support.jsx        # מרכז תמיכה
│   │   ├── OwnerDashboard.jsx # פורטל שותפים — דשבורד
│   │   ├── AddParking.jsx     # הוספת חניה (בעלים)
│   │   ├── Login.jsx
│   │   ├── Register.jsx
│   │   └── ForgotPassword.jsx
│   │
│   ├── components/
│   │   ├── layout/            # מעטפת האפליקציה
│   │   │   ├── Layout.jsx     # Header + Main + BottomNav
│   │   │   ├── Header.jsx
│   │   │   └── BottomNav.jsx
│   │   ├── parking/           # רכיבי חניה ומפה
│   │   │   ├── ParkingMap.jsx
│   │   │   ├── ParkingCard.jsx
│   │   │   ├── FilterBar.jsx
│   │   │   ├── PlacesSearchInput.jsx
│   │   │   └── BookingCard.jsx
│   │   ├── booking/           # רכיבי הזמנה
│   │   │   ├── DateSelector.jsx
│   │   │   └── DurationWheel.jsx
│   │   ├── profile/           # מודלים של פרופיל
│   │   │   ├── EditProfileModal.jsx
│   │   │   └── SecurityModal.jsx
│   │   ├── support/
│   │   │   └── ChatModal.jsx
│   │   ├── ui/                # רכיבי UI גנריים
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Icon.jsx
│   │   │   └── StatCard.jsx
│   │   ├── ProtectedRoute.jsx # דורש התחברות
│   │   └── RoleRoute.jsx      # דורש תפקיד מסוים
│   │
│   ├── context/               # React Context
│   │   ├── AuthContext.jsx    # משתמש, login/logout, פרופיל
│   │   ├── GoogleMapsContext.jsx  # טעינה יחידה של Google Maps
│   │   └── HeaderContext.jsx  # שיתוף שדה חיפוש בין Home ל-Header
│   │
│   ├── data/                  # נתוני Mock
│   │   ├── mockData.js        # משתמשים, חניות, הזמנות, סטטיסטיקות
│   │   └── supportFaq.js      # שאלות נפוצות
│   │
│   └── lib/                   # לוגיקה עסקית ועזר
│       ├── roles.js           # תפקידי משתמש (driver/owner/admin)
│       ├── parkingFilters.js  # לוגיקת סינון חניות
│       ├── bookingPricing.js  # חישוב מחיר והנחות
│       ├── geo.js             # מרחק Haversine בין נקודות
│       ├── googleMapsConfig.js
│       ├── mapMarkers.js      # SVG לסיכות מפה
│       └── supabaseClient.js  # Stub לחיבור עתידי
│
├── index.html                 # HTML ראשי (lang=he, dir=rtl)
├── vite.config.js
├── package.json
├── .gitignore
└── .env.local                 # (לא ב-Git) מפתח Google Maps
```

---

## ניתוב (Routes)

| נתיב | מסך | הגנה |
|------|-----|------|
| `/login` | התחברות | ציבורי |
| `/register` | הרשמה | ציבורי |
| `/forgot-password` | שכחתי סיסמה | ציבורי (UI בלבד) |
| `/` | דף הבית (מפה) | מחובר |
| `/parking/:id` | פרטי חניה | מחובר |
| `/parking/:id/book` | הזמנה | מחובר |
| `/saved` | חניה שמורה | מחובר |
| `/active` | חניה פעילה | מחובר |
| `/history` | היסטוריה | מחובר |
| `/profile` | פרופיל | מחובר |
| `/support` | תמיכה | מחובר |
| `/partner` | דשבורד בעל חניה | מחובר + `owner` |
| `/partner/add` | הוספת חניה | מחובר + `owner` |
| `*` | הפניה ל־`/` | — |

### התנהגות Layout
- **דפי Auth** (`/login`, `/register`, `/forgot-password`) — ללא Header וללא BottomNav
- **פורטל שותפים** — Header ייעודי משלו, ללא BottomNav של האפליקציה הראשית
- **`/active` ו־`/saved`** — ללא BottomNav (מסך מלא)

---

## מערכת משתמשים והרשאות

### שלושה תפקידים (`src/lib/roles.js`)

```js
USER_ROLES = { DRIVER: 'driver', OWNER: 'owner', ADMIN: 'admin' }
```

| תפקיד | תיאור |
|--------|--------|
| `driver` | נהג — חיפוש והזמנת חניות |
| `owner` | בעל חניה — גישה לפורטל שותפים |
| `admin` | מנהל מערכת — דשבורד ניהול עתידי |

### שמירה ב-localStorage

| מפתח | תוכן |
|------|------|
| `parkit_user` | אובייקט המשתמש המחובר |
| `parkit_credentials` | `{ "email": "password" }` למשתמשים שנרשמו |

### רכיבי הגנה
- **`ProtectedRoute`** — מפנה ל־`/login` אם לא מחובר
- **`RoleRoute`** — מפנה ל־`/` אם התפקיד לא מתאים (משמש ל־`/partner`)

### AuthContext — API זמין

```js
const {
  user,              // אובייקט משתמש
  isAuthenticated,
  isDriver, isOwner, isAdmin,
  login, loginWithGoogle, register, logout,
  updateProfile, changePassword,
} = useAuth();
```

---

## נתונים (Mock Data)

כל הנתונים נמצאים ב־`src/data/mockData.js` ואינם נשמרים בשרת.

### ישויות עיקריות

#### משתמשים (`users`)
3 משתמשי דמו: נהג, בעל חניה, מנהל.

#### חניות (`parkings`) — 5 חניות בתל אביב
כל חניה כוללת:
- מיקום (`lat`, `lng`), מחיר לשעה, סוג (`private` / `public` / `office`)
- תמונות מ־Pexels (אינטרנט)
- מבנה זמינות (`availability`) — לוח שבועי, תאריכים חסומים, משבצות תפוסות
- סטטוס רישום (`status`: `active` / `inactive`) — נפרד מ־`available`

#### הזמנות (`bookings`)
היסטוריית נסיעות לנהג הדמו (`user-1`) — **רק הזמנות שהסתיימו** (`completed`).  
**אין** הזמנות פעילות או שמורות בנתוני הדמו.

#### פונקציות עזר חשובות

```js
getParkingById(id)
getBookingsByUserId(userId)
getParkingsByOwnerId(ownerId)
getUserStats(userId)           // חניות שמורות / הושלמו
getOwnerStats(ownerId)         // סטטיסטיקות דשבורד בעלים
getTodayTomorrowAvailability(parking)
getUserByEmail(email)
```

---

## קבצים חשובים

### `src/pages/Home.jsx`
הלב של האפליקציה:
- מצב מסננים (`filters`) וחיפוש (`searchQuery`, `searchLocation`)
- סינון גאוגרפי ברדיוס 5 ק"מ לאחר בחירת כתובת ב־Places
- פריסה כפולה: מובייל (שורת מסננים + מפה) / דסקטופ (סיידבר + מפה)

### `src/components/parking/ParkingMap.jsx`
- מפת Google עם `Marker` + `Circle` (מעגל רדיוס חיפוש)
- סיכות מחיר מותאמות אישית (`mapMarkers.js`)
- כפתור מיקום נוכחי (Geolocation API)

### `src/components/parking/FilterBar.jsx`
- **מובייל:** שבבי מסנן (זמן / מחיר / דירוג) + כפתור "נקה"
- **דסקטופ:** `SidebarFilters` — פאנל מלא + חיפושים אחרונים

### `src/lib/parkingFilters.js`
לוגיקת סינון מרכזית — `applyParkingFilters()`, `isFiltersActive()`, אפשרויות מחיר/דירוג/זמן.

### `src/lib/bookingPricing.js`
- משך הזמנה: 15/30/45 דק׳ → עד יום שלם (12 שעות)
- הנחות: 15% ל־6–8 שעות, 25% ליום שלם

### `src/context/GoogleMapsContext.jsx`
טוען את ספריית Google Maps **פעם אחת** לכל האפליקציה (כולל `places`).

### `src/lib/supabaseClient.js`
Stub מתועד — מפרט את הקריאות העתידיות ל־Auth, Parkings, Bookings, Storage.

---

## הוראות לשינוי והרחבה

### הוספת חניה חדשה (Mock)
ערוך `src/data/mockData.js`:
1. הוסף אובייקט ל־`parkings` עם `id`, `ownerId`, `lat`, `lng` ושאר השדות
2. ודא ש־`ownerId` תואם לבעלים קיים (למשל `owner-1`)
3. הוסף תמונה דרך `pexelsPhoto(id)` או URL חיצוני אחר

### הוספת משתמש דמו
הוסף ל־`users` ב־`mockData.js` עם `role` מתאים.

### הוספת מסך חדש
1. צור קומפוננטה ב־`src/pages/`
2. הוסף Route ב־`src/App.jsx`
3. עטוף ב־`ProtectedRoute` (או `RoleRoute` לפי צורך)
4. אם נדרש כותרת ב־Header — הוסף ל־`PAGE_TITLES` ב־`Layout.jsx`

### שינוי מסננים
- אפשרויות: `src/lib/parkingFilters.js`
- UI: `src/components/parking/FilterBar.jsx`

### שינוי מחירון / הנחות
`src/lib/bookingPricing.js` — פונקציית `calculateBookingPrice()`

### שינוי רדיוס חיפוש
`src/lib/googleMapsConfig.js` → `searchRadiusKm` (ברירת מחדל: 5 ק"מ)

### החלפת תמונות חניות
ב־`mockData.js` — עדכן `PARKING_IMAGES` ו־`PARKING_GALLERY` (מזהי Pexels או URLs אחרים).  
בקומפוננטות התמונה יש `referrerPolicy="no-referrer"` לטעינה תקינה ממקורות חיצוניים.

### הוספת שאלות ל-FAQ
`src/data/supportFaq.js`

---

## עיצוב ו־UI

### RTL ועברית
- `index.html`: `lang="he"` `dir="rtl"`
- ניווט תחתון: בית | היסטוריה | פרופיל (מימין לשמאל)
- שימוש ב־`inset-inline`, `text-align: start` במקום left/right קשיחים

### רספונסיביות
- **מובייל:** מפה מלאה, כרטיס חניה צף, שורת מסננים
- **דסקטופ (≥1024px):** סיידבר מסננים + חיפושים אחרונים, מפה רחבה, Header עם שדה חיפוש מורחב

### מערכת עיצוב (`index.css`)
משתני CSS מרכזיים:
- `--color-primary`, `--color-secondary`, `--color-success`, `--color-danger`
- `--color-bg`, `--color-border`, `--color-text`, `--color-text-secondary`
- `--shadow-sm`, `--shadow-md`, `--radius-sm`

### קומפוננטות UI
`Button` — וריאנטים: `primary`, `secondary`, `ghost`, `dark`  
`Modal` — דיאלוג נגיש עם `role="dialog"`  
`Icon` — עטיפה ל־lucide-react

---

## אינטגרציות חיצוניות

| שירות | שימוש | קובץ |
|--------|--------|------|
| **Google Maps** | מפה, סיכות, מעגל רדיוס | `ParkingMap.jsx`, `googleMapsConfig.js` |
| **Google Places** | Autocomplete לכתובות בישראל | `PlacesSearchInput.jsx` |
| **Pexels** | תמונות חניות (Mock) | `mockData.js` |
| **Geolocation** | מיקום המשתמש | `ParkingMap.jsx` |
| **mailto:** | יצירת קשר מתמיכה | `Support.jsx` |

---

## מגבלות נוכחיות וחריגים

### אין Backend אמיתי
- הזמנה חדשה **לא נשמרת** — לאחר אישור מועבר ל־`/history` ללא עדכון הנתונים
- דפי `/saved` ו־`/active` מציגים **מצב ריק** (אין חניות שמורות/פעילות בדמו)
- הוספת חניה בפורטל שותפים — UI בלבד, לא מוסיפה ל־`parkings`

### אימות (Auth)
- משתמשי דמו: כל סיסמה מתקבלת
- אימייל לא מוכר: נוצר משתמש `driver` חדש אוטומטית
- Google Login: מתחבר כנהג הדמו (`israel@example.com`)
- שכחתי סיסמה: מסך UI ללא שליחת מייל אמיתי

### חניה `p4` (פלורנטין)
- `status: 'inactive'` בדשבורד בעלים
- `available: true` — **עדיין מופיעה** במפת הנהג (הסינון משתמש ב־`available`, לא ב־`status`)

### תמונות
- תלויות ב־Pexels — דורש חיבור אינטרנט
- אם תמונה לא נטענת, יש לבדוק שה־URL תקין (קוד 200)

### localStorage
- נתוני משתמש נשמרים בדפדפן — "התנתקות" מנקה את `parkit_user`
- שינוי תפקיד בקוד דורש התחברות מחדש (או `hydrateUser` מסנכרן מ־`mockData` לפי אימייל)

### נגישות
- חלק מהכפתורים כוללים `aria-label`
- לא בוצעה בדיקת נגישות מלאה (WCAG)

---

## תכנון עתידי (Backend)

הקובץ `src/lib/supabaseClient.js` מתעד את המעבר המתוכנן:

| תחום | פעולות עתידיות |
|------|----------------|
| **Auth** | `signInWithPassword`, `signUp`, OAuth, `signOut` |
| **Parkings** | CRUD על טבלת `parkings` |
| **Bookings** | יצירה ושליפה לפי `user_id` |
| **Storage** | bucket `parking-images` לתמונות |

משתני סביבה עתידיים (לא פעילים כרגע):
```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

---

## פקודות npm

| פקודה | תיאור |
|--------|--------|
| `npm run dev` | שרת פיתוח עם HMR |
| `npm run build` | בנייה לתיקיית `dist/` |
| `npm run preview` | תצוגה מקדימה של ה-build |
| `npm run lint` | הרצת Oxlint |

---

## פתרון בעיות נפוצות

### המפה לא נטענת / שגיאת Google Maps
- ודא ש־`VITE_GOOGLE_MAPS_API_KEY` מוגדר ב־`.env.local`
- ודא שהפעלת Maps JavaScript API + Places API
- הפעל מחדש את `npm run dev` לאחר שינוי `.env.local`

### חיפוש כתובת לא עובד
- דורש Places API פעיל
- Autocomplete מוגבל לישראל (`componentRestrictions: { country: 'il' }`)

### נכנסתי כנהג ורואה פורטל שותפים
- ודא שאתה מחובר עם `danny@example.com` (בעל חניה)
- נהג לא אמור לראות את הקישור בפרופיל; גישה ישירה ל־`/partner` תופנה לדף הבית

### תמונות לא מוצגות
- בדוק חיבור אינטרנט
- ודא שכתובות Pexels ב־`mockData.js` תקפות

### שינוי בקוד לא משתקף
- רענון קשיח: `Cmd+Shift+R` (Mac) / `Ctrl+Shift+R` (Windows)
- אם שינית תפקיד משתמש — התנתק והתחבר מחדש

---

## רישיון וקרדיטים

פרויקט לימודי / דמו.  
תמונות: [Pexels](https://www.pexels.com/) · מפות: [Google Maps Platform](https://maps.google.com/)

---

**גרסה:** 0.0.0 (MVP)  
**שפת ממשק:** עברית (RTL)  
**אזור ברירת מחדל:** תל אביב, ישראל
