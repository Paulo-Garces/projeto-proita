import { useParams, Link, useLocation } from 'react-router-dom';
import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Star, 
  MapPin, 
  CheckCircle, 
  MessageCircle, 
  Share2, 
  Shield, 
  Clock, 
  Camera, 
  Globe, 
  Phone, 
  Briefcase,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight,
  Award,
  ShieldCheck,
  Users,
  Sparkles
} from 'lucide-react';
import SponsorSlider from '../components/SponsorSlider';

const InstagramIcon = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const YoutubeIcon = ({ size = 24, className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z" />
    <polygon points="10 9 15 12 10 15" fill="currentColor" />
  </svg>
);
import { API_URL } from '../config';
import { getProfileDisplayName, getProfileAvatarNameParam } from '../utils/profileDisplayName';
import { getReputationBadge } from '../utils/reputationBadge';

export default function Profile() {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const [professional, setProfessional] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialTab = queryParams.get('tab') || 'sobre';
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sincroniza a aba ativa caso o query parameter da URL seja alterado
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const tabParam = searchParams.get('tab');
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  // Estados para Avaliações
  const [reviews, setReviews] = useState([]);
  const [isFetchingReviews, setIsFetchingReviews] = useState(true);
  const [formRating, setFormRating] = useState(5);
  const [formHoverRating, setFormHoverRating] = useState(0);
  const [formComment, setFormComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  // Estados para o Lightbox do Portfólio
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  // Estados para Serviços
  const [services, setServices] = useState([]);
  const [isFetchingServices, setIsFetchingServices] = useState(true);

  const fetchReviews = async () => {
    try {
      const res = await fetch(`${API_URL}/api/reviews/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setReviews(data.data);
      }
    } catch (err) {
      console.error("Erro ao buscar avaliações:", err);
    } finally {
      setIsFetchingReviews(false);
    }
  };

  const fetchServices = async () => {
    try {
      const res = await fetch(`${API_URL}/api/services/${id}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setServices(data.data);
      }
    } catch (err) {
      console.error("Erro ao buscar serviços:", err);
    } finally {
      setIsFetchingServices(false);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`${API_URL}/api/ads/${id}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const profile = data.data;
          const rawSocial = profile.socialLinks ?? profile.redesSociais;
          
          let socialLinks = [];
          if (Array.isArray(rawSocial)) {
            socialLinks = rawSocial
              .map((item) => {
                if (!item || typeof item !== 'object') return null;
                const platform = (item.platform ?? item.network ?? '').toString().toLowerCase().trim();
                const url = (item.url ?? item.link ?? '').toString().trim();
                if (!platform || !url) return null;
                return { platform, url };
              })
              .filter(Boolean);
          } else if (rawSocial && typeof rawSocial === 'object') {
            socialLinks = Object.entries(rawSocial)
              .map(([platform, url]) => {
                if (typeof url !== 'string' || !url.trim()) return null;
                return { platform: platform.toLowerCase().trim(), url: url.trim() };
              })
              .filter(Boolean);
          }

          const instagramEntry = socialLinks.find((s) => s.platform === 'instagram');
          const instagram = instagramEntry?.url || profile.instagram || '';

          setProfessional({
            id: profile.id,
            userId: profile.userId, // Identificação do dono para trava do form
            name: getProfileDisplayName(profile),
            category: profile.atividadePrincipal,
            rating: profile.rating ?? 5.0,
            reviewsCount: profile.reviewCount ?? 0,
            reviews: profile.reviews ?? [],
            location: profile.serviceBairro || profile.user?.bairro || 'Itapipoca',
            fullDescription: profile.descricaoTrabalho,
            phone: (profile.telefoneComercial && profile.telefoneComercial.trim() !== '')
              ? profile.telefoneComercial.trim()
              : (profile.servicePhone && profile.servicePhone.trim() !== '')
                ? profile.servicePhone.trim()
                : (profile.whatsapp && profile.whatsapp.trim() !== '')
                  ? profile.whatsapp.trim()
                  : (profile.phone && profile.phone.trim() !== '')
                    ? profile.phone.trim()
                    : (profile.user?.telefone || null),
            telefoneComercial: profile.telefoneComercial,
            servicePhone: profile.servicePhone,
            instagram: instagram,
            socialLinks,
            avatar: (profile.fotoAnuncioUrl && profile.fotoAnuncioUrl.trim() !== '')
              ? profile.fotoAnuncioUrl
              : (profile.user?.profileImageUrl
                || profile.avatarUrl
                || `https://ui-avatars.com/api/?name=${encodeURIComponent(getProfileAvatarNameParam(profile))}&background=0ea5e9&color=fff&bold=true`),
            capaUrl: profile.capaUrl || null,
            enderecoComercial: profile.enderecoComercial || null,
            horariosFuncionamento: profile.horariosFuncionamento || null,
            portfolioUrls: profile.portfolioUrls || [],
            createdAt: profile.createdAt || null,
            planStatus: profile.user?.planStatus || profile.planStatus || 'DEGUSTACAO',
            trialEndsAt: profile.user?.trialEndsAt || profile.trialEndsAt || null,
            subscriptionEndsAt: profile.user?.subscriptionEndsAt || profile.subscriptionEndsAt || null,
            verified: true,
            user: profile.user
          });

          // Dispara tracking silencioso de visualização
          fetch(`${API_URL}/api/ads/${profile.id}/track`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'view' })
          }).catch(console.error);
        }
      } catch (err) {
        console.error("Erro ao buscar perfil:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
    fetchReviews();
    fetchServices();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-3 text-lg font-medium text-slate-600">Carregando...</span>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Profissional não encontrado</h2>
          <Link to="/search" className="text-primary hover:underline">Voltar para a busca</Link>
        </div>
      </div>
    );
  }

  const badge = getReputationBadge(professional);
  const ownerName = professional.user 
    ? [professional.user.nome, professional.user.sobrenome].filter(Boolean).join(' ').trim()
    : '';

  const handleWhatsApp = () => {
    if (professional.phone) {
      fetch(`${API_URL}/api/ads/${id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'whatsapp' })
      }).catch(console.error);

      const cleanPhone = professional.phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      window.open(`https://wa.me/${finalPhone}?text=Olá! Encontrei seu perfil no proITA e gostaria de um orçamento.`, '_blank');
    }
  };

  const handleServiceWhatsApp = (serviceName) => {
    if (professional.phone) {
      fetch(`${API_URL}/api/ads/${id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'whatsapp' })
      }).catch(console.error);

      const cleanPhone = professional.phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      const message = `Olá! Vi o seu perfil no proITA e gostaria de solicitar um orçamento para o serviço de ${serviceName}.`;
      window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      alert("Este profissional não cadastrou um contato de WhatsApp válido.");
    }
  };

  const handlePhoneClick = () => {
    if (professional.phone) {
      fetch(`${API_URL}/api/ads/${id}/track`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'phone' })
      }).catch(console.error);

      window.location.href = `tel:${professional.phone.replace(/\D/g,'')}`;
    }
  };

  const handleShare = () => {
    fetch(`${API_URL}/api/ads/${id}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'share' })
    }).catch(console.error);

    navigator.clipboard.writeText(window.location.href);
    alert('Link do perfil copiado para a área de transferência!');
  };

  const renderSocialLinks = () => {
    const platforms = [
      { 
        key: 'instagram', 
        label: 'Instagram', 
        icon: InstagramIcon, 
        activeClass: 'text-pink-600 bg-pink-50 border-pink-200 hover:bg-pink-100 hover:border-pink-300' 
      },
      { 
        key: 'facebook', 
        label: 'Facebook', 
        icon: FacebookIcon, 
        activeClass: 'text-blue-600 bg-blue-50 border-blue-200 hover:bg-blue-100 hover:border-blue-300' 
      },
      { 
        key: 'youtube', 
        label: 'YouTube', 
        icon: YoutubeIcon, 
        activeClass: 'text-red-600 bg-red-50 border-red-200 hover:bg-red-100 hover:border-red-300' 
      }
    ];

    return (
      <div className="flex items-center gap-2">
        {platforms.map((p) => {
          let linkVal = null;
          if (p.key === 'instagram' && professional.instagram) {
            linkVal = professional.instagram;
          } else {
            const found = professional.socialLinks?.find(
              (s) => s.platform === p.key
            );
            linkVal = found?.url || null;
          }

          const IconComponent = p.icon;

          if (linkVal) {
            const isUrl = linkVal.startsWith('http');
            let targetUrl = linkVal;
            if (!isUrl) {
              if (p.key === 'instagram') {
                targetUrl = `https://instagram.com/${linkVal.replace('@', '')}`;
              } else if (p.key === 'facebook') {
                targetUrl = `https://facebook.com/${linkVal}`;
              } else if (p.key === 'youtube') {
                targetUrl = `https://youtube.com/${linkVal.startsWith('@') ? linkVal : '@' + linkVal}`;
              } else {
                targetUrl = `https://${linkVal}`;
              }
            }
            
            return (
              <a
                key={p.key}
                href={targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                title={`Ver ${p.label}`}
                className={`p-2 rounded-xl border transition-all hover:scale-105 active:scale-95 ${p.activeClass}`}
              >
                <IconComponent size={18} />
              </a>
            );
          } else {
            return (
              <button
                key={p.key}
                disabled
                title={`${p.label} não cadastrado`}
                className="p-2 rounded-xl text-slate-300 bg-slate-50 border border-slate-100 cursor-not-allowed opacity-50"
              >
                <IconComponent size={18} />
              </button>
            );
          }
        })}
      </div>
    );
  };

  const renderHorarios = (horarios) => {
    if (!horarios) return null;

    if (typeof horarios === 'string') {
      return (
        <p className="text-sm text-slate-600 whitespace-pre-line leading-relaxed">
          {horarios}
        </p>
      );
    }

    const dayLabels = {
      segunda: 'Segunda-feira',
      terca: 'Terça-feira',
      quarta: 'Quarta-feira',
      quinta: 'Quinta-feira',
      sexta: 'Sexta-feira',
      sabado: 'Sábado',
      domingo: 'Domingo',
      seg: 'Segunda-feira',
      ter: 'Terça-feira',
      qua: 'Quarta-feira',
      qui: 'Quinta-feira',
      sex: 'Sexta-feira',
      sab: 'Sábado',
      dom: 'Domingo'
    };

    if (Array.isArray(horarios)) {
      return (
        <ul className="space-y-2 text-sm text-slate-600">
          {horarios.map((h, idx) => (
            <li key={idx} className="flex justify-between py-1 border-b border-slate-100 last:border-0">
              {h}
            </li>
          ))}
        </ul>
      );
    }

    return (
      <div className="space-y-2">
        {Object.entries(horarios).map(([day, val]) => {
          const formattedDay = dayLabels[day.toLowerCase()] || day;
          return (
            <div key={day} className="flex justify-between items-center text-sm border-b border-slate-100/50 pb-2 last:border-0 last:pb-0">
              <span className="font-medium text-slate-700">{formattedDay}</span>
              <span className="text-slate-500 font-semibold text-xs bg-slate-100 px-2 py-0.5 rounded-md">{val}</span>
            </div>
          );
        })}
      </div>
    );
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!token) return;

    setIsSubmittingReview(true);
    setReviewError(null);
    setReviewSuccess(null);

    try {
      const res = await fetch(`${API_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          rating: formRating,
          comment: formComment,
          profileId: id
        })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setReviewSuccess('Avaliação enviada com sucesso!');
        setFormComment('');
        setFormRating(5);
        fetchReviews(); // Recarrega os depoimentos atualizados

        if (data.profileStats) {
          setProfessional(prev => ({
            ...prev,
            rating: data.profileStats.rating,
            reviewsCount: data.profileStats.reviewCount
          }));
        }
      } else {
        setReviewError(data.message || 'Falha ao enviar avaliação.');
      }
    } catch (err) {
      console.error("Erro ao enviar avaliação:", err);
      setReviewError('Erro ao se conectar com o servidor.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20 pt-20 md:pt-24">
      {/* 1. Foto de Capa (Facebook Inspired) - Altura estável e blindada contra achatamento */}
      <div className="relative w-full h-48 sm:h-64 md:h-80 bg-slate-200 overflow-hidden">
        {professional.capaUrl ? (
          <img 
            src={professional.capaUrl} 
            alt="Capa do Profissional" 
            className="w-full h-full object-cover z-0"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-sky-100 to-emerald-50 flex items-end justify-center relative overflow-hidden z-0">
            {/* Camadas do SVG de Serras (Mountain Background) */}
            <div className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320" className="w-full h-full" preserveAspectRatio="none">
                <path fill="#34d399" fillOpacity="0.25" d="M0,224L48,202.7C96,181,192,139,288,149.3C384,160,480,224,576,218.7C672,213,768,139,864,133.3C960,128,1056,192,1152,213.3C1248,235,1344,213,1392,202.7L1440,192L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                <path fill="#10b981" fillOpacity="0.4" d="M0,256L48,245.3C96,235,192,213,288,208C384,203,480,213,576,202.7C672,192,768,160,864,170.7C960,181,1056,235,1152,234.7C1248,235,1344,181,1392,154.7L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                <path fill="#059669" fillOpacity="0.75" d="M0,320L48,298.7C96,277,192,235,288,229.3C384,224,480,256,576,250.7C672,245,768,203,864,186.7C960,171,1056,181,1152,208C1248,235,1344,277,1392,298.7L1440,320L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
              </svg>
            </div>
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900/5">
              <span className="text-emerald-800/15 font-black text-6xl md:text-8xl tracking-widest select-none uppercase font-sans">
                proITA
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-24 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-slate-100">
          
          {/* 2. Cabeçalho Principal */}
          <div className="flex flex-col gap-6 w-full border-b border-slate-100 pb-8">
            
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-end text-center md:text-left w-full">
              {/* Foto de Perfil Sobreposta */}
              <div className="relative shrink-0 -mt-24 md:-mt-28">
                <img 
                  src={professional.avatar} 
                  alt={professional.name} 
                  className="w-36 h-36 md:w-44 md:h-44 rounded-full object-cover border-[6px] border-white shadow-2xl bg-white"
                />
                {professional.verified && (
                  <div className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow-md border border-slate-100" title="Profissional Verificado">
                    <CheckCircle size={24} className="text-emerald-500 fill-emerald-50" />
                  </div>
                )}
                {badge ? (
                  <div className={`absolute -top-2 -right-2 bg-white rounded-full p-2.5 shadow-lg border border-slate-100 hover:scale-110 transition-transform duration-200 ${badge.color}`} title={badge.title}>
                    {badge.icon === 'ShieldCheck' ? <ShieldCheck size={22} className="stroke-[2.5]" /> : <Award size={22} className="stroke-[2.5]" />}
                  </div>
                ) : (
                  <div 
                    className="absolute -top-2 -right-2 bg-white rounded-full p-2.5 shadow-lg border border-slate-100 hover:scale-110 transition-transform duration-200 text-gray-400 grayscale opacity-50 cursor-help" 
                    title="Selo de Verificação: Complete seu perfil e receba avaliações para ativar esta conquista."
                  >
                    <Award size={22} className="stroke-[2.5]" />
                  </div>
                )}
              </div>

              {/* Informações do Bloco */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{professional.name}</h1>
                  {badge ? (
                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm ${badge.color}`} title={badge.title}>
                      {badge.icon === 'ShieldCheck' ? <ShieldCheck size={14} className="stroke-[2.5]" /> : <Award size={14} className="stroke-[2.5]" />}
                      Selo {badge.name}
                    </span>
                  ) : (
                    <span 
                      className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border border-gray-200 bg-gray-50 text-gray-400 grayscale opacity-50 shadow-sm cursor-help select-none" 
                      title="Selo de Verificação: Complete seu perfil e receba avaliações para ativar esta conquista."
                    >
                      <Award size={14} className="stroke-[2.5]" />
                      Selo Inativo
                    </span>
                  )}
                </div>
                
                <p className="text-lg font-bold text-indigo-600 flex items-center justify-center md:justify-start gap-1.5">
                  <Briefcase size={16} />
                  {professional.category}
                </p>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-sm text-slate-500">
                  <span className="flex items-center gap-1 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-200">
                    <MapPin size={14} className="text-slate-400" />
                    Itapipoca - CE
                  </span>
                  <span className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 text-amber-700 font-medium">
                    <Star size={14} className="fill-amber-400 text-amber-400" />
                    {professional.reviewsCount > 0 ? `${professional.rating} (${professional.reviewsCount} avaliações)` : "Novo no proITA"}
                  </span>
                </div>
              </div>
            </div>

            {/* Ações Rápidas - Posicionado abaixo da info no próprio eixo horizontal com largura controlada */}
            <div className="flex flex-row flex-nowrap items-center justify-center md:justify-start gap-2 sm:gap-3 w-full mt-4 md:max-w-2xl">
              {professional.phone && (
                <button 
                  onClick={handlePhoneClick}
                  className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 sm:py-4 rounded-2xl font-bold border border-slate-200 transition-transform active:scale-95 shadow-sm text-xs sm:text-sm"
                >
                  <Phone size={16} /> Ligar
                </button>
              )}
              <button 
                onClick={handleWhatsApp}
                className="flex-[1.5] flex items-center justify-center gap-1.5 sm:gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white py-3.5 sm:py-4 rounded-2xl font-bold shadow-lg shadow-[#25D366]/20 transition-transform active:scale-95 text-xs sm:text-sm shrink-0"
              >
                <MessageCircle size={16} /> WhatsApp
              </button>
              <button 
                className="flex-1 flex items-center justify-center gap-1.5 sm:gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 py-3.5 sm:py-4 rounded-2xl font-bold transition-transform active:scale-95 shadow-sm border border-slate-200 shrink-0 text-xs sm:text-sm"
                title="Compartilhar Perfil"
                onClick={handleShare}
              >
                <Share2 size={16} /> Compartilhar
              </button>
            </div>
          </div>

          {/* Redes Sociais */}
          <div className="flex items-center gap-3 py-4 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Redes Sociais:</span>
            {renderSocialLinks()}
          </div>

          {/* 3. Menu de Abas */}
          <div className="border-b border-slate-100 flex gap-4 overflow-x-auto scrollbar-none">
            {['sobre', 'portfolio', 'servicos', 'avaliacoes', 'parceiros'].map((tab) => {
              const label = {
                sobre: 'Sobre',
                portfolio: 'Portfólio',
                servicos: 'Serviços',
                avaliacoes: `Avaliações (${reviews.length})`,
                parceiros: 'Parceiros'
              }[tab];
              
              const isActive = activeTab === tab;
              
              // Oculta a aba parceiros no desktop (já que ela fica na sidebar no desktop)
              const displayClass = tab === 'parceiros' ? 'lg:hidden' : '';
              
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-4 font-bold text-sm transition-all border-b-2 -mb-[2px] whitespace-nowrap ${displayClass} ${
                    isActive 
                      ? 'border-indigo-600 text-indigo-600' 
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          {/* Conteúdo das Abas */}
          <div className="mt-8">
            {/* Aba 'Sobre' com os 3 quadros obrigatórios */}
            {activeTab === 'sobre' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* Quadro 1: Biografia/Descrição */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="bg-slate-50/50 rounded-3xl p-6 md:p-8 border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Briefcase className="text-indigo-600" size={20} />
                      Sobre o Profissional
                    </h2>
                    <p className="text-slate-600 leading-relaxed text-[15px] whitespace-pre-line">
                      {professional.fullDescription || 'Nenhuma descrição detalhada fornecida.'}
                    </p>
                    {ownerName && (
                      <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 opacity-85 font-medium">
                        <span>Anunciante Titular:</span>
                        <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-md border border-indigo-100">Por {ownerName}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coluna da Direita (Quadros 2 e 3) */}
                <div className="space-y-6">
                  {/* Quadro 2: Horário de Atendimento */}
                  <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
                    <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                      <Clock className="text-indigo-600" size={18} />
                      Horário de Atendimento
                    </h3>
                    {professional.horariosFuncionamento ? (
                      renderHorarios(professional.horariosFuncionamento)
                    ) : (
                      <p className="text-slate-400 text-sm italic">
                        Horários de atendimento não definidos pelo profissional
                      </p>
                    )}
                  </div>

                  {/* Quadro 3: Localização / Endereço */}
                  <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 flex flex-col justify-between">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                        <MapPin className="text-indigo-600" size={18} />
                        Localização / Endereço
                      </h3>
                      {professional.enderecoComercial ? (
                        <div className="space-y-2">
                          <p className="text-slate-700 text-sm font-medium">
                            {professional.enderecoComercial}
                          </p>
                          {professional.location && (
                            <p className="text-slate-500 text-xs">
                              Bairro de atuação principal: {professional.location}
                            </p>
                          )}
                        </div>
                      ) : professional.location ? (
                        <div className="space-y-2">
                          <p className="text-slate-700 text-sm font-medium">
                            Atendimento a Domicílio
                          </p>
                          <p className="text-slate-500 text-xs">
                            Bairro de atuação principal: {professional.location}
                          </p>
                        </div>
                      ) : (
                        <p className="text-slate-400 text-sm italic">
                          Localização não definida
                        </p>
                      )}
                    </div>

                    {(professional.enderecoComercial || professional.location) && (
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${professional.enderecoComercial || professional.location}, Itapipoca, CE`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-5 w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 hover:text-indigo-800 border border-indigo-200 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 shadow-sm shadow-indigo-100/50"
                      >
                        <MapPin size={14} /> Como Chegar (Abrir GPS)
                      </a>
                    )}
                  </div>

                  {/* Quadro de Parceiros (Desktop Sidebar) */}
                  {(() => {
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
                      <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100 hidden lg:block">
                        <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                          <Users className="text-indigo-600" size={18} />
                          Parceiro
                        </h3>
                        <SponsorSlider partners={valid} layout="sidebar" />
                      </div>
                    );
                  })()}

                  {/* Quadro Extra de Garantias/Segurança */}
                  <div className="bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 p-6 rounded-3xl border border-indigo-100/50 text-center">
                    <Shield className="text-indigo-600 mx-auto mb-3" size={32} />
                    <h4 className="font-bold text-slate-900 mb-2">Dica de Segurança</h4>
                    <p className="text-xs text-slate-600">Combine detalhes de pagamento e prazos pelo WhatsApp antes de fechar o negócio. O proITA não se responsabiliza por adiantamentos.</p>
                  </div>
                </div>

              </div>
            )}

            {/* Aba 'Portfólio' */}
            {activeTab === 'portfolio' && (
              <div>
                {professional.portfolioUrls && professional.portfolioUrls.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {professional.portfolioUrls.map((url, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => {
                          setCurrentImageIndex(idx);
                          setIsLightboxOpen(true);
                        }}
                        className="group relative overflow-hidden rounded-2xl bg-slate-100 aspect-square shadow-sm border border-slate-100/50 transition-all duration-300 hover:shadow-md hover:scale-[1.02] cursor-pointer"
                      >
                        <img 
                          src={url} 
                          alt={`Portfólio ${idx + 1}`} 
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 rounded-3xl p-10 border border-slate-100 text-center">
                    <ImageIcon className="text-slate-300 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Sem Imagens</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto italic">
                      Este profissional ainda não adicionou imagens ao portfólio.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Aba 'Serviços' */}
            {activeTab === 'servicos' && (
              <div>
                {isFetchingServices ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-sm text-slate-500 font-medium">Carregando catálogo de serviços...</span>
                  </div>
                ) : services.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                    {services.map((service) => {
                      // Formatar preço de acordo com priceType
                      let priceDisplay = '';
                      if (service.priceType === 'FIXO') {
                        priceDisplay = `R$ ${parseFloat(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      } else if (service.priceType === 'A_PARTIR') {
                        priceDisplay = `A partir de R$ ${parseFloat(service.price).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                      } else {
                        priceDisplay = 'Orçamento gratuito';
                      }

                      return (
                        <div key={service.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between h-full group animate-fadeIn">
                          <div className="space-y-3">
                            <div className="flex justify-between items-start gap-4">
                              <h3 className="font-extrabold text-slate-900 text-lg tracking-tight group-hover:text-indigo-600 transition-colors">
                                {service.name}
                              </h3>
                              {service.priceType === 'SOB_CONSULTA' ? (
                                <span className="bg-purple-50 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 border border-purple-100">
                                  Sob Consulta
                                </span>
                              ) : (
                                <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 border border-indigo-100">
                                  {service.priceType === 'FIXO' ? 'Fixo' : 'A partir'}
                                </span>
                              )}
                            </div>

                            <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed min-h-[40px]">
                              {service.description || <span className="italic text-slate-300">Sem descrição detalhada</span>}
                            </p>
                          </div>

                          <div className="mt-6 pt-4 border-t border-slate-100/60 flex items-center justify-between gap-4">
                            <div className="flex flex-col">
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Valor</span>
                              <span className={`font-extrabold text-base md:text-lg tracking-tight ${service.priceType === 'SOB_CONSULTA' ? 'text-purple-600' : 'text-slate-900'}`}>
                                {priceDisplay}
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleServiceWhatsApp(service.name)}
                              className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-5 py-2.5 rounded-xl font-bold shadow-md shadow-[#25D366]/10 transition-all hover:scale-[1.03] active:scale-97 text-xs cursor-pointer"
                            >
                              <MessageCircle size={14} className="stroke-[2.5]" /> Solicitar Orçamento
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 rounded-3xl p-10 border border-slate-100 text-center">
                    <Briefcase className="text-slate-300 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Catálogo Vazio</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto italic">
                      Este profissional ainda não adicionou itens ao seu catálogo de serviços.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Aba 'Avaliações' */}
            {activeTab === 'avaliacoes' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-xl font-bold text-slate-900">
                    Depoimentos de Clientes ({reviews.length})
                  </h2>
                </div>

                {/* Formulário de Avaliação (Disponível apenas para logados que não são os donos do anúncio) */}
                {token && user && user.id !== professional.userId && (
                  <div className="bg-white rounded-3xl p-6 md:p-8 border border-slate-100 shadow-sm mb-8">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Deixe sua Avaliação</h3>
                    
                    {reviewSuccess && (
                      <div className="bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-100 mb-6 text-sm font-medium">
                        {reviewSuccess}
                      </div>
                    )}

                    {reviewError && (
                      <div className="bg-red-50 text-red-800 p-4 rounded-2xl border border-red-100 mb-6 text-sm font-medium">
                        {reviewError}
                      </div>
                    )}

                    <form onSubmit={handleSubmitReview} className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Sua Nota:</span>
                        <div 
                          className="flex items-center gap-1.5"
                          onMouseLeave={() => setFormHoverRating(0)}
                        >
                          {[1, 2, 3, 4, 5].map((star) => {
                            const activeStars = formHoverRating || formRating;
                            const isFilled = star <= activeStars;
                            return (
                              <button
                                key={star}
                                type="button"
                                onClick={() => setFormRating(star)}
                                onMouseEnter={() => setFormHoverRating(star)}
                                className="p-1 text-amber-400 transition-transform hover:scale-110 active:scale-90 focus:outline-none"
                              >
                                <Star 
                                  size={28} 
                                  className={isFilled ? "fill-amber-400 stroke-amber-400" : "text-slate-200 stroke-slate-200"} 
                                />
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Seu Comentário:</span>
                        <textarea
                          value={formComment}
                          onChange={(e) => setFormComment(e.target.value)}
                          placeholder="Escreva como foi sua experiência e qualidade do serviço contratado..."
                          className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm text-slate-700 resize-none transition-all placeholder:text-slate-400"
                          rows="3"
                          required
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingReview}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm px-6 py-3.5 rounded-2xl transition-all shadow-md shadow-indigo-600/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmittingReview ? 'Enviando...' : 'Enviar Avaliação'}
                      </button>
                    </form>
                  </div>
                )}
                
                {isFetchingReviews ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
                    <span className="ml-3 text-sm text-slate-500 font-medium">Buscando avaliações...</span>
                  </div>
                ) : reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map(review => {
                      const authorName = review.author 
                        ? `${review.author.nome} ${review.author.sobrenome || ''}`.trim() 
                        : 'Anônimo';
                      
                      const avatarUrl = review.author?.profileImageUrl 
                        || `https://ui-avatars.com/api/?name=${encodeURIComponent(authorName)}&background=0ea5e9&color=fff&bold=true`;

                      return (
                        <div key={review.id} className="bg-white border border-slate-100 p-6 rounded-3xl shadow-sm flex gap-4">
                          <img 
                            src={avatarUrl} 
                            alt={authorName} 
                            className="w-12 h-12 rounded-full object-cover shrink-0 bg-slate-100 border border-slate-100"
                          />
                          <div className="space-y-1.5 w-full">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                              <span className="font-bold text-slate-800 text-sm sm:text-base">{authorName}</span>
                              <span className="text-xs text-slate-400 font-medium">
                                {new Date(review.createdAt).toLocaleDateString('pt-BR')}
                              </span>
                            </div>
                            
                            <div className="flex text-amber-400">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} size={16} className={i < review.rating ? "fill-amber-400 stroke-amber-400" : "text-slate-200 stroke-slate-200"} />
                              ))}
                            </div>
                            
                            <p className="text-slate-600 text-sm whitespace-pre-line leading-relaxed">
                              {review.comment || 'Nenhum comentário por escrito.'}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="bg-slate-50/50 rounded-3xl p-10 border border-slate-100 text-center">
                    <Star className="text-slate-300 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Sem Avaliações Ainda</h3>
                    <p className="text-slate-500 text-sm max-w-md mx-auto italic">
                      Este profissional ainda não possui avaliações. Seja o primeiro a avaliar!
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Aba 'Parceiros' (Mobile Only) */}
            {activeTab === 'parceiros' && (
              <div className="lg:hidden animate-in fade-in duration-300 space-y-6">
                {(() => {
                  let list = [];
                  try {
                    list = typeof professional.partners === 'string'
                      ? JSON.parse(professional.partners)
                      : (professional.partners || []);
                  } catch {
                    list = professional.partners || [];
                  }
                  const valid = list.filter(p => p && p.imageUrl);
                  if (valid.length === 0) {
                    return (
                      <div className="bg-slate-50/50 rounded-3xl p-10 border border-slate-100 text-center">
                        <Sparkles className="text-slate-300 mx-auto mb-4 animate-pulse" size={48} />
                        <h3 className="text-lg font-bold text-slate-900 mb-2">Sem Parceiros</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto italic">
                          Este profissional ainda não cadastrou parceiros ou patrocinadores locais.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4">
                      <div className="bg-gradient-to-br from-indigo-50/50 to-emerald-50/30 p-6 rounded-3xl border border-slate-100 text-center">
                        <Sparkles className="text-indigo-600 mx-auto mb-3 animate-pulse" size={32} />
                        <h4 className="font-bold text-slate-900 mb-1">Nossos Patrocinadores</h4>
                        <p className="text-xs text-slate-600">Apoie os negócios locais que patrocinam e tornam este trabalho possível!</p>
                      </div>
                      <SponsorSlider partners={valid} layout="tab" />
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Botão de Denúncia sutil */}
      <div className="mt-8 mb-4 text-center">
        <a 
          href={`mailto:suporte@proita.com.br?subject=${encodeURIComponent(`Denúncia de Perfil: ${professional.name}`)}`}
          className="text-red-500 hover:text-red-600 hover:underline text-sm font-semibold transition-colors inline-flex items-center gap-1.5"
        >
          <span>🚩 Encontrou algo errado? Denunciar este perfil.</span>
        </a>
      </div>
      
      {/* Botão de Ação Flutuante para Dispositivos Móveis */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <button 
          onClick={handleWhatsApp}
          className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg shadow-[#25D366]/40 transition-transform active:scale-95"
        >
          <MessageCircle size={28} />
        </button>
      </div>

      {/* Lightbox / Modal do Portfólio */}
      {isLightboxOpen && professional.portfolioUrls && professional.portfolioUrls.length > 0 && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 transition-opacity duration-300 backdrop-blur-xs"
          onClick={() => setIsLightboxOpen(false)}
        >
          {/* Botão Fechar */}
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsLightboxOpen(false);
            }}
            className="absolute top-6 right-6 text-white/75 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-2.5 rounded-full z-50 cursor-pointer shadow-lg"
            title="Fechar Visualização"
          >
            <X size={24} />
          </button>

          {/* Seta Esquerda */}
          {currentImageIndex > 0 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => prev - 1);
              }}
              className="absolute left-4 md:left-8 text-white/75 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-3.5 rounded-full z-50 cursor-pointer shadow-lg"
              title="Imagem Anterior"
            >
              <ChevronLeft size={28} />
            </button>
          )}

          {/* Imagem Centralizada */}
          <div 
            className="relative max-h-[90vh] max-w-[90vw] flex flex-col items-center justify-center select-none"
            onClick={(e) => e.stopPropagation()}
          >
            <img 
              src={professional.portfolioUrls[currentImageIndex]} 
              alt={`Portfólio ampliado ${currentImageIndex + 1}`} 
              className="max-h-[80vh] max-w-[85vw] md:max-h-[85vh] object-contain rounded-xl shadow-2xl transition-all duration-300"
            />
            {/* Indicador de Página no Rodapé da Imagem */}
            <div className="mt-3 text-white/60 text-sm font-semibold tracking-wider bg-black/40 px-3 py-1 rounded-full backdrop-blur-xs">
              {currentImageIndex + 1} / {professional.portfolioUrls.length}
            </div>
          </div>

          {/* Seta Direita */}
          {currentImageIndex < professional.portfolioUrls.length - 1 && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImageIndex(prev => prev + 1);
              }}
              className="absolute right-4 md:right-8 text-white/75 hover:text-white transition-colors bg-white/10 hover:bg-white/20 p-3.5 rounded-full z-50 cursor-pointer shadow-lg"
              title="Próxima Imagem"
            >
              <ChevronRight size={28} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
