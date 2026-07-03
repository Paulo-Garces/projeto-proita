import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  CheckCircle, Sparkles, Check, X, ArrowLeft, ArrowUp,
  Trophy, Star, Zap, Users, BarChart3, Image, Award,
  Smartphone, BadgeCheck, Store, ChevronUp
} from 'lucide-react';
import { API_URL } from '../config';
import AdCard from '../components/AdCard';
import PaymentCheckout from '../components/PaymentCheckout';

// ─── Configuração dos planos ────────────────────────────────────────────────
const PLAN_CONFIG = {
  basico_anual:        { name: 'Plano Profissional Anual',        price: '35,90' },
  basico_bienal:       { name: 'Plano Profissional Bienal',       price: '59,90' },
  patrocinador_anual:  { name: 'Plano Patrocinador Anual',  price: '45,90' },
  patrocinador_bienal: { name: 'Plano Patrocinador Bienal', price: '79,90' },
  trial:               { name: 'Degustação Gratuita',        price: '0,00'  },
};

// ─── Benefícios base (compartilhados entre Profissional e Patrocinador) ───────────
const BASE_BENEFITS = [
  'Perfil completo no proITA',
  'Avaliações e notas completas',
  'Portfólio de serviços com fotos',
  'Selos de Verificação (Bronze/Prata/Ouro)',
  'Estatísticas de acesso e desempenho',
  'Até 2 anúncios simultâneos',
];

// ─── Features descritivas da lateral do mockup ─────────────────────────────
const MOCKUP_FEATURES = [
  {
    icon: <Image size={20} className="text-[#009ee2]" />,
    bg: 'bg-blue-50',
    title: 'Sua foto ou logo no perfil',
    desc: 'Imprime credibilidade imediata ao primeiro olhar do cliente.',
  },
  {
    icon: <Smartphone size={20} className="text-pink-500" />,
    bg: 'bg-pink-50',
    title: 'Atalho para suas redes sociais',
    desc: 'Direcione clientes ao seu Instagram, Facebook e YouTube com um clique.',
  },
  {
    icon: <Zap size={20} className="text-emerald-600" />,
    bg: 'bg-emerald-50',
    title: 'Botão direto no WhatsApp',
    desc: 'Contato instantâneo sem taxas ou intermediários.',
  },
  {
    icon: <Users size={20} className="text-[#009ee2]" />,
    bg: 'bg-blue-50',
    title: 'Página de perfil completa',
    desc: 'Catálogo de serviços e qualificações sempre online e acessível.',
  },
  {
    icon: <Store size={20} className="text-amber-500" />,
    bg: 'bg-amber-50',
    title: 'Espaço Parceiro (Patrocinador)',
    desc: 'Banner lateral para exibir marcas parceiras e gerar renda extra.',
  },
];

