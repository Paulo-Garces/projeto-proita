import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, HelpCircle, ChevronDown, Send, Loader2, MessageSquare, CheckCircle } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

export default function Faq() {
  const { user } = useContext(AuthContext);
  
  // Accordion state - por padrão abre a primeira pergunta
  const [openIndex, setOpenIndex] = useState(0);

  // Estados do formulário de contato
  const [nome, setNome] = useState(user ? `${user.nome || user.name || ''} ${user.sobrenome || ''}`.trim() : '');
  const [email, setEmail] = useState(user?.email || '');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [loading, setLoading] = useState(false);
  const [formSuccess, setFormSuccess] = useState(false);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const handleSubmit = async (e) => {
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
          tipo: 'suporte'
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar a mensagem.');
      }

      setFormSuccess(true);
      setAssunto('');
      setMensagem('');
    } catch (err) {
      console.error('Erro no envio da mensagem:', err);
      alert(err.message || 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const faqData = [
    {
      question: 'O que é o proITA?',
      answer: 'O proITA é o guia definitivo de profissionais e serviços de Itapipoca. Conectamos clientes a prestadores de serviço locais de forma rápida e direta pelo WhatsApp.'
    },
    {
      question: 'Eu pago para pesquisar profissionais?',
      answer: 'Não! O proITA é 100% gratuito para os usuários que buscam serviços. Você não paga nenhuma taxa para pesquisar ou entrar em contato com os profissionais.'
    },
    {
      question: 'É grátis para o profissional anunciar?',
      answer: 'Sim! Você tem 30 dias de teste totalmente grátis para experimentar a plataforma e sentir os resultados. Após esse período, cobramos apenas uma pequena taxa anual de manutenção para manter seu perfil ativo e em destaque.'
    },
    {
      question: 'Como faço para anunciar meus serviços?',
      answer: 'É muito simples! Basta clicar no botão "Anuncie" ou "Cadastrar" no menu superior, criar sua conta e preencher seu perfil com suas fotos e informações.'
    },
    {
      question: 'Como fecho negócio com o cliente?',
      answer: 'O proITA não cobra comissões. O cliente encontra seu perfil e clica no botão do seu WhatsApp. Vocês negociam diretamente, sem intermediários.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 pt-28 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Container Principal de FAQ */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10">
          
          {/* Botão Voltar */}
          <div className="mb-8">
            <Link
              to="/central-de-ajuda"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:text-primary-hover transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Voltar para a Central de Ajuda
            </Link>
          </div>

          {/* Cabeçalho */}
          <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl shrink-0">
              <HelpCircle className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Dúvidas Frequentes</h1>
              <p className="text-sm text-slate-500 mt-1">Perguntas comuns e respostas sobre a plataforma proITA</p>
            </div>
          </div>

          {/* Accordion Component */}
          <div className="space-y-4">
            {faqData.map((item, index) => {
              const isOpen = openIndex === index;
              return (
                <div 
                  key={index}
                  className="border border-slate-200 rounded-2xl overflow-hidden transition-all duration-200 bg-white shadow-xs hover:border-slate-300"
                >
                  <button
                    onClick={() => toggleAccordion(index)}
                    className="w-full px-6 py-4 text-left flex items-center justify-between gap-4 font-bold text-slate-800 hover:text-primary transition-colors text-base md:text-lg focus:outline-none"
                    aria-expanded={isOpen}
                  >
                    <span>{item.question}</span>
                    <ChevronDown 
                      className={`w-5 h-5 text-slate-400 shrink-0 transition-transform duration-200 ${isOpen ? 'transform rotate-180 text-primary' : ''}`} 
                    />
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-5 text-slate-600 text-sm md:text-base leading-relaxed border-t border-slate-100 pt-3 animate-in fade-in duration-200">
                      {item.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

        </div>

        {/* Formulário de Contato Incorporado */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200/80 p-6 sm:p-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-primary/10 text-primary rounded-xl">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900">Ainda tem dúvidas? Fale conosco!</h2>
              <p className="text-xs sm:text-sm text-slate-500">Envie sua dúvida ou sugestão diretamente para a nossa equipe.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {formSuccess ? (
              <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3 animate-in fade-in duration-300">
                <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-lg font-bold text-slate-800">Mensagem Enviada com Sucesso!</h4>
                <p className="text-sm text-slate-600 max-w-md mx-auto">
                  Agradecemos seu contato. Responderemos o mais breve possível no seu e-mail.
                </p>
                <button
                  type="button"
                  onClick={() => setFormSuccess(false)}
                  className="mt-2 text-xs font-bold text-emerald-700 underline hover:text-emerald-800"
                >
                  Enviar outra mensagem
                </button>
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm read-only:bg-slate-50 read-only:text-slate-500"
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
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm read-only:bg-slate-50 read-only:text-slate-500"
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
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm"
                    placeholder="Qual a sua dúvida ou sugestão?"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Mensagem</label>
                  <textarea
                    value={mensagem}
                    onChange={(e) => setMensagem(e.target.value)}
                    required
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-sm resize-none"
                    placeholder="Descreva aqui sua dúvida em detalhes..."
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto px-8 py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-primary/10"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Enviar Mensagem
                  </button>
                </div>
              </>
            )}
          </form>
        </div>

      </div>
    </div>
  );
}
