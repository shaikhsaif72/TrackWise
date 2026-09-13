import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from 'react';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => {
    return localStorage.getItem('trackwise_token');
  });

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('trackwise_user');

    try {
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = Boolean(token);

  const login = (authToken, userData = null) => {
    localStorage.setItem('trackwise_token', authToken);

    if (userData) {
      localStorage.setItem('trackwise_user', JSON.stringify(userData));
    }

    setToken(authToken);
    setUser(userData);

    window.dispatchEvent(new Event('auth:login'));
  };

  const logout = () => {
    localStorage.removeItem('trackwise_token');
    localStorage.removeItem('trackwise_user');

    // Remove old token keys also
    localStorage.removeItem('token');
    localStorage.removeItem('access_token');
    localStorage.removeItem('accessToken');

    setToken(null);
    setUser(null);

    window.dispatchEvent(new Event('auth:logout'));
  };

  useEffect(() => {
    const handleLogin = () => {
      const savedToken = localStorage.getItem('trackwise_token');
      const savedUser = localStorage.getItem('trackwise_user');

      setToken(savedToken);

      try {
        setUser(savedUser ? JSON.parse(savedUser) : null);
      } catch {
        setUser(null);
      }
    };

    const handleLogout = () => {
      setToken(null);
      setUser(null);
    };

    window.addEventListener('auth:login', handleLogin);
    window.addEventListener('auth:logout', handleLogout);

    return () => {
      window.removeEventListener('auth:login', handleLogin);
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        isAuthenticated,
        login,
        logout
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}