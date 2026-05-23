import { Link, useLocation } from 'react-router-dom';
import { Home, Search, Bookmark, User } from 'lucide-react';
import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const { isAuthenticated } = useContext(AuthContext);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isFavoritesActive = () => {
    return location.pathname === '/search' && new URLSearchParams(location.search).get('favoritos') === 'true';
  };

  return (
    <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 animate-in slide-in-from-bottom-6 duration-500">
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] px-4 py-2 flex justify-around items-center">
        
        {/* Início */}
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 active:scale-95 ${
            isActive('/') && !isFavoritesActive()
              ? 'text-primary'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home size={20} className={`transition-transform ${isActive('/') && !isFavoritesActive() ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight">Início</span>
        </Link>

        {/* Buscar */}
        <Link
          to="/search"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 active:scale-95 ${
            isActive('/search') && !isFavoritesActive()
              ? 'text-primary'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search size={20} className={`transition-transform ${isActive('/search') && !isFavoritesActive() ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight">Explorar</span>
        </Link>

        {/* Favoritos */}
        <Link
          to="/search?favoritos=true"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 active:scale-95 ${
            isFavoritesActive()
              ? 'text-primary'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Bookmark size={20} className={`transition-transform ${isFavoritesActive() ? 'scale-110 fill-primary/10' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight">Favoritos</span>
        </Link>

        {/* Minha Conta / Dashboard */}
        <Link
          to={isAuthenticated ? '/dashboard' : '/auth'}
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 active:scale-95 ${
            isActive('/dashboard') || isActive('/auth')
              ? 'text-primary'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <User size={20} className={`transition-transform ${isActive('/dashboard') || isActive('/auth') ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight">Painel</span>
        </Link>

      </div>
    </div>
  );
}
