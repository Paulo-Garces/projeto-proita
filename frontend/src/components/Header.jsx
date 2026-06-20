import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, User, Search, Home, PlusCircle, HelpCircle, Info, LogOut, Shield, Heart, Download, Smartphone } from 'lucide-react';
import { useState, useRef, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { PwaContext } from '../context/PwaContext';
import NotificationBell from './NotificationBell';

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  
  const handleAnuncieClick = (e) => {
    e?.preventDefault();
    if (user) {
      navigate('/dashboard/novo-anuncio');
    } else {
      navigate('/planos');
    }
  };

  // Estados para fechar o menu mobile arrastando e colando no polegar (swipe close com física realista)
  const [touchStartX, setTouchStartX] = useState(0);
  const [touchDisplacement, setTouchDisplacement] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleTouchStart = (e) => {
    setTouchStartX(e.targetTouches[0].clientX);
    setIsDragging(true);
    setTouchDisplacement(0);
  };

  const handleTouchMove = (e) => {
    const currentX = e.targetTouches[0].clientX;
    const diffX = touchStartX - currentX;
    // Apenas arrasta para a esquerda (valores positivos de deslocamento)
    if (diffX > 0) {
      setTouchDisplacement(diffX);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    // Se arrastou mais de 80px (cerca de 30% do drawer), fecha graciosamente
    if (touchDisplacement > 80) {
      setIsOpen(false);
    }
    setTouchDisplacement(0);
  };

  const { user, isAuthenticated, logout } = useContext(AuthContext);
  const { isInstallable, installApp } = useContext(PwaContext);

  const isTrialExpired = user?.planStatus === 'DEGUSTACAO' && user?.trialEndsAt && new Date(user.trialEndsAt) < new Date();
  const hasActivePlan = isAuthenticated && (user?.planStatus === 'ATIVO' || user?.planStatus === 'BASICO' || (user?.planStatus === 'DEGUSTACAO' && !isTrialExpired));

  // Fechar dropdown do perfil ao clicar fora
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownRef]);

  // BÔNUS: Fechar o menu mobile automaticamente quando trocar de página
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isHome = location.pathname === '/';
  const hasAdminToken = !!localStorage.getItem('@proita:admin_token');
  const handleVoltarAdmin = () => {
    const originalToken = localStorage.getItem('@proita:admin_token');
    if (originalToken) {
      localStorage.setItem('@proita:token', originalToken);
      localStorage.removeItem('@proita:admin_token');
      localStorage.removeItem('impersonator_name');
      window.location.href = '/admin';
    }
  };

  return (
    <>
      {hasAdminToken && (
        <div className="fixed top-0 left-0 w-full h-9 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 z-50 flex items-center justify-between text-xs font-semibold shadow-md animate-in slide-in-from-top duration-150">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse shrink-0" />
            <span className="truncate">Modo Deus: Acessando como <strong className="underline font-bold">{user?.nome} {user?.sobrenome || ''}</strong></span>
          </div>
          <button
            onClick={handleVoltarAdmin}
            className="bg-white hover:bg-violet-50 text-violet-700 px-3 py-1 rounded-lg text-[10px] font-bold transition-all shadow-sm cursor-pointer shrink-0 uppercase tracking-wider"
          >
            Voltar ao Admin
          </button>
        </div>
      )}
      <header className={`fixed left-0 w-full z-40 glass border-b border-slate-200 bg-white/90 backdrop-blur-md transition-all duration-150 ${hasAdminToken ? 'top-9' : 'top-0'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Esquerda: Menu Mobile e Logo */}
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <div className="md:hidden flex items-center">
                <button onClick={() => setIsOpen(true)} className="text-slate-600 hover:text-slate-900 focus:outline-none">
                  <Menu size={28} />
                </button>
              </div>

              {/* Logo (Oculto na Home) */}
              {!isHome && (
                <Link to="/" className="flex items-center">
                  <img src="/logo-proita.svg" alt="proITA Logo" className="h-10 md:h-12" />
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
                  <Link to="/central-de-ajuda" className="text-slate-600 hover:text-primary font-medium transition-colors flex items-center gap-2">
                    <HelpCircle size={18} /> Suporte
                  </Link>
                ) : (
                  <Link to="/sobre" className="text-slate-600 hover:text-primary font-medium transition-colors flex items-center gap-2">
                    <Info size={18} /> Sobre
                  </Link>
                )}
              </nav>

              {/* Divisor */}
              <div className="h-6 w-px bg-slate-200"></div>

              {/* Botão Instalar App (PWA) */}
              {isInstallable && (
                <button
                  onClick={installApp}
                  className="border border-primary text-primary hover:bg-primary/5 px-4 py-2 rounded-full font-medium transition-colors flex items-center gap-2 cursor-pointer text-sm shadow-sm"
                >
                  <Download size={18} /> Instalar
                </button>
              )}

              {/* Botão Anuncie (Sempre Visível) */}
              <button onClick={handleAnuncieClick} className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-full font-medium transition-colors shadow-md shadow-sky-200 flex items-center gap-2">
                <PlusCircle size={18} /> Anuncie
              </button>

              {/* Auth e Conta */}
              {isAuthenticated ? (
                <div className="flex items-center gap-6">
                  <NotificationBell />
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 focus:outline-none"
                    >
                      {user?.profileImageUrl ? (
                        <img
                          src={user.profileImageUrl}
                          alt={user.nome}
                          className="w-10 h-10 rounded-full object-cover border-2 border-transparent hover:border-primary transition-all shadow-sm"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white font-bold text-sm border-2 border-transparent hover:border-primary transition-all select-none">
                          {user?.nome?.[0]?.toUpperCase()}{user?.sobrenome?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </button>

                    {/* Dropdown Menu Desktop */}
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
                          onClick={() => { logout(); setIsDropdownOpen(false); navigate('/'); }}
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
                  <Link to="/auth?mode=register" className="bg-primary hover:bg-primary-hover text-white px-5 py-2 rounded-full font-medium transition-colors shadow-md shadow-sky-200">
                    Cadastrar
                  </Link>
                  <Link to="/auth" className="text-slate-600 hover:text-primary font-medium transition-colors">
                    Entrar
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile right side - Sininho de Notificação se Autenticado */}
            <div className="md:hidden flex items-center">
              {isAuthenticated ? (
                <NotificationBell />
              ) : (
                <div className="w-7"></div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Overlay - AGORA SOLTO DA CAIXA DO HEADER */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Mobile Navigation Sidebar - AGORA SOLTO E COM Z-INDEX MÁXIMO (Sticks to thumb!) */}
      <div
        className={`md:hidden fixed inset-y-0 left-0 w-4/5 max-w-sm z-[60] bg-white shadow-2xl flex flex-col ${
          isDragging ? '' : 'transition-transform duration-300 ease-in-out'
        }`}
        style={{
          transform: isOpen
            ? `translateX(-${touchDisplacement}px)`
            : 'translateX(-100%)',
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="p-4 border-b border-slate-100 flex justify-end items-center bg-white min-h-[72px] relative">
          <img src="/logo-proita.svg" alt="proITA Logo" className="h-12 absolute left-1/2 -translate-x-1/2" />
          <button onClick={() => setIsOpen(false)} className="text-slate-500 hover:text-slate-800 p-1 rounded-full hover:bg-slate-100 transition-colors relative z-10">
            <X size={24} />
          </button>
        </div>

        <div className="px-4 py-6 overflow-y-auto flex-1 space-y-1 bg-white">
          {!isHome && (
            <Link to="/" className="block px-3 py-4 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md border-b border-slate-100 flex items-center gap-3">
              <Home size={20} className="text-slate-400" /> Início
            </Link>
          )}
          <Link to="/search" className="block px-3 py-4 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md border-b border-slate-100 flex items-center gap-3">
            <Search size={20} className="text-slate-400" /> Explorar Profissionais
          </Link>
          {isAuthenticated ? (
            <Link to="/central-de-ajuda" className="block px-3 py-4 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md border-b border-slate-100 flex items-center gap-3">
              <HelpCircle size={20} className="text-slate-400" /> Suporte
            </Link>
          ) : (
            <Link to="/sobre" className="block px-3 py-4 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md border-b border-slate-100 flex items-center gap-3">
              <Info size={20} className="text-slate-400" /> Sobre
            </Link>
          )}

          {/* Botão Anuncie (Sempre Visível no Mobile) */}
          <button onClick={handleAnuncieClick} className="w-full text-center block px-3 py-4 text-base font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md flex items-center gap-3 mt-4 justify-center">
            <PlusCircle size={20} /> Anuncie
          </button>

          {/* Card de Instalação do PWA no Mobile */}
          {isInstallable && (
            <div className="p-4 bg-gradient-to-r from-sky-50 to-cyan-50 rounded-xl border border-sky-100 flex flex-col gap-3 mt-4 mx-3">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                  <Smartphone size={20} />
                </div>
                <div className="text-left">
                  <h4 className="font-semibold text-slate-800 text-sm">Instalar Aplicativo</h4>
                  <p className="text-xs text-slate-500">Tenha acesso rápido e use offline.</p>
                </div>
              </div>
              <button 
                onClick={installApp} 
                className="w-full bg-primary hover:bg-primary-hover text-white py-2.5 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
              >
                <Download size={16} /> Instalar proITA
              </button>
            </div>
          )}

          {isAuthenticated ? (
            <>
              <div className="mt-4 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-4 px-3 mb-5">
                  {user?.profileImageUrl ? (
                    <img
                      src={user.profileImageUrl}
                      alt={user.nome}
                      className="w-16 h-16 rounded-full object-cover border-[3px] border-primary shadow-lg shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white font-bold text-xl border-[3px] border-primary shadow-lg shrink-0 select-none">
                      {user?.nome?.[0]?.toUpperCase()}{user?.sobrenome?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-base font-bold text-slate-900 leading-tight">{user?.nome} {user?.sobrenome}</p>
                    <p className="text-sm text-slate-500 mt-0.5">{user?.telefone}</p>
                  </div>
                </div>
                {user?.role === 'ADMIN' && (
                  <Link to="/admin" className="block px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md flex items-center gap-3">
                    <Shield size={20} className="text-slate-400" /> Administração
                  </Link>
                )}
                <Link to="/dashboard" className="block px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md flex items-center gap-3">
                  <User size={20} className="text-slate-400" /> Minha Conta
                </Link>
                <Link to="/search?favoritos=true" className="block px-3 py-3 text-base font-medium text-slate-800 hover:bg-slate-50 rounded-md flex items-center gap-3">
                  <Heart size={20} className="text-slate-400" /> Favoritos
                </Link>
                <div className="border-t border-slate-100 mt-2 pt-2">
                  <button onClick={() => { logout(); navigate('/'); }} className="block w-full text-left px-3 py-3 text-base font-medium text-red-500 hover:bg-red-50 rounded-md flex items-center gap-3">
                    <LogOut size={20} /> Sair
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="mt-6 flex flex-col gap-3 px-3">
              <Link to="/auth?mode=register" className="w-full text-center block px-4 py-3 text-base font-medium text-white bg-primary hover:bg-primary-hover rounded-xl shadow-md">
                Cadastrar
              </Link>
              <Link to="/auth" className="w-full text-center block px-4 py-3 text-base font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl border border-slate-200">
                Entrar
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}