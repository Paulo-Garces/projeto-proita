import { Mail, MessageSquare, Send } from 'lucide-react';

export default function Support() {
  const handleSubmit = (e) => {
    e.preventDefault();
    alert('Sua mensagem foi enviada com sucesso! (Simulação)');
  };

  return (
    <div className="bg-slate-50 min-h-screen pt-24 pb-20">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mx-auto mb-6">
            <MessageSquare size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-4">Central de Ajuda</h1>
          <p className="text-lg text-slate-600">
            Ficou com alguma dúvida ou precisa reportar um problema? Estamos aqui para ajudar.
          </p>
        </div>

        <div className="bg-white rounded-3xl p-8 md:p-10 border border-slate-200 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b border-slate-100 pb-4">Envie uma mensagem</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Nome Completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Seu nome"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
                <input 
                  type="email" 
                  required
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Assunto</label>
              <select className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-slate-700">
                <option>Dúvida sobre a plataforma</option>
                <option>Problemas técnicos</option>
                <option>Sugestões</option>
                <option>Outros</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Mensagem</label>
              <textarea 
                required
                rows={5}
                placeholder="Descreva como podemos ajudar..."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all resize-none"
              ></textarea>
            </div>

            <button 
              type="submit" 
              className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary-hover text-white font-bold py-4 rounded-xl transition-colors"
            >
              <Send size={18} />
              Enviar Mensagem
            </button>
          </form>
        </div>

        <div className="mt-12 text-center text-slate-500 flex items-center justify-center gap-2">
          <Mail size={16} /> <span>Ou envie um e-mail direto para: <strong>contato@proita.com.br</strong></span>
        </div>

      </div>
    </div>
  );
}
