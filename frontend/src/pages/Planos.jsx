import { Link } from 'react-router-dom';
import { CheckCircle, Shield } from 'lucide-react';

export default function Planos() {
  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Planos e Preços</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Escolha o melhor plano para destacar seus serviços em Itapipoca. Sem taxas ocultas, total transparência.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {/* Plano 1 Ano */}
          <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/50 transition-all">
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Plano Anual</h3>
            <p className="text-slate-500 mb-6">Ideal para começar e testar a plataforma.</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-slate-900">R$ 30</span>
              <span className="text-slate-500 font-medium">/ano</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3"><CheckCircle className="text-primary shrink-0" size={20} /> <span className="text-slate-700">Anúncio de Perfil Público</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="text-primary shrink-0" size={20} /> <span className="text-slate-700">Categoria e Subcategoria via IA</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="text-primary shrink-0" size={20} /> <span className="text-slate-700">Botão direto para WhatsApp</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="text-primary shrink-0" size={20} /> <span className="text-slate-700">Métricas de Acesso e Cliques</span></li>
            </ul>
            <Link to="/auth?mode=register" className="block w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-center rounded-xl transition-colors">
              Começar Agora
            </Link>
          </div>

          {/* Plano 2 Anos */}
          <div className="bg-primary rounded-3xl p-8 border border-primary shadow-xl shadow-primary/20 transform md:-translate-y-4 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-400 to-orange-500 text-white px-4 py-1 rounded-full text-sm font-bold shadow-sm">
              Mais Vantajoso
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Plano Bienal</h3>
            <p className="text-primary-100 mb-6">Economia garantida para profissionais focados a longo prazo.</p>
            <div className="mb-6">
              <span className="text-5xl font-extrabold text-white">R$ 50</span>
              <span className="text-primary-200 font-medium">/2 anos</span>
            </div>
            <ul className="space-y-4 mb-8">
              <li className="flex items-center gap-3"><CheckCircle className="text-white shrink-0" size={20} /> <span className="text-white">Todas as vantagens do plano anual</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="text-white shrink-0" size={20} /> <span className="text-white">Mais de 15% de desconto</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="text-white shrink-0" size={20} /> <span className="text-white">Selo de 'Verificado' (em breve)</span></li>
              <li className="flex items-center gap-3"><CheckCircle className="text-white shrink-0" size={20} /> <span className="text-white">Prioridade no suporte</span></li>
            </ul>
            <Link to="/auth?mode=register" className="block w-full py-3 px-4 bg-white hover:bg-slate-50 text-primary font-bold text-center rounded-xl transition-colors">
              Escolher Plano Bienal
            </Link>
          </div>
        </div>

        <div className="mt-16 bg-white rounded-2xl p-6 md:p-8 flex items-start md:items-center gap-4 border border-slate-200 shadow-sm">
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
