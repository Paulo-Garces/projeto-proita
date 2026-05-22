import { useParams, Link } from 'react-router-dom';
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
  ChevronRight
} from 'lucide-react';

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

export default function Profile() {
  const { id } = useParams();
  const { user, token } = useContext(AuthContext);
  const [professional, setProfessional] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('sobre');

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
              ? profile.telefoneComercial
              : (profile.user?.telefone || profile.servicePhone || profile.whatsapp || null),
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
            verified: true
          });
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

  const handleWhatsApp = () => {
    if (professional.phone) {
      const cleanPhone = professional.phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      window.open(`https://wa.me/${finalPhone}?text=Olá! Encontrei seu perfil no proITA e gostaria de um orçamento.`, '_blank');
    }
  };

  const handleServiceWhatsApp = (serviceName) => {
    if (professional.phone) {
      const cleanPhone = professional.phone.replace(/\D/g, '');
      const finalPhone = cleanPhone.startsWith('55') ? cleanPhone : `55${cleanPhone}`;
      const message = `Olá! Vi o seu perfil no proITA e gostaria de solicitar um orçamento para o serviço de ${serviceName}.`;
      window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(message)}`, '_blank');
    } else {
      alert("Este profissional não cadastrou um contato de WhatsApp válido.");
    }
  };

  const handleShare = () => {
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
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* 1. Foto de Capa (Facebook Inspired) */}
      <div className="relative w-full aspect-[3/1] bg-slate-200 overflow-hidden">
        {professional.capaUrl ? (
          <img 
            src={professional.capaUrl} 
            alt="Capa do Profissional" 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-sky-700 via-indigo-700 to-indigo-900 flex items-center justify-center relative overflow-hidden">
            <div className="absolute w-96 h-96 rounded-full bg-white/5 -top-20 -left-20 blur-3xl"></div>
            <div className="absolute w-80 h-80 rounded-full bg-indigo-500/20 bottom-10 right-10 blur-2xl"></div>
            <div className="text-white/10 font-black text-5xl md:text-8xl tracking-widest select-none uppercase font-sans">
              proITA
            </div>
          </div>
        )}
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 md:-mt-24 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-slate-100">
          
          {/* 2. Cabeçalho Principal */}
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-end justify-between border-b border-slate-100 pb-8">
            
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-end text-center md:text-left">
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
              </div>

              {/* Informações do Bloco */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">{professional.name}</h1>
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

            {/* Ações Rápidas */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto mt-4 md:mt-0">
              {professional.phone && (
                <button 
                  onClick={() => window.location.href = `tel:${professional.phone.replace(/\D/g,'')}`}
                  className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-3.5 rounded-2xl font-bold border border-slate-200 transition-transform active:scale-95 shadow-sm text-sm"
                >
                  <Phone size={18} /> Ligar
                </button>
              )}
              <button 
                onClick={handleWhatsApp}
                className="flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-[#25D366]/20 transition-transform active:scale-95 text-sm"
              >
                <MessageCircle size={18} /> WhatsApp
              </button>
              <button 
                className="flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 p-3.5 rounded-2xl font-bold transition-transform active:scale-95 shadow-sm border border-slate-200"
                title="Compartilhar Perfil"
                onClick={handleShare}
              >
                <Share2 size={18} />
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
            {['sobre', 'portfolio', 'servicos', 'avaliacoes'].map((tab) => {
              const label = {
                sobre: 'Sobre',
                portfolio: 'Portfólio',
                servicos: 'Serviços',
                avaliacoes: `Avaliações (${reviews.length})`
              }[tab];
              
              const isActive = activeTab === tab;
              
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-4 font-bold text-sm transition-all border-b-2 -mb-[2px] whitespace-nowrap ${
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
                  <div className="bg-slate-50/50 rounded-3xl p-6 border border-slate-100">
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
                    ) : (
                      <p className="text-slate-400 text-sm italic">
                        Endereço comercial não adicionado
                      </p>
                    )}
                  </div>

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
          </div>

        </div>
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
