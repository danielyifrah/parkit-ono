# הגדרת Supabase — מדריך שלב-אחר-שלב

## מה זה בכלל?

**Supabase** הוא שירות ענן שנותן לפרויקט:
- **מסד נתונים** (PostgreSQL) — טבלאות אמיתיות בענן
- **התחברות משתמשים** (Auth) — login/register אמיתי (כולל Google OAuth)
- **אבטחה** (RLS) — מי רשאי לראות/לשנות מה

**מיגרציה (Migration)** היא קובץ SQL שבונה / מעדכן את מבנה ה-DB:
- יוצר טבלאות (`profiles`, `parkings`, `bookings`, `payment_methods`, `app_settings`, `admin_activity_log`)
- מגדיר קשרים, RLS, triggers ו-RPC
- מכניס נתוני דמו (משתמשים, חניות, הזמנות, אמצעי תשלום)

> **אנלוגיה:** המיגרציה היא כמו "תוכנית בנייה" לדאטאבייס. בלי להריץ אותה — אין טבלאות, והאפליקציה לא יכולה לשמור נתונים בענן.

**מודל הנתונים המלא:** [erd.md](erd.md)

---

## על מה זה משפיע באפליקציה?

| מצב | מה קורה |
|-----|---------|
| **בלי Supabase ב-`.env.local`** | האפליקציה עובדת על `localStorage` בדפדפן בלבד. נתונים לא מסתנכרנים בין מכשירים. |
| **עם מפתחות Supabase, בלי מיגרציות** | האפליקציה מנסה להתחבר ל-DB ריק → **שגיאת טעינה** (באנר אדום "שגיאה בטעינת נתונים מהשרת"). |
| **עם מפתחות + מיגרציות הורצו** | ✅ התחברות אמיתית, נתונים בענן, סנכרון בין מכשירים, נשמר גם אחרי ניקוי cache. |

**לסיכום:** אם אתה רוצה שהמרצה יראה Backend אמיתי — צריך גם מפתחות Supabase **וגם** להריץ **את כל** המיגרציות.

---

## שלב 1 — צור פרויקט Supabase (פעם אחת)

