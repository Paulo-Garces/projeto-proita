import { Link, useLocation } from 'react-router-dom';
import { Menu, X, User, Search, Home, PlusCircle, HelpCircle, Info, LogOut, Shield } from 'lucide-react';
import { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  
  const { user, isAuthenticated, logout } = useContext(AuthContext);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  const isHome = location.pathname === '/';

  return (
    <header className="fixed top-0 left-0 w-full z-50 glass border-b border-slate-200 bg-white/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Esquerda: Logo Apenas (Oculto na Home) */}
          <div className="flex items-center">
            {!isHome && (
              <Link to="/" className="flex items-center">
                <img src="/logo-proita.svg" alt="proITA Logo" className="h-8" />
              </Link>
            )}
          </div>

          {/* Direita: Links de Navegação & Auth/Ações */}
          <div className="hidden md:flex items-center gap-8">
            
            {/* Navegação */}
            <nav className="flex items-center gap-6">
              {!isHome && (
                <Link to="/" className="text-slate-600 hover:text-primary font-medium transition-colors flex items-center gap-2">
                  <Home size={18} /> Início
                </Link>
              )}
              <Link to="/search" className="text-slate-600 hover:text-primary font-medium transition-colors flex items-center gap-2">
                <Search size={18} /> Explorar
              </Link>
              {isAuthenticated ? (
                <Link to="/support" className="text-slate-600 hover:text-primary font-medium transition-colors flex items-center gap-2">
                  <HelpCircle size={18} /> Suporte
                </Link>
              ) : (
                <Link to="/about" className="text-slate-600 hover:text-primary font-medium transition-colors flex items-center gap-2">
                  <Info size={18} /> Sobre
                </Link>
              )}
            </nav>

            {/* Divisor */}
            <div className="h-6 w-px bg-slate-200"></div>

            {/* Auth e Conta */}
            {isAuthenticated ? (
              <div className="flex items-center gap-6">
                <Link to="/advertise" className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-full font-medium transition-colors shadow-md shadow-sky-200 flex items-center gap-2">
                  <PlusCircle size={18} /> Anuncie
                </Link>

                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)} 
                    className="flex items-center gap-2 focus:outline-none"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 border-2 border-transparent hover:border-primary transition-all">
                      <User size={20} />
                    </div>
                  </button>

                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-100 py-2 z-50">
                      <div className="px-4 py-2 border-b border-slate-100 mb-2">
                        <p className="text-sm font-medium text-slate-800">{user?.nome}</p>
                        <p className="text-xs text-slate-500 truncate">{user?.telefone}</p>
                      </div>
                      {user?.role === 'ADMIN' && (
                        <Link 
                          to="/admin" 
                          onClick={() => setIsDropdownOpen(false)}
                          className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary flex items-center gap-2"
                        >
                          <Shield size={16} /> Administração
                        </Link>
                      )}
                      <Link 
                        to="/dashboard" 
                        onClick={() => setIsDropdownOpen(false)}
                        className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-primary flex items-center gap-2"
                      >
                        <User size={16} /> Minha Conta
                      </Link>
                      <button 
                        onClick={() => { logout(); setIsDropdownOpen(false); }}
                        className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                      >
                        <LogOut size={16} /> Sair
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/auth" className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-full font-medium transition-colors shadow-md shadow-sky-200">
                  Cadastrar
                </Link>
                <Link to="/auth" className="text-slate-600 hover:text-primary font-medium transition-colors">
                  Entrar
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-slate-600 hover:text-slate-900 focus:outline-none">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isOpen && (
        <div className="md:hidden absolute top-16 left-0 w-full glass bg-white/95 border-b border-slate-200 shadow-xl max-h-[calc(100vh-4rem)] overflow-y-auto">
          <div className="px-4 pt-2 pb-6 space-y-1">
            {!isHome && (
              <Link to="/" onClick={() => setIsOpen(false)} className="block px-3 py-4 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md border-b border-slate-100 flex items-center gap-3">
                <Home size={20} className="text-slate-400" /> Início
              </Link>
            )}
            <Link to="/search" onClick={() => setIsOpen(false)} className="block px-3 py-4 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md border-b border-slate-100 flex items-center gap-3">
              <Search size={20} className="text-slate-400" /> Explorar Profissionais
            </Link>
            {isAuthenticated ? (
              <Link to="/support" onClick={() => setIsOpen(false)} className="block px-3 py-4 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md border-b border-slate-100 flex items-center gap-3">
                <HelpCircle size={20} className="text-slate-400" /> Suporte
              </Link>
            ) : (
              <Link to="/about" onClick={() => setIsOpen(false)} className="block px-3 py-4 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md border-b border-slate-100 flex items-center gap-3">
                <Info size={20} className="text-slate-400" /> Sobre
              </Link>
            )}
            
            {isAuthenticated ? (
              <>
                <Link to="/advertise" onClick={() => setIsOpen(false)} className="block px-3 py-4 text-base font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md flex items-center gap-3 mt-4 justify-center">
                  <PlusCircle size={20} /> Anuncie
                </Link>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-3 px-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 border-2 border-primary">
                      <User size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{user?.nome}</p>
                      <p className="text-xs text-slate-500">{user?.telefone}</p>
                    </div>
                  </div>
                  {user?.role === 'ADMIN' && (
                    <Link to="/admin" onClick={() => setIsOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md flex items-center gap-3">
                      <Shield size={20} className="text-slate-400" /> Administração
                    </Link>
                  )}
                  <Link to="/dashboard" onClick={() => setIsOpen(false)} className="block px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md flex items-center gap-3">
                    <User size={20} className="text-slate-400" /> Minha Conta
                  </Link>
                  <button onClick={() => { logout(); setIsOpen(false); }} className="block w-full text-left px-3 py-3 text-base font-medium text-red-500 hover:bg-red-50 rounded-md flex items-center gap-3">
                    <LogOut size={20} /> Sair
                  </button>
                </div>
              </>
            ) : (
              <div className="mt-6 flex flex-col gap-3 px-3">
                <Link to="/auth" onClick={() => setIsOpen(false)} className="w-full text-center block px-4 py-3 text-base font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md">
                  Cadastrar
                </Link>
                <Link to="/auth" onClick={() => setIsOpen(false)} className="w-full text-center block px-4 py-3 text-base font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200">
                  Entrar
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
