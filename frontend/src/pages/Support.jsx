import { HelpCircle, Megaphone, FileText, Mail, MessageSquare } from 'lucide-react';

export default function Support() {
  return (
    <div className="bg-slate-50 min-h-[calc(100vh-64px)] py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-4">Como podemos ajudar?</h1>
          <p className="text-lg text-slate-600">Escolha um dos tópicos abaixo ou envie-nos uma mensagem.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-14 h-14 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <HelpCircle size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Dúvidas Frequentes</h3>
            <p className="text-sm text-slate-500">Respostas para as perguntas mais comuns dos nossos usuários.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-14 h-14 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <Megaphone size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Como Anunciar</h3>
            <p className="text-sm text-slate-500">Aprenda a destacar seu perfil e atrair mais clientes na plataforma.</p>
          </div>
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-14 h-14 bg-purple-50 text-purple-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText size={28} />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Políticas e Termos</h3>
            <p className="text-sm text-slate-500">Entenda nossas regras de uso e como protegemos seus dados.</p>
          </div>
        </div>

        <div className="bg-white p-8 md:p-10 rounded-3xl shadow-sm border border-slate-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-primary/10 text-primary rounded-xl"><MessageSquare size={24} /></div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Envie sua Sugestão</h2>
              <p className="text-sm text-slate-500">Não encontrou o que procurava? Fale com a gente.</p>
            </div>
          </div>

          <form className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Seu Nome</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors text-slate-800" placeholder="Nome completo" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">E-mail ou Telefone</label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors text-slate-800" placeholder="Para podermos te responder" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Sua Mensagem</label>
              <textarea rows={4} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary transition-colors resize-none text-slate-800" placeholder="Escreva sua dúvida, sugestão ou relato de problema..."></textarea>
            </div>
            <div className="flex justify-end">
              <button type="button" className="bg-primary hover:bg-primary-hover text-white px-8 py-3.5 rounded-xl font-bold transition-colors shadow-md flex items-center gap-2">
                <Mail size={18} /> Enviar Mensagem
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
