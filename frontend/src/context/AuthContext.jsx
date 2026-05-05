import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Ao carregar a aplicação, tenta recuperar token e usuário do localStorage
    const storedToken = localStorage.getItem('@proita:token');
    const storedUser = localStorage.getItem('@proita:user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    
    setLoading(false);
  }, []);

  const login = (jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('@proita:token', jwtToken);
    localStorage.setItem('@proita:user', JSON.stringify(userData));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('@proita:token');
    localStorage.removeItem('@proita:user');
  };

  // Atualiza campos específicos do usuário no estado global e no localStorage
  // sem precisar re-logar. Útil para troca de foto, edição de nome, etc.
  const updateUser = (newData) => {
    setUser(prev => {
      const updated = { ...prev, ...newData };
      localStorage.setItem('@proita:user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}
