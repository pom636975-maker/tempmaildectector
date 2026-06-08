import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('stravo_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('stravo_access_token');
    if (!token) {
      setLoading(false);
      return;
    }

    authApi.me()
      .then(({ user: currentUser }) => {
        setUser(currentUser);
        localStorage.setItem('stravo_user', JSON.stringify(currentUser));
      })
      .catch(() => {
        localStorage.removeItem('stravo_access_token');
        localStorage.removeItem('stravo_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: nextUser, accessToken } = await authApi.login({ email, password });
    localStorage.setItem('stravo_access_token', accessToken);
    localStorage.setItem('stravo_user', JSON.stringify(nextUser));
    setUser(nextUser);
    return nextUser;
  }, []);

  const signup = useCallback(async ({ email, password, fullName, deviceId }) => {
    return authApi.signup({ email, password, fullName, deviceId });
  }, []);

  const verifyEmail = useCallback(async ({ email, otp }) => {
    const { user: nextUser, accessToken, message } = await authApi.verifyEmail({ email, otp });
    if (accessToken && nextUser) {
      localStorage.setItem('stravo_access_token', accessToken);
      localStorage.setItem('stravo_user', JSON.stringify(nextUser));
      setUser(nextUser);
    }
    return { user: nextUser, message };
  }, []);

  const resendVerification = useCallback((email) => authApi.resendVerification(email), []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem('stravo_access_token');
    localStorage.removeItem('stravo_user');
    setUser(null);
  }, []);

  const isDashboardEnabled = !!user && user.account_status === 'active' && user.email_verified !== false;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      signup,
      verifyEmail,
      resendVerification,
      logout,
      isAuthenticated: !!user,
      isDashboardEnabled,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
