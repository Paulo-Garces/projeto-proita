import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import AdCard from '../components/AdCard';
import PaymentCheckout from '../components/PaymentCheckout';
import { ArrowLeft, Mountain, Sun, Calendar, Layers, BarChart3, Award, Image, Sparkles, PlayCircle } from 'lucide-react';
import './Planos.css';

// ─── Configuração dos planos ────────────────────────────────────────────────
const PLAN_CONFIG = {
  basico_anual:        { name: 'Plano Profissional Anual',        price: '44,90' },
  basico_bienal:       { name: 'Plano Profissional Bienal',       price: '74,90' },
  patrocinador_anual:  { name: 'Plano Patrocinador Anual',  price: '54,90' },
  patrocinador_bienal: { name: 'Plano Patrocinador Bienal', price: '94,90' },
  trial:               { name: 'Degustação Gratuita',        price: '0,00'  },
};

export default function Planos() {
  const navigate = useNavigate();
  const { isAuthenticated, user, token, updateUser } = useContext(AuthContext);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
  const [isBienal, setIsBienal] = useState(false);

  const prices = {
    pro: { anual: { price: '44,90', month: '3,74' }, bienal: { price: '74,90', month: '3,12' } },
    patro: { anual: { price: '54,90', month: '4,58' }, bienal: { price: '94,90', month: '3,95' } }
  };

  const getUserStatus = () => {
    if (!user) return 'first_subscription';
    if (user.planStatus === 'DEGUSTACAO') return 'trial_ending';
    if (user.planStatus === 'ATIVO' || user.planStatus === 'BASICO') return 'renewal';
    return 'first_subscription';
  };

  const handlePlanCta = async (planId, e) => {
    e?.preventDefault();
    if (planId) localStorage.setItem('selected_plan', planId);

    if (!user) {
      navigate(`/auth?mode=register&plan=${planId}`);
      return;
    }

    if (planId === 'trial') {
      if (['ATIVO', 'BASICO', 'DEGUSTACAO'].includes(user.planStatus)) {
        navigate('/dashboard/novo-anuncio');
        return;
      }
      try {
        const res = await fetch(`${API_URL}/api/subscriptions/trial`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
          body: JSON.stringify({ planId }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          updateUser(data.user);
          navigate('/dashboard/novo-anuncio');
        } else {
          const message = data.message || 'Erro ao iniciar o período de testes.';
          if (message === 'Você já possui um plano ativo ou em degustação.') {
            updateUser({ planStatus: 'DEGUSTACAO' });
            navigate('/dashboard/novo-anuncio');
          } else {
            alert(message);
          }
        }
      } catch (err) {
        console.error('Erro ao iniciar trial:', err);
        alert('Erro ao conectar com o servidor para iniciar período de degustação.');
      }
      return;
    }

    const config = PLAN_CONFIG[planId] || { name: planId, price: '?' };
    setCheckoutPlan({ planId, name: config.name, price: config.price });
  };

  // Mock profissional real para demonstração na seção "Como aparece pro cliente"
  const previewProfessional = {
    id: 'mock-felipe',
    name: 'Felipe Silva',
    nomeExibicao: 'Felipe',
    sobrenomeExibicao: 'Silva',
    category: 'Eletricista Predial',
    telefoneComercial: '(88) 99900-XXXX',
    serviceBairro: 'Urbano Teixeira',
    avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=150&q=80',
    verified: true,
    rating: 5.0,
    reviewCount: 62,
    planStatus: 'ATIVO',
    planType: 'PATROCINADOR_ANUAL',
    createdAt: '2020-01-01T00:00:00Z',
    horariosFuncionamento: 'Segunda a Sexta, 8h às 18h',
    socialLinks: [
      { platform: 'instagram', url: 'instagram.com/felipesilva' },
      { platform: 'youtube', url: 'youtube.com/felipesilva' },
      { platform: 'facebook', url: 'facebook.com/felipesilva' },
    ],
    partners: JSON.stringify([
      { imageUrl: 'https://placehold.co/120x160/009ee2/ffffff?text=Sua+Marca', name: 'Sua Marca Aqui' },
    ]),
  };

  // ── Tela de checkout ──────────────────────────────────────────────────────
  if (checkoutPlan) {
    return (
      <div className="bg-[#eae7e5] min-h-screen pt-28 pb-20 overflow-x-hidden font-sans">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-center gap-4">
            <button
              onClick={() => setCheckoutPlan(null)}
              className="flex items-center gap-2 text-slate-600 hover:text-slate-900 font-medium text-sm transition-colors group"
            >
              <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
              Voltar aos Planos
            </button>
          </div>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Finalize sua Assinatura</h1>
            <p className="text-slate-500 mt-1 text-sm">Você está a um passo de divulgar seus serviços em Itapipoca!</p>
          </div>
          <PaymentCheckout
            planId={checkoutPlan.planId}
            planName={checkoutPlan.name}
            planPrice={checkoutPlan.price}
            userStatus={getUserStatus()}
            onClose={() => setCheckoutPlan(null)}
          />
        </div>
      </div>
    );
  }

  // ── Página principal com a nova UI ─────────────────────────────────────────
  return (
    <div className="planos-page">
      
      {/* ---------- HERO ---------- */}
      <section className="bg-slate-900 text-white pt-28 pb-20 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-[450px] h-[450px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none opacity-40"></div>
        <div className="absolute bottom-0 right-0 w-[350px] h-[350px] bg-emerald-500/5 rounded-full blur-[90px] pointer-events-none opacity-30"></div>

        <div className="max-w-7xl mx-auto px-6 sm:px-8 relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <span className="inline-flex items-center gap-1.5 bg-amber-400/10 text-amber-300 border border-amber-400/20 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider">
              ★ O Guia dos Três Climas
            </span>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.05] !font-serif">
              Sua vitrine profissional em <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">Itapipoca</span>
            </h1>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl">
              Divulgue seus serviços na serra, no sertão e no litoral. Tenha um perfil profissional moderno, conquiste avaliações reais de clientes e receba contatos diretos pelo WhatsApp sem pagar intermediários.
            </p>
            <div className="flex flex-wrap gap-4 pt-2">
              <button 
                onClick={(e) => handlePlanCta('trial', e)} 
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-600 hover:to-amber-500 text-slate-950 font-extrabold rounded-xl transition-all duration-300 shadow-lg shadow-amber-500/10 hover:shadow-amber-500/20 active:scale-95 cursor-pointer text-center text-sm"
              >
                Começar grátis por 30 dias
              </button>
              <a 
                href="#planos" 
                className="px-6 py-3.5 bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 rounded-xl transition-all duration-300 text-center text-sm cursor-pointer"
              >
                Ver Planos ↓
              </a>
            </div>
          </div>

          {/* Right Column: Diverse Professionals Grid */}
          <div className="lg:col-span-6 relative min-h-[350px] flex items-center justify-center">
            {/* Gradient Overlay for blending */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-slate-900/30 pointer-events-none z-10"></div>
            <div className="absolute -inset-2 bg-gradient-to-r from-slate-900 via-transparent to-slate-900 pointer-events-none z-10"></div>
            
            <div className="grid grid-cols-3 gap-3 w-full max-w-lg relative z-0 opacity-80 hover:opacity-95 transition-opacity duration-500">
              {/* Box 1 - Tall/Large */}
              <div className="col-span-2 row-span-2 relative rounded-2xl overflow-hidden shadow-2xl group aspect-[4/3] sm:aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80" 
                  alt="Eletricista Profissional" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300">Eletricista / Instalações</span>
                </div>
              </div>

              {/* Box 2 - Small */}
              <div className="col-span-1 relative rounded-2xl overflow-hidden shadow-2xl group aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80" 
                  alt="Consultora" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-sky-300">Consultoria</span>
                </div>
              </div>

              {/* Box 3 - Small */}
              <div className="col-span-1 relative rounded-2xl overflow-hidden shadow-2xl group aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&w=300&q=80" 
                  alt="Confeiteira" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-rose-300">Confeitaria</span>
                </div>
              </div>

              {/* Box 4 - Wide */}
              <div className="col-span-2 relative rounded-2xl overflow-hidden shadow-2xl group aspect-[2/1]">
                <img 
                  src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80" 
                  alt="Costureira" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-3">
                  <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-emerald-300">Costura & Artesanato</span>
                </div>
              </div>

              {/* Box 5 - Small */}
              <div className="col-span-1 relative rounded-2xl overflow-hidden shadow-2xl group aspect-square">
                <img 
                  src="https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80" 
                  alt="Personal Trainer" 
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-2">
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-amber-300">Saúde & Bem-Estar</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- TRIAL STRIP ---------- */}
      <div className="bg-slate-50 border-b border-slate-200/40 py-5">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 flex flex-wrap items-center justify-center gap-8 md:gap-12">
          <div className="flex items-center gap-2.5 text-slate-700 text-xs sm:text-sm font-semibold font-sans">
            <svg className="text-emerald-600 w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            30 dias 100% grátis
          </div>
          <div className="flex items-center gap-2.5 text-slate-700 text-xs sm:text-sm font-semibold font-sans">
            <svg className="text-emerald-600 w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sem cobrança automática
          </div>
        </div>
      </div>

      {/* ---------- COMO FUNCIONA + VIDEO ---------- */}
      <section className="bg-slate-50 py-20 border-b border-slate-200/50">
        <div className="max-w-7xl mx-auto px-6 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column: Steps */}
          <div className="space-y-8 text-left">
            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-primary font-sans">Passo a Passo</span>
              <h2 className="text-3xl font-bold text-slate-900 mt-2 !font-serif">Como funciona o proITA?</h2>
              <p className="text-slate-500 mt-2 text-sm leading-relaxed font-sans">
                Entenda como a plataforma te conecta a clientes em toda Itapipoca em apenas 3 passos simples.
              </p>
            </div>

            <div className="space-y-6 font-sans">
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">1</div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">Cadastro Rápido</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Crie sua conta e configure o seu perfil preenchendo sua categoria, localização e descrição dos seus serviços.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">2</div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">Visibilidade Local</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Seu anúncio passa a aparecer nas buscas e categorias em toda a região de Itapipoca (serra, sertão e litoral).
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-lg shrink-0">3</div>
                <div>
                  <h4 className="text-base font-bold text-slate-800">Negociação Direta no WhatsApp</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Os clientes te encontram e entram em contato direto pelo seu WhatsApp, sem intermediários, taxas ou comissões.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Video Placeholder */}
          <div className="w-full max-w-xl mx-auto">
            {/* TODO: Substituir esta div pelo iframe do YouTube quando o vídeo estiver pronto */}
            <div className="w-full aspect-video bg-slate-100 rounded-xl shadow-lg border border-slate-200 flex flex-col items-center justify-center text-slate-400 gap-2">
              <PlayCircle size={48} />
              <span className="text-sm font-semibold font-sans">Vídeo explicativo em breve...</span>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- PLANS SECTION ---------- */}
      <section className="plans-section" id="planos">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">Planos</span>
            <h2>Escolha até onde seu anúncio chega</h2>
            <p>Preço claro, sem letra miúda. Quanto mais alto o plano, mais visibilidade seu perfil ganha.</p>
          </div>

          <div className="toggle-wrap">
            <div className={`toggle ${isBienal ? 'bienal' : ''}`} id="toggle">
              <button 
                type="button"
                className={!isBienal ? 'active' : ''} 
                onClick={() => setIsBienal(false)}
              >
                Anual
              </button>
              <button 
                type="button"
                className={isBienal ? 'active' : ''} 
                onClick={() => setIsBienal(true)}
              >
                Bienal
              </button>
              <span className="pill"></span>
            </div>
          </div>

          <div className="cards">

            {/* GRÁTIS */}
            <div className="card">
              <div className="climate-icon litoral">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <path d="M2 18c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 4.5 0 3-1.5 4.5 0" stroke="var(--litoral)" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M2 13c1.5 1.5 3 1.5 4.5 0s3-1.5 4.5 0 3 1.5 4.5 0 3-1.5 4.5 0" stroke="var(--litoral)" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
                </svg>
              </div>
              <div className="card-tier">Praia</div>
              <h3>Grátis</h3>
              <p className="desc">Pra testar a plataforma antes de decidir.</p>
              <div className="price-row">
                <span className="amount">R$0</span>
                <span className="period">/ 30 dias</span>
              </div>
              <div className="price-month">Depois, seu anúncio fica pausado até você decidir continuar.</div>
              <ul className="feat">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--serra)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Perfil completo no proITA
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--serra)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Todas as funcionalidades liberadas
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--serra)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Cancele quando quiser, sem custo
                </li>
              </ul>
              <button onClick={(e) => handlePlanCta('trial', e)} className="btn cta cta-free">
                Começar grátis
              </button>
            </div>

            {/* PROFISSIONAL */}
            <div className="card featured featured-pro">
              {isBienal && (
                <span className="card-badge" id="badge-pro">Melhor custo-benefício</span>
              )}
              <div className="climate-icon serra">
                <Mountain size={22} />
              </div>
              <div className="card-tier">Serra</div>
              <h3>Profissional</h3>
              <p className="desc">Presença profissional completa na plataforma.</p>
              <div className="price-row">
                <span className="currency">R$</span>
                <span className="amount num" id="pro-price">
                  {isBienal ? prices.pro.bienal.price : prices.pro.anual.price}
                </span>
                <span className="period" id="pro-period">
                  {isBienal ? '/2 anos' : '/ano'}
                </span>
              </div>
              <div className="price-month" id="pro-month">
                Equivalente a <strong>R${isBienal ? prices.pro.bienal.month : prices.pro.anual.month}/mês</strong>
              </div>
              <ul className="feat">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--serra)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Avaliações e notas completas
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--serra)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Portfólio de serviços com fotos
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--serra)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Selo de reputação (Bronze/Prata/Ouro)
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--serra)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Estatísticas de acesso e desempenho
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--serra)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Até 2 anúncios simultâneos
                </li>
              </ul>
              <button 
                onClick={(e) => handlePlanCta(isBienal ? 'basico_bienal' : 'basico_anual', e)} 
                className="btn cta cta-pro"
              >
                Assinar Profissional
              </button>
            </div>

            {/* PATROCINADOR */}
            <div className="card featured featured-patro">
              <span className="card-badge">Recomendado</span>
              <div className="climate-icon sertao">
                <Sun size={22} />
              </div>
              <div className="card-tier">Sertão</div>
              <h3>Patrocinador</h3>
              <p className="desc">Tudo do Profissional, mais o Espaço Parceiro pra monetizar seu perfil.</p>
              <div className="price-row">
                <span className="currency">R$</span>
                <span className="amount num" id="patro-price">
                  {isBienal ? prices.patro.bienal.price : prices.patro.anual.price}
                </span>
                <span className="period" id="patro-period">
                  {isBienal ? '/2 anos' : '/ano'}
                </span>
              </div>
              <div className="price-month" id="patro-month">
                Equivalente a <strong>R${isBienal ? prices.patro.bienal.month : prices.patro.anual.month}/mês</strong>
              </div>
              <div 
                className="savings" 
                id="patro-save" 
                style={{ visibility: isBienal ? 'visible' : 'hidden' }}
              >
                Economize R$ 14,90 no plano bienal
              </div>
              <ul className="feat">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17l-5-5" stroke="var(--serra)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Tudo do plano Profissional
                </li>
                <li className="extra">
                  🏆 Espaço Parceiro: revenda até 3 cotas publicitárias e gere renda extra
                </li>
              </ul>
              <button 
                onClick={(e) => handlePlanCta(isBienal ? 'patrocinador_bienal' : 'patrocinador_anual', e)} 
                className="btn cta cta-patro"
              >
                Assinar Patrocinador
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ---------- FEATURES BAND ---------- */}
      <div className="features-band">
        <div className="wrap">
          <div className="section-head">
            <span className="kicker">Sempre incluso</span>
            <h2>O que todo plano pago carrega</h2>
          </div>
          <div className="feat-grid">
            <div className="feat-cell">
              <div className="ic">
                <Calendar size={18} />
              </div>
              <div>
                <h4>30 dias de teste grátis</h4>
                <p>Todo plano pago começa com um mês pra você experimentar sem risco.</p>
              </div>
            </div>
            <div className="feat-cell">
              <div className="ic">
                <Layers size={18} />
              </div>
              <div>
                <h4>Até 2 anúncios simultâneos</h4>
                <p>Divulgue mais de um serviço com o mesmo perfil.</p>
              </div>
            </div>
            <div className="feat-cell">
              <div className="ic">
                <BarChart3 size={18} />
              </div>
              <div>
                <h4>Estatísticas de desempenho</h4>
                <p>Acompanhe visitas, cliques e contatos recebidos.</p>
              </div>
            </div>
            <div className="feat-cell">
              <div className="ic">
                <Award size={18} />
              </div>
              <div>
                <h4>Selos de reputação</h4>
                <p>Bronze, prata e ouro conforme suas avaliações crescem.</p>
              </div>
            </div>
            <div className="feat-cell">
              <div className="ic">
                <Image size={18} />
              </div>
              <div>
                <h4>Portfólio com fotos</h4>
                <p>Mostre seus trabalhos direto no perfil.</p>
              </div>
            </div>
            <div className="feat-cell">
              <div className="ic">
                <Sparkles size={18} />
              </div>
              <div>
                <h4>Categorização por IA</h4>
                <p>Seu serviço aparece nas buscas certas, automaticamente.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- PROFILE PREVIEW ---------- */}
      <section className="preview-section">
        <div className="wrap">
          <div className="preview-layout">
            
            {/* Render do AdCard real da plataforma com dados mockados customizados */}
            <div className="w-full flex justify-center">
              <div className="w-full max-w-[420px] pointer-events-none select-none">
                <AdCard professional={previewProfessional} />
              </div>
            </div>

            <div className="preview-text">
              <span className="kicker">Como aparece pro cliente</span>
              <h2>Um cartão simples, feito pra fechar contato.</h2>
              <p className="lead">Perfil fictício apenas pra ilustrar — assim que o seu ficaria pronto pra receber cliques.</p>
              <div className="mini-list">
                <div className="row">
                  <div className="num-badge">1</div>
                  <div>
                    <h5>Nota e selo à vista</h5>
                    <p>Reputação e verificação aparecem antes de qualquer coisa.</p>
                  </div>
                </div>
                <div className="row">
                  <div className="num-badge">2</div>
                  <div>
                    <h5>Botão de WhatsApp direto</h5>
                    <p>Cliente chama sem precisar sair da tela.</p>
                  </div>
                </div>
                <div className="row">
                  <div className="num-badge">3</div>
                  <div>
                    <h5>Categoria clara</h5>
                    <p>Fica fácil saber, de cara, que serviço você oferece.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ---------- FINAL CTA ---------- */}
      <div className="final-cta wrap">
        <h2>Pronto pra aparecer nos três climas de Itapipoca?</h2>
        <p>Comece grátis agora. Se fizer sentido pra você, escolhe um plano depois.</p>
        <div className="hero-ctas">
          <button onClick={(e) => handlePlanCta('trial', e)} className="btn btn-primary">
            Começar grátis por 30 dias
          </button>
        </div>
      </div>

    </div>
  );
}
