import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { authApi } from '../services/api';
import { getInsForgeAccessToken, hadInitialOAuthCallback, insforgeBrowserClient } from '../services/insforgeClient';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('stravo_access_token');
    if (!token) {
      localStorage.removeItem('stravo_user');
      return null;
    }
    const stored = localStorage.getItem('stravo_user');
    return stored ? JSON.parse(stored) : null;
  });
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    async function syncSession() {
      try {
        setAuthError('');
        let token = localStorage.getItem('stravo_access_token');
        let completedOAuth = false;

        if (!token || hadInitialOAuthCallback) {
          const { data, error } = await insforgeBrowserClient.auth.getCurrentUser();
          const oauthToken = getInsForgeAccessToken();
          if (hadInitialOAuthCallback && error) throw new Error(error.message);
          if (oauthToken && data?.user) {
            localStorage.setItem('stravo_access_token', oauthToken);
            token = oauthToken;
            completedOAuth = hadInitialOAuthCallback;
          } else if (hadInitialOAuthCallback) {
            throw new Error('OAuth sign-in did not return a valid session.');
          }
        }

        if (!token) {
          setUser(null);
          return;
        }

        const { user: currentUser } = await authApi.me();
        setUser(currentUser);
        localStorage.setItem('stravo_user', JSON.stringify(currentUser));
        if (completedOAuth) sessionStorage.setItem('stravo_oauth_complete', '1');
      } catch (err) {
        localStorage.removeItem('stravo_access_token');
        localStorage.removeItem('stravo_user');
        setAuthError(err.message || 'Authentication failed. Please sign in again.');
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    syncSession();
  }, []);

  useEffect(() => {
    const handleAuthExpired = () => setUser(null);
    window.addEventListener('stravo:auth-expired', handleAuthExpired);
    return () => window.removeEventListener('stravo:auth-expired', handleAuthExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const { user: nextUser, accessToken } = await authApi.login({ email, password });
    if (!accessToken || !nextUser) throw new Error('Login did not return a valid session. Please try again.');
    localStorage.setItem('stravo_access_token', accessToken);
    localStorage.setItem('stravo_user', JSON.stringify(nextUser));
    setAuthError('');
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
      setAuthError('');
      setUser(nextUser);
    }
    return { user: nextUser, message };
  }, []);

  const resendVerification = useCallback((email) => authApi.resendVerification(email), []);

  const loginWithProvider = useCallback(async (provider) => {
    const redirectTo = `${window.location.origin}/login`;
    const { data, error } = await insforgeBrowserClient.auth.signInWithOAuth(provider, {
      redirectTo,
      additionalParams: { prompt: 'select_account' },
      skipBrowserRedirect: true,
    });
    if (error) throw new Error(error.message);
    if (!data?.url) throw new Error(`${provider} sign-in URL was not returned by InsForge.`);
    window.location.href = data.url;
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    localStorage.removeItem('stravo_access_token');
    localStorage.removeItem('stravo_user');
    setUser(null);
  }, []);

  const isDashboardEnabled = !!user && user.account_status === 'active' && user.email_verified !== false;
  const hasSession = !!localStorage.getItem('stravo_access_token');

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      authError,
      login,
      signup,
      verifyEmail,
      resendVerification,
      loginWithProvider,
      logout,
      isAuthenticated: hasSession && !!user,
      isDashboardEnabled: hasSession && isDashboardEnabled,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
