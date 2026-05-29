import { Link } from 'react-router-dom';
import { Lightbulb, ArrowLeft, Sparkles, Coins, MessageCircle, Star, Camera, ShieldCheck } from 'lucide-react';

export default function Dicas() {
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-12 px-4 md:py-20">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Cabeçalho de Dicas */}
        <div className="text-center space-y-4 animate-in fade-in duration-500">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto shadow-inner border border-amber-200/50">
            <Lightbulb size={32} className="animate-pulse" />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Guia de Sucesso & Monetização
          </h1>
          <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
            Descubra segredos práticos para destacar o seu perfil no proITA e aprenda a zerar o custo da sua assinatura mensal vendendo patrocínios locais.
          </p>
        </div>

        {/* Quadro Principal: A Dica de Ouro de Monetização */}
        <div className="bg-gradient-to-br from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 md:p-10 shadow-xl relative overflow-hidden border border-slate-800 animate-in fade-in duration-500">
          {/* Efeitos visuais premium */}
          <div className="absolute top-[-50px] left-[-50px] w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-[-50px] right-[-50px] w-48 h-48 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-col md:flex-row gap-6 items-start relative z-10">
            <div className="p-4 bg-amber-400 text-slate-950 rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <Coins size={36} />
            </div>
            
            <div className="space-y-4 text-left">
              <span className="bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider inline-block">
                Estratégia de Custo Zero
              </span>
              <h2 className="text-2xl font-black tracking-tight text-white md:text-3xl leading-snug">
                Como Custear sua Assinatura com Patrocinadores Locais!
              </h2>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                Você sabia que o seu perfil proITA possui um espaço exclusivo para **Parceiros** e patrocinadores? Com o novo **Espaço Parceiro**, você pode exibir no topo ou sidebar do seu perfil até 3 imagens reposicionáveis de comércios locais!
              </p>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-amber-400 font-extrabold text-xl block mb-1">1. Escolha</span>
                  <span className="text-xs text-slate-400 leading-normal block">Identifique mercantis, borracharias, salões ou lanchonetes perto de você.</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-amber-400 font-extrabold text-xl block mb-1">2. Ofereça</span>
                  <span className="text-xs text-slate-400 leading-normal block">Cobre apenas R$ 5,00 ou R$ 10,00 por mês para exibir a marca deles no seu perfil.</span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4">
                  <span className="text-amber-400 font-extrabold text-xl block mb-1">3. Fature</span>
                  <span className="text-xs text-slate-400 leading-normal block">Vendendo 3 espaços, você arrecada R$ 15,00+/mês. Custeia sua assinatura e ainda lucra!</span>
                </div>
              </div>

              <div className="bg-amber-400/10 border border-amber-400/20 p-4 rounded-2xl text-xs text-amber-200 leading-relaxed font-semibold">
                💡 <strong>Dica prática:</strong> Ao editar seu perfil no painel de controle, use a nossa nova ferramenta de recorte com enquadramento perfeito (proporção 16:9) para que os logotipos dos patrocinadores fiquem impecáveis e profissionais no seu carrossel de parceiros!
              </div>
            </div>
          </div>
        </div>

        {/* Outras dicas de crescimento */}
        <div className="space-y-6">
          <h3 className="text-xl font-bold text-slate-800 text-left border-b border-slate-200 pb-3">
            Outras Dicas de Ouro para Bombar seu Perfil:
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* Dica 1: WhatsApp */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4 transition-all hover:shadow-md hover:border-emerald-100 duration-200 group">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl shrink-0 h-fit group-hover:scale-105 transition-transform">
                <MessageCircle size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 text-base leading-snug">Conexão Imediata pelo WhatsApp</h4>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                  Deixe seu contato sempre atualizado. Os clientes do proITA preferem fechar serviços diretamente de forma dinâmica. Fique atento às notificações!
                </p>
              </div>
            </div>

            {/* Dica 2: Avaliações */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4 transition-all hover:shadow-md hover:border-amber-105 duration-200 group">
              <div className="p-3 bg-amber-50 text-amber-500 rounded-2xl shrink-0 h-fit group-hover:scale-105 transition-transform">
                <Star size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 text-base leading-snug">Colete Avaliações Ativamente</h4>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                  Após realizar um excelente serviço, envie o link do seu perfil para o cliente e peça que ele deixe um depoimento. Perfis com boas notas ganham relevância e selos de prestígio!
                </p>
              </div>
            </div>

            {/* Dica 3: Fotos Portfólio */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4 transition-all hover:shadow-md hover:border-indigo-100 duration-200 group">
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl shrink-0 h-fit group-hover:scale-105 transition-transform">
                <Camera size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 text-base leading-snug">Capriche no Portfólio</h4>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                  Imagens valem mais do que mil palavras! Publique fotos reais de seus trabalhos concluídos. Um portfólio rico aumenta a conversão de cliques em orçamentos em até 80%.
                </p>
              </div>
            </div>

            {/* Dica 4: Selos de Qualidade */}
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex gap-4 transition-all hover:shadow-md hover:border-blue-100 duration-200 group">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0 h-fit group-hover:scale-105 transition-transform">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-2">
                <h4 className="font-extrabold text-slate-800 text-base leading-snug">Assinatura Ativa & Selos de Reputação</h4>
                <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">
                  Com a sua assinatura ativa no proITA, o sistema exibe seus selos exclusivos (Bronze, Prata e Ouro) nas buscas. Isto passa seriedade e destaca você da concorrência de imediato!
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Link de retorno */}
        <div className="text-center pt-4">
          <Link to="/search" className="inline-flex items-center gap-2 text-primary font-bold hover:text-primary-hover transition-colors text-base">
            <ArrowLeft size={18} /> Voltar para Explorar Perfis
          </Link>
        </div>
      </div>
    </div>
  );
}
