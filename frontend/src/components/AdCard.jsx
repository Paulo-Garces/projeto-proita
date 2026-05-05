/**
 * AdCard — componente único usado tanto na busca (Search.jsx)
 * quanto na aba "Meus Anúncios" do Dashboard.
 *
 * Props:
 *   professional  — objeto com dados do anúncio (shape abaixo)
 *   showEdit      — boolean: exibe botões Editar/Excluir (modo Dashboard)
 *   onEdit        — fn(ad) chamada ao clicar em Editar
 *   onDelete      — fn(id) chamada ao clicar em Excluir
 */

import { Star, MapPin, Phone, Share2, ChevronRight, CheckCircle, Edit2, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';

// ─── SVGs das plataformas ────────────────────────────────────────
const PLATFORM_SVGS = {
  instagram: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  tiktok: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.29 6.29 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.27 8.27 0 004.84 1.56V6.82a4.85 4.85 0 01-1.07-.13z"/>
    </svg>
  ),
  youtube: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M23.495 6.205a3.007 3.007 0 00-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 00.527 6.205a31.247 31.247 0 00-.522 5.805 31.247 31.247 0 00.522 5.783 3.007 3.007 0 002.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 002.088-2.088 31.247 31.247 0 00.5-5.783 31.247 31.247 0 00-.5-5.805zM9.609 15.601V8.408l6.264 3.602z"/>
    </svg>
  ),
  facebook: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
  whatsapp: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-3.5 h-3.5">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
    </svg>
  ),
};

const PLATFORM_STYLES = {
  instagram: 'bg-gradient-to-br from-pink-50 to-purple-50 text-pink-600 hover:from-pink-100 hover:to-purple-100',
  tiktok:    'bg-slate-800 text-white hover:bg-slate-700',
  youtube:   'bg-red-50 text-red-600 hover:bg-red-100',
  facebook:  'bg-blue-50 text-blue-700 hover:bg-blue-100',
  whatsapp:  'bg-green-50 text-green-600 hover:bg-green-100',
};

const WA_SVG = (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
  </svg>
);

export default function AdCard({ professional, showEdit = false, onEdit, onDelete }) {
  const phone = professional.servicePhone || professional.phone;
  const location = professional.serviceBairro || professional.location || 'Itapipoca';
  const description = professional.shortDescription || professional.fullDescription?.substring(0, 90) || professional.descricaoTrabalho?.substring(0, 90) || '';

  // Parse socialLinks — aceita array de objetos {platform, url}
  const socialLinks = Array.isArray(professional.socialLinks)
    ? professional.socialLinks.filter(s => s?.platform && s?.url)
    : [];

  const openWhatsApp = (e) => {
    e.preventDefault();
    if (phone) window.open(`https://wa.me/${phone.replace(/\D/g, '')}?text=Olá! Vi seu perfil no proITA.`, '_blank');
  };

  const share = (e) => {
    e.preventDefault();
    navigator.clipboard.writeText(`${window.location.origin}/profile/${professional.id}`);
    alert('Link copiado!');
  };

  const openSocial = (e, url) => {
    e.preventDefault();
    window.open(url.startsWith('http') ? url : `https://${url}`, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 flex flex-col overflow-hidden relative group">

      {/* Barra colorida no topo ao hover */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-cyan-400 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300" />

      {/* Cabeçalho */}
      <div className="p-5 pb-3 flex items-start gap-4">
        {/* Avatar — círculo perfeito com borda elegante */}
        <div className="relative shrink-0">
          <img
            src={professional.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(professional.name || 'P')}&background=0ea5e9&color=fff&bold=true`}
            alt={professional.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md ring-2 ring-slate-100 group-hover:ring-primary/20 transition-all"
          />
          {professional.verified && (
            <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
              <CheckCircle size={15} className="text-emerald-500 fill-emerald-50" />
            </span>
          )}
        </div>

        {/* Nome + Categoria + Rating */}
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-[15px] text-slate-800 leading-snug truncate group-hover:text-primary transition-colors">
            {professional.name}
          </h3>
          <p className="text-xs font-semibold text-primary/80 mt-0.5 truncate uppercase tracking-wide">
            {professional.category || professional.atividadePrincipal}
          </p>
          <div className="flex items-center gap-1 mt-1.5">
            {[1,2,3,4,5].map(i => (
              <Star key={i} size={11} className="text-amber-400 fill-amber-400" />
            ))}
            <span className="text-[11px] font-bold text-slate-600 ml-1">5.0</span>
            <span className="text-[11px] text-slate-400">(novo)</span>
          </div>
        </div>
      </div>

      {/* Descrição curta */}
      <div className="px-5 pb-3 flex-1">
        <p className="text-sm text-slate-500 line-clamp-2 leading-relaxed">
          {description}
        </p>
      </div>

      {/* Localização e Telefone */}
      <div className="px-5 pb-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span className="flex items-center gap-1">
          <MapPin size={12} className="shrink-0" /> {location}
        </span>
        {phone && (
          <span className="flex items-center gap-1">
            <Phone size={12} className="shrink-0" /> {phone}
          </span>
        )}
      </div>

      {/* Ícones das redes sociais dinâmicas */}
      {socialLinks.length > 0 && (
        <div className="px-5 pb-3 flex items-center gap-2">
          {socialLinks.map((s, i) => (
            <button
              key={i}
              title={s.platform}
              onClick={(e) => openSocial(e, s.url)}
              className={`p-1.5 rounded-lg transition-all ${PLATFORM_STYLES[s.platform?.toLowerCase()] || 'bg-slate-50 text-slate-600 hover:bg-slate-100'}`}
            >
              {PLATFORM_SVGS[s.platform?.toLowerCase()] || <span className="text-[10px] font-bold">{s.platform?.[0]?.toUpperCase()}</span>}
            </button>
          ))}
        </div>
      )}

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-50 flex items-center justify-between gap-2">
        {/* Ações de contato */}
        <div className="flex items-center gap-2">
          {phone && (
            <button
              onClick={openWhatsApp}
              className="flex items-center gap-1.5 bg-[#25D366]/10 text-[#25D366] hover:bg-[#25D366]/20 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
            >
              {WA_SVG} WhatsApp
            </button>
          )}
          <button
            onClick={share}
            title="Compartilhar"
            className="p-1.5 bg-slate-50 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Share2 size={14} />
          </button>
        </div>

        {/* Botões de edição (modo Dashboard) OU link "Sobre" */}
        {showEdit ? (
          <div className="flex gap-1.5">
            <button
              onClick={() => onEdit?.(professional)}
              className="flex items-center gap-1 text-xs bg-slate-100 hover:bg-primary/10 hover:text-primary text-slate-600 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Edit2 size={12} /> Editar
            </button>
            <button
              onClick={() => onDelete?.(professional.id)}
              className="flex items-center gap-1 text-xs bg-red-50 hover:bg-red-100 text-red-500 px-3 py-1.5 rounded-lg font-medium transition-colors"
            >
              <Trash2 size={12} /> Excluir
            </button>
          </div>
        ) : (
          <Link
            to={`/profile/${professional.id}`}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-hover transition-colors group-hover:translate-x-0.5"
          >
            Sobre <ChevronRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}
