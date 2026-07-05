/**
 * AdCard — componente único usado na busca (Search.jsx) e no Dashboard.
 */

import { useState, useEffect, useContext } from 'react';
import { Star, Phone, Share2, CheckCircle, Edit2, Trash2, IdCard, Bookmark, Plus, MapPin, Award, ShieldCheck, Eye, MessageCircle, TrendingUp, Loader2, X, BadgeCheck, BarChart3, Map, CircleUser, QrCode } from 'lucide-react';
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
    case 'instagram': return <div className="w-10 h-10 flex items-center justify-center bg-pink-50 text-pink-500 hover:bg-pink-100 rounded-full transition-colors shrink-0">{INSTAGRAM_SVG}</div>;
    case 'facebook': return <div className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-full transition-colors shrink-0">{FB_SVG}</div>;
    case 'youtube': return <div className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 hover:bg-red-100 rounded-full transition-colors shrink-0">{YT_SVG}</div>;
    case 'tiktok': return <div className="w-10 h-10 flex items-center justify-center bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-full transition-colors shrink-0">{TIKTOK_SVG}</div>;
    default: return <div className="w-10 h-10 flex items-center justify-center bg-primary/10 text-primary hover:bg-primary/20 rounded-full transition-colors shrink-0">{WEB_SVG}</div>;
  }
};

function detectSocialNetwork(url) {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes('instagram.com')) return 'instagram';
  if (lowercaseUrl.includes('facebook.com') || lowercaseUrl.includes('fb.com')) return 'facebook';
  if (lowercaseUrl.includes('youtube.com') || lowercaseUrl.includes('youtu.be')) return 'youtube';
  if (lowercaseUrl.includes('tiktok.com')) return 'tiktok';
  if (lowercaseUrl.includes('linkedin.com')) return 'linkedin';
  if (lowercaseUrl.includes('wa.me') || lowercaseUrl.includes('whatsapp.com')) return 'whatsapp';
  return 'website';
}

const SocialIcon = ({ platform }) => {
  const icons = {
    instagram: INSTAGRAM_SVG,
    facebook: FB_SVG,
    youtube: YT_SVG,
    tiktok: TIKTOK_SVG,
  };
  return icons[platform?.toLowerCase()] || WEB_SVG;
};

