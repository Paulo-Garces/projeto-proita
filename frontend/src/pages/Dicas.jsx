import React from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, ArrowLeft, Quote, Sparkles, Coins, CheckCircle, Star } from 'lucide-react';

export default function Dicas() {
  const testimonials = [
    {
      quote: "Sempre coloco fotos nítidas dos meus trabalhos. Os clientes de Itapipoca adoram ver o resultado pronto antes de chamar no WhatsApp!",
      author: "João M.",
      profession: "Marceneiro",
      avatarColor: "bg-blue-500"
    },
    {
      quote: "Responder rápido é o segredo. Quando o cliente clica no meu link do proITA, eu tento responder na mesma hora. Fecho quase todos os orçamentos assim.",
      author: "Ana C.",
      profession: "Eletricista",
      avatarColor: "bg-emerald-500"
    },
    {
      quote: "Preencher bem a descrição faz toda a diferença. Explico detalhadamente que atendo tanto no centro quanto nas praias, o que me trouxe clientes novos.",
      author: "Carlos T.",
      profession: "Encanador",
      avatarColor: "bg-amber-500"
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Botão Voltar */}
        <div>
          <Link
            to="/central-de-ajuda"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para a Central de Ajuda
          </Link>
        </div>

        {/* Cabeçalho */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
            <Lightbulb size={28} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
            Dicas de Perfil & Histórias de Sucesso
          </h1>
          <p className="text-slate-600 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            Confira as melhores práticas recomendadas por quem já usa e aprova o proITA em Itapipoca.
          </p>
        </div>

        {/* Grid de 3 Cards de Depoimentos / Dicas com Aspas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((item, index) => (
            <div 
              key={index}
              className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col justify-between hover:shadow-md transition-all duration-300 relative group"
            >
              {/* Ícone de Aspas decorativo */}
              <div className="mb-4 text-primary/30 group-hover:text-primary/60 transition-colors">
                <Quote size={36} className="rotate-180" />
              </div>

              {/* Texto em Itálico */}
              <p className="text-slate-700 italic text-sm sm:text-base leading-relaxed mb-6 font-normal">
                "{item.quote}"
              </p>

              {/* Autor e Profissão */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                <div className={`w-10 h-10 ${item.avatarColor} text-white rounded-full flex items-center justify-center font-bold text-sm shadow-xs`}>
                  {item.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{item.author}</h4>
                  <p className="text-xs text-slate-500 font-medium">{item.profession}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Banner complementar: Dica Extra de Monetização */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Dica de Ouro
            </span>
            <h3 className="text-xl font-bold text-white">Querzerar o custo da sua assinatura?</h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
              Adicione parceiros e patrocinadores locais no seu perfil e transforme seu espaço no proITA em fonte de renda extra!
            </p>
          </div>
          <Link
            to="/planos"
            className="shrink-0 bg-primary hover:bg-primary-hover text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md"
          >
            Ver Planos & Benefícios
          </Link>
        </div>

      </div>
    </div>
  );
}
