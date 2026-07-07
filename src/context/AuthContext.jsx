import { createContext, useContext, useState, useCallback } from 'react';
import { getUserByEmail } from '../data/mockData';
import { isAdmin, isDriver, isOwner, USER_ROLES } from '../lib/roles';

function hydrateUser(savedUser) {
  if (!savedUser) return null;

  const canonical = getUserByEmail(savedUser.email);
  if (!canonical) return savedUser;

  return {
    ...canonical,
    name: savedUser.name || canonical.name,
    phone: savedUser.phone || canonical.phone,
    avatar: savedUser.avatar ?? canonical.avatar,
  };
}

const AuthContext = createContext(null);
const CREDENTIALS_KEY = 'parkit_credentials';

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

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('parkit_user');
    return saved ? hydrateUser(JSON.parse(saved)) : null;
  });

  const persistUser = useCallback((nextUser) => {
    setUser(nextUser);
    localStorage.setItem('parkit_user', JSON.stringify(nextUser));
  }, []);

  const login = useCallback((email, password) => {
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
  }, [persistUser]);

  const loginWithGoogle = useCallback(() => {
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
  }, [persistUser]);

  const register = useCallback((name, email, password) => {
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
  }, [persistUser]);

  const updateProfile = useCallback((updates) => {
    if (!user) return { success: false, error: 'לא מחובר' };

    const nextUser = { ...user, ...updates };
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
  }, [user, persistUser]);

  const changePassword = useCallback((currentPassword, newPassword) => {
    if (!user) return { success: false, error: 'לא מחובר' };

    if (newPassword.length < 6) {
      return { success: false, error: 'הסיסמה החדשה חייבת להכיל לפחות 6 תווים' };
    }

    const storedPassword = getStoredPassword(user.email);

    if (storedPassword && storedPassword !== currentPassword) {
      return { success: false, error: 'הסיסמה הנוכחית שגויה' };
    }

    if (!storedPassword && currentPassword.length < 4) {
      return { success: false, error: 'הסיסמה הנוכחית שגויה' };
    }

    setStoredPassword(user.email, newPassword);
    return { success: true };
  }, [user]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('parkit_user');
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        loginWithGoogle,
        register,
        logout,
        updateProfile,
        changePassword,
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
