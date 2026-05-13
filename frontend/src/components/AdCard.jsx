/**
 * AdCard — componente único usado na busca (Search.jsx) e no Dashboard.
 *
 * Props:
 * professional  — objeto com dados do anúncio
 * showEdit      — boolean: exibe botões Editar/Excluir (modo Dashboard)
 * onEdit        — fn(ad) ao clicar em Editar
 * onDelete      — fn(id) ao clicar em Excluir
 */

import { useState } from 'react';
import { Star, MapPin, Phone, Share2, CheckCircle, Edit2, Trash2, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_URL } from '../config';
import { getProfileDisplayName } from '../utils/profileDisplayName';

// ─── SVG das plataformas ──────────────────────────────────────────────────────
const INSTAGRAM_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
  </svg>
);

const WA_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

// ─── Formatação de telefone ───────────────────────────────────────────────────
const formatPhone = (phone) => {
  if (!phone) return null;
  const d = phone.replace(/\D/g, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return phone;
};

// ─── Componente ──────────────────────────────────────────────────────────────
export default function AdCard({ professional, showEdit = false, onEdit, onDelete }) {
  const [copied, setCopied] = useState(false);

  const displayName =
    professional.name || getProfileDisplayName(professional) || 'Profissional';

  const phone = professional.servicePhone || professional.phone;
  const location = professional.serviceBairro || professional.location || 'Itapipoca';
  const description = professional.shortDescription
    || professional.fullDescription?.substring(0, 120)
    || professional.descricaoTrabalho?.substring(0, 120)
    || '';
  const avatar = professional.avatar || professional.avatarUrl;

  const socialLinks = Array.isArray(professional.socialLinks)
    ? professional.socialLinks.filter(s => s?.platform && s?.url)
    : [];

  const instagramLink = socialLinks.find(s => s.platform?.toLowerCase() === 'instagram');

  // ── Ações ────────────────────────────────────────────────────
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
    fetch(`${API_URL}/api/ads/${professional.id}/view`, { method: 'POST' }).catch(err => console.error(err));
  };

  const callPhone = (e) => {
    e.preventDefault();
    if (phone) window.location.href = `tel:${phone.replace(/\D/g, '')}`;
  };

  const share = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(`${window.location.origin}/profile/${professional.id}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const openInstagram = (e) => {
    e.preventDefault();
    if (instagramLink) {
      const url = instagramLink.url.startsWith('http') ? instagramLink.url : `https://${instagramLink.url}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 overflow-hidden group relative">

      {/* Barra de destaque no hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-cyan-400 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

      {/* AQUI FOI A GRANDE MUDANÇA: 'flex-row' fixo para manter as colunas no mobile */}
      <div className="flex flex-row p-4 gap-4">

        {/* ═══════════════════════════════════════════════════
            COLUNA ESQUERDA — Perfil (Tamanho ajustado e centralizado)
        ════════════════════════════════════════════════════ */}
        <div className="flex flex-col items-center justify-start shrink-0 w-20 md:w-24">

          {/* Foto (Aumentada para o celular) */}
          <div className="relative mb-3">
            {avatar ? (
              <img
                src={avatar}
                alt={displayName}
                className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover ring-[3px] ring-primary/25 border-2 border-white shadow-md"
              />
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
          </div>

          {/* Título / Ocupação */}
          <p className="text-[11px] md:text-xs font-bold text-primary text-center uppercase tracking-widest leading-tight mb-3">
            {professional.category || professional.atividadePrincipal || '—'}
          </p>

          {/* Ícones de ação secundária */}
          <div className="flex items-center gap-2 justify-center flex-wrap">
            {instagramLink && (
              <button onClick={openInstagram} title="Instagram" className="p-2 bg-pink-50 text-pink-500 hover:bg-pink-100 rounded-full transition-colors">
                {INSTAGRAM_SVG}
              </button>
            )}
            <Link
              to={`/profile/${professional.id}`}
              onClick={(e) => { e.stopPropagation(); handleProfileClick(); }}
              title="Perfil Completo"
              className="p-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors"
            >
              <Info size={16} />
            </Link>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            COLUNA DIREITA — Informações e Ações
        ════════════════════════════════════════════════════ */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* Nome e Avaliação */}
          <div className="mb-2">
            <h3 className="font-bold text-slate-800 text-lg md:text-xl leading-snug truncate group-hover:text-primary transition-colors">
              {displayName}
            </h3>
            <div className="flex items-center gap-1 mt-1">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={14} className="text-amber-400 fill-amber-400" />
              ))}
              <span className="text-sm font-bold text-slate-700 ml-1">5.0</span>
            </div>
          </div>

          {/* Localização e Telefone */}
          <div className="flex flex-col gap-1 text-sm text-slate-500 mb-2">
            <span className="flex items-center gap-1.5 truncate">
              <MapPin size={14} className="shrink-0" /> {location}
            </span>
            {phone && (
              <span className="flex items-center gap-1.5 font-medium truncate">
                <Phone size={14} className="shrink-0" /> {formatPhone(phone)}
              </span>
            )}
          </div>

          {/* Descrição */}
          {description && (
            <p className="text-xs md:text-sm text-slate-500 leading-relaxed line-clamp-2 mb-3 bg-slate-50 p-2 rounded-lg">
              {description}
            </p>
          )}

          {/* ── Botões de ação ── */}
          <div className="flex items-center gap-2 mt-auto">
            {showEdit ? (
              /* Modo Dashboard */
              <>
                <button onClick={() => onEdit?.(professional)} className="flex-1 flex justify-center items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 py-2.5 rounded-full font-medium transition-colors">
                  <Edit2 size={16} /> Editar
                </button>
                <button onClick={() => onDelete?.(professional.id)} className="flex items-center gap-1 bg-red-50 hover:bg-red-100 text-red-500 px-4 py-2.5 rounded-full font-medium transition-colors">
                  <Trash2 size={16} /> Excluir
                </button>
              </>
            ) : (
              /* Modo Público: Botões Redondos */
              <>
                {phone && (
                  <button onClick={callPhone} title="Ligar" className="flex-1 flex justify-center items-center bg-blue-50 text-blue-600 hover:bg-blue-100 py-2.5 rounded-full transition-colors shadow-sm">
                    <Phone size={20} />
                  </button>
                )}

                {phone && (
                  <button onClick={openWhatsApp} className="flex-[2] flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1fb355] active:scale-95 text-white py-2.5 rounded-full transition-all shadow-md shadow-green-200">
                    {WA_SVG} <span className="font-bold">WhatsApp</span>
                  </button>
                )}

                <button onClick={share} title={copied ? 'Copiado!' : 'Compartilhar link'} className="flex-1 flex justify-center items-center bg-slate-50 text-slate-600 hover:bg-slate-100 py-2.5 rounded-full transition-colors shadow-sm">
                  {copied ? <CheckCircle size={20} className="text-emerald-500" /> : <Share2 size={20} />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}