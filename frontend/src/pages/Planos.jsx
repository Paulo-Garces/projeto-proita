import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle } from 'lucide-react';
import { API_URL } from '../config';
import AdCard from '../components/AdCard';

export default function Planos() {
  const navigate = useNavigate();
  const { isAuthenticated, user, token, updateUser } = useContext(AuthContext);

  const handlePlanCta = async (e) => {
    e?.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth?mode=register');
      return;
    }

    const currentStatus = user?.planStatus;
    if (currentStatus !== 'ATIVO' && currentStatus !== 'DEGUSTACAO') {
      try {
        const res = await fetch(`${API_URL}/api/subscriptions/trial`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await res.json();
        if (res.ok && data.success) {
          updateUser({
            planStatus: data.user.planStatus,
            trialEndsAt: data.user.trialEndsAt
          });
          navigate('/dashboard/novo-anuncio');
        } else {
          alert(data.message || 'Erro ao iniciar o período de testes.');
        }
      } catch (err) {
        console.error('Erro ao iniciar trial:', err);
        alert('Erro ao conectar com o servidor para iniciar período de degustação.');
      }
    } else {
      navigate('/dashboard/novo-anuncio');
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
                onClick={handlePlanCta}
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
        {/* 2. PRICING CARDS (SLIM & CENTERED IN SOLID COLORS)                        */}
        {/* ========================================================================= */}
        <div className="flex flex-col md:flex-row justify-center gap-6 items-stretch max-w-4xl mx-auto mb-16">
          
          {/* Card 1: Plano Anual (Solid Soft Green Theme) */}
          <div className="bg-[#4dbfa2] rounded-3xl p-8 flex flex-col justify-between hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 relative w-full max-w-[260px] mx-auto md:mx-0">
            <div className="text-left space-y-4 mb-8">
              <h3 className="text-xl font-black text-slate-900 leading-none">Plano Anual</h3>
              
              <div className="flex items-baseline gap-1 select-none text-slate-900">
                <span className="text-lg font-bold">R$</span>
                <span className="text-5xl font-extrabold tracking-tight">35,90</span>
                <span className="text-slate-800 font-bold text-xs">/ano</span>
              </div>
              
              <p className="text-xs font-bold text-slate-800/80">
                (Equivalente a 2,99 por mês)
              </p>
              
              <p className="text-slate-950 text-sm font-extrabold pt-2 leading-relaxed">
                Anúncio ativo por 12 meses + Período Grátis
              </p>
            </div>

            <button
              onClick={handlePlanCta}
              className="block w-full py-3.5 px-4 bg-[#eae8e6] hover:bg-[#dfdddb] text-slate-800 font-black text-center rounded-xl transition-all duration-200 active:scale-95 text-sm select-none cursor-pointer"
            >
              Assinar
            </button>
          </div>

          {/* Card 2: Plano Bienal (Solid Vibrant Blue Theme) */}
          <div className="bg-[#009ee2] rounded-3xl p-8 flex flex-col justify-between hover:scale-[1.02] hover:shadow-2xl transition-all duration-300 relative w-full max-w-[260px] mx-auto md:mx-0">
            {/* Top orange badge */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-orange-500 text-white px-4 py-1 rounded-full text-[10px] font-black shadow-md whitespace-nowrap animate-pulse select-none z-10">
              Aprox. 16% de Economia
            </div>

            {/* Pure white text inside this card for clear contrast */}
            <div className="text-left space-y-4 mb-8 text-white">
              <h3 className="text-xl font-black leading-none pt-1">Plano Bienal</h3>
              
              <div className="flex items-baseline gap-1 select-none text-white">
                <span className="text-lg font-bold">R$</span>
                <span className="text-5xl font-extrabold tracking-tight">59,90</span>
                <span className="text-blue-100 font-bold text-xs">/2 anos</span>
              </div>
              
              <p className="text-xs font-bold text-blue-100">
                (Equivalente a 2,48 por mês)
              </p>
              
              <p className="text-blue-50 text-sm font-extrabold pt-2 leading-relaxed">
                Anúncio ativo por 24 meses + Período Grátis
              </p>
            </div>

            <button
              onClick={handlePlanCta}
              className="block w-full py-3.5 px-4 bg-[#eae8e6] hover:bg-[#dfdddb] text-slate-800 font-black text-center rounded-xl transition-all duration-200 active:scale-95 text-sm select-none cursor-pointer"
            >
              Assinar
            </button>
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
            onClick={handlePlanCta}
            className="bg-[#009ee2] hover:bg-[#008cc9] text-white text-base font-black px-14 py-4.5 rounded-2xl transition-all shadow-lg shadow-sky-300/40 hover:scale-105 active:scale-95 inline-block cursor-pointer animate-bounce"
          >
            Começar
          </button>
        </div>

      </div>
    </div>
  );
}
