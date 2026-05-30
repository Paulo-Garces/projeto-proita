import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle, Sparkles, Check, X } from 'lucide-react';
import { API_URL } from '../config';
import AdCard from '../components/AdCard';

export default function Planos() {
  const navigate = useNavigate();
  const { isAuthenticated, user, token, updateUser } = useContext(AuthContext);
  const [billingCycle, setBillingCycle] = useState('anual');

  const handlePlanCta = async (planId, e) => {
    e?.preventDefault();
    if (planId) {
      localStorage.setItem('selected_plan', planId);
    }
    
    if (!user) {
      navigate(`/auth?mode=register&plan=${planId}`);
      return;
    }

    if (user.planStatus === 'ATIVO' || user.planStatus === 'BASICO' || user.planStatus === 'DEGUSTACAO') {
      navigate('/dashboard/novo-anuncio');
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/subscriptions/trial`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ planId })
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
  };

  const mockProfessional = {
    id: 'mock-garces',
    name: 'Paulo Garces',
    category: 'Eletricista Predial',
    servicePhone: '(88) 99995-7769',
    serviceBairro: 'Urbano Teixeira',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    verified: true,
    rating: 5.0,
    reviewCount: 12,
    planStatus: 'ATIVO',
    createdAt: '2020-01-01T00:00:00Z',
    horariosFuncionamento: 'Segunda a Sexta, 8h às 18h',
    socialLinks: [
      { platform: 'instagram', url: 'instagram.com/paulogarces' },
      { platform: 'facebook', url: 'facebook.com/paulogarces' },
      { platform: 'youtube', url: 'youtube.com/paulogarces' }
    ]
  };

  return (
    <div className="bg-[#eae7e5] min-h-screen pt-28 pb-20 overflow-x-hidden font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* ========================================================================= */}
        {/* 1. TOP 'GRÁTIS' BANNER (THE HOOK)                                         */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-10 shadow-md mb-12 max-w-4xl mx-auto transition-all hover:shadow-lg duration-300">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Esquerda: Titulo e Lista */}
            <div className="md:col-span-8 text-left space-y-4">
              <h2 className="text-4xl font-extrabold text-emerald-500 tracking-tight select-none">
                Grátis
              </h2>
              
              <ul className="space-y-2">
                <li className="flex items-center gap-2.5 text-slate-800 font-extrabold text-base">
                  <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                  30 Dias 100% Grátis
                </li>
                <li className="flex items-center gap-2.5 text-slate-800 font-extrabold text-base">
                  <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                  Sem limitações
                </li>
                <li className="flex items-center gap-2.5 text-slate-800 font-extrabold text-base">
                  <CheckCircle className="text-emerald-500 shrink-0" size={20} />
                  Sem cobrança automática
                </li>
              </ul>
              
              {/* Disclaimer Text refined to strictly: text-sm text-slate-500 font-normal tracking-wide mt-3 */}
              <p className="text-sm text-slate-500 font-normal tracking-wide mt-3 leading-relaxed max-w-xl">
                Terminou o período seu anúncio simplesmente ficam aguardando você decidir ou não continuar.
              </p>
            </div>
            
            {/* Direita: Botão de Chamada com Sol's Yellow e Header style */}
            <div className="md:col-span-4 flex justify-start md:justify-end items-center">
              <button
                onClick={(e) => handlePlanCta('trial', e)}
                className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-bold px-6 py-2 rounded-full shadow-md transition-all text-base text-center select-none cursor-pointer"
              >
                Começar
              </button>
            </div>
            
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERMEDIATE TITLE AND SUBTITLE (PLANOS E PREÇOS)                         */}
        {/* ========================================================================= */}
        <div className="text-center my-12 animate-in fade-in duration-500 select-none">
          <h2 className="text-4xl font-black text-slate-800 tracking-tight">Planos e Preços</h2>
          <p className="text-emerald-500 font-extrabold text-base mt-1.5">
            Teste o proITA sem compromisso.
          </p>
        </div>

        {/* ========================================================================= */}
        {/* 2. DYNAMIC BILLING TOGGLE AND COMPARISON CARDS                            */}
        {/* ========================================================================= */}
        
        {/* Toggle de Ciclo de Faturamento */}
        <div className="flex justify-center mb-10 select-none">
          <div className="bg-slate-200/80 backdrop-blur-sm p-1 rounded-2xl flex items-center shadow-inner border border-slate-300/40">
            <button
              onClick={() => setBillingCycle('anual')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 ${
                billingCycle === 'anual'
                  ? 'bg-white text-slate-900 shadow-md transform scale-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cobrança Anual
            </button>
            <button
              onClick={() => setBillingCycle('bienal')}
              className={`px-6 py-2.5 rounded-xl text-sm font-black transition-all duration-300 flex items-center gap-1.5 ${
                billingCycle === 'bienal'
                  ? 'bg-white text-slate-900 shadow-md transform scale-100'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Cobrança Bienal
              <span className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 rounded-full font-black animate-pulse uppercase tracking-wider">
                Desconto
              </span>
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row justify-center gap-8 items-stretch max-w-4xl mx-auto mb-16 px-4">
          
          {/* CARD 1: Plano Básico */}
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 flex flex-col justify-between hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 relative w-full max-w-[340px] mx-auto md:mx-0 shadow-md">
            <div>
              <div className="text-left space-y-4 mb-8">
                <div className="inline-block bg-slate-100 text-slate-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
                  Essencial
                </div>
                <h3 className="text-2xl font-black text-slate-900 leading-none">Plano Básico</h3>
                <p className="text-xs text-slate-500 font-bold leading-relaxed">
                  Perfeito para divulgar seus serviços com extrema qualidade, avaliações reais e portfólio.
                </p>
                
                <div className="pt-2 select-none">
                  {billingCycle === 'anual' ? (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1 text-slate-900">
                        <span className="text-lg font-bold">R$</span>
                        <span className="text-5xl font-extrabold tracking-tight">35,90</span>
                        <span className="text-slate-500 font-bold text-sm">/ano</span>
                      </div>
                      <p className="text-xs font-extrabold text-emerald-600">
                        (Apenas R$ 2,99 por mês)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1 text-slate-900">
                        <span className="text-lg font-bold">R$</span>
                        <span className="text-5xl font-extrabold tracking-tight">59,90</span>
                        <span className="text-slate-500 font-bold text-sm">/2 anos</span>
                      </div>
                      <p className="text-xs font-extrabold text-emerald-600">
                        (Apenas R$ 2,49 por mês)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Divisor */}
              <div className="h-px bg-slate-100 my-6"></div>

              {/* Lista de Vantagens */}
              <ul className="space-y-4 text-left">
                <li className="flex items-start gap-3 text-slate-700 font-bold text-sm">
                  <Check className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <span>Perfil completo no proITA</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 font-bold text-sm">
                  <Check className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <span>Avaliações e notas completas</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 font-bold text-sm">
                  <Check className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <span>Portfólio de serviços com fotos</span>
                </li>
                <li className="flex items-start gap-3 text-slate-700 font-bold text-sm">
                  <Check className="text-emerald-500 shrink-0 mt-0.5" size={18} />
                  <span>Selos de Verificação (Bronze/Prata/Ouro)</span>
                </li>
                {/* Restrição Clara */}
                <li className="flex items-start gap-3 text-red-500/80 font-bold text-sm select-none">
                  <X className="text-red-500 shrink-0 mt-0.5" size={18} />
                  <span className="line-through">Sem acesso ao Espaço Parceiro (Monetização)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={(e) => handlePlanCta(billingCycle === 'anual' ? 'basico_anual' : 'basico_bienal', e)}
              className="block w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-center rounded-2xl transition-all duration-200 active:scale-95 text-base select-none cursor-pointer mt-8 shadow-md"
            >
              Assinar Plano Básico
            </button>
          </div>

          {/* CARD 2: Plano Patrocinador (Highlighted) */}
          <div className="bg-slate-900 text-white rounded-3xl border-2 border-indigo-500 p-8 flex flex-col justify-between hover:shadow-2xl hover:shadow-indigo-500/20 hover:scale-[1.03] transition-all duration-300 relative w-full max-w-[340px] mx-auto md:mx-0 shadow-xl">
            {/* Tag Recomendado */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 px-5 py-1.5 rounded-full text-xs font-black shadow-md uppercase tracking-wider animate-pulse whitespace-nowrap z-10">
              Recomendado
            </div>

            <div>
              <div className="text-left space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <div className="inline-block bg-indigo-500/20 text-indigo-400 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider">
                    Premium
                  </div>
                  {billingCycle === 'bienal' && (
                    <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider shrink-0 select-none">
                      Economize R$ 11,90
                    </span>
                  )}
                </div>
                <h3 className="text-2xl font-black text-white leading-none">Plano Patrocinador</h3>
                <p className="text-xs text-slate-350 font-bold leading-relaxed">
                  Todos os benefícios inclusos + direito a revender espaço publicitário local diretamente no perfil!
                </p>
                
                <div className="pt-2 select-none">
                  {billingCycle === 'anual' ? (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1 text-white">
                        <span className="text-lg font-bold">R$</span>
                        <span className="text-5xl font-extrabold tracking-tight">45,90</span>
                        <span className="text-slate-350 font-bold text-sm">/ano</span>
                      </div>
                      <p className="text-xs font-extrabold text-amber-400">
                        (Apenas R$ 3,82 por mês)
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <div className="flex items-baseline gap-1 text-white">
                        <span className="text-lg font-bold">R$</span>
                        <span className="text-5xl font-extrabold tracking-tight">79,90</span>
                        <span className="text-slate-350 font-bold text-sm">/2 anos</span>
                      </div>
                      <p className="text-xs font-extrabold text-amber-400">
                        (Apenas R$ 3,32 por mês - Poupe R$ 11,90!)
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Divisor */}
              <div className="h-px bg-slate-800 my-6"></div>

              {/* Lista de Vantagens */}
              <ul className="space-y-4 text-left">
                <li className="flex items-start gap-3 text-slate-200 font-bold text-sm">
                  <Check className="text-indigo-400 shrink-0 mt-0.5" size={18} />
                  <span>Todos os benefícios do plano básico</span>
                </li>
                <li className="flex items-start gap-3 text-slate-200 font-bold text-sm">
                  <Check className="text-indigo-400 shrink-0 mt-0.5" size={18} />
                  <span>Destaque prioritário na busca do guia</span>
                </li>
                <li className="flex items-start gap-3 text-slate-200 font-bold text-sm">
                  <Check className="text-indigo-400 shrink-0 mt-0.5" size={18} />
                  <span>Suporte prioritário e relatórios de acessos</span>
                </li>
                <li className="flex items-start gap-3 text-amber-400 font-black text-sm bg-indigo-950/40 border border-indigo-500/30 p-3 rounded-2xl">
                  <Sparkles className="text-amber-400 shrink-0 mt-0.5 animate-pulse" size={18} />
                  <span>Libera a revenda de 3 cotas do Espaço Parceiro (Monetize seu perfil!)</span>
                </li>
              </ul>
            </div>

            <button
              onClick={(e) => handlePlanCta(billingCycle === 'anual' ? 'patrocinador_anual' : 'patrocinador_bienal', e)}
              className="block w-full py-4 px-4 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-slate-950 font-black text-center rounded-2xl transition-all duration-200 active:scale-95 text-base select-none cursor-pointer mt-8 shadow-lg shadow-amber-500/20"
            >
              Assinar Plano Patrocinador
            </button>
          </div>

        </div>

        {/* ========================================================================= */}
        {/* MONETIZATION HIGHLIGHT (SPONSOR RESELLING AD)                             */}
        {/* ========================================================================= */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col md:flex-row items-center gap-6 max-w-4xl mx-auto mb-16 text-left animate-in fade-in duration-500 select-none">
          <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
            <Sparkles className="text-amber-600 animate-pulse" size={32} />
          </div>
          <div className="space-y-2 flex-1">
            <h4 className="text-lg font-black text-amber-850 flex items-center gap-1.5">
              💸 Dica de Ouro: Seu Anúncio proITA pode sair 100% GRÁTIS!
            </h4>
            <p className="text-sm text-slate-700 font-bold leading-relaxed">
              Com o novo recurso de <span className="text-indigo-600 font-extrabold">Espaço Parceiro</span>, você pode fazer o upload de até 3 logotipos de comerciantes locais (mercantis, oficinas, salões de beleza ou lojas de amigos) diretamente no seu perfil público.
            </p>
            <p className="text-xs text-slate-500 leading-relaxed font-normal">
              Cobrando apenas R$ 5,00/mês de cada patrocinador local, você acumula R$ 15,00 mensais — custeando totalmente a sua anuidade do proITA (de R$ 45,90 ou R$ 79,90, que equivalem a apenas R$ 3,82 ou R$ 3,32 por mês) e ainda gera lucro líquido direto no seu bolso!
            </p>
          </div>
          <div className="bg-amber-400 text-slate-900 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider whitespace-nowrap shadow-sm">
            Custo Zero
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 3. BENEFITS GRID (2 COLUMNS)                                              */}
        {/* ========================================================================= */}
        <div className="max-w-3xl mx-auto my-16 text-left select-none animate-in fade-in duration-500">
          <h3 className="text-xl font-black text-slate-800 text-center mb-8 tracking-tight">
            Vantagens inclusas no anúncio:
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 max-w-3xl mx-auto text-slate-800 font-extrabold text-base">
            <li className="flex items-center gap-3">
              <CheckCircle className="text-[#009ee2] shrink-0" size={20} />
              30 Dias de teste grátis
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="text-[#009ee2] shrink-0" size={20} />
              Crie até 2 anúncios simultâneos
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="text-[#009ee2] shrink-0" size={20} />
              Categorias e descrição por IA
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="text-[#009ee2] shrink-0" size={20} />
              Estatísticas
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="text-[#009ee2] shrink-0" size={20} />
              Selos de Reputação
            </li>
            <li className="flex items-center gap-3">
              <CheckCircle className="text-[#009ee2] shrink-0" size={20} />
              Portfólio
            </li>
            <li className="flex items-center gap-3 md:col-span-2 text-indigo-700 bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-2xl shadow-xs">
              <Sparkles className="text-indigo-650 shrink-0 animate-pulse" size={20} />
              <span>Acesso exclusivo à revenda de 3 cotas publicitárias no <strong>Espaço Parceiro</strong></span>
            </li>
          </ul>
        </div>

        {/* ========================================================================= */}
        {/* 4. REAL AD MOCKUP SECTION                                                 */}
        {/* ========================================================================= */}
        <div className="mt-20 pt-16 border-t border-slate-200/60 max-w-4xl mx-auto text-center select-none animate-in fade-in duration-500">
          <h4 className="text-2xl font-black text-slate-800 mb-10 tracking-tight">
            Seu anúncio aparece assim:
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Esquerda: Componente AdCard Real Mockado para Paulo Garces */}
            <div className="md:col-span-7 flex justify-center w-full">
              <div className="w-full relative transition-all duration-300 hover:scale-[1.01]">
                <AdCard professional={mockProfessional} />
              </div>
            </div>

            {/* Direita: Rótulos Descritivos das Partes do Mockup apontando */}
            <div className="md:col-span-5 flex flex-col justify-center space-y-4 pl-0 md:pl-6 text-left">
              <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-300/40 shadow-sm transition-all hover:-translate-x-1 duration-200">
                <span className="font-extrabold text-slate-800 text-sm block mb-0.5">Sua foto no perfil ou sua logo</span>
                <span className="text-xs text-slate-500 font-bold">Imprime credibilidade imediata ao primeiro olhar.</span>
              </div>
              
              <div className="bg-white/70 backdrop-blur-md p-4 rounded-2xl border border-slate-300/40 shadow-sm transition-all hover:-translate-x-1 duration-200">
                <span className="font-extrabold text-slate-800 text-sm block mb-0.5">Atalho para suas redes sociais</span>
                <span className="text-xs text-slate-500 font-bold">Direcione clientes para portfólios no Instagram, Facebook e YouTube.</span>
              </div>
              
              <div className="bg-[#25d366]/10 backdrop-blur-md p-4 rounded-2xl border border-emerald-200 shadow-sm transition-all hover:-translate-x-1 duration-200">
                <span className="font-extrabold text-emerald-800 text-sm block mb-0.5">Botão do Whatsapp</span>
                <span className="text-xs text-emerald-600 font-bold">Contato direto sem taxas de intermediação, direto na sua mão.</span>
              </div>
              
              <div className="bg-[#009ee2]/10 backdrop-blur-md p-4 rounded-2xl border border-blue-200 shadow-sm transition-all hover:-translate-x-1 duration-200">
                <span className="font-extrabold text-blue-900 text-sm block mb-0.5">Pagina de perfil</span>
                <span className="text-xs text-blue-600 font-bold">Seu catálogo completo de serviços e qualificações sempre online.</span>
              </div>
            </div>

          </div>
        </div>

        {/* ========================================================================= */}
        {/* 5. BOTTOM CTA                                                             */}
        {/* ========================================================================= */}
        <div className="mt-20 text-center select-none animate-in fade-in duration-500">
          <button
            onClick={(e) => handlePlanCta('trial', e)}
            className="bg-[#009ee2] hover:bg-[#008cc9] text-white text-base font-black px-14 py-4.5 rounded-2xl transition-all shadow-lg shadow-sky-300/40 hover:scale-105 active:scale-95 inline-block cursor-pointer animate-bounce"
          >
            Começar
          </button>
        </div>

      </div>
    </div>
  );
}
