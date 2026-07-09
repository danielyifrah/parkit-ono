import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { getUserByEmail } from '../data/mockData';
import { isSupabaseConfigured, supabase } from '../lib/supabaseClient';
import { profileFromRow, profileToRow } from '../lib/supabaseMappers';
import { isAdmin, isDriver, isOwner, USER_ROLES } from '../lib/roles';

const DEMO_PASSWORD = 'demo1234';
const AuthContext = createContext(null);
const CREDENTIALS_KEY = 'parkit_credentials';

function hydrateUser(savedUser) {
  if (!savedUser) return null;

  const canonical = getUserByEmail(savedUser.email);
  if (!canonical) return savedUser;

  return {
    ...canonical,
    ...savedUser,
    name: savedUser.name || canonical.name,
    phone: savedUser.phone || canonical.phone,
    avatar: savedUser.avatar ?? canonical.avatar,
  };
}

function loadCredentials() {
  try {
    return JSON.parse(localStorage.getItem(CREDENTIALS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveCredentials(credentials) {
  localStorage.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
}

function getStoredPassword(email) {
  return loadCredentials()[email];
}

function setStoredPassword(email, password) {
  const credentials = loadCredentials();
  credentials[email] = password;
  saveCredentials(credentials);
}

async function fetchProfileByAuthUser(authUser) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', authUser.id)
    .single();

  if (error) {
    console.error('Failed to load profile', error);
    return {
      id: authUser.id,
      email: authUser.email,
      name: authUser.user_metadata?.name || authUser.email?.split('@')[0] || 'משתמש',
      phone: authUser.user_metadata?.phone || '',
      role: authUser.user_metadata?.role || USER_ROLES.DRIVER,
      avatar: authUser.user_metadata?.avatar || null,
    };
  }

  return profileFromRow(data);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured());

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser);
    if (!isSupabaseConfigured()) {
      localStorage.setItem('parkit_user', JSON.stringify(nextUser));
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      const saved = localStorage.getItem('parkit_user');
      setUser(saved ? hydrateUser(JSON.parse(saved)) : null);
      setLoading(false);
      return undefined;
    }

    let active = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active) return;
      if (session?.user) {
        const profile = await fetchProfileByAuthUser(session.user);
        setUser(profile);
      }
      setLoading(false);
    }).catch(() => {
      if (active) setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!active) return;
      if (session?.user) {
        const profile = await fetchProfileByAuthUser(session.user);
        setUser(profile);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = useCallback(async (email, password) => {
    if (!isSupabaseConfigured()) {
      const storedPassword = getStoredPassword(email);
      if (storedPassword && storedPassword !== password) {
        return { success: false, error: 'אימייל או סיסמה שגויים' };
      }

      const found = getUserByEmail(email);
      if (found) {
        persistUser({ ...found });
        return { success: true };
      }

      if (email) {
        persistUser({
          id: `user-${Date.now()}`,
          name: email.split('@')[0],
          email,
          phone: '',
          role: USER_ROLES.DRIVER,
          avatar: null,
        });
        return { success: true };
      }
      return { success: false, error: 'אימייל או סיסמה שגויים' };
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      return { success: false, error: 'אימייל או סיסמה שגויים' };
    }
    return { success: true };
  }, [persistUser]);

  const loginWithGoogle = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      const demoDriver = getUserByEmail('israel@example.com');
      persistUser(demoDriver ? { ...demoDriver } : {
        id: `user-${Date.now()}`,
        name: 'משתמש Google',
        email: 'google@example.com',
        phone: '',
        role: USER_ROLES.DRIVER,
        avatar: null,
      });
      return { success: true };
    }

    return login('israel@example.com', DEMO_PASSWORD);
  }, [login, persistUser]);

  const register = useCallback(async (name, email, password) => {
    if (password.length < 6) {
      return { success: false, error: 'הסיסמה חייבת להכיל לפחות 6 תווים' };
    }

    if (!isSupabaseConfigured()) {
      const newUser = {
        id: `user-${Date.now()}`,
        name,
        email,
        phone: '',
        role: USER_ROLES.DRIVER,
        avatar: null,
      };
      setStoredPassword(email, password);
      persistUser(newUser);
      return { success: true };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role: USER_ROLES.DRIVER },
      },
    });

    if (error) {
      return { success: false, error: error.message || 'ההרשמה נכשלה' };
    }

    if (!data.session) {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) {
        return { success: false, error: 'נרשמת בהצלחה. אשרו את האימייל ואז התחברו.' };
      }
    }

    return { success: true };
  }, [persistUser]);

  const updateProfile = useCallback(async (updates) => {
    if (!user) return { success: false, error: 'לא מחובר' };

    const nextUser = { ...user, ...updates };

    if (!isSupabaseConfigured()) {
      const emailChanged = updates.email && updates.email !== user.email;
      if (emailChanged) {
        const storedPassword = getStoredPassword(user.email);
        if (storedPassword) {
          setStoredPassword(updates.email, storedPassword);
          const credentials = loadCredentials();
          delete credentials[user.email];
          saveCredentials(credentials);
        }
      }
      persistUser(nextUser);
      return { success: true };
    }

    const { error } = await supabase
      .from('profiles')
      .update(profileToRow(nextUser))
      .eq('id', user.id);

    if (error) {
      return { success: false, error: 'עדכון הפרופיל נכשל' };
    }

    if (updates.email && updates.email !== user.email) {
      const { error: authError } = await supabase.auth.updateUser({ email: updates.email });
      if (authError) {
        return { success: false, error: 'עדכון האימייל נכשל' };
      }
    }

    persistUser(nextUser);
    return { success: true };
  }, [user, persistUser]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'לא מחובר' };

    if (newPassword.length < 6) {
      return { success: false, error: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים' };
    }

    if (!isSupabaseConfigured()) {
      const storedPassword = getStoredPassword(user.email);
      if (storedPassword && storedPassword !== currentPassword) {
        return { success: false, error: 'הסיסמה הנוכחית שגויה' };
      }
      if (!storedPassword && currentPassword.length < 4) {
        return { success: false, error: 'הסיסמה הנוכחית שגויה' };
      }
      setStoredPassword(user.email, newPassword);
      return { success: true };
    }

    const { error: reauthError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (reauthError) {
      return { success: false, error: 'הסיסמה הנוכחית שגויה' };
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) {
      return { success: false, error: 'שינוי הסיסמה נכשל' };
    }

    return { success: true };
  }, [user]);

  const requestPasswordReset = useCallback(async (email) => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      return { success: false, error: 'יש להזין כתובת אימייל' };
    }

    if (!isSupabaseConfigured()) {
      await new Promise((r) => setTimeout(r, 600));
      return { success: true };
    }

    const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
      redirectTo: `${window.location.origin}/login`,
    });

    if (error) {
      return { success: false, error: 'שליחת קישור האיפוס נכשלה. נסו שוב.' };
    }

    return { success: true };
  }, []);

  const logout = useCallback(async () => {
    if (isSupabaseConfigured()) {
      await supabase.auth.signOut();
    }
    setUser(null);
    localStorage.removeItem('parkit_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        changePassword,
        requestPasswordReset,
        isAuthenticated: !!user,
        isDriver: isDriver(user),
        isOwner: isOwner(user),
        isAdmin: isAdmin(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
