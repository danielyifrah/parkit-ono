# Parkit — מודל נתונים (ERD)

דיאגרמת יחסים ישויות (ERD) התואמת את המיגרציות ב־`supabase/migrations/`.

**מקור אמת:** `20260708180000_initial_schema.sql`

![Parkit ERD](erd.png)

---

## דיאגרמה

```mermaid
erDiagram
    AUTH_USERS ||--|| PROFILES : "id (1:1)"
    PROFILES ||--o{ PARKINGS : "owner_id (1:N)"
    PROFILES ||--o{ BOOKINGS : "user_id (1:N)"
    PARKINGS ||--o{ BOOKINGS : "parking_id (1:N)"

    AUTH_USERS {
        uuid id PK
        text email
        text encrypted_password
    }

    PROFILES {
        uuid id PK,FK
        text email UK
        text name
        text phone
        text role "driver|owner|admin"
        text avatar
        timestamptz created_at
        timestamptz updated_at
    }

    PARKINGS {
        text id PK
        uuid owner_id FK
        text name
        text address
        text city
        numeric price_per_hour
        text type
        text spot_number
        text description
        numeric rating
        int reviews_count
        int walk_minutes
        boolean available
        text status "active|inactive"
        text image
        jsonb images
        float lat
        float lng
        text availability_hours
        jsonb availability
        int bookings_today
        numeric income_today
        boolean covered
        int photos_count
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    BOOKINGS {
        text id PK
        uuid user_id FK
        text parking_id FK
        date date
        text start_time
        text end_time
        numeric duration_hours
        int duration_minutes
        numeric total_price
        numeric base_price
        numeric discount_percent
        text discount_label
        text payment_method
        text status
        boolean slot_blocked
        timestamptz hold_started_at
        timestamptz started_at
        timestamptz completed_at
        timestamptz created_at
        jsonb review
    }
```

---

## קשרים

| מ | אל | סוג | שדה | ON DELETE |
|---|-----|-----|-----|-----------|
| `auth.users` | `profiles` | 1:1 | `profiles.id` → `auth.users.id` | CASCADE |
| `profiles` | `parkings` | 1:N | `parkings.owner_id` → `profiles.id` | CASCADE |
| `profiles` | `bookings` | 1:N | `bookings.user_id` → `profiles.id` | CASCADE |
| `parkings` | `bookings` | 1:N | `bookings.parking_id` → `parkings.id` | CASCADE |

---

## טבלאות

### `profiles`
פרופיל משתמש — נוצר אוטומטית ב-trigger `handle_new_user()` בעת הרשמה ב-Supabase Auth.

| שדה | טיפוס | הערות |
|-----|--------|--------|
| `id` | UUID PK | זהה ל־`auth.users.id` |
| `email` | TEXT UNIQUE | |
| `name`, `phone` | TEXT | |
| `role` | TEXT | `driver` / `owner` / `admin` |
| `avatar` | TEXT | URL או base64 |

### `parkings`
חניה שמפורסמת על ידי בעלים (`owner`).

| שדה | טיפוס | הערות |
|-----|--------|--------|
| `id` | TEXT PK | מזהה ידידותי (למשל `p1`) |
| `owner_id` | UUID FK → profiles | |
| `availability` | JSONB | לוח שבועי, תאריכים חסומים, משבצות תפוסות |
| `lat`, `lng` | DOUBLE | מיקום על המפה |
| `status` | TEXT | `active` / `inactive` (הקפאה) |

### `bookings`
הזמנת חניה על ידי נהג.

| שדה | טיפוס | הערות |
|-----|--------|--------|
| `id` | TEXT PK | |
| `user_id` | UUID FK → profiles | הנהג |
| `parking_id` | TEXT FK → parkings | |
| `status` | TEXT | `scheduled`, `pending_arrival`, `saved`, `active`, `completed`, `cancelled` |
| `review` | JSONB | `{ rating, text }` לאחר סיום |

---

## אינדקסים

- `parkings_owner_id_idx` — חיפוש חניות לפי בעלים
- `bookings_user_id_idx` — היסטוריית הזמנות לנהג
- `bookings_parking_id_idx` — הזמנות לחניה
- `bookings_status_idx` — סינון לפי מצב

---

## Row Level Security (RLS)

| טבלה | מדיניות עיקרית |
|------|----------------|
| `profiles` | SELECT/UPDATE לפרופיל עצמי בלבד |
| `parkings` | SELECT ציבורי לחניות `active`; בעלים רואה גם מוקפאות |
| `bookings` | SELECT להזמנות עצמיות + הזמנות על חניות של הבעלים |
| `bookings` | INSERT/UPDATE/DELETE להזמנה עצמית בלבד |
| `parkings` | INSERT/UPDATE/DELETE לבעלים בלבד |

פרטים מלאים: `supabase/migrations/` (3 קבצים, לפי סדר תאריך).

---

## מיפוי לאפליקציה

| DB (snake_case) | אפליקציה (camelCase) | קובץ |
|-----------------|----------------------|------|
| `profiles` | `user` | `supabaseMappers.js` → `profileFromRow` |
| `parkings` | `parking` | `parkingFromRow` / `parkingToRow` |
| `bookings` | `booking` | `bookingFromRow` / `bookingToRow` |

---

## הערות עיצוב

1. **`availability` ב-JSONB** — לוח זמינות גמיש (שבועי + overrides לפי תאריך + משבצות תפוסות) בלי טבלאות משנה נפרדות ב-MVP.
2. **`review` ב-JSONB** — ביקורת אחת להזמנה; מספיק לדרישות הפרויקט.
3. **`parkings.id` כ-TEXT** — תואם ל-seed ב-`mockData.js` ולמעבר חלק בין mock ל-Supabase.
