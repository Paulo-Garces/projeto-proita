import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Cookie } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('proita_cookies_accepted');
    if (!accepted) {
      setShouldRender(true);
      // Pequeno atraso para engajar a transição de opacidade/fade-in
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    setIsVisible(false);
    localStorage.setItem('proita_cookies_accepted', 'true');
    // Espera a transição de fade-out terminar antes de remover do DOM
    setTimeout(() => {
      setShouldRender(false);
    }, 500);
  };

  if (!shouldRender) return null;

  return (
    <div
      className={`fixed bottom-24 md:bottom-6 left-1/2 -translate-x-1/2 md:left-auto md:right-6 md:translate-x-0 z-[9999] w-[90%] md:max-w-md bg-white/95 backdrop-blur-md border border-slate-100 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.12)] p-5 transition-all duration-500 ease-out transform ${
        isVisible ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-8 scale-95 pointer-events-none'
      }`}
    >
      <div className="flex gap-4">
        <div className="p-3 bg-sky-50 rounded-xl text-sky-600 shrink-0 self-start shadow-inner">
          <Cookie className="w-6 h-6 animate-pulse" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-800 text-sm mb-1">
            Privacidade & Cookies
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed mb-4">
            Usamos cookies para otimizar o funcionamento do site, analisar o tráfego e personalizar a sua experiência no <strong>proITA</strong> de acordo com a LGPD.
          </p>
          <div className="flex items-center justify-between gap-3">
            <Link
              to="/privacidade"
              className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors underline decoration-slate-200 underline-offset-4 cursor-pointer"
            >
              Saiba mais
            </Link>
            <button
              onClick={handleAccept}
              className="px-5 py-2 bg-gradient-to-r from-primary to-secondary hover:from-primary-hover hover:to-primary text-white text-xs font-bold rounded-xl transition-all duration-300 shadow-md shadow-primary/20 hover:shadow-primary/30 active:scale-95 cursor-pointer text-center"
            >
              Permitir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
