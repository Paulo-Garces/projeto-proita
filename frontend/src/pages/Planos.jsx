import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';
import AdCard from '../components/AdCard';
import PaymentCheckout from '../components/PaymentCheckout';
import { ArrowLeft, Mountain, Sun, Calendar, Layers, BarChart3, Award, Image, Sparkles } from 'lucide-react';
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
      <section className="hero">
        <div className="horizon">
          <svg viewBox="0 0 1200 520" preserveAspectRatio="xMidYMax slice" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,220 C220,150 420,260 620,190 C820,120 1000,210 1200,160 L1200,0 L0,0 Z" fill="#E8F4F1" opacity="0.55"/>
            <path d="M0,300 C260,240 460,330 700,270 C900,222 1050,290 1200,250 L1200,0 L0,0 Z" fill="#E6F2ED" opacity="0.35"/>
            <path d="M0,360 C240,330 500,400 760,350 C960,312 1080,360 1200,340 L1200,520 L0,520 Z" fill="#FEF3C7" opacity="0.28"/>
            <path d="M0,430 C260,400 520,455 800,415 C980,390 1090,420 1200,410 L1200,520 L0,520 Z" fill="#E0F2FE" opacity="0.55"/>
            <path d="M0,470 C280,450 540,495 820,465 C1000,445 1100,468 1200,460 L1200,520 L0,520 Z" fill="#BAE6FD" opacity="0.6"/>
          </svg>
        </div>
        <div className="hero-inner">
          <span className="eyebrow">★ O guia dos três climas</span>
          <h1>Seu serviço visto na <em>serra</em>, no <em>sertão</em><br />e no <em>litoral</em> de Itapipoca.</h1>
          <p className="sub">Um perfil profissional, avaliações reais e clientes chegando pelo WhatsApp. Comece hoje, teste por 30 dias sem gastar nada.</p>
          <div className="hero-ctas">
            <button onClick={(e) => handlePlanCta('trial', e)} className="btn btn-primary">
              Começar grátis por 30 dias
            </button>
            <a href="#planos" className="btn btn-ghost">Ver planos ↓</a>
          </div>
        </div>
      </section>

      {/* ---------- TRIAL STRIP ---------- */}
      <div className="trial-strip">
        <div className="wrap">
          <div className="trial-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="var(--serra)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            30 dias 100% grátis
          </div>
          <div className="trial-item">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M20 6L9 17l-5-5" stroke="var(--serra)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Sem cobrança automática
          </div>
        </div>
      </div>

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
