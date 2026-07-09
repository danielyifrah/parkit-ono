# הגדרת Supabase — מדריך שלב-אחר-שלב

## מה זה בכלל?

**Supabase** הוא שירות ענן שנותן לפרויקט:
- **מסד נתונים** (PostgreSQL) — טבלאות אמיתיות בענן
- **התחברות משתמשים** (Auth) — login/register אמיתי
- **אבטחה** (RLS) — מי רשאי לראות/לשנות מה

**מיגרציה (Migration)** היא קובץ SQL שבונה את מבנה ה-DB בפעם הראשונה:
- יוצר טבלאות (`profiles`, `parkings`, `bookings`)
- מגדיר קשרים ביניהן (מי בעלים של מה)
- מפעיל RLS (הרשאות)
- מכניס נתוני דמו (3 משתמשים, 5 חניות, 8 הזמנות)

> **אנלוגיה:** המיגרציה היא כמו "תוכנית בנייה" לדאטאבייס. בלי להריץ אותה — אין טבלאות, והאפליקציה לא יכולה לשמור נתונים בענן.

---

## על מה זה משפיע באפליקציה?

| מצב | מה קורה |
|-----|---------|
| **בלי Supabase ב-`.env.local`** | האפליקציה עובדת על `localStorage` בדפדפן בלבד. נתונים לא מסתנכרנים בין מכשירים. |
| **עם מפתחות Supabase, בלי מיגרציות** | האפליקציה מנסה להתחבר ל-DB ריק → **שגיאת טעינה** (באנר אדום "שגיאה בטעינת נתונים מהשרת"). |
| **עם מפתחות + מיגרציות הורצו** | ✅ התחברות אמיתית, נתונים בענן, סנכרון בין מכשירים, נשמר גם אחרי ניקוי cache. |

**לסיכום:** אם אתה רוצה שהמרצה יראה Backend אמיתי — צריך גם מפתחות Supabase **וגם** להריץ מיגרציות.

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

---

## שלב 3 — הרץ מיגרציות (בניית הטבלאות)

יש **שתי דרכים**. בחר אחת:

### דרך א — Supabase Dashboard (הכי פשוט, מומלץ)

1. ב-Supabase: **SQL Editor** → **New query**
2. פתח בפרויקט את הקובץ:
   `supabase/migrations/20260708180000_initial_schema.sql`
3. העתק את **כל** התוכן → הדבק ב-SQL Editor → **Run**
4. חזור על אותו דבר לקובץ השני:
   `supabase/migrations/20260708200000_public_parkings_rls.sql` → **Run**
5. חזור על אותו דבר לקובץ השלישי:
   `supabase/migrations/20260709120000_tighten_rls.sql` → **Run**

### דרך ב — מהטרמינל (`npm run db:setup`)

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

**Table Editor** — אמורות להופיע 3 טבלאות:
- `profiles` (3 שורות)
- `parkings` (5 שורות)
- `bookings` (8 שורות)

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
| `20260708180000_initial_schema.sql` | יוצר טבלאות, אינדקסים, RLS בסיסי, trigger לפרופיל, seed data |
| `20260708200000_public_parkings_rls.sql` | מאפשר קריאה ציבורית לחניות (למפה) |
| `20260709120000_tighten_rls.sql` | מחמיר RLS: פרופיל עצמי, הזמנות מוגבלות, חניות active לציבור |

---

## בעיות נפוצות

| בעיה | פתרון |
|------|--------|
| "שגיאה בטעינת נתונים מהשרת" | הרץ מיגרציות (שלב 3) |
| Login נכשל ב-Supabase | השתמש ב-`demo1234` או הרשם משתמש חדש |
| `npm run db:setup` נכשל | בדוק סיסמת DB ו-`SUPABASE_PROJECT_REF` |
| "relation already exists" | המיגרציה כבר רצה — זה בסדר, אפשר לדלג |
