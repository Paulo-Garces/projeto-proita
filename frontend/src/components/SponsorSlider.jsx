import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * SponsorSlider — Componente de carrossel automático com transição suave para patrocinadores.
 * 
 * @param {Array} partners - Lista de parceiros [{ imageUrl: string, link: string }]
 * @param {string} layout - Estilo e tamanho do slide: 'card' (busca), 'sidebar' (perfil desktop), 'tab' (perfil mobile)
 */
export default function SponsorSlider({ partners = [], layout = 'card', onPartnerClick }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Filtra parceiros válidos que possuem imagem
  const validPartners = (partners || []).filter(p => p && p.imageUrl);

  useEffect(() => {
    if (validPartners.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % validPartners.length);
    }, 3500); // Transição entre 3 e 4 segundos (3.5s é perfeito)

    return () => clearInterval(interval);
  }, [validPartners.length]);

  if (validPartners.length === 0) return null;

  // Definições de tamanho e estilo baseadas no layout
  const containerClasses = {
    card: 'h-16 sm:h-20 w-full rounded-xl border border-slate-100 bg-slate-50/50 shadow-inner',
    sidebar: 'h-36 sm:h-40 w-full rounded-2xl border border-slate-100 bg-slate-50/30 shadow-sm',
    tab: 'h-48 sm:h-56 w-full rounded-2xl border border-slate-150 bg-slate-50/50 shadow-md',
    portrait: 'h-24 md:h-28 w-[72px] md:w-[84px] rounded-lg border border-slate-100 bg-slate-50/50 shadow-sm shrink-0',
  }[layout];

  const currentPartner = validPartners[currentIndex];

  const handlePartnerClick = (e, partner) => {
    e.stopPropagation();
    if (onPartnerClick) {
      onPartnerClick(partner);
    } else if (partner.link) {
      const link = partner.link;
      window.open(link.startsWith('http') ? link : `https://${link}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div className={`relative overflow-hidden group select-none transition-all duration-300 ${containerClasses}`}>
      {/* Slides */}
      {validPartners.map((partner, index) => {
        const isActive = index === currentIndex;
        const isClickable = !!partner.link || !!onPartnerClick;

        return (
          <div
            key={index}
            onClick={(e) => handlePartnerClick(e, partner)}
            className={`absolute inset-0 w-full h-full flex items-center justify-center transition-all duration-700 ease-in-out cursor-pointer ${
              isActive 
                ? 'opacity-100 scale-100 z-10' 
                : 'opacity-0 scale-95 z-0 pointer-events-none'
            } ${isClickable ? 'hover:scale-[1.01]' : ''}`}
          >
            {/* Imagem de Fundo (Blur para enquadramento premium) */}
            <div 
              className="absolute inset-0 bg-cover bg-center blur-md opacity-25 scale-110 pointer-events-none"
              style={{ backgroundImage: `url(${partner.imageUrl})` }}
            />

            {/* Imagem Principal Centralizada */}
            <img
              src={partner.imageUrl}
              alt={`Patrocinador ${index + 1}`}
              className={`relative z-10 transition-transform duration-500 group-hover:scale-105 rounded-lg ${
                layout === 'portrait'
                  ? 'w-full h-full object-cover p-0'
                  : 'max-w-full max-h-full object-contain p-2'
              }`}
            />

            {/* Overlay com Link Indicador se houver link e estiver ativo */}
            {isActive && (partner.link || onPartnerClick) && (
              <div className="absolute top-2 right-2 z-20 bg-slate-900/60 backdrop-blur-xs text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <ExternalLink size={12} className="text-white" />
              </div>
            )}
          </div>
        );
      })}

      {/* Indicadores de bolinha (dots) se houver mais de um parceiro */}
      {validPartners.length > 1 && (
        <div className="absolute bottom-2 left-0 right-0 z-20 flex justify-center gap-1.5 pointer-events-none">
          {validPartners.map((_, index) => (
            <span
              key={index}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-primary w-3' 
                  : 'bg-slate-300 opacity-60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
