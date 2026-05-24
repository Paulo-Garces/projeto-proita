import { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { CheckCircle, Shield } from 'lucide-react';

export default function Planos() {
  const navigate = useNavigate();
  const { isAuthenticated } = useContext(AuthContext);

  const handlePlanCta = (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      navigate('/auth?mode=register');
    } else {
      navigate('/advertise');
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Topo com Título e Subtítulo Forte */}
        <div className="text-center mb-10 animate-in fade-in slide-in-from-top-4 duration-500">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-3 tracking-tight">Planos e Preços</h1>
          <p className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent mb-4">
            Teste o proITA sem compromisso.
          </p>
          <p className="text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Escolha o melhor plano para destacar seus serviços em Itapipoca. Sem taxas ocultas, total transparência.
          </p>
        </div>

        {/* Badges de Destaque / Garantia de Transparência */}
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 bg-emerald-50/70 backdrop-blur-md border border-emerald-100/80 rounded-2xl p-4 max-w-2xl mx-auto mb-12 text-emerald-800 text-xs sm:text-sm font-bold shadow-sm hover:shadow-md transition-all duration-300">
          <div className="flex items-center gap-1.5 hover:scale-[1.02] transition-transform">
            <span>✅ 30 dias de teste 100% grátis</span>
          </div>
          <span className="hidden sm:inline text-emerald-300">|</span>
          <div className="flex items-center gap-1.5 hover:scale-[1.02] transition-transform">
            <span>✅ Sem cobrança automática</span>
          </div>
          <span className="hidden sm:inline text-emerald-300">|</span>
          <div className="flex items-center gap-1.5 hover:scale-[1.02] transition-transform">
            <span>✅ Avisaremos você antes do período expirar</span>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Plano 1 Ano */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all duration-300 flex flex-col justify-between hover:scale-[1.02] group">
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">Plano Anual</h3>
              <p className="text-slate-500 mb-5 text-sm">Ideal para começar e testar a plataforma.</p>
              
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-slate-900 group-hover:text-primary transition-colors duration-300">R$ 35,99</span>
                <span className="text-slate-500 font-medium">/ano</span>
              </div>
              <div className="mb-5">
                <span className="text-[11px] font-bold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">
                  (Equivale a apenas R$ 2,99 por mês)
                </span>
              </div>

              {/* Textos de Transparência Próximos ao Preço */}
              <div className="space-y-2 mb-6 text-xs text-emerald-700 font-bold bg-emerald-50/50 border border-emerald-100 rounded-xl p-3 shadow-inner">
                <div>✅ 30 dias de teste 100% grátis</div>
                <div>✅ Sem cobrança automática</div>
                <div>✅ Avisaremos você antes do período expirar</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><CheckCircle className="text-primary shrink-0" size={18} /> <span className="text-slate-700 text-sm">30 dias de teste grátis</span></li>
                <li className="flex items-center gap-3"><CheckCircle className="text-primary shrink-0" size={18} /> <span className="text-slate-700 text-sm">Crie até 2 anúncios simultâneos</span></li>
                <li className="flex items-center gap-3"><CheckCircle className="text-primary shrink-0" size={18} /> <span className="text-slate-700 text-sm">Categoria e Subcategoria via IA</span></li>
                <li className="flex items-center gap-3"><CheckCircle className="text-primary shrink-0" size={18} /> <span className="text-slate-700 text-sm">Botão direto para WhatsApp e Ligar</span></li>
                <li className="flex items-center gap-3"><CheckCircle className="text-primary shrink-0" size={18} /> <span className="text-slate-700 text-sm">Funil de Conversão e Estatísticas</span></li>
                <li className="flex items-center gap-3"><CheckCircle className="text-primary shrink-0" size={18} /> <span className="text-slate-700 text-sm">Elegível ao Selo de Reputação (Ouro/Prata/Bronze)</span></li>
              </ul>
            </div>
            <button
              onClick={handlePlanCta}
              className="block w-full py-3.5 px-4 bg-slate-100 hover:bg-primary hover:text-white text-slate-900 font-extrabold text-center rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-sm"
            >
              Começar meus 30 dias grátis
            </button>
          </div>

          {/* Plano 2 Anos */}
          <div className="bg-primary rounded-3xl p-8 border border-primary shadow-xl shadow-primary/20 transform md:-translate-y-4 relative flex flex-col justify-between hover:scale-[1.03] transition-all duration-300">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-sm whitespace-nowrap animate-pulse">
              Aprox. 16% de Economia Real
            </div>
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">Plano Bienal</h3>
              <p className="text-primary-100 mb-5 text-sm">Economia garantida para profissionais focados a longo prazo.</p>
              
              <div className="mb-1 flex items-baseline gap-2">
                <span className="text-5xl font-extrabold text-white">R$ 59,90</span>
                <span className="text-primary-200 font-medium">/2 anos</span>
              </div>
              <div className="mb-5">
                <span className="text-[11px] font-bold text-primary bg-white px-2.5 py-1 rounded-lg">
                  (Equivale a apenas R$ 2,49 por mês)
                </span>
              </div>

              {/* Textos de Transparência Próximos ao Preço */}
              <div className="space-y-2 mb-6 text-xs text-emerald-100 font-bold bg-white/10 border border-white/20 rounded-xl p-3 shadow-inner">
                <div>✅ 30 dias de teste 100% grátis</div>
                <div>✅ Sem cobrança automática</div>
                <div>✅ Avisaremos você antes do período expirar</div>
              </div>

              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3"><CheckCircle className="text-white shrink-0" size={18} /> <span className="text-white text-sm">30 dias de teste grátis</span></li>
                <li className="flex items-center gap-3"><CheckCircle className="text-white shrink-0" size={18} /> <span className="text-white text-sm">Crie até 2 anúncios simultâneos</span></li>
                <li className="flex items-center gap-3"><CheckCircle className="text-white shrink-0" size={18} /> <span className="text-white text-sm">Todas as vantagens do plano anual</span></li>
                <li className="flex items-center gap-3"><CheckCircle className="text-white shrink-0" size={18} /> <span className="text-white text-sm">Categoria e Subcategoria via IA</span></li>
                <li className="flex items-center gap-3"><CheckCircle className="text-white shrink-0" size={18} /> <span className="text-white text-sm">Funil de Conversão e Estatísticas</span></li>
                <li className="flex items-center gap-3"><CheckCircle className="text-white shrink-0" size={18} /> <span className="text-white text-sm">Elegível ao Selo de Reputação (Ouro/Prata/Bronze)</span></li>
              </ul>
            </div>
            <button
              onClick={handlePlanCta}
              className="block w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-primary font-extrabold text-center rounded-xl transition-all duration-200 hover:scale-[1.02] active:scale-95 shadow-md shadow-sky-900/10"
            >
              Começar meus 30 dias grátis
            </button>
          </div>
        </div>

        {/* Banner Transparência Adicional */}
        <div className="mt-16 bg-white rounded-2xl p-6 md:p-8 flex items-start md:items-center gap-4 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="bg-green-50 p-3 rounded-full shrink-0">
            <Shield className="text-green-500" size={28} />
          </div>
          <div>
            <h4 className="font-bold text-slate-900 mb-1">Transparência proITA</h4>
            <p className="text-slate-600 text-sm leading-relaxed">
              Não cobramos comissões sobre os seus serviços. O valor pago pela assinatura é a única taxa que a plataforma exige para manter o seu anúncio ativo e o site funcionando para toda a cidade.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