1. היכנס ל-[supabase.com](https://supabase.com) והתחבר
2. **New Project** → בחר שם (למשל `parkit`) וסיסמת DB (שמור אותה!)
3. חכה כ-2 דקות שהפרויקט ייווצר

---

## שלב 2 — העתק מפתחות ל-`.env.local`

ב-Supabase: **Project Settings → API**

הוסף ל-`.env.local`:

```env
VITE_SUPABASE_URL=https://xxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

> אלה מפתחות **ציבוריים** (anon key) — בטוחים בצד לקוח. לא לשתף את `service_role` key.  
> **Google OAuth Client Secret** לא שייך ל־`.env.local` — רק ל-Dashboard (שלב 2ב).

---

## שלב 2ב — Google OAuth (אופציונלי)

כניסה עם Google עוברת דרך **Supabase Auth** — ה-Client Secret נשאר בשרת של Supabase, לא בקוד React.

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → **OAuth 2.0 Client ID** (Web application)
2. ב-Supabase: **Authentication → Providers → Google** — הדבק Client ID + **Client Secret**, הפעל את הספק
3. העתק מ-Supabase את **Callback URL** והוסף אותו ב-Google תחת Authorized redirect URIs
4. ב-Supabase: **Authentication → URL Configuration** — הוסף `http://localhost:5173` (ודומיין פרודקשן) ל-Redirect URLs

בקוד: `AuthContext.loginWithGoogle()` קורא ל־`supabase.auth.signInWithOAuth({ provider: 'google' })` בלבד — בלי סודות.

פירוט מלא על כל האינטגרציות: [README — אינטגרציות חיצוניות](../README.md#אינטגרציות-חיצוניות).

---

## שלב 3 — הרץ מיגרציות (בניית הטבלאות)

יש **שתי דרכים**. בחר אחת:

### דרך א — Supabase Dashboard

1. ב-Supabase: **SQL Editor** → **New query**
2. הרץ **לפי סדר התאריך** את כל קבצי `supabase/migrations/*.sql` (12 קבצים) — אחד אחרי השני
3. רשימה מלאה בטבלה למטה

> אם הפרויקט כבר רץ חלקית — הרץ רק מיגרציות שטרם הורצו. אל תדלג על קבצים באמצע.

### דרך ב — מהטרמינל (`npm run db:setup`) — מומלץ

1. ב-Supabase: **Project Settings → Database** → העתק:
   - Database password (שהגדרת ביצירת הפרויקט)
   - Connection string (או host)
2. הרץ בטרמינל (החלף סיסמה ו-project ref):

```bash
SUPABASE_DB_PASSWORD=your_db_password \
SUPABASE_PROJECT_REF=your-project-ref \
npm run db:setup
```

הסקריפט מריץ **את כל** קבצי ה-`.sql` מתיקיית `supabase/migrations/` לפי סדר.

---

## שלב 4 — אימות שהכל עבד

### ב-Supabase Dashboard

**Table Editor** — אמורות להופיע 6 טבלאות ב־`public`:
- `profiles` (3 שורות דמו)
- `parkings` (5 שורות)
- `bookings` (8 שורות)
- `payment_methods` (לפחות 2 שורות דמו)
- `app_settings` (שורה אחת: `global`)
- `admin_activity_log` (ריקה בהתחלה)

**Authentication → Users** — 3 משתמשי דמו:
- `israel@example.com`
- `danny@example.com`
- `admin@parkit.com`

### באפליקציה

```bash
npm run dev
```

1. התחבר עם `israel@example.com` / `demo1234`
2. אמורות להופיע חניות במפה
3. **לא** אמור להופיע באנר "שגיאה בטעינת נתונים מהשרת"

---

## קבצי המיגרציה בפרויקט

| קובץ | מה הוא עושה |
|------|-------------|
| `20260708180000_initial_schema.sql` | טבלאות ליבה, אינדקסים, RLS בסיסי, trigger לפרופיל, seed |
| `20260708200000_public_parkings_rls.sql` | קריאה ציבורית לחניות (למפה) |
| `20260709120000_tighten_rls.sql` | החמרת RLS: פרופיל עצמי, הזמנות מוגבלות |
| `20260710120000_payment_methods.sql` | טבלת אמצעי תשלום + seed |
| `20260710120000_owner_booker_profiles_rls.sql` | (ביניים) גישת בעלים לפרופילי מזמינים |
| `20260710140000_owner_booking_privacy.sql` | פרטיות: בעלים בלי זהות מזמין; RPC תפוסה |
| `20260710150000_lock_roles.sql` | נעילת תפקידים בהרשמה + trigger |
| `20260710160000_admin_rls.sql` | `is_admin()` + מדיניות מנהל |
| `20260710170000_app_settings.sql` | הקפאת הזמנות; ביטול גישת מנהל לכרטיסים |
| `20260710180000_admin_ops.sql` | השעיה, החזרים, `admin_activity_log` |
| `20260710200000_google_oauth_profile_meta.sql` | שם/אווטאר מ-Google ב־`handle_new_user` |
| `20260712120000_admin_delete_user.sql` | RPC למחיקת משתמש ע״י מנהל |

---

## בעיות נפוצות

| בעיה | פתרון |
|------|--------|
| "שגיאה בטעינת נתונים מהשרת" | הרץ את **כל** המיגרציות (שלב 3) |
| Login נכשל ב-Supabase | השתמש ב-`demo1234` או הרשם משתמש חדש |
| Google OAuth נכשל | ודא Provider מופעל, Client Secret ב-Dashboard, Redirect URLs תואמים |
| `npm run db:setup` נכשל | בדוק סיסמת DB ו-`SUPABASE_PROJECT_REF` |
| "relation already exists" | המיגרציה כבר רצה — זה בסדר, אפשר לדלג / להמשיך לקובץ הבא |
| טבלאות חסרות (`payment_methods` וכו') | הורצו רק המיגרציות הישנות — השלם את השאר לפי הסדר |