export default function AdCard({ professional, showEdit = false, onEdit, onDelete, style, disableEdit = false, isDashboard = false, onQrCode }) {
  console.log('Ad User Data:', professional?.user);
  const { token } = useContext(AuthContext);
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);
  const [isFavorited, setIsFavorited] = useState(professional.isFavorited || false);
  const [currentSponsorIdx, setCurrentSponsorIdx] = useState(0);

  useEffect(() => {
    setIsFavorited(professional.isFavorited || false);
  }, [professional.isFavorited]);

  let listPartners = [];
  try {
    listPartners = typeof professional.partners === 'string'
      ? JSON.parse(professional.partners)
      : (professional.partners || []);
  } catch {
    listPartners = professional.partners || [];
  }
  let validPartners = listPartners.filter(p => p && p.imageUrl);
  if (validPartners.length === 0 && professional.fotoAnuncioUrl) {
    validPartners = [{ imageUrl: professional.fotoAnuncioUrl }];
  }

  useEffect(() => {
    if (validPartners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSponsorIdx(prev => (prev + 1) % validPartners.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [validPartners.length]);

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
  const planStatus = professional.user?.planStatus || professional.planStatus || 'DEGUSTACAO';
  const planType = professional.user?.planType || professional.planType || '';
  const showSponsor = planStatus === 'DEGUSTACAO' || planType === 'TESTE' || planType.includes('PATROCINADOR');
  const hasSponsorRights = planStatus === 'DEGUSTACAO' || planType === 'TESTE' || planType?.includes('PATROCINADOR');
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

  const [localSocialLinks, setLocalSocialLinks] = useState(() => {
    return Array.isArray(professional.socialLinks)
      ? professional.socialLinks.map(normalizeSocialEntry).filter(Boolean)
      : [];
  });

  useEffect(() => {
    setLocalSocialLinks(
      Array.isArray(professional.socialLinks)
        ? professional.socialLinks.map(normalizeSocialEntry).filter(Boolean)
        : []
    );
  }, [professional.socialLinks]);

  const [isSocialModalOpen, setIsSocialModalOpen] = useState(false);
  const [newSocialUrl, setNewSocialUrl] = useState('');
  const [isSavingSocial, setIsSavingSocial] = useState(false);
  const [socialError, setSocialError] = useState('');

  const handleSaveSocial = async (e) => {
    e.preventDefault();
    if (!newSocialUrl.trim()) {
      setSocialError('Por favor, insira uma URL.');
      return;
    }

    setIsSavingSocial(true);
    setSocialError('');

    try {
      const platform = detectSocialNetwork(newSocialUrl);
      const urlNormalized = newSocialUrl.trim();

      const existingIdx = localSocialLinks.findIndex(
        (item) => item.platform === platform
      );
      
      let updatedLinks = [...localSocialLinks];
      if (existingIdx > -1) {
        updatedLinks[existingIdx] = { platform, url: urlNormalized };
      } else {
        if (updatedLinks.length >= 3) {
          setSocialError('Você já possui 3 redes sociais cadastradas. Remova ou edite uma existente pelo formulário de edição de anúncio.');
          setIsSavingSocial(false);
          return;
        }
        updatedLinks.push({ platform, url: urlNormalized });
      }

      const res = await fetch(`${API_URL}/api/ads/${professional.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ socialLinks: updatedLinks })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setLocalSocialLinks(updatedLinks);
        setIsSocialModalOpen(false);
        setNewSocialUrl('');
      } else {
        setSocialError(data.message || 'Erro ao salvar a rede social.');
      }
    } catch (err) {
      console.error(err);
      setSocialError('Erro de conexão ao salvar a rede social.');
    } finally {
      setIsSavingSocial(false);
    }
  };

  const displayedSocials = localSocialLinks.slice(0, 3);
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
    const url = `${window.location.origin}/profile/${professional.slug || professional.id}`;

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

  const cardContent = (
    <div 
      style={!isDashboard ? style : undefined}
      className={`flex flex-col gap-y-[10px] p-[10px] border border-slate-200 rounded-xl bg-white relative hover:shadow-xl hover:border-primary/20 transition-all duration-300 animate-card-fade ${!isDashboard ? 'w-full max-w-[420px] mx-auto' : 'w-full max-w-[420px]'} min-w-[310px]`}
    >
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-cyan-400 scale-x-0 group-hover:scale-x-100 origin-left transition-transform duration-300 rounded-t-xl" />

      {/* Row 1 (Avatar, Info, Sponsor) */}
      <div className="grid grid-cols-[96px_1fr_56px] gap-2.5 w-full items-start">
        {/* Left (Block 1 - Avatar) */}
        <div className="w-full h-full flex items-center justify-center">
          <Link 
            to={`/profile/${professional.slug || professional.id}`} 
            onClick={handleProfileClick} 
            className="relative cursor-pointer hover:scale-105 transition-transform rounded-full w-[72px] h-[72px]"
          >
            {avatar ? (
              <img src={avatar} alt={displayName} className="w-[72px] h-[72px] rounded-full object-cover ring-[3px] ring-primary/25 border-2 border-white shadow-md" />
            ) : (
              <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-primary to-cyan-400 flex items-center justify-center text-white text-2xl font-bold ring-[3px] ring-primary/25 border-2 border-white shadow-md select-none">
                {displayName?.[0]?.toUpperCase() || 'P'}
              </div>
            )}
            {badge ? (
              <div 
                className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 bg-white rounded-full p-0.5 shadow-md flex items-center justify-center z-10" 
                title={badge.title}
              >
                <BadgeCheck 
                  className={`w-5 h-5 ${
                    badge.level === 'ouro' ? 'text-yellow-500 fill-yellow-500/10' :
                    badge.level === 'prata' ? 'text-slate-400 fill-slate-400/10' :
                    badge.level === 'bronze' ? 'text-amber-700 fill-amber-700/10' :
                    'text-gray-400'
                  }`} 
                />
              </div>
            ) : (
              <div 
                className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/4 bg-white rounded-full p-0.5 shadow-md flex items-center justify-center text-gray-400 cursor-help z-10" 
                title="Selo de Verificação: Complete seu perfil e receba avaliações para ativar esta conquista."
              >
                <BadgeCheck className="w-5 h-5 text-gray-400" />
              </div>
            )}
          </Link>
        </div>

        {/* Middle (Block 2 - Name, Stars, Phone, Location) */}
        <div className="flex-1 min-w-0 flex flex-col justify-center h-[90px] gap-2">
          <Link 
            to={`/profile/${professional.slug || professional.id}`} 
            onClick={handleProfileClick} 
            className="block group-hover:text-primary transition-colors min-w-0 w-full"
          >
            <h3 className="font-black text-slate-800 text-sm leading-tight truncate" title={displayName}>
              {displayName}
            </h3>
          </Link>
          
          {/* Avaliação */}
          <Link 
            to={`/profile/${professional.slug || professional.id}?tab=avaliacoes`}
            onClick={handleProfileClick}
            className="flex items-center gap-1 hover:underline hover:text-primary transition-all cursor-pointer group/rating min-w-0"
            title="Ver todas as avaliações deste profissional"
          >
            <div className="flex items-center gap-0.5 shrink-0 text-amber-400">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} size={10} className={i <= rating ? "fill-amber-400 text-amber-400 group-hover/rating:scale-110 transition-transform duration-200" : "text-slate-200 fill-slate-200"} />
              ))}
            </div>
            <span className="text-[11px] font-bold text-slate-700 leading-none whitespace-nowrap">
              {rating > 0 ? rating.toFixed(1) : 'Novo'}
            </span>
            {reviewCount > 0 && (
              <span className="text-[9px] text-slate-450 leading-none">({reviewCount})</span>
            )}
          </Link>

          {/* Telefone */}
          {phone && (
            <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium leading-none truncate w-full min-w-0">
              <Phone size={10} className="text-slate-400 shrink-0" />
              <span className="truncate">{formatPhone(phone)}</span>
            </div>
          )}

          {/* Local/Bairro */}
          <div className="flex items-center gap-1 text-[11px] text-slate-500 font-medium leading-none truncate w-full min-w-0">
            <MapPin size={10} className="text-slate-400 shrink-0" />
            <span className="truncate">{location}</span>
          </div>
        </div>

        {/* Right (Block 3 - Sponsor Banner) */}
        <div className="w-[56px] shrink-0 aspect-[3/4] flex items-center justify-center">
          {hasSponsorRights && validPartners.length > 0 ? (
            <div 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/profile/${professional.slug || professional.id}?tab=parceiros`);
              }}
              className="w-full h-full rounded-lg border border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-0.5 relative overflow-hidden shadow-2xs select-none cursor-pointer hover:border-primary/30 transition-colors"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center blur-[2px] opacity-15 scale-110 pointer-events-none" 
                style={{ backgroundImage: `url(${validPartners[currentSponsorIdx].imageUrl})` }} 
              />
              <img 
                src={validPartners[currentSponsorIdx].imageUrl} 
                alt={validPartners[currentSponsorIdx].name || "Patrocinador"} 
                className="relative z-10 w-full h-full object-contain"
              />
              <span className="absolute bottom-0 left-0 right-0 text-center bg-slate-900/60 backdrop-blur-[1px] text-white text-[8px] font-bold py-0.5 leading-none z-20">
                APOIO
              </span>
            </div>
          ) : (
            <div className="w-full h-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-1 select-none text-center">
              <span className="text-[10px] font-semibold text-slate-400 leading-tight">
                Anuncie
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Row 2 (Category, View Profile, Sec. Actions) */}
      <div className="grid grid-cols-[96px_1fr_56px] gap-2.5 w-full items-center h-[31px]">
        {/* Left (Block 4 - Category) */}
        <div className="w-full flex items-center justify-center">
          <p className="text-[10px] font-black text-primary uppercase tracking-wider leading-none text-center line-clamp-2 max-w-full">
            {professional.category || professional.atividadePrincipal || 'Profissional'}
          </p>
        </div>

        {/* Middle (Block 5 - View Profile Btn) */}
        <div className="w-full flex items-center justify-center h-full">
          <Link
            to={`/profile/${professional.slug || professional.id}`}
            onClick={handleProfileClick}
            className="w-full h-full flex items-center justify-center gap-1 bg-sky-50 hover:bg-sky-100 text-sky-600 hover:text-sky-700 font-bold text-[11px] rounded-lg transition-colors border border-sky-100/30 whitespace-nowrap"
          >
            <CircleUser size={14} className="text-sky-600 shrink-0" />
            <span>Ver Perfil</span>
          </Link>
        </div>

        {/* Right (Block 6 - Fav & Map Btns) */}
        <div className="w-full h-full flex justify-between items-center gap-1.5">
          {!showEdit ? (
            <>
              <button
                onClick={handleToggleFavorite}
                className={`flex-1 h-full rounded-lg border transition-colors flex items-center justify-center ${
                  isFavorited 
                    ? 'bg-red-50 text-red-500 border-red-200 hover:bg-red-100' 
                    : 'bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100'
                }`}
                title={isFavorited ? "Remover dos favoritos" : "Salvar nos favoritos"}
              >
                <Bookmark size={14} className={isFavorited ? "fill-red-500 text-red-500" : ""} />
              </button>
              
              <a
                href={getMapsLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 h-full rounded-lg border bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center"
                title="Ver rota no mapa"
              >
                <Map size={14} />
              </a>
            </>
          ) : (
            <a
              href={getMapsLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full h-full rounded-lg border bg-slate-50 text-slate-650 border-slate-200 hover:bg-slate-100 transition-colors flex items-center justify-center"
              title="Ver rota no mapa"
            >
              <Map size={14} />
            </a>
          )}
        </div>
      </div>

      {/* Row 3 (Socials, Primary Actions) */}
      <div className="grid grid-cols-[96px_1fr_56px] gap-2.5 w-full items-center h-[60px] mt-1">
        {/* Left (Block 7 - Social Icons + 'Por Fulano') */}
        <div className="w-full flex flex-col items-center justify-center gap-y-1">
          <div className="flex flex-row flex-nowrap justify-center items-center gap-1 w-full">
            {displayedSocials.map((link, idx) => {
              const url = link.url.startsWith('http') ? link.url : `https://${link.url}`;
              return (
                <a 
                  key={idx} 
                  href={url} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  title={link.platform} 
                  onClick={(e) => e.stopPropagation()} 
                  className="w-7 h-7 flex items-center justify-center hover:scale-110 transition-transform shrink-0"
                >
                  <div className={`w-7 h-7 flex items-center justify-center rounded-full transition-colors shrink-0 ${
                    link.platform?.toLowerCase() === 'instagram' ? 'bg-pink-50 text-pink-500 hover:bg-pink-100' :
                    link.platform?.toLowerCase() === 'facebook' ? 'bg-blue-50 text-blue-600 hover:bg-blue-100' :
                    link.platform?.toLowerCase() === 'youtube' ? 'bg-red-50 text-red-600 hover:bg-red-100' :
                    link.platform?.toLowerCase() === 'tiktok' ? 'bg-slate-100 text-slate-800 hover:bg-slate-200' :
                    'bg-primary/10 text-primary hover:bg-primary/20'
                  }`}>
                    <SocialIcon platform={link.platform} />
                  </div>
                </a>
              );
            })}
            {[...Array(placeholdersCount)].map((_, idx) => (
              <div 
                key={`placeholder-${idx}`} 
                className="w-7 h-7 rounded-full border border-dashed border-slate-200 bg-slate-50/50 flex items-center justify-center text-slate-350 shrink-0" 
                title="Rede não cadastrada"
              >
                <Plus size={10} className="stroke-[2.5]" />
              </div>
            ))}
            {showEdit && isDashboard && (
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsSocialModalOpen(true);
                  setSocialError('');
                }}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-primary hover:text-white text-slate-500 flex items-center justify-center transition-all duration-200 cursor-pointer shadow-xs shrink-0"
                title="Adicionar/Editar Rede Social"
              >
                <Edit2 size={11} />
              </button>
            )}
          </div>
          
          {ownerName && (
            <p className="text-[9px] text-slate-400 font-medium truncate w-full text-center">
              Por {ownerName}
            </p>
          )}
        </div>

        {/* Right (Block 8 - Call, WA, Share) */}
        <div className="col-span-2 min-w-0 flex justify-center items-center gap-[10px] h-full">
          {isDashboard ? (
            showEdit && (
              <div className="flex flex-row w-full gap-[10px] items-center h-full">
                <button 
                  onClick={() => onEdit?.(professional)} 
                  disabled={disableEdit}
                  className="flex-1 h-10 flex justify-center items-center gap-1 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-700 rounded-xl font-bold transition-all text-[11px] sm:text-xs border border-slate-200 shadow-xs cursor-pointer"
                >
                  <Edit2 size={12} /> Editar
                </button>
                <button 
                  type="button"
                  onClick={() => onQrCode?.(professional)}
                  className="flex-1 h-10 flex justify-center items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all text-[11px] sm:text-xs border border-slate-200 shadow-xs cursor-pointer"
                >
                  <QrCode size={12} /> QR Code
                </button>
                <button 
                  onClick={() => onDelete?.(professional.id)} 
                  className="flex-1 h-10 flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-150 rounded-xl font-bold transition-all text-[11px] sm:text-xs shadow-xs cursor-pointer"
                >
                  <Trash2 size={12} /> Excluir
                </button>
              </div>
            )
          ) : (
            <div className="w-full flex items-center justify-between px-1 sm:px-2 h-full">
              {/* Botão Ligar */}
              {phone && (
                <button
                  onClick={callPhone}
                  className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-50 text-slate-605 border border-slate-200 rounded-full transition-colors shadow-2xs active:scale-95 cursor-pointer"
                  title="Ligar"
                >
                  <Phone className="w-[18px] h-[18px]" />
                </button>
              )}

              {/* Botão WhatsApp */}
              {phone && (
                <button
                  onClick={openWhatsApp}
                  className="w-12 h-12 shrink-0 flex items-center justify-center bg-[#25D366] hover:bg-[#1fb355] text-white rounded-full transition-all shadow-md shadow-green-200/40 scale-110 hover:scale-115 active:scale-95 cursor-pointer"
                  title="WhatsApp"
                >
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-[24px] h-[24px] shrink-0">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </button>
              )}

              {/* Botão Compartilhar */}
              <button
                onClick={share}
                className="w-10 h-10 shrink-0 flex items-center justify-center bg-slate-50 text-slate-605 border border-slate-200 rounded-full transition-colors shadow-2xs active:scale-95 cursor-pointer"
                title={copied ? 'Copiado!' : 'Compartilhar link'}
              >
                {copied ? <CheckCircle className="w-[18px] h-[18px] text-emerald-500" /> : <Share2 className="w-[18px] h-[18px]" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (isDashboard) {
    return (
      <div className="flex flex-col gap-4 w-full" style={style}>
        {cardContent}

        {showEdit && (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 animate-in fade-in duration-300">
            <h4 className="text-sm font-bold text-slate-800 mb-4 text-left flex items-center gap-2">
              <BarChart3 size={18} className="text-primary shrink-0" />
              Estatísticas
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-650">
              
              <div className="flex items-center gap-3 bg-slate-50/30 p-2.5 rounded-xl border border-slate-100" title="Exibições nas buscas de clientes">
                <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                  <TrendingUp size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-normal leading-none mb-1">Exibições</span>
                  <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.impressions ?? 0}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50/30 p-2.5 rounded-xl border border-slate-100" title="Visitas completas ao seu perfil profissional">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg shrink-0">
                  <Eye size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-normal leading-none mb-1">Visitas</span>
                  <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.profileViews ?? 0}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50/30 p-2.5 rounded-xl border border-slate-100" title="Clientes que favoritaram seu perfil">
                <div className="p-2 bg-rose-50 text-rose-500 rounded-lg shrink-0">
                  <Bookmark size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-normal leading-none mb-1">Favoritos</span>
                  <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.favoritesCount ?? 0}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50/30 p-2.5 rounded-xl border border-slate-100" title="Clientes que iniciaram conversa no WhatsApp">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
                  <MessageCircle size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-normal leading-none mb-1">WhatsApp</span>
                  <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.whatsappClicks ?? 0}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50/30 p-2.5 rounded-xl border border-slate-100" title="Clientes que clicaram para efetuar ligação direta">
                <div className="p-2 bg-teal-50 text-teal-600 rounded-lg shrink-0">
                  <Phone size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-normal leading-none mb-1">Ligações</span>
                  <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.phoneClicks ?? 0}</span>
                </div>
              </div>

              <div className="flex items-center gap-3 bg-slate-50/30 p-2.5 rounded-xl border border-slate-100" title="Número de vezes que seu link foi compartilhado">
                <div className="p-2 bg-orange-50 text-orange-500 rounded-lg shrink-0">
                  <Share2 size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] text-slate-400 block font-normal leading-none mb-1">Partilhas</span>
                  <span className="text-sm font-extrabold text-slate-800 leading-none">{professional.shares ?? 0}</span>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Modal de In-Place Editing das Redes Sociais */}
        {isSocialModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-105 animate-in zoom-in-95 duration-200">
              {/* Header */}
              <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="text-base font-bold">Adicionar Rede Social</h3>
                <button 
                  onClick={() => {
                    setIsSocialModalOpen(false);
                    setNewSocialUrl('');
                  }}
                  type="button"
                  className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-800 rounded-lg"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSaveSocial} className="p-6 space-y-4">
                {socialError && (
                  <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold border border-red-100">
                    {socialError}
                  </div>
                )}
                
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                    URL do Perfil
                  </label>
                  <input
                    type="url"
                    value={newSocialUrl}
                    onChange={(e) => setNewSocialUrl(e.target.value)}
                    required
                    placeholder="https://instagram.com/seu.perfil"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm bg-slate-50 focus:bg-white text-slate-800"
                  />
                  <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">
                    Insira o link completo do perfil. O sistema detectará automaticamente a rede social correspondente.
                  </p>
                </div>

                <div className="flex gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSocialModalOpen(false);
                      setNewSocialUrl('');
                    }}
                    className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-all cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingSocial}
                    className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
                  >
                    {isSavingSocial ? <Loader2 size={16} className="animate-spin" /> : null}
                    Salvar
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {cardContent}
      {/* Modal de In-Place Editing das Redes Sociais */}
      {isSocialModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border border-slate-105 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="text-base font-bold">Adicionar Rede Social</h3>
              <button 
                onClick={() => {
                  setIsSocialModalOpen(false);
                  setNewSocialUrl('');
                }}
                type="button"
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1 hover:bg-slate-800 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveSocial} className="p-6 space-y-4">
              {socialError && (
                <div className="bg-red-50 text-red-600 p-3.5 rounded-xl text-xs font-semibold border border-red-100">
                  {socialError}
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  URL do Perfil
                </label>
                <input
                  type="url"
                  value={newSocialUrl}
                  onChange={(e) => setNewSocialUrl(e.target.value)}
                  required
                  placeholder="https://instagram.com/seu.perfil"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm bg-slate-50 focus:bg-white text-slate-800"
                />
                <p className="text-[10px] text-slate-450 mt-1.5 leading-relaxed">
                  Insira o link completo do perfil. O sistema detectará automaticamente a rede social correspondente.
                </p>
              </div>

              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsSocialModalOpen(false);
                    setNewSocialUrl('');
                  }}
                  className="flex-1 py-2.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-sm font-bold transition-all cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingSocial}
                  className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
                >
                  {isSavingSocial ? <Loader2 size={16} className="animate-spin" /> : null}
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}