import React, { useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { 
  HelpCircle, 
  MessageSquare, 
  Briefcase, 
  AlertTriangle, 
  Lightbulb, 
  FileText,
  X,
  Send,
  Loader2
} from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { API_URL } from '../config';

const Support = () => {
  const { user } = useContext(AuthContext);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [contactType, setContactType] = useState('suporte'); // 'suporte' | 'comercial'
  
  // Estados do formulário
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [assunto, setAssunto] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [formSuccess, setFormSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleOpenContactForm = (type) => {
    setContactType(type);
    setIsContactFormOpen(true);
    setFormSuccess(false);
    setAssunto('');
    setMensagem('');
    
    // Auto-preenche com dados do usuário se estiver logado
    const userNome = user ? `${user.nome || user.name || ''} ${user.sobrenome || ''}`.trim() : '';
    setNome(userNome);
    setEmail(user?.email || '');
  };

  const handleCloseContactForm = () => {
    setIsContactFormOpen(false);
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
          tipo: contactType
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Erro ao enviar a mensagem.');
      }

      console.log('DADOS ENVIADOS COM SUCESSO:', data);
      setFormSuccess(true);
      setTimeout(() => {
        setIsContactFormOpen(false);
      }, 2500);
    } catch (err) {
      console.error('Erro no envio do contato:', err);
      alert(err.message || 'Ocorreu um erro ao enviar sua mensagem. Por favor, tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const supportCards = [
    {
      title: 'Dúvidas Frequentes (FAQ)',
      description: 'Encontre respostas rápidas para as dúvidas mais comuns da nossa comunidade.',
      icon: <HelpCircle className="w-8 h-8 text-blue-600" />,
      linkTo: '/faq',
      isExternal: false,
    },
    {
      title: 'Enviar Mensagem',
      description: 'Fale diretamente com nosso suporte técnico para resolver problemas específicos.',
      icon: <MessageSquare className="w-8 h-8 text-blue-600" />,
      onClick: () => handleOpenContactForm('suporte'),
    },
    {
      title: 'Contato Comercial',
      description: 'Parcerias e planos comerciais. Fale diretamente com o nosso setor de vendas.',
      icon: <Briefcase className="w-8 h-8 text-blue-600" />,
      onClick: () => handleOpenContactForm('comercial'),
    },
    {
      title: 'Denúncias',
      description: 'Canal seguro para reportar problemas, abusos ou comportamentos inadequados.',
      icon: <AlertTriangle className="w-8 h-8 text-blue-600" />,
      linkTo: '/denuncias',
      isExternal: false,
    },
    {
      title: 'Dicas de Perfil',
      description: 'Aprenda a destacar seu anúncio e atrair mais clientes para o seu negócio.',
      icon: <Lightbulb className="w-8 h-8 text-blue-600" />,
      linkTo: '/dicas',
      isExternal: false,
    },
    {
      title: 'Termos e Privacidade',
      description: 'Leia nossas regras de uso, termos de serviço e política de privacidade.',
      icon: <FileText className="w-8 h-8 text-blue-600" />,
      linkTo: '/terms',
      isExternal: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pt-32 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Como podemos ajudar?
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Escolha uma das opções abaixo para encontrar a resposta ou falar com nossa equipe.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {supportCards.map((card, index) => {
            const CardContent = (
              <div 
                onClick={card.onClick} 
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 p-8 border border-gray-100 h-full flex flex-col items-center text-center group cursor-pointer"
              >
                <div className="mb-6 p-4 bg-blue-50 rounded-full group-hover:scale-110 transition-transform duration-300">
                  {card.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {card.title}
                </h3>
                <p className="text-gray-600">
                  {card.description}
                </p>
              </div>
            );

            if (card.onClick) {
              return (
                <div key={index} className="outline-none focus:ring-2 focus:ring-blue-500 rounded-xl">
                  {CardContent}
                </div>
              );
            }

            return card.isExternal ? (
              <a 
                key={index} 
                href={card.linkTo}
                className="block outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
              >
                {CardContent}
              </a>
            ) : (
              <Link 
                key={index} 
                to={card.linkTo}
                className="block outline-none focus:ring-2 focus:ring-blue-500 rounded-xl"
              >
                {CardContent}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Modal de Formulário de Contato */}
      {isContactFormOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  Setor: {contactType === 'suporte' ? 'Suporte Técnico' : 'Contato Comercial'}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Destinatário: {contactType === 'suporte' ? 'suporte@proita.com.br' : 'contato@proita.com.br'}
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
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formSuccess ? (
                <div className="py-8 text-center space-y-3 animate-in fade-in duration-300">
                  <div className="mx-auto w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center font-bold text-xl">
                    ✓
                  </div>
                  <h4 className="text-lg font-bold text-slate-800">Mensagem Enviada!</h4>
                  <p className="text-sm text-slate-550 max-w-sm mx-auto leading-relaxed">
                    Sua mensagem foi registrada com sucesso no console do desenvolvedor. Entraremos em contato em breve.
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
                        readOnly={!!user}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm read-only:bg-slate-50 read-only:text-slate-500 read-only:cursor-not-allowed"
                        placeholder="Nome completo"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Seu E-mail</label>
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        readOnly={!!user}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm read-only:bg-slate-50 read-only:text-slate-500 read-only:cursor-not-allowed"
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
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm"
                      placeholder="Qual o motivo do contato?"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-1.5">Mensagem</label>
                    <textarea
                      value={mensagem}
                      onChange={(e) => setMensagem(e.target.value)}
                      required
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-sm resize-none"
                      placeholder="Escreva sua dúvida ou mensagem detalhada..."
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
                      className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-600/10"
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
      )}
    </div>
  );
};

export default Support;
