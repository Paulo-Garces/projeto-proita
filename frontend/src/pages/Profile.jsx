import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Star, MapPin, CheckCircle, MessageCircle, Share2, Shield, Clock, Camera } from 'lucide-react';

export default function Profile() {
  const { id } = useParams();
  const [professional, setProfessional] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/ads/${id}`);
        const data = await res.json();
        if (res.ok && data.success) {
          const profile = data.data;
          let instagram = '';
          if (profile.redesSociais) {
            if (Array.isArray(profile.redesSociais)) {
              const instaMatch = profile.redesSociais.find(r => r.includes('instagram'));
              if (instaMatch) instagram = instaMatch;
            } else if (typeof profile.redesSociais === 'object') {
              instagram = profile.redesSociais.instagram || '';
            }
          }

          setProfessional({
            id: profile.id,
            name: `${profile.user.nome} ${profile.user.sobrenome}`,
            category: profile.atividadePrincipal,
            rating: 5.0,
            reviewsCount: 0,
            reviews: [],
            location: profile.user.bairro || 'Itapipoca',
            fullDescription: profile.descricaoTrabalho,
            phone: profile.user.telefone,
            instagram: instagram,
            avatar: profile.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.user.nome)}+${encodeURIComponent(profile.user.sobrenome)}&background=0ea5e9&color=fff&bold=true`,
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
    // In a real app, this would open WhatsApp with a pre-filled message
    window.open(`https://wa.me/${professional.phone}?text=Olá! Encontrei seu perfil no proITA e gostaria de um orçamento.`, '_blank');
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-20">
      {/* Cover */}
      <div className="h-64 bg-slate-900 w-full relative">
        <img 
          src="https://images.unsplash.com/photo-1541888086925-ebca89b8c2bc?auto=format&fit=crop&w=1920&q=80" 
          alt="Cover" 
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent"></div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 -mt-24 relative z-10">
        <div className="bg-white rounded-3xl shadow-xl p-6 md:p-10 border border-slate-100">
          
          {/* Header Profile */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="relative -mt-16 md:-mt-20 shrink-0">
              <img 
                src={professional.avatar} 
                alt={professional.name} 
                className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-lg bg-white"
              />
              {professional.verified && (
                <div className="absolute bottom-2 right-2 bg-white rounded-full p-1 shadow-sm" title="Profissional Verificado">
                  <CheckCircle size={28} className="text-emerald-500 fill-emerald-50" />
                </div>
              )}
            </div>
            
            <div className="flex-1 w-full">
              <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                <div>
                  <h1 className="text-3xl font-extrabold text-slate-900 flex items-center gap-2">
                    {professional.name}
                  </h1>
                  <p className="text-lg font-medium text-primary mt-1">{professional.category}</p>
                  
                  <div className="flex items-center gap-4 mt-3 text-sm">
                    <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-full text-amber-700 font-semibold border border-amber-100">
                      {professional.reviewsCount > 0 ? (
                        <>
                          <Star size={16} className="fill-amber-500 text-amber-500" />
                          {professional.rating} ({professional.reviewsCount} avaliações)
                        </>
                      ) : (
                        <span className="text-emerald-600 bg-emerald-50 px-1 rounded-full">Novo na plataforma</span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-slate-600">
                      <MapPin size={16} /> {professional.location || 'Itapipoca'}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-3 flex-wrap">
                  {professional.instagram && (
                    <button 
                      className="p-2.5 bg-pink-50 text-pink-600 hover:bg-pink-100 rounded-full transition-colors"
                      title="Instagram"
                      onClick={(e) => { 
                        e.preventDefault(); 
                        const isUrl = professional.instagram.startsWith('http');
                        const instaUrl = isUrl ? professional.instagram : `https://instagram.com/${professional.instagram.replace('@', '')}`;
                        window.open(instaUrl, '_blank'); 
                      }}
                    >
                      <Camera size={20} />
                    </button>
                  )}
                  <button 
                    className="p-2.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
                    title="Compartilhar"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/profile/${professional.id}`);
                      alert('Link copiado!');
                    }}
                  >
                    <Share2 size={20} />
                  </button>
                  <button 
                    onClick={handleWhatsApp}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white px-6 py-2.5 rounded-full font-bold shadow-lg shadow-[#25D366]/30 transition-transform active:scale-95"
                  >
                    <MessageCircle size={20} /> WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-12">
            
            {/* Left Column (Main content) */}
            <div className="lg:col-span-2 space-y-10">
              <section>
                <h2 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
                  Sobre o Serviço
                </h2>
                <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                  <p className="whitespace-pre-line">{professional.fullDescription}</p>
                </div>
              </section>

              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-xl font-bold text-slate-900">
                    Avaliações ({professional.reviews.length})
                  </h2>
                </div>
                
                <div className="space-y-4">
                  {professional.reviews.map(review => (
                    <div key={review.id} className="bg-white border border-slate-100 p-5 rounded-2xl shadow-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className="font-bold text-slate-800">{review.author}</div>
                        <div className="flex text-amber-400">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} size={14} className={i < review.rating ? "fill-amber-400" : "text-slate-200"} />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Right Column (Sidebar info) */}
            <div className="space-y-6">
              <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="font-bold text-slate-900 mb-4">Informações</h3>
                <ul className="space-y-4">
                  <li className="flex items-start gap-3">
                    <Clock className="text-primary mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Horário de Atendimento</p>
                      <p className="text-sm text-slate-500">Seg a Sex: 08h às 18h</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <Shield className="text-emerald-500 mt-0.5" size={20} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">Garantia proITA</p>
                      <p className="text-sm text-slate-500">Profissional com identidade verificada.</p>
                    </div>
                  </li>
                </ul>
              </div>
              
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 p-6 rounded-2xl border border-primary/20 text-center">
                <Shield className="text-primary mx-auto mb-3" size={32} />
                <h4 className="font-bold text-slate-900 mb-2">Dica de Segurança</h4>
                <p className="text-xs text-slate-600">Combine detalhes de pagamento e prazos pelo chat antes de fechar o negócio. O proITA não se responsabiliza por adiantamentos.</p>
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Floating Action Button for Mobile */}
      <div className="fixed bottom-6 right-6 md:hidden z-50">
        <button 
          onClick={handleWhatsApp}
          className="flex items-center justify-center w-14 h-14 bg-[#25D366] text-white rounded-full shadow-lg shadow-[#25D366]/40"
        >
          <MessageCircle size={28} />
        </button>
      </div>
    </div>
  );
}
