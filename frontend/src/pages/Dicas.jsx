import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { Lightbulb, ArrowLeft, Quote, Sparkles, MessageSquare, X, Send, Loader2 } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

export default function Dicas() {
  const { user } = useContext(AuthContext);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpenContactForm = () => {
    setIsContactFormOpen(true);
    setFormSuccess(false);
    setAssunto('Dica de Sucesso para a Comunidade');
    setMensagem('');
    const userNome = user ? `${user.nome || user.name || ''} ${user.sobrenome || ''}`.trim() : '';
    setNome(userNome);
    setEmail(user?.email || '');
  };

  const handleCloseContactForm = () => {
    setIsContactFormOpen(false);
  };

  const handleSubmitTip = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nome,
          email,
          assunto,
          mensagem,
          tipo: 'dica'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar sua dica.');
      }

      setFormSuccess(true);
      setTimeout(() => {
        setIsContactFormOpen(false);
      }, 2500);
    } catch (err) {
      console.error('Erro no envio da dica:', err);
      alert(err.message || 'Ocorreu um erro ao enviar sua dica. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

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

        {/* CTA para enviar dica de sucesso */}
        <div className="text-center pt-2">
          <button
            onClick={handleOpenContactForm}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 hover:text-primary rounded-2xl border border-slate-200 text-sm font-semibold transition-all shadow-xs cursor-pointer group"
          >
            <MessageSquare className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
            <span>Tem uma dica de sucesso? Compartilhe com a nossa comunidade!</span>
          </button>
        </div>

        {/* Banner complementar: Dica Extra de Monetização */}
        <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 text-left">
            <span className="inline-flex items-center gap-1.5 bg-amber-400/20 text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
              <Sparkles size={14} /> Dica de Ouro
            </span>
            <h3 className="text-xl font-bold text-white">Quer zerar o custo da sua assinatura?</h3>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl">
              O proITA permite que você adicione banners de parceiros ou patrocinadores locais diretamente no seu perfil. Você pode cobrar por esse espaço publicitário, cobrindo o valor da sua assinatura e ainda transformando seu perfil em uma nova fonte de renda extra todos os meses!
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

      {/* Modal de Envio de Dicas */}
      {isContactFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  Compartilhe sua Dica de Sucesso
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Sua sugestão será analisada por nossa equipe para inspirar outros profissionais
                </p>
              </div>
              <button 
                onClick={handleCloseContactForm}
                className="text-slate-400 hover:text-white transition-colors cursor-pointer p-1.5 hover:bg-slate-800 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmitTip} className="p-6 space-y-4">
              {formSuccess ? (
                <div className="py-8 text-center space-y-3 animate-in fade-in duration-300">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl">
                    ✓
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">Dica Enviada com Sucesso!</h4>
                  <p className="text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
                    Muito obrigado por compartilhar sua experiência com a nossa comunidade!
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Seu Nome</label>
                      <input
                        type="text"
                        value={nome}
                        onChange={(e) => setNome(e.target.value)}
                        readOnly={!!(user?.nome || user?.name)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm read-only:bg-slate-50 read-only:text-slate-500 read-only:cursor-not-allowed"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Seu E-mail</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        readOnly={!!user?.email}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm read-only:bg-slate-50 read-only:text-slate-500 read-only:cursor-not-allowed"
                        placeholder="seu@email.com"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Assunto</label>
                    <input
                      type="text"
                      value={assunto}
                      onChange={(e) => setAssunto(e.target.value)}
                      required
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Título da dica"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Sua Dica / História</label>
                    <textarea
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-sm resize-none"
                      placeholder="Escreva sua dica ou segredo de sucesso no proITA..."
                    />
                  </div>

                  <div className="flex gap-3 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleCloseContactForm}
                      className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-650 rounded-xl text-sm font-bold transition-all cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-3 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
                    >
                      {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                      Enviar Dica
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
