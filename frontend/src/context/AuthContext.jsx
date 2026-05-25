import { createContext, useState, useEffect } from 'react';
import { API_URL } from '../config';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('@proita:token');
    localStorage.removeItem('@proita:user');
  };

  useEffect(() => {
    // Ao carregar a aplicação, tenta recuperar token e usuário do localStorage
    const storedToken = localStorage.getItem('@proita:token');
    const storedUser = localStorage.getItem('@proita:user');

    if (storedToken) {
      setToken(storedToken);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      
      // Busca dados atualizados em tempo real diretamente do banco de dados
      fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${storedToken}`
        }
      })
        .then(res => {
          if (res.status === 401 || res.status === 403) {
            // Se o token expirou ou é inválido, limpa sessão local
            logout();
            return null;
          }
          return res.json();
        })
        .then(data => {
          if (data && data.success && data.user) {
            setUser(data.user);
            localStorage.setItem('@proita:user', JSON.stringify(data.user));
          }
        })
        .catch(err => {
          console.error("Erro ao sincronizar sessão com banco de dados:", err);
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = (jwtToken, userData) => {
    setToken(jwtToken);
    setUser(userData);
    localStorage.setItem('@proita:token', jwtToken);
    localStorage.setItem('@proita:user', JSON.stringify(userData));
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
