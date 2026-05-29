/**
 * AdCard — componente único usado na busca (Search.jsx) e no Dashboard.
 */

import { useState, useEffect, useContext } from 'react';
import { Star, Phone, Share2, CheckCircle, Edit2, Trash2, IdCard, Bookmark, Plus, MapPin, Award, ShieldCheck, Eye, MessageCircle, TrendingUp } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { getProfileDisplayName } from '../utils/profileDisplayName';
import { AuthContext } from '../context/AuthContext';
import { getReputationBadge } from '../utils/reputationBadge';
import SponsorSlider from './SponsorSlider';

// ─── SVGs Diretos (Blindados contra erro de versão de biblioteca) ──────────────
const INSTAGRAM_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>;
const FB_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
const YT_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
const TIKTOK_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>;
const WEB_SVG = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
const WA_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>;

const formatPhone = (phone) => {
  if (!phone) return null;
  
  // 1. Strip +55 or 55 prefix if present and the remaining length is a valid phone
  let cleaned = phone.trim();
  if (cleaned.startsWith('+55')) {
    cleaned = cleaned.slice(3).trim();
  } else if (cleaned.startsWith('55') && cleaned.length > 10) {
    cleaned = cleaned.slice(2).trim();
  }

  // 2. Extract digits only
  const d = cleaned.replace(/\D/g, '');

  // 3. Format to Brazilian standard (11 digits for cell, 10 digits for landline)
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  
  return phone; // fallback to original if format is unexpected
};

// Componente auxiliar blindado
const SocialIconBadge = ({ platform }) => {
  switch (platform) {
    case 'instagram': return <div className="p-2 bg-pink-50 text-pink-500 hover:bg-pink-100 rounded-full transition-colors">{INSTAGRAM_SVG}</div>;
    case 'facebook': return <div className="p-2 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors">{FB_SVG}</div>;
    case 'youtube': return <div className="p-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-colors">{YT_SVG}</div>;
    case 'tiktok': return <div className="p-2 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-full transition-colors">{TIKTOK_SVG}</div>;
    default: return <div className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors">{WEB_SVG}</div>;
  }
};

