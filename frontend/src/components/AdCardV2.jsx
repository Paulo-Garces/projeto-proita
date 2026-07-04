import { useState, useEffect, useContext } from 'react';
import { Star, Phone, Share2, CheckCircle, Bookmark, MapPin, Map, PhoneCall, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { getProfileDisplayName } from '../utils/profileDisplayName';
import { AuthContext } from '../context/AuthContext';

// ─── SVGs Diretos (Blindados contra erro de versão de biblioteca) ──────────────
const INSTAGRAM_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>;
const FB_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
const YT_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
const TIKTOK_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>;
const WEB_SVG = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
const WA_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 sm:w-5 sm:h-5 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>;

const formatPhone = (phone) => {
  if (!phone) return null;
  
  let cleaned = phone.trim();
  if (cleaned.startsWith('+55')) {
    cleaned = cleaned.slice(3).trim();
  } else if (cleaned.startsWith('55') && cleaned.length > 10) {
    cleaned = cleaned.slice(2).trim();
  }

  const d = cleaned.replace(/\D/g, '');

  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  
  return phone;
};

const SocialIcon = ({ platform }) => {
  const icons = {
    instagram: INSTAGRAM_SVG,
    facebook: FB_SVG,
    youtube: YT_SVG,
    tiktok: TIKTOK_SVG,
  };
  return icons[platform?.toLowerCase()] || WEB_SVG;
};

const platformColors = {
  instagram: 'bg-pink-50 text-pink-600 hover:bg-pink-100',
  tiktok: 'bg-slate-900 text-white hover:bg-slate-700',
  youtube: 'bg-red-50 text-red-600 hover:bg-red-100',
  facebook: 'bg-blue-50 text-blue-700 hover:bg-blue-100',
  whatsapp: 'bg-green-50 text-green-600 hover:bg-green-100',
};

export default function AdCardV2({ professional, showEdit = false, onEdit, onDelete, style, disableEdit = false, isDashboard = false }) {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(professional?.isFavorited || false);

  useEffect(() => {
    setIsFavorited(professional?.isFavorited || false);
  }, [professional?.isFavorited]);

  const handleToggleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert("Para favoritar anúncios, você precisa estar conectado à sua conta.");
      navigate('/auth?mode=login');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/ads/favorites/toggle`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ profileId: professional.id })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setIsFavorited(data.isFavorited);
      } else {
        alert(data.message || "Erro ao atualizar favoritos.");
      }
    } catch (err) {
      console.error("Erro ao favoritar:", err);
      alert("Erro ao se conectar com o servidor.");
    }
  };

  const handleWhatsApp = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (phone) {
      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=Olá! Vi seu perfil no proITA.`, '_blank');
    }
  };

  const handleShare = (e) => {
    e.preventDefault();
    e.stopPropagation();
    navigator.clipboard.writeText(`${window.location.origin}/profile/${professional.slug || professional.id}`);
    setCopied(true);
    alert('Link do perfil copiado para a área de transferência!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSocialClick = (e, url) => {
    e.preventDefault();
    e.stopPropagation();
    const fullUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(fullUrl, '_blank', 'noopener,noreferrer');
  };

  const displayName = getProfileDisplayName(professional) || professional?.name || 'Profissional';
  const ownerName = professional?.user 
    ? [professional.user.nome, professional.user.sobrenome].filter(Boolean).join(' ').trim()
    : '';

  const phone = 
    (professional?.telefoneComercial != null && String(professional.telefoneComercial).trim() !== '')
      ? String(professional.telefoneComercial).trim()
      : (professional?.servicePhone != null && String(professional.servicePhone).trim() !== '')
        ? String(professional.servicePhone).trim()
        : (professional?.whatsapp != null && String(professional.whatsapp).trim() !== '')
          ? String(professional.whatsapp).trim()
          : (professional?.phone != null && String(professional.phone).trim() !== '')
            ? String(professional.phone).trim()
            : (professional?.user?.telefone != null && String(professional.user.telefone).trim() !== '')
              ? String(professional.user.telefone).trim()
              : null;

  const location = professional?.serviceBairro || professional?.location || 'Itapipoca';
  const avatar = professional?.avatar || professional?.avatarUrl || 'https://placehold.co/150x150?text=Foto';
  
  const getMapsLink = () => {
    const address = professional?.enderecoComercial || professional?.endereco || location;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Itapipoca, CE`)}`;
  };

  const reviewCount = professional?.reviewCount || 0;
  const planStatus = professional?.user?.planStatus || professional?.planStatus || 'DEGUSTACAO';
  const planType = professional?.user?.planType || professional?.planType || '';
  const hasSponsorRights = planStatus === 'DEGUSTACAO' || planType === 'TESTE' || planType?.includes('PATROCINADOR');

  // Redes sociais
  let socialLinks = [];
  if (Array.isArray(professional?.socialLinks)) {
    socialLinks = professional.socialLinks.filter(s => s?.platform && s?.url);
  }

  // Patrocinadores/Apoio
  let partnersList = [];
  try {
    partnersList = typeof professional?.partners === 'string'
      ? JSON.parse(professional.partners)
      : (professional?.partners || []);
  } catch {
    partnersList = professional?.partners || [];
  }
  let validPartners = partnersList.filter(p => p && p.imageUrl);
  if (validPartners.length === 0 && professional?.fotoAnuncioUrl) {
    validPartners = [{ imageUrl: professional.fotoAnuncioUrl }];
  }

  return (
    <div 
      style={style}
      className="grid grid-cols-[130px_1fr] sm:grid-cols-[150px_1fr] gap-4 p-4 border border-slate-200 rounded-xl bg-white relative hover:shadow-md transition-shadow duration-200 min-h-[220px]"
    >
      {/* Coluna Esquerda: Bloco Verde e Laranja */}
      <div className="flex flex-col justify-between items-center h-full text-center border-r border-slate-100 pr-2">
        {/* Topo (Verde no wireframe original, focado no avatar e atividade) */}
        <div className="flex flex-col items-center w-full">
          <div className="relative inline-block">
            <img
              src={avatar}
              alt={displayName}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border border-slate-150 shadow-xs"
            />
            {professional?.verified && (
              <div className="absolute bottom-0 right-0 bg-white rounded-full p-0.5 shadow-xs flex items-center justify-center">
                <CheckCircle size={16} className="text-blue-500 fill-blue-50 shrink-0" />
              </div>
            )}
          </div>
          
          <p className="text-[11px] sm:text-xs font-black text-primary uppercase tracking-wider leading-tight mt-2.5 max-w-[120px] line-clamp-2">
            {professional?.category || professional?.atividadePrincipal || 'Profissional'}
          </p>
        </div>

        {/* Base (Laranja no wireframe, focado em redes sociais e assinatura 'Por') */}
        <div className="flex flex-col items-center gap-1.5 w-full mt-3">
          {socialLinks.length > 0 && (
            <div className="flex justify-center gap-1 flex-wrap w-full">
              {socialLinks.slice(0, 3).map((s, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleSocialClick(e, s.url)}
                  className={`p-1 rounded-full transition-colors ${platformColors[s.platform?.toLowerCase()] || 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
                  title={s.platform}
                >
                  <SocialIcon platform={s.platform} />
                </button>
              ))}
            </div>
          )}
          {ownerName && (
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-medium truncate w-full max-w-[110px] sm:max-w-[130px]">
              Por {ownerName}
            </p>
          )}
        </div>
      </div>

      {/* Coluna Direita: Bloco Cinza, Rosa e Amarelo */}
      <div className="flex flex-col h-full gap-2.5 min-w-0">
        
        {/* Linha 1: Cinza Escuro + Cinza Claro (Lado esquerdo: informações básicas, Lado direito: Banner Apoio) */}
        <div className="flex justify-between items-start gap-2 min-w-0">
          {/* Lado esquerdo: Nome, Estrelas, Telefone, Local */}
          <div className="flex-1 min-w-0 flex flex-col gap-2 sm:gap-2.5">
            <h3 className="text-base sm:text-lg font-black text-slate-800 leading-tight truncate" title={displayName}>
              {displayName}
            </h3>
            
            {/* Avaliação */}
            <div className="flex items-center gap-1">
              <div className="flex items-center text-amber-400 shrink-0">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={11} className="fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="text-[11px] sm:text-xs font-bold text-slate-700 leading-none">5.0</span>
              {reviewCount > 0 && (
                <span className="text-[10px] text-slate-400 leading-none">({reviewCount})</span>
              )}
            </div>

            {/* Telefone */}
            {phone && (
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-medium leading-none">
                <Phone size={12} className="text-slate-400 shrink-0" />
                <span className="truncate">{formatPhone(phone)}</span>
              </div>
            )}

            {/* Local/Bairro */}
            <div className="flex items-center gap-1.5 text-[11px] sm:text-xs text-slate-500 font-medium leading-none">
              <MapPin size={12} className="text-slate-400 shrink-0" />
              <span className="truncate">{location}</span>
            </div>
          </div>

          {/* Lado direito: Banner do Patrocinador (Apoio) fixo 3/4 */}
          <div className="shrink-0 aspect-[3/4] w-20 rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-1 relative overflow-hidden shadow-2xs select-none">
            {hasSponsorRights && validPartners.length > 0 ? (
              <>
                <div 
                  className="absolute inset-0 bg-cover bg-center blur-[2px] opacity-15 scale-110 pointer-events-none" 
                  style={{ backgroundImage: `url(${validPartners[0].imageUrl})` }} 
                />
                <img 
                  src={validPartners[0].imageUrl} 
                  alt={validPartners[0].name || "Patrocinador"} 
                  className="relative z-10 w-full h-full object-contain"
                />
                <span className="absolute bottom-0 left-0 right-0 text-center bg-slate-900/60 backdrop-blur-[1px] text-white text-[8px] font-bold py-0.5 leading-none z-20">
                  APOIO
                </span>
              </>
            ) : (
              <div className="w-full h-full rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-1 select-none text-center">
                <span className="text-[10px] font-semibold text-slate-400 leading-tight">
                  Anuncie
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Linha 2: Rosa (Ver Perfil, Favorito, Mapa/Rota) */}
        <div className="flex items-center gap-2 mt-auto">
          {/* Botão Ver Perfil */}
          <Link
            to={`/profile/${professional?.slug || professional?.id}`}
            className="flex-1 flex items-center justify-center gap-1 py-2 px-3 bg-primary hover:bg-primary-hover text-white font-bold text-xs sm:text-sm rounded-lg transition-colors shadow-xs"
          >
            Ver Perfil
          </Link>
          
          {/* Favoritar */}
          <button
            onClick={handleToggleFavorite}
            className={`p-2 rounded-lg border transition-colors ${
              isFavorited 
                ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' 
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
            title={isFavorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
          >
            <Bookmark size={16} className={isFavorited ? "fill-red-500 text-red-500" : ""} />
          </button>

          {/* Rota/Mapa */}
          <a
            href={getMapsLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 rounded-lg border bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center"
            title="Ver rota no mapa"
          >
            <Map size={16} />
          </a>
        </div>

        {/* Linha 3: Amarelo (Ligar, WhatsApp, Compartilhar) */}
        <div className="flex md:w-full items-center justify-center md:justify-center gap-2 md:gap-4">
          {/* Botão Ligar */}
          {phone ? (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                window.open(`tel:${phone.replace(/\D/g, '')}`, '_self');
              }}
              className="flex-1 flex items-center justify-center py-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
              title="Ligar para profissional"
            >
              <Phone size={15} />
            </button>
          ) : (
            <div className="flex-1" />
          )}

          {/* Botão WhatsApp */}
          {phone ? (
            <button
              onClick={handleWhatsApp}
              className="flex-[2] flex items-center justify-center gap-1.5 py-2 bg-green-500 hover:bg-green-600 text-white font-bold text-xs sm:text-sm rounded-lg transition-all shadow-md hover:scale-105 active:scale-95 scale-110 sm:scale-115"
              title="Conversar pelo WhatsApp"
            >
              {WA_SVG}
              <span>Conversar</span>
            </button>
          ) : (
            <div className="flex-[2]" />
          )}

          {/* Botão Compartilhar */}
          <button
            onClick={handleShare}
            className="flex-1 flex items-center justify-center py-2 bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors"
            title="Compartilhar perfil"
          >
            <Share2 size={15} />
          </button>
        </div>

      </div>
    </div>
  );
}
