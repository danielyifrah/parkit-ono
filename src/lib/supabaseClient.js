// Supabase Client — מוכן לחיבור עתידי
// התקנה עתידית: npm install @supabase/supabase-js

// import { createClient } from '@supabase/supabase-js';

// const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const supabase = null;

// ─── Auth ───────────────────────────────────────────────
// בעתיד: supabase.auth.signInWithPassword({ email, password })
// בעתיד: supabase.auth.signInWithOAuth({ provider: 'google' })
// בעתיד: supabase.auth.signUp({ email, password })
// בעתיד: supabase.auth.signOut()
// בעתיד: supabase.auth.getSession()

// ─── Parkings ───────────────────────────────────────────
// בעתיד: supabase.from('parkings').select('*').eq('available', true)
// בעתיד: supabase.from('parkings').select('*').eq('id', parkingId).single()
// בעתיד: supabase.from('parkings').insert(parkingData)
// בעתיד: supabase.from('parkings').update({ available }).eq('id', parkingId)

// ─── Bookings ───────────────────────────────────────────
// בעתיד: supabase.from('bookings').insert(bookingData)
// בעתיד: supabase.from('bookings').select('*').eq('user_id', userId)

// ─── Storage (תמונות חניה) ─────────────────────────────
// בעתיד: supabase.storage.from('parking-images').upload(path, file)
// בעתיד: supabase.storage.from('parking-images').getPublicUrl(path)
