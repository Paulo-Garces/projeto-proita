/**
 * AdCard — componente único usado na busca (Search.jsx) e no Dashboard.
 */

import { useState } from 'react';
import { Star, Phone, Share2, CheckCircle, Edit2, Trash2, UserCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { getProfileDisplayName } from '../utils/profileDisplayName';

// ─── SVGs Diretos (Blindados contra erro de versão de biblioteca) ──────────────
const INSTAGRAM_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>;
const FB_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>;
const YT_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>;
const TIKTOK_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" /></svg>;
const WEB_SVG = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>;
const WA_SVG = <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 shrink-0"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>;

const formatPhone = (phone) => {
  if (!phone) return null;
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
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

export default function AdCard({ professional, showEdit = false, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);

  const displayName = professional.name || getProfileDisplayName(professional) || 'Profissional';
  const phone = professional.servicePhone || professional.phone;
  const location = professional.serviceBairro || professional.location || 'Itapipoca';
  const avatar = professional.avatar || professional.avatarUrl;

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

  const openWhatsApp = async (e) => {
    e.preventDefault();
    if (phone) {
      try {
        await fetch(`${API_URL}/api/ads/${professional.id}/click`, { method: 'POST' });
      } catch (err) {
        console.error(err);
      }
      window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=Olá! Vi seu perfil no proITA.`, '_blank');
    }
  };

  const handleProfileClick = () => {
    if (!professional.id) return;
    fetch(`${API_URL}/api/ads/${professional.id}/view`, { method: 'POST' }).catch(err => console.error(err));
  };

  const callPhone = (e) => {
    e.preventDefault();
    if (phone) window.location.href = `tel:${phone.replace(/\D/g, '')}`;
  };

  const share = async (e) => {
    e.preventDefault();
    const url = `${window.location.origin}/profile/${professional.id}`;

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
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden group relative">
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-cyan-400 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

      <div className="flex flex-row p-4 gap-4">
        {/* COLUNA ESQUERDA - w-28 para caber os ícones */}
        <div className="flex flex-col items-center justify-start shrink-0 w-28 md:w-32">
          <Link to={`/profile/${professional.id}`} onClick={handleProfileClick} className="relative mb-3 cursor-pointer block hover:scale-105 transition-transform">
            {avatar ? (
              <img src={avatar} alt={displayName} className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-[3px] ring-primary/25 border-2 border-white shadow-md" />
            ) : (
              <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-2xl font-bold ring-[3px] ring-primary/25 border-2 border-white shadow-md select-none">
                {displayName?.[0]?.toUpperCase() || 'P'}
              </div>
            )}
            {professional.verified && (
              <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                <CheckCircle size={20} className="text-emerald-500 fill-emerald-50" />
              </span>
            )}
          </Link>

          <p className="text-[11px] md:text-xs font-bold text-primary text-center uppercase tracking-widest leading-tight mb-3">
            {professional.category || professional.atividadePrincipal || '—'}
          </p>

          <div className="flex items-center gap-2 justify-center flex-wrap">
            {socialLinks.map((link, idx) => {
              const url = link.url.startsWith('http') ? link.url : `https://${link.url}`;
              return (
                <a key={idx} href={url} target="_blank" rel="noopener noreferrer" title={link.platform} onClick={(e) => e.stopPropagation()}>
                  <SocialIconBadge platform={link.platform} />
                </a>
              );
            })}
          </div>
        </div>

        {/* COLUNA DIREITA */}
        <div className="flex-1 flex flex-col min-w-0">
          <div className="mb-2">
            <Link to={`/profile/${professional.id}`} onClick={handleProfileClick} className="block group-hover:text-primary transition-colors">
              <h3 className="font-bold text-slate-800 text-xl md:text-2xl leading-snug truncate">
                {displayName}
              </h3>
            </Link>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={14} className={i <= rating ? "text-amber-400 fill-amber-400" : "text-slate-200 fill-slate-200"} />
              ))}
              <span className="text-sm font-bold text-slate-700 ml-1">{rating > 0 ? rating.toFixed(1) : 'Novo'}</span>
              {reviewCount > 0 && <span className="text-xs text-slate-400 ml-1">({reviewCount})</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1 text-[15px] font-medium text-slate-600 mb-3">
            {phone && <span className="truncate">{formatPhone(phone)}</span>}
            <span className="truncate text-slate-500">{location}</span>
          </div>

          <div className="mb-4">
            <Link
              to={`/profile/${professional.id}`}
              onClick={handleProfileClick}
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:text-primary-hover bg-primary/10 hover:bg-primary/20 px-4 py-2 rounded-full transition-colors"
            >
              <UserCircle2 size={18} /> Ver Perfil
            </Link>
          </div>

          <div className="flex items-center gap-2 mt-auto">
            {showEdit ? (
              <div className="flex w-full gap-2">
                <button onClick={() => onEdit?.(professional)} className="flex-1 flex justify-center items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-full font-medium transition-colors">
                  <Edit2 size={16} /> Editar
                </button>
                <button onClick={() => onDelete?.(professional.id)} className="flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2.5 rounded-full font-medium transition-colors">
                  <Trash2 size={16} /> Excluir
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-start gap-4 md:gap-6 w-full">
                {phone && (
                  <div className="flex flex-col items-center gap-1.5">
                    <button onClick={callPhone} title="Ligar" className="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors shadow-sm">
                      <Phone size={22} />
                    </button>
                    <span className="text-[11px] font-semibold text-slate-600">Ligar</span>
                  </div>
                )}

                {phone && (
                  <div className="flex flex-col items-center gap-1.5">
                    <button onClick={openWhatsApp} title="WhatsApp" className="w-12 h-12 flex items-center justify-center bg-[#25D366] text-white hover:bg-[#1fb355] active:scale-95 rounded-full transition-all shadow-md shadow-green-200">
                      {WA_SVG}
                    </button>
                    <span className="text-[11px] font-semibold text-slate-600">WhatsApp</span>
                  </div>
                )}

                <div className="flex flex-col items-center gap-1.5">
                  <button onClick={share} title={copied ? 'Copiado!' : 'Compartilhar link'} className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-600 hover:bg-slate-100 rounded-full transition-colors shadow-sm">
                    {copied ? <CheckCircle size={22} className="text-emerald-500" /> : <Share2 size={22} />}
                  </button>
                  <span className="text-[11px] font-semibold text-slate-600">
                    {copied ? 'Copiado!' : 'Compartilhar'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}