export default function AdCard({ professional, showEdit = false, onEdit, onDelete, style }) {
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(professional.isFavorited || false);

  useEffect(() => {
    setIsFavorited(professional.isFavorited || false);
  }, [professional.isFavorited]);

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

  const displayName = getProfileDisplayName(professional) || professional.name || 'Profissional';
  const ownerName = professional.user 
    ? [professional.user.nome, professional.user.sobrenome].filter(Boolean).join(' ').trim()
    : '';
  const phone = 
    (professional.telefoneComercial != null && String(professional.telefoneComercial).trim() !== '')
      ? String(professional.telefoneComercial).trim()
      : (professional.servicePhone != null && String(professional.servicePhone).trim() !== '')
        ? String(professional.servicePhone).trim()
        : (professional.whatsapp != null && String(professional.whatsapp).trim() !== '')
          ? String(professional.whatsapp).trim()
          : (professional.phone != null && String(professional.phone).trim() !== '')
            ? String(professional.phone).trim()
            : (professional.user?.telefone != null && String(professional.user.telefone).trim() !== '')
              ? String(professional.user.telefone).trim()
              : null;
  const location = professional.serviceBairro || professional.location || 'Itapipoca';
  const avatar = professional.avatar || professional.avatarUrl;
  const badge = getReputationBadge(professional);
  const getMapsLink = () => {
    const address = professional.enderecoComercial || professional.endereco || location;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${address}, Itapipoca, CE`)}`;
  };

  const rating = professional.rating || 0;
  const reviewCount = professional.reviewCount || 0;

  const normalizeSocialEntry = (s) => {
    if (!s || typeof s !== 'object') return null;
    const platform = (s.platform ?? s.network ?? '').toString().toLowerCase().trim();
    const url = (s.url ?? s.link ?? '').toString().trim();
    if (!platform || !url) return null;
    return { platform, url };
  };

  const socialLinks = Array.isArray(professional.socialLinks)
    ? professional.socialLinks.map(normalizeSocialEntry).filter(Boolean)
    : [];

  const displayedSocials = socialLinks.slice(0, 3);
  const placeholdersCount = Math.max(0, 3 - displayedSocials.length);

  const openWhatsApp = async (e) => {
    e.preventDefault();
    if (phone) {
      try {
        await fetch(`${API_URL}/api/ads/${professional.id}/track`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'whatsapp' })
        });
      } catch (err) {
        console.error(err);
      }
      const cleanPhone = phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      window.open(`https://wa.me/${finalPhone}?text=Olá! Vi seu perfil no proITA.`, '_blank');
    }
  };

  const handleProfileClick = () => {
    if (!professional.id) return;
    fetch(`${API_URL}/api/ads/${professional.id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'view' })
    }).catch(err => console.error(err));
  };

  const callPhone = (e) => {
    e.preventDefault();
    if (phone) {
      fetch(`${API_URL}/api/ads/${professional.id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'phone' })
      }).catch(err => console.error(err));
      window.location.href = `tel:${phone.replace(/\D/g, '')}`;
    }
  };

  const share = async (e) => {
    e.preventDefault();
    const url = `${window.location.origin}/profile/${professional.id}`;

    fetch(`${API_URL}/api/ads/${professional.id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share' })
    }).catch(err => console.error(err));

    if (navigator.share) {
      try {
        await navigator.share({ title: `Perfil de ${displayName} no proITA`, url: url });
      } catch (err) {
        console.log('Compartilhamento cancelado ou falhou');
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden group relative animate-card-fade" style={style}>
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-cyan-400 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

      {/* Grid Layout: 2 colunas, 3 linhas */}
      <div className="grid grid-cols-[100px_1fr] md:grid-cols-[130px_1fr] gap-x-4 md:gap-x-6 gap-y-5 p-5 items-center">
        
        {/* LINHA 1 ESQUERDA: Foto de perfil centralizada na coluna */}
        <div className="flex justify-center items-center">
          <Link 
            to={`/profile/${professional.id}`} 
            onClick={handleProfileClick} 
            className="relative cursor-pointer inline-block hover:scale-105 transition-transform rounded-full"
            style={{ width: 'fit-content', height: 'fit-content' }}
          >
            {avatar ? (
              <img src={avatar} alt={displayName} className="w-24 h-24 md:w-28 md:h-28 rounded-full object-cover ring-[3px] ring-primary/25 border-2 border-white shadow-md" />
            ) : (
              <div className="w-24 h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-3xl font-bold ring-[3px] ring-primary/25 border-2 border-white shadow-md select-none">
                {displayName?.[0]?.toUpperCase() || 'P'}
              </div>
            )}
            {professional.verified && (
              <span className="absolute bottom-0 right-0 translate-x-[2px] translate-y-[2px] bg-white rounded-full p-0.5 shadow-md z-10 flex items-center justify-center">
                <CheckCircle size={22} className="text-blue-500 fill-blue-50" />
              </span>
            )}
          </Link>
        </div>

        {/* LINHA 1 DIREITA: Dados/Textos (Centro) + Banner de Apoio (Direita) */}
        <div className="flex items-center justify-between gap-4 w-full min-w-0">
          <div className="flex flex-col gap-1 min-w-0 justify-center items-start text-left flex-1">
            <div className="flex justify-between items-start w-full min-w-0 gap-1.5">
              <Link to={`/profile/${professional.id}`} onClick={handleProfileClick} className="block group-hover:text-primary transition-colors truncate">
                <h3 className="font-bold text-slate-800 text-lg md:text-xl leading-snug truncate">
                  {displayName}
                </h3>
              </Link>
              {badge ? (
                <span title={badge.title} className={`${badge.color} shrink-0`} onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
                  {badge.icon === 'ShieldCheck' ? <ShieldCheck size={20} className="stroke-[2.5]" /> : <Award size={20} className="stroke-[2.5]" />}
                </span>
              ) : (
                <span 
                  title="Selo de Verificação: Complete seu perfil e receba avaliações para ativar esta conquista." 
                  className="text-gray-400 grayscale opacity-50 shrink-0 cursor-help" 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                >
                  <Award size={20} className="stroke-[2.5]" />
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-1 flex-wrap w-full">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(i => (
                  <Star key={i} size={14} className={i <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
                ))}
              </div>
              <span className="text-xs font-bold text-slate-700 ml-1">{rating > 0 ? rating.toFixed(1) : 'Novo'}</span>
              {reviewCount > 0 && <span className="text-[11px] text-slate-400 ml-1">({reviewCount})</span>}
            </div>

            <div className="text-slate-600 text-xs md:text-sm font-medium flex flex-col gap-1 mt-1 items-start w-full">
              {phone && <span className="truncate">{formatPhone(phone)}</span>}
              <div className="flex items-center gap-2 flex-wrap text-slate-500 w-full">
                <span className="truncate flex items-center gap-1">
                  <MapPin size={14} className="text-slate-400 shrink-0" /> {location}
                </span>
              </div>
            </div>
          </div>

          {/* Banner de Apoio (Patrocinador) posicionado no lado direito em formato retrato (vertical) */}
          {!showEdit && professional.partners && (
            (() => {
              let list = [];
              try {
                list = typeof professional.partners === 'string' 
                  ? JSON.parse(professional.partners) 
                  : (professional.partners || []);
              } catch {
                list = professional.partners || [];
              }
              const valid = list.filter(p => p && p.imageUrl);
              if (valid.length === 0) return null;

              return (
                <div className="flex flex-col items-center gap-1 shrink-0 self-center">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">Apoio</span>
                  <SponsorSlider partners={valid} layout="portrait" />
                </div>
              );
            })()
          )}
        </div>

        {/* LINHA 2 ESQUERDA: Título da profissão, centralizado, negrito, azul principal */}
        <div className="flex justify-center items-center text-center px-1">
          <p className="text-xs md:text-sm font-bold text-primary uppercase tracking-wider leading-tight line-clamp-2">
            {professional.category || professional.atividadePrincipal || '—'}
          </p>
        </div>

        {/* LINHA 2 DIREITA: Botão 'Ver Perfil' e botão de Favoritar */}
        <div className="flex items-center gap-3 justify-center">
          <Link
            to={`/profile/${professional.id}`}
            onClick={handleProfileClick}
            className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full transition-colors"
          >
            <IdCard size={18} /> Ver Perfil
          </Link>
          
          {!showEdit && (
            <button
              onClick={handleToggleFavorite}
              className="group/fav p-2.5 rounded-full border border-slate-100 hover:border-primary/20 bg-slate-50/50 hover:bg-primary/5 transition-all duration-200 active:scale-90 shadow-sm"
              title={isFavorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
            >
              <Bookmark
                size={18}
                className={`transition-colors duration-200 ${
                  isFavorited
                    ? 'fill-primary text-primary'
                    : 'text-slate-400 group-hover/fav:text-primary'
                }`}
              />
            </button>
          )}
        </div>

        {/* LINHA 3 ESQUERDA: Redes sociais (sempre 3 espaços) + Selo de Titularidade */}
        <div className="flex flex-col items-center gap-1.5 justify-center">
          <div className="flex items-center gap-1.5 justify-center">
            {displayedSocials.map((link, idx) => {
              const url = link.url.startsWith('http') ? link.url : `https://${link.url}`;
              return (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" title={link.platform} onClick={(e) => e.stopPropagation()} className="hover:scale-110 transition-transform">
                  <SocialIconBadge platform={link.platform} />
                </a>
              );
            })}
            {[...Array(placeholdersCount)].map((_, idx) => (
              <div key={`placeholder-${idx}`} className="w-9 h-9 md:w-10 md:h-10 rounded-full border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center text-slate-300" title="Rede não cadastrada">
                <Plus size={12} className="stroke-[2.5]" />
              </div>
            ))}
          </div>
          {ownerName && (
            <span className="text-[10px] md:text-xs text-slate-500 opacity-70 font-semibold truncate max-w-full select-none mt-0.5">
              Por {ownerName}
            </span>
          )}
        </div>

        {/* LINHA 3 DIREITA: Botões de Ação centralizados (Ligar, WhatsApp, Compartilhar) ou Editar/Excluir */}
        <div className="flex items-center justify-center w-full">
          {showEdit ? (
            <div className="flex w-full gap-2 items-center justify-center max-w-xs">
              <button onClick={() => onEdit?.(professional)} className="flex-1 flex justify-center items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 px-3 rounded-full font-medium transition-colors text-xs md:text-sm">
                <Edit2 size={16} /> Editar
              </button>
              <button onClick={() => onDelete?.(professional.id)} className="flex items-center justify-center gap-1.5 bg-red-50 hover:bg-red-100 text-red-500 px-3 py-2 rounded-full font-medium transition-colors text-xs md:text-sm">
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-3 md:gap-5 w-full">
              {phone && (
                <div className="flex flex-col items-center gap-1">
                  <button onClick={callPhone} title="Ligar" className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors shadow-sm active:scale-95">
                    <Phone size={18} />
                  </button>
                  <span className="text-[10px] font-semibold text-slate-500">Ligar</span>
                </div>
              )}

              {phone && (
                <div className="flex flex-col items-center gap-1">
                  <button onClick={openWhatsApp} title="WhatsApp" className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-[#25D366] text-white hover:bg-[#1fb355] rounded-full transition-all shadow-md shadow-green-200 hover:scale-105 active:scale-95">
                    {WA_SVG}
                  </button>
                  <span className="text-[10px] font-bold text-slate-600">WhatsApp</span>
                </div>
              )}

              <div className="flex flex-col items-center gap-1">
                <button onClick={share} title={copied ? 'Copiado!' : 'Compartilhar link'} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-full transition-colors shadow-sm active:scale-95">
                  {copied ? <CheckCircle size={18} className="text-emerald-500" /> : <Share2 size={18} />}
                </button>
                <span className="text-[10px] font-semibold text-slate-500">
                  {copied ? 'Copiado!' : 'Compartilhar'}
                </span>
              </div>
            </div>
          )}
        </div>

      </div>



      {showEdit && (
        <div className="border-t border-slate-100 bg-slate-50/50 p-5 rounded-b-2xl animate-in fade-in duration-300">
          <h4 className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 text-center md:text-left">Funil de Conversão & Estatísticas</h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-semibold text-slate-600">
            <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm" title="Exibições nas buscas de clientes">
              <TrendingUp size={16} className="text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-normal leading-none mb-0.5">Exibições</span>
                <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.impressions ?? 0}</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm" title="Visitas completas ao seu perfil profissional">
              <Eye size={16} className="text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-normal leading-none mb-0.5">Visitas</span>
                <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.profileViews ?? 0}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm" title="Clientes que favoritaram seu perfil">
              <Bookmark size={16} className="text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-normal leading-none mb-0.5">Favoritos</span>
                <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.favoritesCount ?? 0}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm" title="Cliques para iniciar conversa no WhatsApp">
              <MessageCircle size={16} className="text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-normal leading-none mb-0.5">WhatsApp</span>
                <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.whatsappClicks ?? 0}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm" title="Cliques para efetuar ligação direta">
              <Phone size={16} className="text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-normal leading-none mb-0.5">Ligações</span>
                <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.phoneClicks ?? 0}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-2.5 rounded-xl border border-slate-100 shadow-sm" title="Número de vezes que seu link foi compartilhado">
              <Share2 size={16} className="text-slate-400 shrink-0" />
              <div className="min-w-0">
                <span className="text-[10px] text-slate-400 block font-normal leading-none mb-0.5">Partilhas</span>
                <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.shares ?? 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}