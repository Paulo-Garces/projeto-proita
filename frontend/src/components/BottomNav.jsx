import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Search, User, Undo2 } from 'lucide-react';
import { useContext, useState, useEffect, useRef, useCallback } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const [isVisible, setIsVisible] = useState(true);
  const timeoutRef = useRef(null);

  const resetTimer = useCallback(() => {
    setIsVisible(true);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 2000);
  }, []);

  useEffect(() => {
    resetTimer();

    const handleEvent = () => {
      resetTimer();
    };

    window.addEventListener('scroll', handleEvent, { passive: true });
    window.addEventListener('touchstart', handleEvent, { passive: true });
    window.addEventListener('touchmove', handleEvent, { passive: true });
    window.addEventListener('mousemove', handleEvent, { passive: true });

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('scroll', handleEvent);
      window.removeEventListener('touchstart', handleEvent);
      window.removeEventListener('touchmove', handleEvent);
      window.removeEventListener('mousemove', handleEvent);
    };
  }, [resetTimer]);

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  if (location.pathname === '/') return null;

  return (
    <div className={`md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-50 transition-all duration-500 ease-in-out ${
      isVisible 
        ? 'translate-y-0 opacity-100' 
        : 'translate-y-24 opacity-0 pointer-events-none'
    }`}>
      <div className="bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.08)] px-4 py-2 flex justify-around items-center">
        
        {/* Voltar */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 active:scale-95 text-slate-500 hover:text-slate-800 cursor-pointer"
        >
          <Undo2 size={20} className="transition-transform" />
          <span className="text-[10px] font-bold tracking-tight">Voltar</span>
        </button>

        {/* Explorar */}
        <Link
          to="/search"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 active:scale-95 ${
            isActive('/search')
              ? 'text-primary'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Search size={20} className={`transition-transform ${isActive('/search') ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight">Explorar</span>
        </Link>

        {/* Painel */}
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

        {/* Início */}
        <Link
          to="/"
          className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-300 active:scale-95 ${
            isActive('/')
              ? 'text-primary'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Home size={20} className={`transition-transform ${isActive('/') ? 'scale-110' : ''}`} />
          <span className="text-[10px] font-bold tracking-tight">Início</span>
        </Link>

      </div>
    </div>
  );
}