export default function Planos() {
  const navigate = useNavigate();
  const { isAuthenticated, user, token, updateUser } = useContext(AuthContext);
  const [checkoutPlan, setCheckoutPlan] = useState(null);

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

  // Mock profissional para demonstração
  const mockProfessional = {
    id: 'mock-joao',
    name: 'João Silva',
    category: 'Eletricista Predial',
    servicePhone: '(88) 99999-0000',
    serviceBairro: 'Centro',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    verified: true,
    rating: 5.0,
    reviewCount: 12,
    planStatus: 'ATIVO',
    createdAt: '2020-01-01T00:00:00Z',
    horariosFuncionamento: 'Segunda a Sexta, 8h às 18h',
    socialLinks: [
      { platform: 'instagram', url: 'instagram.com/joaosilva' },
      { platform: 'facebook', url: 'facebook.com/joaosilva' },
      { platform: 'youtube', url: 'youtube.com/joaosilva' },
    ],
    partners: JSON.stringify([
      { imageUrl: 'https://placehold.co/120x60/009ee2/ffffff?text=Sua+Marca', name: 'Sua Marca Aqui' },
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

  // ── Página principal ───────────────────────────────────────────────────────
  return (
    <div className="bg-[#eae7e5] min-h-screen overflow-x-hidden font-sans">

      {/* ===================================================================== */}
      {/* HERO SECTION — Parallax + Overlay                                      */}
      {/* ===================================================================== */}
      <section
        className="relative w-full min-h-[420px] md:min-h-[500px] flex items-center justify-center bg-fixed bg-center bg-cover"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1553484771-371a605b060b?w=1600&q=80')",
        }}
      >
        {/* Overlay com gradiente para o fundo da página */}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/80 via-slate-900/70 to-[#eae7e5]/90" />

        <div className="relative z-10 text-center px-4 py-24 pt-36">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 backdrop-blur-sm text-white/90 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Star size={12} className="text-amber-400 fill-amber-400" />
            Encontre seu plano ideal
          </div>
          <h1 className="text-5xl md:text-6xl font-black text-white tracking-tight leading-none mb-4 drop-shadow-lg">
            Planos e Preços
          </h1>
          <p className="text-white/80 text-lg md:text-xl font-medium max-w-xl mx-auto leading-relaxed">
            Divulgue seus serviços em Itapipoca com qualidade profissional.<br />
            Comece grátis, sem cartão de crédito.
          </p>

          {/* CTA Hero */}
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <button
              onClick={(e) => handlePlanCta('trial', e)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-black px-8 py-3.5 rounded-full shadow-lg shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95 text-base cursor-pointer"
            >
              Começar 30 dias grátis
            </button>
            <a
              href="#planos"
              className="bg-white/15 hover:bg-white/25 border border-white/30 text-white font-bold px-8 py-3.5 rounded-full backdrop-blur-sm transition-all hover:scale-105 text-base"
            >
              Ver planos pagos ↓
            </a>
          </div>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* =================================================================== */}
        {/* BLOCO GRÁTIS                                                         */}
        {/* =================================================================== */}
        <div className="mt-16 bg-white rounded-3xl border border-slate-200 p-8 md:p-10 shadow-md max-w-4xl mx-auto hover:shadow-lg transition-shadow duration-300">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-8 text-left space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                  <Zap size={24} className="text-emerald-500" />
                </div>
                <h2 className="text-4xl font-black text-emerald-500 tracking-tight">Grátis</h2>
              </div>
              <ul className="space-y-2">
                {['30 Dias 100% Grátis', 'Sem limitações de funcionalidades', 'Sem cobrança automática'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-slate-800 font-extrabold text-sm">
                    <CheckCircle className="text-emerald-500 shrink-0" size={18} />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="text-sm text-slate-500 font-normal leading-relaxed max-w-xl">
                Terminou o período? Seu anúncio simplesmente fica aguardando você decidir se quer continuar. Sem surpresas.
              </p>
            </div>
            <div className="md:col-span-4 flex justify-start md:justify-end items-center">
              <button
                onClick={(e) => handlePlanCta('trial', e)}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-black px-8 py-3 rounded-full shadow-md transition-all hover:scale-105 active:scale-95 text-base cursor-pointer"
              >
                Começar Grátis
              </button>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* TÍTULO DA SEÇÃO DE PLANOS                                            */}
        {/* =================================================================== */}
        <div id="planos" className="text-center mt-20 mb-12 scroll-mt-28">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Escolha seu Plano</h2>
          <p className="text-slate-500 font-medium text-base mt-2">
            Invista no crescimento do seu negócio com preços acessíveis.
          </p>
        </div>

        {/* =================================================================== */}
        {/* GRID DOS 4 PLANOS LADO A LADO (SEM TABS)                             */}
        {/* =================================================================== */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-16">

          {/* ── BÁSICO ANUAL ── */}
          <div className="bg-white rounded-3xl border border-slate-200 p-7 flex flex-col hover:shadow-xl hover:border-blue-200 transition-all duration-300 relative group">
            <div>
              <div className="inline-block bg-slate-100 text-slate-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                Essencial · Anual
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Plano Profissional</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Divulgue seus serviços com qualidade, avaliações e portfólio.
              </p>
              <div className="mb-6">
                <div className="flex items-baseline gap-1 text-slate-900">
                  <span className="text-sm font-bold">R$</span>
                  <span className="text-4xl font-extrabold tracking-tight">35,90</span>
                  <span className="text-slate-400 font-medium text-sm">/ano</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Equivalente a R$ 2,99 / mês</p>
              </div>
              <div className="h-px bg-slate-100 mb-5" />
              <ul className="space-y-3">
                {BASE_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-slate-700 font-semibold text-xs">
                    <Check className="text-emerald-500 shrink-0 mt-0.5" size={15} />
                    {b}
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-red-400 font-semibold text-xs">
                  <X className="text-red-400 shrink-0 mt-0.5" size={15} />
                  <span>Sem acesso ao Espaço Parceiro (Monetização)</span>
                </li>
              </ul>
            </div>
            <button
              onClick={(e) => handlePlanCta('basico_anual', e)}
              className="mt-8 w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl transition-all active:scale-95 text-sm cursor-pointer shadow"
            >
              Assinar Anual
            </button>
          </div>

          {/* ── BÁSICO BIENAL ── */}
          <div className="bg-white rounded-3xl border border-blue-200 p-7 flex flex-col hover:shadow-xl hover:border-blue-400 transition-all duration-300 relative group">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md whitespace-nowrap z-10">
              Melhor Valor
            </div>
            <div>
              <div className="inline-block bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                Essencial · Bienal
              </div>
              <h3 className="text-xl font-black text-slate-900 mb-1">Plano Profissional</h3>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Dois anos de presença profissional com o maior custo-benefício.
              </p>
              <div className="mb-6">
                <div className="flex items-baseline gap-1 text-slate-900">
                  <span className="text-sm font-bold">R$</span>
                  <span className="text-4xl font-extrabold tracking-tight">59,90</span>
                  <span className="text-slate-400 font-medium text-sm">/2 anos</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Equivalente a R$ 2,49 / mês</p>
              </div>
              <div className="h-px bg-slate-100 mb-5" />
              <ul className="space-y-3">
                {BASE_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-slate-700 font-semibold text-xs">
                    <Check className="text-emerald-500 shrink-0 mt-0.5" size={15} />
                    {b}
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-red-400 font-semibold text-xs">
                  <X className="text-red-400 shrink-0 mt-0.5" size={15} />
                  <span>Sem acesso ao Espaço Parceiro (Monetização)</span>
                </li>
              </ul>
            </div>
            <button
              onClick={(e) => handlePlanCta('basico_bienal', e)}
              className="mt-8 w-full py-3.5 bg-[#009ee2] hover:bg-[#0087c5] text-white font-black rounded-2xl transition-all active:scale-95 text-sm cursor-pointer shadow"
            >
              Assinar Bienal
            </button>
          </div>

          {/* ── PATROCINADOR ANUAL ── */}
          <div className="bg-slate-900 text-white rounded-3xl border border-slate-700 p-7 flex flex-col hover:shadow-2xl hover:border-amber-400/50 transition-all duration-300 relative group">
            <div>
              <div className="inline-block bg-amber-400/20 text-amber-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                Premium · Anual
              </div>
              <h3 className="text-xl font-black text-white mb-1">Patrocinador</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                Todos os benefícios do Profissional + o poder de monetizar seu perfil.
              </p>
              <div className="mb-6">
                <div className="flex items-baseline gap-1 text-white">
                  <span className="text-sm font-bold">R$</span>
                  <span className="text-4xl font-extrabold tracking-tight">45,90</span>
                  <span className="text-slate-400 font-medium text-sm">/ano</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Equivalente a R$ 3,82 / mês</p>
              </div>
              <div className="h-px bg-slate-700 mb-5" />
              <ul className="space-y-3">
                {BASE_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-slate-300 font-semibold text-xs">
                    <Check className="text-amber-400 shrink-0 mt-0.5" size={15} />
                    {b}
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-amber-400 font-black text-xs bg-amber-400/10 border border-amber-400/30 p-3 rounded-xl mt-2">
                  <Sparkles className="text-amber-400 shrink-0 mt-0.5 animate-pulse" size={15} />
                  <span>Libera a revenda de cotas publicitárias no Espaço Parceiro (Monetize seu perfil)</span>
                </li>
              </ul>
            </div>
            <button
              onClick={(e) => handlePlanCta('patrocinador_anual', e)}
              className="mt-8 w-full py-3.5 bg-amber-400 hover:bg-amber-500 text-slate-950 font-black rounded-2xl transition-all active:scale-95 text-sm cursor-pointer shadow-lg shadow-amber-500/20"
            >
              Assinar Anual
            </button>
          </div>

          {/* ── PATROCINADOR BIENAL (RECOMENDADO) ── */}
          <div className="bg-slate-900 text-white rounded-3xl border-2 border-amber-400 p-7 flex flex-col hover:shadow-2xl hover:shadow-amber-400/20 transition-all duration-300 relative group scale-[1.02]">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-5 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-lg whitespace-nowrap z-10 animate-pulse">
              ⭐ Recomendado
            </div>
            <div>
              <div className="inline-block bg-amber-400/20 text-amber-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest mb-3">
                Premium · Bienal
              </div>
              <h3 className="text-xl font-black text-white mb-1">Patrocinador</h3>
              <p className="text-xs text-slate-400 leading-relaxed mb-6">
                O plano que pode se pagar sozinho com o Espaço Parceiro.
              </p>
              <div className="mb-6">
                <div className="flex items-baseline gap-1 text-white">
                  <span className="text-sm font-bold">R$</span>
                  <span className="text-4xl font-extrabold tracking-tight">79,90</span>
                  <span className="text-slate-400 font-medium text-sm">/2 anos</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">Equivalente a R$ 3,32 / mês</p>
                <span className="inline-block mt-2 bg-emerald-500/20 text-emerald-400 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Economize R$ 11,90
                </span>
              </div>
              <div className="h-px bg-slate-700 mb-5" />
              <ul className="space-y-3">
                {BASE_BENEFITS.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-slate-300 font-semibold text-xs">
                    <Check className="text-amber-400 shrink-0 mt-0.5" size={15} />
                    {b}
                  </li>
                ))}
                <li className="flex items-start gap-2.5 text-amber-400 font-black text-xs bg-amber-400/10 border border-amber-400/30 p-3 rounded-xl mt-2">
                  <Sparkles className="text-amber-400 shrink-0 mt-0.5 animate-pulse" size={15} />
                  <span>Libera a revenda de cotas publicitárias no Espaço Parceiro (Monetize seu perfil)</span>
                </li>
              </ul>
            </div>
            <button
              onClick={(e) => handlePlanCta('patrocinador_bienal', e)}
              className="mt-8 w-full py-3.5 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black rounded-2xl transition-all active:scale-95 text-sm cursor-pointer shadow-lg shadow-amber-500/30"
            >
              Assinar Bienal
            </button>
          </div>

        </div>

        {/* =================================================================== */}
        {/* DICA DE OURO — Banner premium full-width                             */}
        {/* =================================================================== */}
        <div className="relative bg-gradient-to-r from-amber-50 via-yellow-50 to-white border border-amber-200 rounded-3xl p-8 md:p-10 mb-16 overflow-hidden">
          {/* Glow decorativo */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-amber-300/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-yellow-300/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-start md:items-center gap-8">
            {/* Ícone Troféu */}
            <div className="shrink-0">
              <div className="w-20 h-20 rounded-3xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center shadow-lg shadow-amber-300/20">
                <Trophy size={36} className="text-amber-500 drop-shadow-md" />
              </div>
              <div className="mt-3 text-center">
                <span className="inline-block bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow">
                  Custo Zero
                </span>
              </div>
            </div>

            {/* Conteúdo */}
            <div className="flex-1 space-y-3">
              <h4 className="text-xl md:text-2xl font-black text-slate-800 leading-tight">
                💸 Dica de Ouro: Seu Anúncio pode sair 100% Grátis!
              </h4>
              <p className="text-sm text-slate-700 font-semibold leading-relaxed">
                Com o recurso de <span className="text-[#009ee2] font-extrabold">Espaço Parceiro</span>, disponível no Plano Patrocinador, você pode exibir até <strong>3 logos de comerciantes locais</strong> diretamente no seu perfil.
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Cobrando apenas R$ 5,00/mês de cada parceiro, você acumula R$ 15,00 mensais — o suficiente para custear totalmente a sua anuidade (que equivale a R$ 3,82/mês ou R$ 3,32/mês no bienal) e ainda <strong className="text-emerald-700">gerar lucro líquido direto no seu bolso</strong>.
              </p>
            </div>
          </div>
        </div>

        {/* =================================================================== */}
        {/* VANTAGENS INCLUSAS — Grid de features                                */}
        {/* =================================================================== */}
        <div className="max-w-4xl mx-auto mb-20 text-center">
          <h3 className="text-2xl font-black text-slate-800 tracking-tight mb-2">
            Tudo isso incluso nos planos:
          </h3>
          <p className="text-slate-500 text-sm mb-10">Recursos profissionais para você se destacar no guia de serviços.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5 text-left">
            {[
              { icon: <BadgeCheck size={20} className="text-[#009ee2]" />, bg: 'bg-blue-50', label: '30 dias de teste grátis' },
              { icon: <Users size={20} className="text-emerald-600" />, bg: 'bg-emerald-50', label: 'Até 2 anúncios simultâneos' },
              { icon: <Zap size={20} className="text-violet-500" />, bg: 'bg-violet-50', label: 'Categorias por Inteligência Artificial' },
              { icon: <BarChart3 size={20} className="text-[#009ee2]" />, bg: 'bg-blue-50', label: 'Estatísticas de desempenho' },
              { icon: <Award size={20} className="text-amber-500" />, bg: 'bg-amber-50', label: 'Selos de Reputação (Bronze/Prata/Ouro)' },
              { icon: <Image size={20} className="text-pink-500" />, bg: 'bg-pink-50', label: 'Portfólio de serviços com fotos' },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3 bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
                <div className={`w-9 h-9 rounded-xl ${f.bg} flex items-center justify-center shrink-0`}>
                  {f.icon}
                </div>
                <span className="text-slate-800 font-bold text-sm leading-tight">{f.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* =================================================================== */}
        {/* MOCKUP DO AD CARD                                                     */}
        {/* =================================================================== */}
        <div className="pt-16 border-t border-slate-200/60 max-w-5xl mx-auto mb-20">
          <div className="text-center mb-12">
            <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight mb-2">
              Seu anúncio aparece assim:
            </h3>
            <p className="text-slate-500 text-sm">Um card profissional com tudo que o cliente precisa ver para entrar em contato.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">

            {/* Card mockado */}
            <div className="md:col-span-7 flex justify-center w-full">
              <div className="w-full relative transition-all duration-300 hover:scale-[1.01]">
                <AdCard professional={mockProfessional} />
              </div>
            </div>

            {/* Features descritivas */}
            <div className="md:col-span-5 flex flex-col gap-4">
              {MOCKUP_FEATURES.map((f) => (
                <div
                  key={f.title}
                  className="flex items-start gap-4 group hover:translate-x-1 transition-transform duration-200"
                >
                  <div className={`w-10 h-10 rounded-2xl ${f.bg} flex items-center justify-center shrink-0 mt-0.5 border border-slate-100 shadow-sm`}>
                    {f.icon}
                  </div>
                  <div>
                    <p className="font-extrabold text-slate-800 text-sm leading-snug">{f.title}</p>
                    <p className="text-slate-500 text-xs leading-relaxed mt-0.5">{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </div>

      </div>

      {/* ===================================================================== */}
      {/* FAIXA CTA FINAL — Full-width                                           */}
      {/* ===================================================================== */}
      <section className="w-full bg-gradient-to-r from-[#009ee2] to-[#0078b8] py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/15 border border-white/20 text-white/90 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full mb-6">
            <Star size={12} className="text-amber-300 fill-amber-300" />
            Comece agora mesmo
          </div>
          <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-4 leading-tight">
            Pronto para destacar seu negócio<br className="hidden md:block" /> em Itapipoca?
          </h2>
          <p className="text-white/80 text-base font-medium mb-8 max-w-lg mx-auto">
            Escolha um plano acima e comece a receber clientes. Teste grátis por 30 dias, sem compromisso.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="#planos"
              className="inline-flex items-center gap-2 bg-white text-[#009ee2] font-black px-8 py-3.5 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all text-base"
            >
              <ChevronUp size={18} />
              Escolher meu plano
            </a>
            <button
              onClick={(e) => handlePlanCta('trial', e)}
              className="inline-flex items-center gap-2 bg-white/15 border border-white/30 text-white font-bold px-8 py-3.5 rounded-full backdrop-blur-sm hover:bg-white/25 hover:scale-105 active:scale-95 transition-all text-base cursor-pointer"
            >
              Começar grátis por 30 dias
            </button>
          </div>
        </div>
      </section>

    </div>
  );
}
