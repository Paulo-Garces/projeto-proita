import { Search, Briefcase, TrendingUp, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function About() {
  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mb-6 tracking-tight">
            Sobre o <span className="text-primary">proITA</span>
          </h1>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            Nascemos com um propósito simples: digitalizar o boca a boca em Itapipoca. 
            O Guia dos Três Climas é a ponte confiável entre profissionais dedicados e clientes que buscam qualidade.
          </p>
        </div>

        {/* Missão */}
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm mb-16">
          <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-primary" /> Nossa Missão
          </h2>
          <p className="text-slate-600 leading-relaxed text-lg">
            Acreditamos que Itapipoca possui um potencial gigantesco de serviços não descobertos. 
            Nossa missão é fornecer uma plataforma moderna, acessível e inteligente onde o talento local 
            possa prosperar, eliminando as barreiras entre a oferta e a demanda. 
            Usamos inteligência artificial para simplificar a criação de anúncios e organizar o mercado.
          </p>
        </div>

        {/* Como Funciona - Cards Empilhados/Lado a Lado */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-slate-900 mb-8 text-center">Como o proITA funciona</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* Para quem busca */}
            <div className="bg-gradient-to-br from-white to-slate-50 rounded-3xl p-8 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
              <div className="w-14 h-14 bg-sky-100 rounded-2xl flex items-center justify-center mb-6">
                <Search className="text-sky-600" size={28} />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-4">Para quem busca serviços</h3>
              <ul className="space-y-3 text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  Pesquisa inteligente e rápida de profissionais na sua região.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  Acesso direto ao WhatsApp ou Telefone do profissional.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary font-bold mt-0.5">•</span>
                  Veja perfis detalhados e categorias de atuação claras.
                </li>
              </ul>
              <div className="mt-8">
                <Link to="/search" className="text-primary font-medium hover:text-primary-hover transition-colors flex items-center gap-1">
                  Encontrar profissionais &rarr;
                </Link>
              </div>
            </div>

            {/* Para profissionais */}
            <div className="bg-gradient-to-br from-primary to-cyan-500 rounded-3xl p-8 border border-primary shadow-lg hover:shadow-xl transition-shadow text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 opacity-10 transform translate-x-4 -translate-y-4">
                <Briefcase size={120} />
              </div>
              <div className="relative z-10">
                <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-sm">
                  <Briefcase className="text-white" size={28} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-4">Para profissionais</h3>
                <ul className="space-y-3 text-cyan-50">
                  <li className="flex items-start gap-2">
                    <span className="text-white font-bold mt-0.5">•</span>
                    Crie seu anúncio em menos de 2 minutos com ajuda de IA.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white font-bold mt-0.5">•</span>
                    Seja encontrado por centenas de clientes em Itapipoca.
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-white font-bold mt-0.5">•</span>
                    Acompanhe métricas de visitas e cliques no seu perfil.
                  </li>
                </ul>
                <div className="mt-8">
                  <Link to="/auth?mode=register" className="inline-block bg-white text-primary px-6 py-2 rounded-xl font-bold hover:bg-slate-50 transition-colors">
                    Anuncie Agora
                  </Link>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Footer info */}
        <div className="text-center bg-slate-100 rounded-3xl p-8 border border-slate-200">
          <Users className="mx-auto text-slate-400 mb-4" size={40} />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Feito para Itapipoca</h3>
          <p className="text-slate-500 max-w-lg mx-auto">
            Nossa plataforma é desenvolvida pensando nas necessidades reais da nossa cidade, conectando a serra, o sertão e o mar.
          </p>
        </div>

      </div>
    </div>
  );
}
